<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { DetectedBarcode, BarcodeFormat } from 'barcode-detector/pure';
	import { keepScanning, setScanningFormats } from './scanner';
	import * as cameraController from './camera';

	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { SwitchCamera } from 'lucide-svelte';
	import { assert } from './util';
	import { scannerSettings } from '$lib/web-storage.svelte';
	import { Lightbulb, LightbulbOff, ZoomIn, ZoomOut } from 'lucide-svelte';

	type Point = {
		x: number;
		y: number;
	};

	// Props
	let {
		constraints = { facingMode: 'environment' },
		formats = ['qr_code'] as BarcodeFormat[],
		paused = false,
		torch = false,
		track = undefined as
			| ((codes: DetectedBarcode[], ctx: CanvasRenderingContext2D | null) => void)
			| undefined,
		onDetect = (detail: any) => {},
		onCameraOn = (detail: { detail: MediaTrackCapabilities }) => {},
		onCameraOff = () => {},
		onError = (detail: { detail: Error }) => {},
		autostart = true
	} = $props();

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
	let videoDevices = $state([]);
	let torchSupport = $state(false);
	let torchOn = $state(false);
	const TorchIcon = $derived(torchOn ? Lightbulb : LightbulbOff);

	// Derived state
	let cameraSettings = $derived({
		torch,
		constraints: constraintsCached,
		shouldStream: isMounted && !paused
	});

	let shouldScan = $derived(cameraSettings.shouldStream && cameraActive);

	// Props watchers
	$effect(() => {
		if (JSON.stringify(constraints) !== JSON.stringify(constraintsCached)) {
			constraintsCached = constraints;
		}
	});

	$effect(() => {
		if (JSON.stringify(formats) !== JSON.stringify(formatsCached)) {
			formatsCached = formats;
		}
	});

	// Methods
	function clearCanvas(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		assert(ctx !== null, 'canvas 2d context should always be non-null');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	function onLocate(detectedCodes: DetectedBarcode[]) {
		if (detectedCodes.length === 0 || !track) {
			clearCanvas(trackingLayerCanvas);
			return;
		}

		const displayWidth = videoEl.offsetWidth;
		const displayHeight = videoEl.offsetHeight;
		const resolutionWidth = videoEl.videoWidth;
		const resolutionHeight = videoEl.videoHeight;

		const largerRatio = Math.max(displayWidth / resolutionWidth, displayHeight / resolutionHeight);
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

		trackingLayerCanvas.width = videoEl.offsetWidth;
		trackingLayerCanvas.height = videoEl.offsetHeight;
		const ctx = trackingLayerCanvas.getContext('2d');
		track(adjustedCodes, ctx);
	}

	async function getDevices() {
		const devices = await navigator.mediaDevices.enumerateDevices();
		return devices.filter(({ kind }) => kind === 'videoinput');
	}

	async function handleCameraSettings(cameraSettings) {
		if (cameraSettings.shouldStream) {
			// if (cameraActive === true) {
			// cameraController.stop();
			// cameraActive = false;
			// }

			try {
				const capabilities = await cameraController.start(videoEl, cameraSettings);
				if (isMounted) {
					const devices = await navigator.mediaDevices.enumerateDevices();
					videoDevices = devices.filter(({ kind }) => kind === 'videoinput');
					currentCamera =
						videoDevices.find((device) => device.deviceId === capabilities.deviceId)?.label ?? '';
					cameraActive = true;
					torchSupport = capabilities?.torch ?? false;
					onCameraOn(capabilities);
				} else {
					await cameraController.stop();
				}
			} catch (error) {
				onError(error as Error);
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

	async function handleCameraChange(label: string) {
		const devices = await getDevices();
		const selectedDevice = devices.find((device) => device.label === label);
		if (selectedDevice) {
			cameraSettings.constraints = { deviceId: selectedDevice.deviceId };
			$scannerSettings.selectedCamera = selectedDevice.deviceId;
			await StopCamera();
			await handleCameraSettings(cameraSettings);
			await setScanningFormats(formatsCached);
			await startScanning();
			showCameraSelector = false;
		}
	}

	export async function StopCamera() {
		if (cameraActive === false) return;
		clearCanvas(pauseFrameCanvas);
		clearCanvas(trackingLayerCanvas);
		await cameraController.stop();
		cameraActive = false;
	}
	export async function StartCamera() {
		if (cameraActive === true) return;
		autostart = true; // reset autostart
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

	// Camera settings effect
	$effect(() => {
		if (!isMounted) return;

		(async () => {
			await handleCameraSettings(cameraSettings);
		})();
	});
	async function startScanning() {
		clearCanvas(pauseFrameCanvas);
		clearCanvas(trackingLayerCanvas);

		const scanInterval = track === undefined ? 500 : 40;

		keepScanning(videoEl, {
			detectHandler: (detectedCodes: DetectedBarcode[]) => onDetect({ detail: detectedCodes }),
			formats: formatsCached,
			locateHandler: onLocate,
			minDelay: scanInterval
		});
	}
	// Scanning effect
	$effect(() => {
		// if (!shouldScan) return;
		// (async () => {
		// 	await startScanning();
		// })();
	});
</script>

<div class="wrapper">
	<video bind:this={videoEl} class="camera" autoplay muted playsinline></video>

	<canvas
		id="qrcode-stream-pause-frame"
		bind:this={pauseFrameCanvas}
		class="camera"
		class:hidden={shouldScan}
	></canvas>

	<canvas id="qrcode-stream-tracking-layer" bind:this={trackingLayerCanvas} class="overlay"
	></canvas>

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
			cameraSettings.torch = !cameraSettings.torch;
			torchOn = cameraSettings.torch;
			// await StopCamera();
			await handleCameraSettings(cameraSettings);
			await setScanningFormats(formatsCached);
			await startScanning();
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
