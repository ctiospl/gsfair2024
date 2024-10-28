<script lang="ts">
	const { data } = $props();
	// lib
	import { goto } from '$app/navigation';
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/stores';

	// state
	import { LeftMenuPanel, LoadingDialog } from '$lib/ui-item-states.svelte';

	// components
	import Navbar from '$lib/components/Navbar.svelte';

	// ui
	import { LogOut, Menu as MenuIcon } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const flash = getFlash(page);
	function showMessage(type, message = 'Success') {
		$flash = { type, message };
	}
</script>

<Navbar title="GS Fair 2024">
	{#snippet leftLink()}
		<Button variant="link" size="icon" onclick={() => (LeftMenuPanel.value = true)}
			><MenuIcon />
		</Button>
	{/snippet}
	{#snippet rightLink()}
		<Button variant="link" size="icon" onclick={() => goto('/logout')}><LogOut /></Button>
	{/snippet}
</Navbar>

<Button
	onclick={async () => {
		showMessage('success', 'Scanning QR Code');
		LoadingDialog.value = true;
		setTimeout(() => {
			LoadingDialog.value = false;
		}, 3000);
	}}>Scan QR Code</Button
>
