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
	import {
		QrScannerTitle,
		QrScannerOnScan,
		QrScannerAutostart,
		CurrentEvent
	} from '$lib/ui-item-states.svelte';
	import { LeftMenuPanel, PopupQrScannerOpened, LoadingDialog } from '$lib/ui-item-states.svelte';

	let balance = $state(0);
	let name = $state('');

	$effect(async () => {
		QrScannerTitle.value = 'Select Event';
		QrScannerOnScan.value = await SetEvent;
		if (!CurrentEvent.id) {
			QrScannerAutostart.value = true;
		}
	});
	afterNavigate(async () => {
		PopupQrScannerOpened.value = true;
	});

	async function SetEvent(eventCode: string) {
		LoadingDialog.value = true;
		const res = await fetch(`/app/api/events/${eventCode}`);
		const data = await res.json();
		if ('error' in data) {
			LoadingDialog.value = false;
			return showMessage(page, { type: 'error', text: data.message });
		}
		try {
			let res = await fetch(`/app/api/events/set/${eventCode}`);
			let data = await res.json();
			if (res.status === 200) {
				CurrentEvent.id = data.id;
				CurrentEvent.event_name = data.event_name;
				CurrentEvent.event_code = data.event_code;
				CurrentEvent.has_items = data.has_items;
				CurrentEvent.price = data.price;
				CurrentEvent.since = (Date.now() / 1000) | 0;
				CurrentEvent.event_items = data.event_items;
			}
			LoadingDialog.value = false;
		} catch (error) {
			LoadingDialog.value = false;
			if ('error' in data) {
				return showMessage(page, { type: 'error', text: data.message });
			}
		}
	}
</script>

<Navbar title="Event Selector">
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
	{#if CurrentEvent.event_name}
		<div class="flex flex-1 items-center justify-center">
			<h2 class="text-3xl font-bold">Current Event</h2>
		</div>

		<div class="flex flex-1 items-center justify-center">
			<p class="text-2xl">{CurrentEvent.event_name}</p>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<p class="pb-8 text-center text-3xl">
					Please scan the Event QR Code to {CurrentEvent.event_name ? 'change' : 'select'} the event
				</p>

				<Button
					class="h-24 px-6 text-4xl [&_svg]:size-10"
					onclick={() => (PopupQrScannerOpened.value = true)}><QrCode /> Scan QR Code</Button
				>
			</div>
		</div>
	{/if}
</div>
