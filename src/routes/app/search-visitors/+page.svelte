<script lang="ts">
	export let data;
	import { goto } from '$app/navigation';
	import { IndianRupee, QrCode } from 'lucide-svelte';
	import {
		Page,
		Navbar,
		NavbarBackLink,
		Searchbar,
		List,
		ListItem,
		Fab,
		Popup,
		Link
	} from 'konsta/svelte';
	import { debounce } from '@sveu/shared';
	import { startScan, stopScan } from '$components/QrScanner.svelte';

	import QrScanner from '$components/QrScanner.svelte';

	let searchQuery = '';
	let searchData = [];
	const handleSearch = debounce(async (e) => {
		if (e.target.value.length > 3) {
			const res = await fetch(`/app/api/visitor-registration/search/${e.target.value}`);
			searchData = await res.json();
			searchQuery = e.target.value;
		}
	}, 0.5);

	function handleClear() {
		searchQuery = '';
	}

	function handleDisable() {
		console.log('Disable');
	}
	let popupOpened = false;
	let filteredItems = [];

	// $: console.log('searchQuery :>> ', searchQuery);
	/* eslint-disable */
	$: {
		filteredItems = searchData;
	}
</script>

<Navbar title="GS Fair 2023 Guest List">
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => history.back()} /> -->
	<NavbarBackLink slot="left" text="Back" onClick={() => goto('/app/visitor-registration')} />
	<Searchbar
		slot="subnavbar"
		value={searchQuery}
		onInput={handleSearch}
		onClear={handleClear}
		disableButton
		disableButtonText="Cancel"
		onDisable={handleDisable}
	/>
</Navbar>
<List strong insetMaterial outlineIos>
	{#if filteredItems.length === 0}
		<ListItem title="Nothing found" />
	{/if}
	{#each filteredItems as item (item.id)}
		<ListItem
			key={item.id}
			title={item.title}
			subtitle="{item.phone ? `${item.phone} - ` : ''}{item.payment_method}"
		>
			<svelte:fragment slot="after">
				<div
					class="mr-8"
					on:click={() => {
						goto(`/app/show-balance/${item.uid}`);
					}}
				>
					<IndianRupee />
				</div>
				<div
					on:click={() => {
						goto(`/app/visitor-registration/assign/${item.id}`);
					}}
				>
					<QrCode />
				</div>
			</svelte:fragment>
		</ListItem>
	{/each}
</List>

<Fab
	onClick={() => {
		name = '';
		popupOpened = true;
		startScan();
	}}
	class="fixed right-4-safe bottom-4-safe z-20 !bg-red-500"
>
	<svelte:component this={QrCode} slot="icon" />
</Fab>

<Popup opened={popupOpened} onBackdropClick={() => (popupOpened = false)}>
	<Page>
		<Navbar title="Visitor QrCode Scanner">
			<Link
				slot="right"
				navbar
				onClick={() => {
					popupOpened = false;
					stopScan();
				}}>Close</Link
			>
		</Navbar>
		<QrScanner
			on:scan={async (e) => {
				popupOpened = false;
				console.log('e.detail :>> ', e.detail);
				if (e.detail.length == 3) {
					// const res = await fetch(`/app/api/visitor-registration/search/qrcode/${e.detail}`);
					goto(`/app/visitor-registration/assign/${e.detail}`);
					// searchData = await res.json();
					// searchQuery = e.detail;
				}
			}}
		/>
	</Page>
</Popup>
