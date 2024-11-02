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
	import { Menu, QrCode } from 'lucide-svelte';

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
			><Menu />
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

<div class="flex h-dvh flex-col">
	{#if name}
		<div class="flex flex-1 items-center justify-center">
			<h2 class="text-3xl font-bold">{name}</h2>
		</div>

		<div class="flex flex-1 items-center justify-center">
			<p class="text-2xl">QrCode Balance</p>
			<p class="text-3xl font-bold">₹ {balance}</p>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<p class="pb-8 text-center text-3xl">
					Please scan the QR Code of the visitor <br />to check their Balance
				</p>

				<Button
					class="h-24 px-6 text-4xl [&_svg]:size-10"
					onclick={() => (PopupQrScannerOpened.value = true)}><QrCode /> Scan QR Code</Button
				>
			</div>
		</div>
	{/if}
</div>
