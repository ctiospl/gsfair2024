<script lang="ts">
	export let data;
	import { goto } from '$app/navigation';
	import { IndianRupee, QrCode } from 'lucide-svelte';
	import { Page, Navbar, NavbarBackLink, Searchbar, List, ListItem } from 'konsta/svelte';

	let searchQuery = '';

	function handleSearch(e) {
		searchQuery = e.target.value;
	}

	function handleClear() {
		searchQuery = '';
	}

	function handleDisable() {
		console.log('Disable');
	}

	let filteredItems = [];
	// $: console.log('searchQuery :>> ', searchQuery);
	/* eslint-disable */
	$: {
		filteredItems = searchQuery
			? data.items.filter((item) => {
					// console.log('item.phone :>> ', item.master_user_phone);
					return (
						item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.master_user_phone.includes(searchQuery.toLowerCase())
					);
			  })
			: data.items;
	}
</script>

<Navbar title="GS Fair 2023 Guest List">
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => history.back()} /> -->
	<NavbarBackLink slot="left" text="Back" onClick={() => goto('/app/visitor-registration')} />
	<Searchbar
		slot="subnavbar"
		onInput={handleSearch}
		value={searchQuery}
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
