<script lang="ts">
	import type { PageData } from '../$types';
	import { Block, BlockTitle, Fab, Navbar, NavbarBackLink, Link } from 'konsta/svelte';
	export let data: PageData;
	import StyledQrCode from '$components/StyledQRCode.svelte';
	import { goto } from '$app/navigation';
	import { Printer } from 'lucide-svelte';
	import { page } from '$app/stores';
</script>

<Navbar title="Print Visitor QrCodes">
	<NavbarBackLink
		slot="left"
		text="Back"
		onClick={() => {
			goto('/app/visitor-registration/register', { replaceState: true });
		}}
	/>
	<Link
		slot="right"
		navbar
		onClick={() => {
			alert('Print All Labels. Print Logic to be added after the printer is finalized ');
		}}><Printer /></Link
	>
</Navbar>
{#each data.userData as user, i (i)}
	<BlockTitle large class="!justify-center">
		{user.name}
	</BlockTitle>
	<Block class="!relative">
		<!-- {#key user.uid} -->
		<div class="flex justify-center">
			<svelte:component this={StyledQrCode} qrcodeText={user.uid} />
		</div>
		<Fab
			class="!absolute !bottom-0 !right-0 !m-4 right-4-safe bottom-4-safe z-20 !bg-red-500"
			onClick={() => {
				alert('Note: To Add Print Logic after the printer is finalized.');
			}}><svelte:component this={Printer} slot="icon" /></Fab
		>
	</Block>
{/each}
