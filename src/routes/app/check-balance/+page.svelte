<script lang="ts">
	const { data } = $props();

	// lib/functions
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	import { showMessage } from '$lib/flash-messages.svelte';

	// components
	import Button from '$lib/components/ui/button/button.svelte';
	import Navbar from '$lib/components/Navbar.svelte';

	// ui
	import { MenuIcon, QrCode } from 'lucide-svelte';

	// state
	import { QrScannerTitle, QrScannerOnScan, QrScannerAutostart } from '$lib/ui-item-states.svelte';
	import { LeftMenuPanel, PopupQrScannerOpened, LoadingDialog } from '$lib/ui-item-states.svelte';

	let balance = $state(0);
	let name = $state('');

	$effect(async () => {
		QrScannerTitle.value = 'Visitor Check QR Balance';
		QrScannerOnScan.value = await CheckVisitorBalance;
		QrScannerAutostart.value = true;
		// PopupQrScannerOpened.value = true;
	});
	afterNavigate(async () => {
		PopupQrScannerOpened.value = true;
	});

	async function CheckVisitorBalance(uid: string) {
		const formData = new FormData();
		formData.append('uid', uid);

		LoadingDialog.value = true;

		const res = await fetch(`/app/api/qrcode/get-balance/${uid}`);
		const data = await res.json();

		LoadingDialog.value = false;

		if ('error' in data) {
			return showMessage(page, { type: 'error', text: data.message });
		}

		balance = data.balance_amount;
		name = data.name;
	}
</script>

<Navbar title="Visitor Check QR Balance">
	{#snippet leftLink()}
		<Button
			variant="link"
			size="icon"
			class="[&_svg]:size-7"
			onclick={() => (LeftMenuPanel.value = true)}
			><MenuIcon />
		</Button>
	{/snippet}
	{#snippet rightLink()}
		<Button
			variant="link"
			size="icon"
			class="[&_svg]:size-7"
			onclick={() => (PopupQrScannerOpened.value = true)}><QrCode /></Button
		>
	{/snippet}
</Navbar>

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
