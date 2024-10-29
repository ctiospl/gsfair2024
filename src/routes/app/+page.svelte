<script lang="ts">
	const { data } = $props();
	// lib/functions
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';

	// state
	import { LeftMenuPanel, LoadingDialog } from '$lib/ui-item-states.svelte';

	// components
	import Navbar from '$lib/components/Navbar.svelte';

	// ui
	import { LogOut, Menu as MenuIcon } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
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
		LoadingDialog.value = true;
		setTimeout(() => {
			LoadingDialog.value = false;
			showMessage(page, { type: 'success', text: 'Scanning QR Code' });
		}, 3000);
	}}>Scan QR Code</Button
>
