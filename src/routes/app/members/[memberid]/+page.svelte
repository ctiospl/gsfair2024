<script lang="ts">
	import type { PageData } from './$types';
	import { Editor } from 'novel-svelte';
	import { defaultEditorValue } from '$lib/defaultEditorValue.js';
	import {
		Page,
		Navbar,
		NavbarBackLink,
		List,
		ListGroup,
		ListItem,
		Card,
		Link,
		Button,
		BlockTitle
	} from 'konsta/svelte';

	import { Home } from 'lucide-svelte';

	export let data: PageData;
</script>

<!-- <p>Member: {data.memberInfo.firstname} {data.memberInfo.lastname}</p>
<p>
	Email: {data.memberInfo.email}
</p>
<p>
	Phone: {data.memberInfo.phone}
</p>
{#if data.memberInfo.categories}
	<div class="subcategories">
		<h2>Member of Event Categories</h2>
		<ul>
			{#each data.memberInfo.categories as category}
				<li><a href="/app/categories/{category.id}">{category.name}</a></li>
			{/each}
		</ul>
	</div>
{/if}

<div class="description">
	<Editor
		defaultValue={defaultEditorValue}
		debounceDuration={1000}
		storageKey={data.localStoragePrefix + '_' + data.memberInfo.id}
	/>

</div> -->
<Navbar title="{data.memberInfo.firstname} {data.memberInfo.lastname}">
	<NavbarBackLink slot="left" text="Back" onClick={() => history.back()} />
	<!-- <Link slot="right" navbar href="/app"><Home /></Link> -->
</Navbar>

<Card>
	<svelte:fragment slot="footer">
		{#if data.memberInfo.poc}
			<div class="flex justify-between material:hidden">
				<p>
					<Link href="mailto:{data.memberInfo.email ?? ''}"
						>Email: {data.memberInfo.email ?? ''}</Link
					>
				</p>
				<p>
					<Link href="tel:{data.memberInfo.phone}" rounded inline outline
						>Phone: {data.memberInfo.phone}</Link
					>
				</p>
			</div>

			<div class="flex justify-start ios:hidden space-x-2 rtl:space-x-reverse">
				<!-- <Button rounded inline>Like</Button> -->
				<p>
					<Link href="mailto:{data.memberInfo.email ?? ''}"
						>Email: {data.memberInfo.email ?? ''}</Link
					>
				</p>
				<p>
					<Link href="tel:{data.memberInfo.phone}" rounded inline outline
						>Phone: {data.memberInfo.phone}</Link
					>
				</p>
			</div>
		{/if}
	</svelte:fragment>

	<div class="bg-white">
		<section aria-labelledby="features-heading" class="relative">
			<div
				class="aspect-h-2 aspect-w-3 overflow-hidden sm:aspect-w-5 lg:aspect-none lg:absolute lg:h-full lg:w-1/2 lg:pr-4 xl:pr-16"
			>
				<img
					src="https://cdn.iospl.com/cache/500x500-0/gs2023/{data.memberInfo.avatar}"
					alt="{data.memberInfo?.firstname}'s mugshot :)"
					class="h-full w-full object-cover object-center lg:h-full lg:w-full"
				/>
			</div>

			<div
				class="mx-auto max-w-2xl px-4 pb-24 pt-16 sm:px-6 sm:pb-32 lg:grid lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:pt-32"
			>
				<div class="lg:col-start-2">
					<p class="mt-4 text-4xl font-bold tracking-tight text-gray-900">
						{data.memberInfo.firstname}
						{data.memberInfo.lastname}
					</p>
					<p class="mt-4 text-gray-500">
						<BlockTitle>Member of Categories</BlockTitle>
						<List>
							<!-- {#if data.memberInfo.poc}
				<ListItem
					href="/app/categories/{data.memberInfo.poc.id}"
					title=POC: {data.memberInfo.poc.name}
				/>
			{/if} -->
							{#if data.memberInfo.categories}
								{#each data.memberInfo.categories as category}
									<ListItem href="/app/categories/{category.id}">
										<svelte:fragment slot="title">
											{category.name}
											{#if parseInt(category.poc) > 0}
												<span class=" text-gray-500">(POC)</span>
											{/if}
										</svelte:fragment>
									</ListItem>
								{/each}
							{/if}
						</List>
					</p>
				</div>
			</div>
		</section>
	</div>
</Card>
