<script lang="ts">
	const { data } = $props();
	import { pushState, replaceState } from '$app/navigation';
	import { Navbar, Link } from 'konsta/svelte';
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';

	import { MenuIcon, QrCode } from 'lucide-svelte';
	import { LeftMenuPanel, PopupQrScannerOpened } from '$lib/ui-item-states.svelte';
	import { QrScannerTitle, QrScannerOnScan, QrScannerAutostart } from '$lib/ui-item-states.svelte';
	import { getFlash } from 'sveltekit-flash-message';
	const flash = getFlash(page);
	function showMessage(type, message = 'Success') {
		$flash = { type, message };
	}
	let balance = $state(0);
	let name = $state('');

	$effect(async () => {
		QrScannerTitle.value = 'Visitor Check QR Balance';
		QrScannerOnScan.value = await CheckVisitorBalance;
		QrScannerAutostart.value = true;
		PopupQrScannerOpened.value = true;
	});

	async function CheckVisitorBalance(uid: string) {
		console.log('decodedText :>> ', uid);
		const formData = new FormData();
		formData.append('uid', uid);

		const res = await fetch(`/app/api/qrcode/get-balance/${uid}`);
		const data = await res.json();
		if ('error' in data) {
			return showMessage('error', data.message);
		}
		balance = data.balance_amount;
		name = data.name;
		// history.back();
	}
</script>

<Navbar title="Visitor Check QR Balance" class="sticky top-0">
	<Link slot="left" navbar onclick={() => (LeftMenuPanel.value = true)}><MenuIcon /></Link>
	<Link
		slot="right"
		navbar
		onClick={() => {
			PopupQrScannerOpened.value = true;
		}}><QrCode /></Link
	>
</Navbar>

<Button
	onclick={async () => {
		// popupQrScannerOpened = true;
	}}>Scan QR Code</Button
>

<div
	class="grid h-[80dvh] grid-flow-row auto-rows-fr content-center items-center justify-items-center"
>
	{#if name}
		<div class="text-3xl">
			{name}
		</div>
		<div class="text-center text-xl">
			<div>QrCode Balance</div>
			<div class="text-3xl">
				₹ {balance}
			</div>
		</div>
	{:else}
		<div class="p-8 text-2xl">Check your QrCode Balance</div>
		<div class="p-8 text-2xl">Please click on the button below to scan the QrCode</div>
	{/if}
</div>
