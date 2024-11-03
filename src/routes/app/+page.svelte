<script lang="ts">
	const { data } = $props();
	// lib/functions
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';

	// state
	import {
		LeftMenuPanel,
		LoadingDialog,
		ConfirmDialogProps,
		PopupRouteProps
	} from '$lib/ui-item-states.svelte';

	// components
	import Navbar from '$lib/components/Navbar.svelte';
	import StepCounter from '$lib/components/StepCounter.svelte';

	// ui
	import { LogOut, Menu as MenuIcon } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	let currentValue = $state(0);

	function handleValueChange(newValue: number) {
		currentValue = newValue;
	}
</script>

<Navbar title="GS Fair 2024">
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
		<Button variant="link" size="icon" class="[&_svg]:size-7" onclick={() => goto('/logout')}
			><LogOut /></Button
		>
	{/snippet}
</Navbar>

<Button
	onclick={async () => {
		LoadingDialog.open = true;
	}}>Scan QR Code</Button
>

<StepCounter bind:value={currentValue} />

<p>Current value: {currentValue}</p>
