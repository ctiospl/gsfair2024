<script lang="ts">
	import type { DetectedBarcode, BarcodeFormat } from 'barcode-detector/pure';
	import { keepScanning, setScanningFormats } from './scanner.js';
	import * as cameraController from './camera.js';

	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { SwitchCamera } from 'lucide-svelte';
	import { scannerSettings } from '$lib/web-storage.svelte';
	import { Lightbulb, LightbulbOff, ZoomIn, ZoomOut } from 'lucide-svelte';

	type Point = {
		x: number;
		y: number;
	};
	type Props = {
		children?: any;
		constraints?: MediaTrackConstraints;
		formats?: string[];
		paused?: boolean;
		torch?: boolean;
		track?: MediaStreamTrack;
		onDetect?: (detail: DetectedBarcode[]) => void;
		onCameraOn?: (detail: { detail: MediaTrackCapabilities }) => void;
		onCameraOff?: () => void;
		onError?: (detail: { detail: Error }) => void;
		autostart?: boolean;
		currentCamera?: string;
		onCameraChange?: (cameraId: string) => Promise<void>;
	};
	let videoDevices = $state([]); //MediaDeviceInfo[]
	let showCameraSelector = $state(false);
	let torchSupport = $state(false);
	let torchOn = $state(false);
	const TorchIcon = $derived(torchOn ? Lightbulb : LightbulbOff);

	let {
		children,
		constraints = undefined as MediaTrackConstraints | undefined,
		formats = undefined as string[] | undefined,
		paused = false as boolean,
		torch = false as boolean,
		track = undefined as MediaStreamTrack | undefined,
		onDetect = (detail: any) => {},
		onCameraOn = (detail: { detail: MediaTrackCapabilities }) => {},
		onCameraOff = () => {},
		onError = (detail: { detail: Error }) => {},
		autostart = true,
		onCameraChange
	} = $props() as Props;
	let capabilities: MediaTrackCapabilities;
	let currentCamera = $state('');
	let videoRef: HTMLVideoElement;
	let pauseFrameRef: HTMLCanvasElement;
	let trackingLayerRef: HTMLCanvasElement;

	let cameraActive = $state(false);
	let isMounted = $state(false);

	$inspect('$scannerSettings.selectedCamera', $scannerSettings.selectedCamera);

	let constraintsCached = $state(
		constraints || $scannerSettings.selectedCamera || { facingMode: 'environment' }
	);

	let formatsCached = $state(formats || ['qr_code']);

	let cameraSettings = $derived({
		torch: torch || false,
		constraints: constraintsCached,
		shouldStream: isMounted && !paused
	});
	$inspect(autostart);

	let shouldScan = $derived(cameraSettings.shouldStream && cameraActive && autostart);
	export async function StopCamera() {
		if (cameraActive === false) return;
		clearCanvas(pauseFrameRef);
		clearCanvas(trackingLayerRef);
		await cameraController.stop();
		cameraActive = false;
	}
	export async function StartCamera() {
		if (cameraActive === true) return;
		autostart = true; // reset autostart
		await handleCameraSettings(cameraSettings);
	}

	async function getDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter(({ kind }) => kind === 'videoinput');
	}
	async function handleCameraChange(label: string) {
		const devices = await getDevices();
		const selectedDevice = devices.find((device) => device.label === label);
		if (selectedDevice) {
			showCameraSelector = false;
			cameraSettings.constraints = { deviceId: selectedDevice.deviceId };
			$scannerSettings.selectedCamera = label;
			console.log('scannerSettings :>> ', $scannerSettings);
			// await StopCamera();
			// await handleCameraSettings(cameraSettings);
			// await setScanningFormats(formatsCached);
			// await startScanning();
		}
	}

	async function handleCameraSettings(newSettings) {
		const videoEl = videoRef;
		const canvas = pauseFrameRef;
		const ctx = canvas.getContext('2d');

		if (newSettings.shouldStream) {
			console.log('cameraController :>> ', cameraController);
			cameraController.stop();
			cameraActive = false;

			try {
				// if (isMounted && $scannerSettings.selectedCamera) {
				// 	const devices = await getDevices();
				// 	const previousCameraId = devices.find(
				// 		(device) => device.label === $scannerSettings.selectedCamera
				// 	)?.deviceId;
				// 	newSettings.constraints = { deviceId: previousCameraId };
				// }
				// console.log('newSettings :>> ', newSettings);

				if (isMounted) {
					if ($scannerSettings.selectedCamera) {
						const devices = await getDevices();
						const previousCameraId = devices.find(
							(device) => device.label === $scannerSettings.selectedCamera
						)?.deviceId;
						newSettings.constraints = { deviceId: previousCameraId };
						capabilities = await cameraController.start(videoEl, newSettings);
					} else {
						capabilities = await cameraController.start(videoEl, newSettings);
					}
					console.log('newSettings :>> ', newSettings);

					cameraActive = true;
					const devices = await navigator.mediaDevices.enumerateDevices();
					videoDevices = devices.filter(({ kind }) => kind === 'videoinput');
					currentCamera =
						videoDevices.find((device) => device.deviceId === capabilities.deviceId)?.label ?? '';
					torchSupport = capabilities?.torch;
					autostart = true;

					onCameraOn({ detail: capabilities });
				}
			} catch (error) {
				onError({ detail: error });
			}
		} else {
			canvas.width = videoEl.videoWidth;
			canvas.height = videoEl.videoHeight;
			ctx.drawImage(videoEl, 0, 0, videoEl.videoWidth, videoEl.videoHeight);
			cameraController.stop();
			cameraActive = false;
			onCameraOff();
		}
	}

	$effect(() => {
		isMounted = true;
		return () => {
			cameraController.stop();
		};
	});

	$effect(() => {
		if (JSON.stringify(constraints) !== JSON.stringify(constraintsCached)) {
			constraintsCached = constraints || { facingMode: 'environment' };
		}
	});

	$effect(() => {
		if (JSON.stringify(formats) !== JSON.stringify(formatsCached)) {
			formatsCached = formats || ['qr_code'];
		}
	});

	$effect(() => {
		handleCameraSettings(cameraSettings);
	});

	$effect(() => {
		if (isMounted) {
			setScanningFormats(formatsCached);
		}
	});

	$effect(() => {
		$inspect('shouldScan', shouldScan);
		if (shouldScan) {
			startScanning();
			console.log('startScanning :>> ');
		}
	});

	async function startScanning() {
		clearCanvas(pauseFrameRef);
		clearCanvas(trackingLayerRef);

		const scanInterval = track === undefined ? 500 : 40;

		keepScanning(videoRef, {
			detectHandler: (detectedCodes: DetectedBarcode[]) => onDetect({ detail: detectedCodes }),
			formats: formatsCached,
			locateHandler: onLocate,
			minDelay: scanInterval
		});
	}

	function clearCanvas(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function onLocate(detectedCodes: DetectedBarcode[]) {
		const canvas = trackingLayerRef;
		const video = videoRef;

		if (detectedCodes.length === 0 || track === undefined) {
			clearCanvas(canvas);
		} else {
			const displayWidth = video.offsetWidth;
			const displayHeight = video.offsetHeight;
			const resolutionWidth = video.videoWidth;
			const resolutionHeight = video.videoHeight;
			const largerRatio = Math.max(
				displayWidth / resolutionWidth,
				displayHeight / resolutionHeight
			);
			const uncutWidth = resolutionWidth * largerRatio;
			const uncutHeight = resolutionHeight * largerRatio;
			const xScalar = uncutWidth / resolutionWidth;
			const yScalar = uncutHeight / resolutionHeight;
			const xOffset = (displayWidth - uncutWidth) / 2;
			const yOffset = (displayHeight - uncutHeight) / 2;

			const scale = ({ x, y }: Point) => ({
				x: Math.floor(x * xScalar),
				y: Math.floor(y * yScalar)
			});

			const translate = ({ x, y }: Point) => ({
				x: Math.floor(x + xOffset),
				y: Math.floor(y + yOffset)
			});

			const adjustedCodes = detectedCodes.map((detectedCode) => {
				const { boundingBox, cornerPoints } = detectedCode;
				const { x, y } = translate(scale({ x: boundingBox.x, y: boundingBox.y }));
				const { x: width, y: height } = scale({ x: boundingBox.width, y: boundingBox.height });

				return {
					...detectedCode,
					cornerPoints: cornerPoints.map((point) => translate(scale(point))),
					boundingBox: DOMRectReadOnly.fromRect({ x, y, width, height })
				};
			});

			canvas.width = video.offsetWidth;
			canvas.height = video.offsetHeight;
			const ctx = canvas.getContext('2d');
			track(adjustedCodes, ctx);
		}
	}
</script>

<div class="wrapper">
	<video bind:this={videoRef} class="camera" autoplay muted playsinline></video>

	<canvas
		id="qrcode-stream-pause-frame"
		bind:this={pauseFrameRef}
		class="camera"
		class:hidden={shouldScan}
	></canvas>

	<canvas id="qrcode-stream-tracking-layer" bind:this={trackingLayerRef} class="overlay"></canvas>

	<div class="overlay">
		<!-- {@render children()} -->
	</div>
	<!-- <div class=""> -->
	<Button variant="outline" class="">
		<SwitchCamera
			class="absolute right-0 top-0 z-50 z-50 h-12 w-12 rounded-full bg-white p-2"
			onclick={() => {
				showCameraSelector = true;
			}}
		/>
	</Button>
	<!-- </div> -->
	<Sheet.Root bind:open={showCameraSelector}>
		<Sheet.Content side="bottom">
			<Sheet.Header>
				<Sheet.Title>Select Camera</Sheet.Title>
				<Sheet.Description>Choose a camera for QR code scanning</Sheet.Description>
			</Sheet.Header>
			<RadioGroup.Root value={currentCamera} onValueChange={handleCameraChange}>
				{#each videoDevices as device}
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value={device.label} id={device.id} />
						<Label for={device.id}>{device.label}</Label>
					</div>
				{/each}
			</RadioGroup.Root>
		</Sheet.Content>
	</Sheet.Root>
	<!-- </div> -->
</div>

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
