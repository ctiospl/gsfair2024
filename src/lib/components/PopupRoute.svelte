<!-- TODO
 Impement pushState for Shallow Routing
-->
<script lang="ts">
	import * as Drawer from '$lib/components/ui/drawer';
	import { pushState } from '$app/navigation';
	import { X } from 'lucide-svelte';
	import { tick } from 'svelte';
	import { watch } from 'runed';

	import { PopupRouteProps } from '$lib/ui-item-states.svelte.js';
	let RouterComponent = $state();
	let routerComponent = $state();

	$effect(async () => {
		if (PopupRouteProps.open == true) {
			// await tick();
			pushState('?popupRoute=true', {
				popupRouteOpened: true
			});
			RouterComponent = (await import(PopupRouteProps.route)).default;
		}
	});
</script>

<Drawer.Root dismissible={false} bind:open={PopupRouteProps.open}>
	<Drawer.Content class="!h-dvh !w-dvw">
		<Drawer.Header>
			<Drawer.Close
				onclick={() => {
					history.back();
				}}
				class="active:scale-98 absolute right-5 top-5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background"
			>
				<div>
					<X class="size-5 text-foreground" />
					<span class="sr-only">Close</span>
				</div>
			</Drawer.Close>
			<Drawer.Title>{PopupRouteProps.title}</Drawer.Title>
			<Drawer.Description>
				{#if PopupRouteProps.open}
					<!-- {#await import(PopupRouteProps.route) then RouterComponent} -->
					<RouterComponent bind:this={routerComponent} />
					<!-- {/await} -->
				{/if}
			</Drawer.Description>
			<Drawer.Footer></Drawer.Footer>
		</Drawer.Header>
	</Drawer.Content>
</Drawer.Root>
