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
	import PuretreeLogo from '$lib/images/goldenspiral-logo.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { LeftMenuPanel, CashBalance } from '$lib/ui-item-states.svelte';
	$inspect($page);

	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

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
		<ScrollArea class="m-0 h-full w-full p-0 no-scrollbar">
			<nav class="grid gap-6 text-lg font-medium">
				<div class="flex justify-between">
					<button
						class="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground md:text-base"
					>
						<img
							class="h-8 w-8 transition-all group-hover:scale-110"
							src={PuretreeLogo}
							alt="PureTree Logo"
						/>
					</button>
					<span class="w-full grow pl-4">Hi {$page.data.user.firstname}</span>
				</div>
				<span class="">Cash Balance : ₹ {CashBalance.value}</span>
				{#each menuItems as menuItem}
					{@const Icon = menuItem.icon}
					<button
						onclick={() => {
							LeftMenuPanel.value = false;
							goto(menuItem.url);
						}}
						class="flex items-center gap-4 px-2.5 {$page.route.id === menuItem.url.toLowerCase()
							? 'text-foregroun'
							: 'text-muted-foreground hover:text-foreground'} "
					>
						<Icon class="h-5 w-5" />
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
		</ScrollArea>
	</Sheet.Content>
</Sheet.Root>
