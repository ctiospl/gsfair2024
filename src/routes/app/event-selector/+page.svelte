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
		CurrentEvent,
		LeftMenuPanel,
		PopupQrScannerOpened,
		LoadingDialog
	} from '$lib/ui-item-states.svelte';
	import { eventLS } from '$lib/web-storage.svelte';

	$effect(async () => {
		QrScannerTitle.value = 'Select Event';
		QrScannerOnScan.value = await SetEvent;
		console.log('$eventLS.event_code :>> ', $eventLS);
		if ($eventLS.event_code && ((Date.now() / 1000) | 0) - $eventLS?.since < 3 * 60 * 60) {
			await SetEvent($eventLS.event_code);
		}
	});

	async function SetEvent(eventCode: string, resetSince?: false) {
		LoadingDialog.open = true;
		const res = await fetch(`/app/api/events/${eventCode}`);
		const data = await res.json();
		if ('error' in data) {
			LoadingDialog.open = false;
			return showMessage(page, { type: 'error', text: data.message });
		}
		CurrentEvent.id = data.id;
		CurrentEvent.event_name = data.event_name;
		CurrentEvent.event_code = data.event_code;
		CurrentEvent.has_items = data.has_items;
		CurrentEvent.price = data.price;
		CurrentEvent.since = (Date.now() / 1000) | 0;

		CurrentEvent.event_items = data.event_items;
		$eventLS.event_name = data.event_name;
		$eventLS.event_code = data.event_code;
		$eventLS.since = CurrentEvent.since;
		LoadingDialog.open = false;
		console.log('CurrentEvent :>> ', $state.snapshot(CurrentEvent));
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

<div class="flex h-[calc(100dvh-5rem)] flex-col">
	{#if CurrentEvent.event_name && ((Date.now() / 1000) | 0) - CurrentEvent?.since < 3 * 60 * 60}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<h2 class="text-3xl font-bold">Current Event</h2>
				<p class="text-3xl">{CurrentEvent.event_name}</p>
				<p class="text-3xl">₹ {CurrentEvent.price}</p>
			</div>
		</div>
	{/if}
	<div class="flex flex-1 items-center justify-center">
		<div class="flex flex-col items-center justify-center">
			<p class="pb-8 text-center text-3xl">
				Scan the Event QR Code to {CurrentEvent.event_name ? 'Change' : 'Select'} the event
			</p>

			<Button
				class="h-24 px-6 text-4xl [&_svg]:size-10"
				onclick={() => (PopupQrScannerOpened.value = true)}><QrCode /> Scan QR Code</Button
			>
		</div>
	</div>
</div>
