<script lang="ts">
	import LinkBack from '$lib/components/LinkBack.svelte';
	import { Link, Navbar, Page, Popup } from 'konsta/svelte';

	let { popupEventElectorOpened = $bindable() } = $props();
	let scanner;
	$effect(() => {
		if (popupEventElectorOpened) {
			scanner.startScanner();
		} else {
			scanner.stopScanner();
			console.log('stopped');
		}
		// return () => {
		//     scanner.stopScanner();
		//     scanner = null;
		// };
	});
	$effect(() => {
		return () => {
			scanner = null;
		};
	});
</script>

<Popup
	opened={popupEventElectorOpened}
	onBackdropClick={async () => {
		popupEventElectorOpened = false;
		history.back();
	}}
>
	<Page>
		<Navbar title="Notes">
			<Link
				slot="left"
				navbar
				onClick={() => {
					popupEventElectorOpened = false;
					history.back();
				}}><LinkBack /></Link
			>
		</Navbar>
		<Scanner
			hideScannerOnPause={true}
			pauseCameraOnScanSuccess={true}
			bind:this={scanner}
			autostart={false}
		/>

		<div class="container"></div>
	</Page>
</Popup>
