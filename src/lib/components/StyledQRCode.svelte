<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { QRBorderPlugin } from '$lib/QRBorderPlugin';
	import type {
		DrawType,
		TypeNumber,
		Mode,
		ErrorCorrectionLevel,
		DotType,
		CornerSquareType,
		CornerDotType
	} from 'qr-code-styling';

	interface Props {
		qrcodeText?: string;
		message?: string;
		cta?: string;
	}

	let { qrcodeText = '', message = '', cta = 'SCAN ME' }: Props = $props();
	let qrcc = $state('');
	let options = {
		type: 'svg',
		width: 500,
		height: 500,
		margin: message ? 70 : 0,
		data: qrcodeText,
		// margin: 0,
		qrOptions: {
			typeNumber: '0',
			mode: 'Byte',
			errorCorrectionLevel: 'H'
		},
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.4,
			margin: 0
		},
		dotsOptions: {
			type: 'rounded',
			color: '#6a1a4c',
			gradient: {
				type: 'linear',
				rotation: 0,
				colorStops: [
					{ offset: 0, color: '#004e46' },
					{ offset: 1, color: '#6b9606' }
				]
			}
		},
		// backgroundOptions: { color: '#ffffff', gradient: null },
		// "image": "10cc19bd484118dbcd0a7886a38ceddc.png",
		dotsOptionsHelper: {
			colorType: { single: true, gradient: false },
			gradient: {
				linear: true,
				radial: false,
				color1: '#6a1a4c',
				color2: '#6a1a4c',
				rotation: '0'
			}
		},
		cornersSquareOptions: {
			type: 'extra-rounded',
			color: '#000000',
			gradient: {
				type: 'linear',
				rotation: 0,
				colorStops: [
					{ offset: 0, color: '#f97403' },
					{ offset: 1, color: '#ff2600' }
				]
			}
		},
		cornersSquareOptionsHelper: {
			colorType: { single: true, gradient: false },
			gradient: {
				linear: true,
				radial: false,
				color1: '#000000',
				color2: '#000000',
				rotation: '0'
			}
		},
		cornersDotOptions: { type: '', color: '#791a3e', gradient: null },
		cornersDotOptionsHelper: {
			colorType: { single: true, gradient: false },
			gradient: {
				linear: true,
				radial: false,
				color1: '#000000',
				color2: '#000000',
				rotation: '0'
			}
		},
		backgroundOptionsHelper: {
			colorType: { single: true, gradient: false },
			gradient: {
				linear: true,
				radial: false,
				color1: '#ffffff',
				color2: '#ffffff',
				rotation: '0'
			}
		}
	};

	const extensionOptions = {
		round: 1,
		thickness: 60,
		color: '#79193E',
		decorations: {
			top: {
				type: 'text',
				value: message,
				style: 'font: 30px sans-serif; fill: #D5B882;'
			},
			bottom: {
				type: 'text',
				value: cta,
				style: 'font: 30px sans-serif; fill: #D5B882;'
			}
		},
		borderInner: {
			color: '#000000',
			thickness: 10
		},
		borderOuter: {
			color: '#000000',
			thickness: 10
		}
	};

	if (browser) {
	}

	onMount(async () => {
		const module = await import('qr-code-styling');
		const QRCodeStyling = module.default;
		if (message) {
			options = { shape: 'circle', ...options };
		}
		const qrCode = new QRCodeStyling(options);
		if (message) {
			qrCode.applyExtension(QRBorderPlugin(extensionOptions));
		}
		let blob = await qrCode.getRawData();
		qrcc = URL.createObjectURL(blob);
	});
</script>

{#await qrcc then qrcc}<img src={qrcc} alt="" />{/await}
