<script lang="ts">
	import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
	import type {
		CameraDevice,
		Html5QrcodeResult,
		Html5QrcodeError,
		QrcodeSuccessCallback,
		QrcodeErrorCallback,
		Html5QrcodeCameraScanConfig,
		CameraCapabilities,
		BooleanCameraCapability,
		RangeCameraCapability
	} from 'html5-qrcode';
	import { onMount } from 'svelte';
	import CameraSelector from './CameraSelector.svelte';
	import { scannerSettings } from '$lib/web-storage.svelte';
	import { Lightbulb, LightbulbOff, ZoomIn, ZoomOut } from 'lucide-svelte';

	const ScannerState = {
		UNKNOWN: 0,
		NOT_STARTED: 1,
		SCANNING: 2,
		PAUSED: 3
	} as const;
	type CameraTrack = {
		label: string;
	};

	type ScannerStateType = (typeof ScannerState)[keyof typeof ScannerState];

	interface ScannerProps {
		autostart?: boolean;
		cameraId?: string;
		formats?: string[];
		cameraView?: 'environment' | 'user';
		fps?: number;
		hideScannerOnPause?: boolean;
		useBarCodeDetectorIfSupported?: boolean;
		pauseCameraOnScanSuccess?: boolean;
		rememberLastUsedCamera?: boolean;
		showTorchButtonIfSupported?: boolean;
		showZoomSliderIfSupported?: boolean;
		defaultZoomValueIfSupported?: number;
		onScanSuccess?: QrcodeSuccessCallback;
		onSuccess?: QrcodeSuccessCallback;
		onScanFailure?: QrcodeErrorCallback;
		qrboxFunction?: (
			viewfinderWidth: number,
			viewfinderHeight: number
		) => { width: number; height: number };
	}

	let {
		autostart = true,
		cameraView = 'environment',
		fps = 10,
		formats = ['QR_CODE', 'CODE_128', 'UPC_A', 'UPC_E', 'UPC_EAN_EXTENSION'],
		hideScannerOnPause = false,
		useBarCodeDetectorIfSupported = true,
		defaultZoomValueIfSupported = 2,
		pauseCameraOnScanSuccess = false,
		onScanSuccess = (decodedText: string, decodedResult: Html5QrcodeResult) => {
			console.log(`Code matched = ${decodedText}`, decodedResult);
		},
		onScanFailure = (errorMessage: string, error: Html5QrcodeError) => {
			// Uncomment for debugging
			// console.error(`Code scan error = ${errorMessage}`, error);
		},
		qrboxFunction = (viewfinderWidth: number, viewfinderHeight: number) => {
			const minEdgePercentage = 0.7;
			const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
			const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
			return {
				width: qrboxSize,
				height: qrboxSize
			};
		}
	}: ScannerProps = $props();

	function onScanSuccessInternal(decodedText: string, decodedResult: Html5QrcodeResult) {
		if (pauseCameraOnScanSuccess) {
			pauseScanner();
		}
		onScanSuccess(decodedText, decodedResult);
	}

	let scanner: Html5Qrcode | null = $state(null);
	let devices: CameraDevice[] = $state([]);
	let currentCamera = $state($scannerSettings.selectedCamera ?? '');
	let currentCameraId = $state();
	let scannerState = $state<ScannerStateType>(ScannerState.UNKNOWN);
	function getCameraId(cameraLabel: string) {
		return devices.find((device) => device.label === cameraLabel)?.id;
	}

	let reader: HTMLElement;
	let hideScanner = $state(false);
	let torchSupport = $state(false);
	let torch: BooleanCameraCapability;
	let torchOn = $state(false);
	const TorchIcon = $derived(torchOn ? Lightbulb : LightbulbOff);
	let zoomSupport = $state(false);
	let zoom: RangeCameraCapability;
	let zoomValue = $state($scannerSettings.zoomLevel ?? defaultZoomValueIfSupported);

	const getHtml5QrcodeSupportedFormats = (formatsToSupport: string[]) => {
		if (!formatsToSupport.length) {
			// return keys which are numbers
			return Object.keys(Html5QrcodeSupportedFormats).filter((key) => !Number.isNaN(Number(key)));
		}
		if (formatsToSupport.length === 1 && formatsToSupport[0] === 'ALL') {
			return Object.keys(Html5QrcodeSupportedFormats).filter((key) => !Number.isNaN(Number(key)));
		}
		const supportedFormats: Html5QrcodeSupportedFormats[] = formatsToSupport
			.map((format) => {
				const fotmatId = Html5QrcodeSupportedFormats[format];
				return fotmatId;
			})
			.filter((formatId: number) => formatId !== undefined);
		return supportedFormats;
	};

	onMount(async () => {
		try {
			devices = await Html5Qrcode.getCameras();
			// console.log("devices :>> ", devices);
			if (devices?.length) {
				scanner = new Html5Qrcode('reader', {
					// verbose: true,
					formatsToSupport: getHtml5QrcodeSupportedFormats(formats),
					experimentalFeatures: { useBarCodeDetectorIfSupported: true },
					useBarCodeDetectorIfSupported: useBarCodeDetectorIfSupported
				});
				if (autostart) {
					await startScanner();
				}
			}
		} catch (err) {
			console.error('Error initializing scanner:', err);
		}
	});

	$effect(() => {
		return async () => {
			await stopScanner();
		};
	});

	export const getScannerState = async (): Promise<ScannerStateType> => {
		if (scanner) {
			try {
				scannerState = await scanner.getState();
			} catch (err) {
				console.error('Scanner getState failed', err);
				scannerState = ScannerState.UNKNOWN;
			}
		}
		return scannerState;
	};

	export function getCameras(): CameraDevice[] {
		return devices;
	}

	export async function startScanner(): Promise<void> {
		if (scanner) {
			try {
				scannerState = await getScannerState();

				if (scannerState === ScannerState.NOT_STARTED) {
					const config: Html5QrcodeCameraScanConfig = {
						fps,
						qrbox: qrboxFunction,
						aspectRatio: 1
					};
					let scannerParams = {};
					if (currentCamera) {
						currentCameraId = getCameraId(currentCamera);
						scannerParams = { deviceId: { exact: currentCameraId } };
					} else {
						scannerParams = { facingMode: cameraView };
					}
					try {
						await scanner.start(scannerParams, config, onScanSuccessInternal, onScanFailure);
					} catch (error) {
						console.log('scanner start error :>> ', error);
					}

					const capabilities: CameraCapabilities & { track: MediaStreamTrack } =
						await scanner.getRunningTrackCameraCapabilities();

					torchSupport = capabilities.torchFeature().isSupported();
					if (torchSupport) {
						torch = capabilities.torchFeature();
						torchOn = false;
					}

					zoomSupport = capabilities.zoomFeature().isSupported();
					if (zoomSupport) {
						zoom = capabilities.zoomFeature();
						await zoom.apply(zoomValue);
					}

					currentCamera = capabilities?.track?.label || '';
					currentCameraId = getCameraId(currentCamera) ?? null;

					$scannerSettings.selectedCamera = currentCamera;
					console.log('QR Code scanning started.');
				} else if (scannerState === ScannerState.PAUSED) {
					await scanner.resume();
					if (hideScannerOnPause) {
						hideScanner = false;
					}

					console.log('QR Code scanning resumed.');
				} else if (scannerState === ScannerState.SCANNING) {
					console.log('Scanner is already running.');
				} else {
					console.log('Scanner is in an unknown state.');
				}
			} catch (err) {
				console.error('Scanner Start Failed', err);
			}
		}
	}

	export function pauseScanner(): void {
		if (scanner) {
			try {
				const currentState = scanner.getState();

				if (currentState === ScannerState.SCANNING) {
					scanner.pause();
					if (hideScannerOnPause) {
						hideScanner = true;
					}
					console.log('QR Code scanning paused.');
				} else {
					console.log('Scanner is not in a state that can be paused.');
				}
			} catch (err) {
				console.error('Scanner Pause failed', err);
			}
		}
	}

	export async function stopScanner(): Promise<void> {
		if (scanner) {
			try {
				scannerState = await getScannerState();

				if (scannerState === ScannerState.SCANNING || scannerState === ScannerState.PAUSED) {
					await scanner.stop();
					console.log('QR Code scanning stopped.');
				} else if (scannerState === ScannerState.NOT_STARTED) {
					scanner.clear();
					console.log('Scanner was not running. Cleared any existing configuration.');
				} else {
					console.log('Scanner is in an unknown state. No action taken.');
				}
			} catch (err) {
				console.error('Scanner Stop failed', err);
			}
		}
	}

	async function handleCameraChange(newCameraId: string) {
		if (newCameraId !== currentCameraId) {
			currentCamera = devices.find((device) => device.id === newCameraId)?.label ?? '';

			currentCameraId = newCameraId;

			$scannerSettings.selectedCamera = currentCamera;
			$scannerSettings.zoomLevel = defaultZoomValueIfSupported;
			zoomValue = defaultZoomValueIfSupported;
			await zoom.apply(zoomValue);
			await restartScanner();
		}
	}

	async function restartScanner() {
		await stopScanner();
		await startScanner();
	}
</script>

<div class="h-dvh">
	<div class:hideScanner bind:this={reader} id="reader"></div>
	<CameraSelector {devices} {currentCamera} onCameraChange={handleCameraChange} />

	{#if torchSupport}
		<TorchIcon
			class="fixed z-20 h-14 w-14 rounded-full bg-black p-4 text-white right-4-safe bottom-4-safe {torchOn
				? 'bg-yellow-600'
				: ''}"
			onclick={async () => {
				await torch.apply(!torch.value());
				torchOn = torch.value() ?? false;
			}}
		/>
	{/if}

	{#if zoomSupport}
		<ZoomIn
			class="fixed z-20 h-14 w-14 rounded-full  p-4 text-white right-40-safe bottom-4-safe  {zoomValue >
			1
				? 'bg-green-500'
				: 'bg-black'}"
			onclick={async () => {
				zoomValue = zoom.value() ?? defaultZoomValueIfSupported;
				if (zoomValue < zoom.max()) {
					zoomValue = zoomValue + 1;
					await zoom.apply(zoomValue);
					$scannerSettings.zoomLevel = zoomValue;
				}
			}}
		/>

		<ZoomOut
			class="fixed z-20 h-14 w-14 rounded-full p-4 text-white right-24-safe bottom-4-safe  {zoomValue ===
				1 || !zoomValue
				? 'bg-gray-500'
				: 'bg-red-500'}"
			onclick={async () => {
				zoomValue = zoom.value() ?? defaultZoomValueIfSupported;
				if (zoomValue > 1) {
					zoomValue = zoomValue - 1;
					await zoom.apply(zoomValue);
					$scannerSettings.zoomLevel = zoomValue;
				}
			}}
		/>
	{/if}
</div>

<style>
	.hideScanner {
		display: none;
	}
</style>
