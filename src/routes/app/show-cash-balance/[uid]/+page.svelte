<script lang="ts">
	export let data;
	import { Block, BlockTitle, Fab, Navbar, NavbarBackLink, Link } from 'konsta/svelte';

	import StyledQrCode from '$components/StyledQRCode.svelte';
	import { goto } from '$app/navigation';
	import { Printer, Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	let leftPanelOpened = getContext('leftPanelOpened');
</script>

<Navbar title="Volunteer Cash Balance">
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => goto('/app')} /> -->
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => history.back()} /> -->
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>

<BlockTitle large class="!justify-center">
	{data.firstname}
	{data.lastname}
</BlockTitle>
<BlockTitle large class="!justify-center">
	₹ {data.balance_amount}
</BlockTitle>

<Block class="!relative">
	<div class="flex justify-center">
		<svelte:component this={StyledQrCode} qrcodeText={data.uid} />
	</div>
	<Fab
		class="!absolute !bottom-0 !right-0 !m-4 right-4-safe bottom-4-safe z-20 !bg-red-500"
		onClick={() => {
			alert('Note: To Add Print Logic after the printer is finalized.');
		}}><svelte:component this={Printer} slot="icon" /></Fab
	>
</Block>
