<script lang="ts">
	import { Popup, Page, Navbar, Link } from 'konsta/svelte';
	import LinkBack from '$lib/components/LinkBack.svelte';
	import Scanner from '$lib/components/Scanner.svelte';
	const ScannerState = {
		UNKNOWN: 0,
		NOT_STARTED: 1,
		SCANNING: 2,
		PAUSED: 3
	} as const;
	import type Dice_2 from 'lucide-svelte/icons/dice-2';

	let {
		popupQrScannerOpened = $bindable(),
		onScanSuccess = (decodedText, decodedResult) => {},
		scannerTitle = 'QR Code Scanner'
	} = $props();
	let scanner;
	$effect(async () => {
		if (popupQrScannerOpened) {
			await scanner.startScanner();
		} else {
			console.log('scanner.g :>> ', await scanner.getScannerState());
			try {
				if (
					[ScannerState.SCANNING, ScannerState.PAUSED].includes(await scanner.getScannerState())
				) {
					await scanner.stopScanner();
				}
			} catch (error) {
				console.log('error :>> ', error);
			}
			console.log('stopped');
		}
		// return () => {
		//     scanner.stopScanner();
		//     scanner = null;
		// };
	});
	$effect(() => {
		// return () => {
		// 	scanner = null;
		// };
	});
	$inspect('scanner >>', scanner);
</script>

<Popup
	opened={popupQrScannerOpened}
	onBackdropClick={async () => {
		popupQrScannerOpened = false;
		history.back();
	}}
>
	<Page>
		<Navbar title={scannerTitle}>
			<Link
				slot="left"
				navbar
				onClick={() => {
					popupQrScannerOpened = false;
					history.back();
				}}><LinkBack /></Link
			>
		</Navbar>
		<Scanner
			hideScannerOnPause={false}
			pauseCameraOnScanSuccess={true}
			onScanSuccess={(decodedText, decodedResult) => {
				onScanSuccess(decodedText, decodedResult);
				popupQrScannerOpened = false;
				history.back();
			}}
			bind:this={scanner}
			autostart={false}
		/>

		<div class="container">
			<div class="prose"></div>
		</div>
	</Page>
</Popup>
