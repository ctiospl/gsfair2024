<script lang="ts">
	const { data } = $props();
	import { pushState } from '$app/navigation';
	import { Navbar, Link } from 'konsta/svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';

	import { NotepadText, QrCode, IndianRupee, MenuIcon, X } from 'lucide-svelte';
	import { LeftMenuPanel } from '$lib/ui-item-states.svelte';
	import PopupQrScanner from './PopupQrScanner.svelte';

	let popupQrScannerOpened = $state(false);

	$effect(() => {
		if (!$page.state.popupQrScannerOpened) {
			popupQrScannerOpened = false;
		}
	});

	async function CheckVisitorBalance(decodedText, decodedResult) {
		console.log('decodedText :>> ', decodedText);
		console.log('decodedResult :>> ', decodedResult);
	}
</script>

<Navbar title="Visitor Check QR Balance" class="sticky top-0">
	<Link slot="left" navbar onClick={() => (LeftMenuPanel.value = true)}><MenuIcon /></Link>
</Navbar>

<Button
	onclick={() => {
		pushState('?notesOpened=true', {
			popupQrScannerOpened: true
		});
		popupQrScannerOpened = true;
	}}>Scan QR Code</Button
>

<PopupQrScanner
	bind:popupQrScannerOpened
	onScanSuccess={CheckVisitorBalance}
	scannerTitle="Visitor Check QR Balance"
/>
