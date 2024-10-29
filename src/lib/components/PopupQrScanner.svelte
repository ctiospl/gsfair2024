<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { PopupQrScannerOpened } from '$lib/ui-item-states.svelte';
	import { pushState } from '$app/navigation';
	import QrcodeStream from '$lib/components/BarcodeScanner/QrcodeStream.svelte';

	let {
		onScanSuccess = (decodedText) => {
			console.log('decodedText :>> ', decodedText);
		},
		scannerTitle = 'QR Code Scanner',
		autostart = false
	} = $props();

	let result = $state('');
	let error = $state('');
	let selectedConstraints = $state({ facingMode: 'environment' });
	let qrcodeStream;
	let barcodeFormats = $state({
		aztec: false,
		code_128: false,
		code_39: false,
		code_93: false,
		codabar: false,
		databar: false,
		databar_expanded: false,
		data_matrix: false,
		dx_film_edge: false,
		ean_13: false,
		ean_8: false,
		itf: false,
		maxi_code: false,
		micro_qr_code: false,
		pdf417: false,
		qr_code: true,
		rm_qr_code: false,
		upc_a: false,
		upc_e: false,
		linear_codes: false,
		matrix_codes: false
	});

	let selectedBarcodeFormats = $derived(
		Object.keys(barcodeFormats).filter((format) => barcodeFormats[format])
	);

	function paintOutline(detectedCodes, ctx) {
		for (const detectedCode of detectedCodes) {
			const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			ctx.moveTo(firstPoint.x, firstPoint.y);
			for (const { x, y } of otherPoints) {
				ctx.lineTo(x, y);
			}
			ctx.lineTo(firstPoint.x, firstPoint.y);
			ctx.closePath();
			ctx.stroke();
		}
	}

	function paintRotatedBoundingBox(detectedCodes, ctx) {
		for (const detectedCode of detectedCodes) {
			const {
				boundingBox: { x, y, width, height }
			} = detectedCode;
			ctx.save();
			ctx.translate(x + width / 2, y + height / 2);
			ctx.rotate(0.1); // Rotate 0.1 radians
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#8a2be2';
			ctx.strokeRect(-width / 2, -height / 2, width, height);
			ctx.restore();
		}
	}

	function paintBoundingBox(detectedCodes, ctx) {
		for (const detectedCode of detectedCodes) {
			const {
				boundingBox: { x, y, width, height }
			} = detectedCode;
			ctx.lineWidth = 2;
			ctx.strokeStyle = '#007bff';
			ctx.strokeRect(x, y, width, height);
		}
	}

	function paintCenterText(detectedCodes, ctx) {
		for (const detectedCode of detectedCodes) {
			const { boundingBox, rawValue } = detectedCode;
			const centerX = boundingBox.x + boundingBox.width / 2;
			const centerY = boundingBox.y + boundingBox.height / 2;
			const fontSize = Math.max(12, (50 * boundingBox.width) / ctx.canvas.width);
			ctx.font = `bold ${fontSize}px sans-serif`;
			ctx.textAlign = 'center';
			ctx.lineWidth = 3;
			ctx.strokeStyle = '#35495e';
			ctx.strokeText(rawValue, centerX, centerY);
			ctx.fillStyle = '#5cb984';
			ctx.fillText(rawValue, centerX, centerY);
		}
	}

	function paintBoundingBoxWithShadow(detectedCodes, ctx) {
		for (const detectedCode of detectedCodes) {
			const {
				boundingBox: { x, y, width, height }
			} = detectedCode;
			ctx.save();
			ctx.shadowColor = '#000';
			ctx.shadowBlur = 10;
			ctx.lineWidth = 3;
			ctx.strokeStyle = '#00fa9a';
			ctx.strokeRect(x, y, width, height);
			ctx.restore();
		}
	}

	const trackFunctionOptions = [
		{ text: 'nothing (default)', value: undefined },
		{ text: 'outline', value: paintOutline },
		{ text: 'centered text', value: paintCenterText },
		{ text: 'bounding box', value: paintBoundingBox },
		{ text: 'rotating bounding box', value: paintRotatedBoundingBox },
		{ text: 'bounding box shadow', value: paintBoundingBoxWithShadow }
	];

	let trackFunctionSelected = $state(trackFunctionOptions[5]);

	async function onDetect(event) {
		const detectedCodes = event.detail;

		if (detectedCodes.length > 1) {
			// TODO: alert error too many qrcodes... try again
			PopupQrScannerOpened.value = false;
		} else {
			if (detectedCodes[0].rawValue != '') {
				PopupQrScannerOpened.value = false;
				return onScanSuccess(detectedCodes[0].rawValue);
			}
		}
	}
	let isCameraReady = $state(false);

	async function onCameraReady() {
		isCameraReady = true;
		error = '';
	}

	function onError(event) {
		const err = event.detail;
		error = `[${err.name}]: `;

		if (err.name === 'NotAllowedError') {
			error += 'you need to grant camera access permission';
		} else if (err.name === 'NotFoundError') {
			error += 'no camera on this device';
		} else if (err.name === 'NotSupportedError') {
			error += 'secure context required (HTTPS, localhost)';
		} else if (err.name === 'NotReadableError') {
			error += 'is the camera already in use?';
		} else if (err.name === 'OverconstrainedError') {
			error += 'installed cameras are not suitable';
		} else if (err.name === 'StreamApiNotSupportedError') {
			error += 'Stream API is not supported in this browser';
		} else if (err.name === 'InsecureContextError') {
			error +=
				'Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.';
		} else {
			error += err.message;
		}
	}
	$effect(async () => {
		if (isCameraReady) {
			if (PopupQrScannerOpened.value) {
				await qrcodeStream.StartCamera();
			}
		}
	});
	$effect(() => {
		if (PopupQrScannerOpened.value) {
			pushState('?scannerOpened=true', {
				popupQrScannerOpened: true
			});
		} else {
			if (history.state.popupQrScannerOpened) {
				history.back();
			}
		}
	});
</script>

<Sheet.Root bind:open={PopupQrScannerOpened.value}>
	<Sheet.Content side="bottom" class="h-full w-full">
		<Sheet.Header>
			<Sheet.Title>{scannerTitle}</Sheet.Title>
			<Sheet.Description>
				<QrcodeStream
					bind:this={qrcodeStream}
					constraints={selectedConstraints}
					track={trackFunctionSelected.value}
					formats={selectedBarcodeFormats}
					{onError}
					{onDetect}
					onCameraOn={onCameraReady}
					{autostart}
				/>
			</Sheet.Description>
		</Sheet.Header>
	</Sheet.Content>
</Sheet.Root>
