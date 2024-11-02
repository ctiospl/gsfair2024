<!-- <script lang="ts">
    import type { PageData } from './$types';
    import {defaultEditorValue} from '$lib/defaultEditorValue.js'
    import { Editor } from 'novel-svelte';
    export let data: PageData;
</script>

<table>
    <tr>
        <th>First Name</th>
        <th>Last Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Member of Event Categories</th>
    </tr>
{#each data.members as member}
    <tr>
        <td>{member.firstname}</td>
        <td>{member.lastname}</td>
        <td>{member.phone}</td>
        <td>{member.email}</td>
        <td>{member.categories?member.categories.map((c)=>c.name).join(','):''}</td>
    </tr>
{/each}
</table>

<Editor defaultValue={defaultEditorValue} debounceDuration={1000} storageKey={data.localStoragePrefix}/>
 -->

<script>
	import { Navbar, NavbarBackLink, List, ListGroup, ListItem, Link } from 'konsta/svelte';
	import { Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	let leftPanelOpened = getContext('leftPanelOpened');
	export let data;
</script>

<Navbar title="Members List">
	<!-- <NavbarBackLink slot="left" text="Back" onClick={() => history.back()} /> -->
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>
<List strongIos>
	{#each Object.keys(data.contactList) as letter}
		<ListGroup dividers={false}>
			<!-- <ListItem title="groupTitle" groupTitle contacts /> -->
			<div
				class="
                    pl-4-safe pr-4-safe py-1 flex items-center z-20 h-8 -mt-px text-[17px] text-black text-opacity-55 dark:text-white dark:text-opacity-55 bg-ios-light-surface-variant dark:bg-ios-dark-surface-variant font-semibold top-11-safe sticky text-opacity-90 dark:text-opacity-90 dark:bg-[#323234]"
			>
				{letter}
			</div>

			{#each data.contactList[letter] as member}
				<ListItem
					title={`${member.firstname} ${member.lastname}`}
					contacts
					link
					href={`/app/members/${member.id}`}
					chevronMaterial={false}
				>
					<img
						slot="media"
						src="https://cdn.iospl.com/cache/50x50-0/gs2023/{member.avatar}"
						width="44"
					/>
					<svelte:fragment slot="subtitle">
						{#if member.poc}
							{member.email}
							<br />
							{member.phone}
						{/if}
					</svelte:fragment>
					<svelte:fragment slot="text">
						<!-- {JSON.stringify(member.categories)} -->
						{#if member.categories && member.categories.length > 0}
							{#each member.categories as category}
								{category.name}
								{#if parseInt(category.poc) > 0}
									<span class=" text-gray-500">(POC)</span>
								{/if}
							{/each}
						{/if}
					</svelte:fragment>

					<!-- <svelte:element this="div" slot="subtitle">

						</svelte:element> -->
				</ListItem>
			{/each}

			<!-- <ListItem title="Aaron" contacts />
      <ListItem title="Abbie" contacts />
      <ListItem title="Adam" contacts />
      <ListItem title="Adele" contacts />
      <ListItem title="Agatha" contacts />
      <ListItem title="Agnes" contacts />
      <ListItem title="Albert" contacts />
      <ListItem title="Alexander" contacts /> -->
		</ListGroup>
	{/each}
</List>

<!--
    <ListGroup dividers={false}>
      <ListItem title="B" groupTitle contacts />
      <ListItem title="Bailey" contacts />
      <ListItem title="Barclay" contacts />
      <ListItem title="Bartolo" contacts />
      <ListItem title="Bellamy" contacts />
      <ListItem title="Belle" contacts />
      <ListItem title="Benjamin" contacts />
    </ListGroup>
    <ListGroup dividers={false}>
      <ListItem title="C" groupTitle contacts />
      <ListItem title="Caiden" contacts />
      <ListItem title="Calvin" contacts />
      <ListItem title="Candy" contacts />
      <ListItem title="Carl" contacts />
      <ListItem title="Cherilyn" contacts />
      <ListItem title="Chester" contacts />
      <ListItem title="Chloe" contacts />
    </ListGroup>
    <ListGroup dividers={false}>
      <ListItem title="V" groupTitle contacts />
      <ListItem title="Vladimir" contacts />
    </ListGroup>
  </List> -->
