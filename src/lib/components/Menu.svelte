<script lang="ts">
	import {
		X,
		Home,
		LogOut,
		Bike,
		User,
		Hourglass,
		IndianRupee,
		PersonStanding,
		FerrisWheel,
		Pencil,
		Truck,
		Boxes,
		Package,
		FileText,
		PackagePlus,
		PiggyBank,
		Users,
		UserPlus,
		QrCode,
		BadgeIndianRupee,
		Wallet,
		Plus,
		Shell,
		Check,
		ArrowRight,
		AlertCircle,
		ScrollText,
		Search
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import Logo from '$lib/images/goldenspiral-logo.svg';
	import { pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	import { event } from '$lib/web-storage.svelte';

	import {
		LeftMenuPanel,
		CashBalance,
		PopupQrScannerOpened,
		QrScannerTitle,
		QrScannerOnScan,
		QrScannerAutostart
	} from '$lib/ui-item-states.svelte';

	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { ScrollArea } from '$lib/components/ui/scroll-area/index.js';

	// import PopupEventQRScanner from '$lib/components/PopupQrScanner.svelte';

	let popupQrScannerOpened = $state(false);
	// $inspect($page);

	$effect(() => {});
	let role = $page.data?.user?.role || 'volunteer';

	async function UpdateSelectedEvent(eventId: number) {
		console.log('eventId :>> ', eventId);
		// PopupQrScannerOpened.value = false;
	}

	let menuItems = $state([
		{
			title: 'Home',
			icon: Shell,
			url: `/app`
		},
		{
			title: 'Collect ₹/Scan QR',
			icon: QrCode,

			url: `/app/collect-payment`
		},
		{
			title: 'Check Balance',
			icon: Check,
			// icon2: Wallet,
			// icon3: IndianRupee,

			url: `/app/check-balance`
		},
		{
			title: 'Transactions',
			icon: ScrollText,
			url: `/app/volunteer-transactions`
		}
	]);
	switch (role) {
		case 'volunteer':
			break;

		case 'refund':
			menuItems.push(
				...[
					{
						title: 'Add ₹ to QrCode',
						icon: Plus,
						// icon2: IndianRupee,
						// icon3: Wallet,
						url: `/recharge-qrcode`
					},
					{
						title: 'Issue Refund(Cash)',
						icon: IndianRupee,
						url: `/refund-issue`
					},
					{
						title: 'Balance Transfer',
						icon: ArrowRight,
						url: `/balance-transfer`
					}
				]
			);

			break;
		case 'recharge':
			menuItems = [
				...menuItems,
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: `/app/balance-transfer`
				}
			];

			break;
		case 'registration':
			menuItems = [
				...menuItems,
				{
					title: 'Visitor Registration',
					icon: UserPlus,
					url: `/app/visitor-registration`
				},
				{
					title: 'Search Visitors',
					icon: Search,
					url: `/app/search-visitors`
				},
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: `/app/balance-transfer`
				}
			];

			break;
		case 'super':
			menuItems = [
				...menuItems,
				{
					title: 'Visitor Registration',
					icon: UserPlus,
					url: `/app/visitor-registration`
				},
				{
					title: 'Search Visitors',
					icon: Search,
					url: `/app/search-visitors`
				},
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: `/app/balance-transfer`
				},
				{
					title: 'Issue Cash(Volunteer)',
					icon: Plus,
					url: `/app/cash-issue`
				},
				{
					title: 'Cash Settlement',
					icon: PiggyBank,
					url: `/app/cash-settlement-collect`
				},
				{
					title: 'Issue Refund(Cash)',
					icon: IndianRupee,
					url: `/app/refund-issue`
				}
			];

			break;

		default:
			menuItems = [];
			break;
	}

	menuItems = [
		...menuItems,
		{
			title: 'SOS',
			icon: AlertCircle,
			url: `/app/sos`
		}
	];
</script>

<Sheet.Root bind:open={LeftMenuPanel.value}>
	<Sheet.Trigger></Sheet.Trigger>
	<Sheet.Content side="left" class="m-0 p-0 no-scrollbar sm:max-w-xs">
		<ScrollArea class="m-0 h-full w-full p-0 no-scrollbar">
			<nav class="grid gap-6 text-lg font-medium">
				<div class="flex justify-between">
					<button
						class="group flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-semibold text-primary-foreground md:text-base"
					>
						<img
							class="h-8 w-8 transition-all group-hover:scale-110"
							src={Logo}
							alt="PureTree Logo"
						/>
					</button>

					<!-- <span class="w-full grow pl-4">Hi {$page.data.user.firstname}</span> -->
					<span class="w-full grow pl-4">Cash Balance : ₹ {CashBalance.value}</span>
				</div>

				<Button
					class="ml-4 w-[90%] !bg-black"
					onclick={async () => {
						pushState('?scannerOpened=true', {
							popupQrScannerOpened: true
						});
						QrScannerTitle.value = 'Scan Event QR Code';
						QrScannerOnScan.value = await UpdateSelectedEvent;
						QrScannerAutostart.value = false;
						PopupQrScannerOpened.value = true;
						LeftMenuPanel.value = false;
					}}
				>
					<FerrisWheel class="mr-2 h-4 w-4" />
					{$event.event_name ? $event.event_name : 'Select Event'}
				</Button>

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
