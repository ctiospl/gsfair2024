<script lang="ts">
	const { data } = $props();
	import { goto } from '$app/navigation';
	import Menu from '$lib/components/Menu.svelte';
	import { LeftMenuPanel } from '$lib/ui-item-states.svelte';
	import { Link, Navbar } from 'konsta/svelte';
	import { LogOut, Menu as MenuIcon } from 'lucide-svelte';
</script>

<Navbar title="GS Fair 2024" subtitle="Spirals" class="sticky top-0">
	<Link slot="left" navbar onClick={() => (LeftMenuPanel.value = true)}><MenuIcon /></Link>
	<Link
		slot="right"
		navbar
		onClick={() => {
			goto('/logout');
		}}><LogOut /></Link
	>
</Navbar>
