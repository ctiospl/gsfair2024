<script lang="ts">
	import { Navbar, Button, NavbarBackLink, Link } from 'konsta/svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	let leftPanelOpened = getContext('leftPanelOpened');
</script>

<Navbar title="GS FAIR 2023 Planning App">
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => goto('/app')} /> -->
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>
<div class="flex flex-col min-h-full align-middle justify-center self-center">
	<Button
		href="{$page.route.id}/register"
		class="my-8 h-32 !w-10/12 rounded-lg !bg-primary mx-auto"
		large>Start Registration</Button
	>
	<Button
		href="{$page.route.id}/list"
		class="my-8 h-32 !w-10/12 rounded-lg !bg-blue-600 mx-auto"
		large
		fill>List Visitors</Button
	>
</div>
