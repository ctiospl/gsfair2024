<script lang="ts">
	import type { PageData } from './$types';
	import { getContext } from 'svelte';
	import { ListItem, Navbar, List, BlockTitle, Link } from 'konsta/svelte';
	import { Menu, Phone } from 'lucide-svelte';
	let leftPanelOpened = getContext('leftPanelOpened');

	export let data: PageData;
</script>

<Navbar title="SOS">
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>
<div class="flex flex-col">
	<div class="justify-self-center text-2xl text-center">
		If you face any issues with the app, please call us.
	</div>
</div>
<!-- <BlockTitle large class="!justify-center"></BlockTitle> -->

<List class="!justify-center mt-4 ml-4 border-none border-0 ">
	<ListItem>
		<Link href="tel:+919920022557"><Phone class="mr-4" />Neel</Link>
	</ListItem>
	<ListItem>
		<Link href="tel:+919930868922"><Phone class="mr-4" />Chintan</Link>
	</ListItem>
</List>
