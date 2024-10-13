<script lang="ts">
	import {
		X,
		Home,
		LogOut,
		Bike,
		User,
		Hourglass,
		IndianRupee,
		PersonStanding
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { LeftMenuPanel } from '$lib/ui-item-states.svelte';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import PuretreeLogo from '$lib/images/ptfs-logo.svg';
	import { page } from '$app/stores';

	const menuItems = [
		{
			title: 'Home',
			icon: Home,
			url: '/app'
		},
		{
			title: 'Assign Deliveries',
			icon: PersonStanding,
			url: '/app/assign-deliveries'
		},
		{
			title: 'Deliveries',
			icon: Bike,
			url: '/app/deliveries'
		},
		{
			title: 'History',
			icon: Hourglass,
			url: '/app/deliveries-done'
		},
		{
			title: 'Cash Balance',
			icon: IndianRupee,
			url: '/app/cash-balance'
		},
		{
			title: 'User',
			icon: User,
			url: '/app/settings'
		}
	];
</script>

<Sheet.Root bind:open={LeftMenuPanel.value}>
	<Sheet.Trigger></Sheet.Trigger>
	<Sheet.Content side="left" class="sm:max-w-xs">
		<nav class="grid gap-6 text-lg font-medium">
			<button
				class="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground md:text-base"
			>
				<img
					class="h-8 w-8 transition-all group-hover:scale-110"
					src={PuretreeLogo}
					alt="PureTree Logo"
				/>
				<span class="sr-only">PTMS</span>
			</button>
			{#each menuItems as menuItem}
				<button
					onclick={() => {
						LeftMenuPanel.value = false;
						goto(menuItem.url);
					}}
					class="flex items-center gap-4 px-2.5 {$page.route.id === menuItem.url.toLowerCase()
						? 'text-foregroun'
						: 'text-muted-foreground hover:text-foreground'} "
				>
					<svelte:component this={menuItem.icon} class="h-5 w-5" />
					{menuItem.title}
				</button>
			{/each}
			<button
				onclick={() => {
					LeftMenuPanel.value = false;
					goto('/logout');
				}}
				class="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
			>
				<LogOut class="h-5 w-5" />
				Logout
			</button>
		</nav>
	</Sheet.Content>
</Sheet.Root>
