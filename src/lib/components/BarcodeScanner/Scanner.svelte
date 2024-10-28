<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { DetectedBarcode, BarcodeFormat } from 'barcode-detector/pure';
	import { keepScanning, setScanningFormats } from './scanner';
	import * as cameraController from './camera';
	import { assert } from './util';
	import { scannerSettings } from '$lib/web-storage.svelte';
	import type { Point, CameraSettings, ScannerProps } from './types';
	import CameraControls from './CameraControls.svelte';

	// Props with defaults
	let {
		constraints = { facingMode: 'environment' },
		formats = ['qr_code'] as BarcodeFormat[],
		paused = false,
		torch = false,
		track,
		onDetect = () => {},
		onCameraOn = () => {},
		onCameraOff = () => {},
		onError = () => {},
		autostart = true
	} = $props<ScannerProps>();

	// State
	let videoEl = $state<HTMLVideoElement>();
	let pauseFrameCanvas = $state<HTMLCanvasElement>();
	let trackingLayerCanvas = $state<HTMLCanvasElement>();
	let cameraActive = $state(false);
	let isMounted = $state(false);
	let constraintsCached = $state(constraints);
	let formatsCached = $state(formats);
	let currentCamera = $state('');
	let showCameraSelector = $state(false);
	let videoDevices = $state<MediaDeviceInfo[]>([]);
	let torchSupport = $state(false);
	let torchOn = $state(false);

	// Derived state
	let cameraSettings = $derived<CameraSettings>({
		torch,
		constraints: constraintsCached,
		shouldStream: isMounted && !paused
	});

	let shouldScan = $derived(cameraSettings.shouldStream && cameraActive);

	// Methods
	function clearCanvas(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		assert(ctx !== null, 'canvas 2d context should always be non-null');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	async function handleCameraSettings(settings: CameraSettings) {
		if (settings.shouldStream) {
			try {
				const capabilities = await cameraController.start(videoEl, settings);
				if (isMounted) {
					const devices = await navigator.mediaDevices.enumerateDevices();
					videoDevices = devices.filter(({ kind }) => kind === 'videoinput');
					currentCamera =
						videoDevices.find((device) => device.deviceId === capabilities.deviceId)?.label ?? '';
					cameraActive = true;
					torchSupport = capabilities?.torch ?? false;
					onCameraOn({ detail: capabilities });
				} else {
					await cameraController.stop();
				}
			} catch (error) {
				onError({ detail: error as Error });
			}
		} else {
			pauseFrameCanvas.width = videoEl.videoWidth;
			pauseFrameCanvas.height = videoEl.videoHeight;
			const ctx = pauseFrameCanvas.getContext('2d');
			ctx?.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);

			cameraController.stop();
			cameraActive = false;
			onCameraOff();
		}
	}

	async function startScanning() {
		clearCanvas(pauseFrameCanvas);
		clearCanvas(trackingLayerCanvas);

		const scanInterval = track === undefined ? 500 : 40;

		keepScanning(videoEl, {
			detectHandler: (codes: DetectedBarcode[]) => onDetect({ detail: codes }),
			formats: formatsCached,
			locateHandler: onLocate,
			minDelay: scanInterval
		});
	}

	async function handleCameraChange(label: string) {
		const devices = await navigator.mediaDevices.enumerateDevices();
		const selectedDevice = devices.find((device) => device.label === label);
		if (selectedDevice) {
			cameraSettings.constraints = { deviceId: selectedDevice.deviceId };
			$scannerSettings.selectedCamera = selectedDevice.deviceId;
			await stopCamera();
			await handleCameraSettings(cameraSettings);
			await setScanningFormats(formatsCached);
			await startScanning();
			showCameraSelector = false;
		}
	}

	async function handleTorchToggle() {
		cameraSettings.torch = !cameraSettings.torch;
		torchOn = cameraSettings.torch;
		await handleCameraSettings(cameraSettings);
		await setScanningFormats(formatsCached);
		await startScanning();
	}

	export async function stopCamera() {
		if (!cameraActive) return;
		clearCanvas(pauseFrameCanvas);
		clearCanvas(trackingLayerCanvas);
		await cameraController.stop();
		cameraActive = false;
	}

	export async function startCamera() {
		if (cameraActive) return;
		autostart = true;
		await handleCameraSettings(cameraSettings);
		await setScanningFormats(formatsCached);
		await startScanning();
	}

	// Lifecycle
	onMount(async () => {
		isMounted = true;
		await setScanningFormats(formatsCached);
	});

	onDestroy(() => {
		cameraController.stop();
	});

	// Effects
	$effect(() => {
		if (!isMounted) return;
		handleCameraSettings(cameraSettings);
	});
</script>

<div class="wrapper">
	<video bind:this={videoEl} class="camera" class:hidden={!shouldScan} autoplay muted playsinline />

	<canvas
		id="qrcode-stream-pause-frame"
		bind:this={pauseFrameCanvas}
		class="camera"
		class:hidden={shouldScan}
	/>

	<canvas id="qrcode-stream-tracking-layer" bind:this={trackingLayerCanvas} class="overlay" />

	<div class="overlay">
		<!-- {@render children()} -->
	</div>

	<CameraControls
		{videoDevices}
		{currentCamera}
		{showCameraSelector}
		{torchSupport}
		{torchOn}
		onCameraChange={handleCameraChange}
		onTorchToggle={handleTorchToggle}
	/>
</div>

<style>
	.wrapper {
		width: 100%;
		height: 100%;
		position: relative;
		z-index: 0;
	}

	.camera {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.camera.hidden {
		visibility: hidden;
		position: absolute;
	}

	.overlay {
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}
</style>
