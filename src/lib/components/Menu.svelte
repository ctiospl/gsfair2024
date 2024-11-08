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

	import { eventLS } from '$lib/web-storage.svelte';

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
	let eventCode = $state('');

	$effect(() => {
		console.log('$eventLS :>> ', $eventLS);
		eventCode =
			$eventLS?.event_code && ((Date.now() / 1000) | 0) - $eventLS?.since < 3 * 60 * 60
				? $eventLS?.event_code
				: '';
		console.log('eventCode :>> ', eventCode);
	});
	let role = $page.data?.user?.role || 'volunteer';

	async function UpdateSelectedEvent(eventId: number) {
		console.log('eventId :>> ', eventId);
		// PopupQrScannerOpened.value = false;
	}

	let commonMenuItems = [
		{
			title: 'Home',
			icon: Shell,
			url: () => `/app`
		},
		{
			title: 'Collect ₹/Scan QR',
			icon: QrCode,
			url: () => `/app/collect-payment/${eventCode}` // visible: CurrentEvent.id !== 0
		},
		{
			title: 'Check Balance',
			icon: Check,
			// icon2: Wallet,
			// icon3: IndianRupee,

			url: () => `/app/check-balance`
		},
		{
			title: 'Transactions',
			icon: ScrollText,
			url: () => `/app/volunteer-transactions`
		}
	];

	let endMenuItems = [
		{
			title: 'SOS',
			icon: AlertCircle,
			url: () => `/app/sos`
		}
	];
	let menuItems: typeof commonMenuItems = $state([]);
	switch (role) {
		case 'volunteer':
			menuItems = [...commonMenuItems, ...endMenuItems];
			break;

		case 'refund':
			menuItems = [
				...commonMenuItems,
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: () => `/recharge-qrcode`
				},
				{
					title: 'Issue Refund(Cash)',
					icon: IndianRupee,
					url: () => `/refund-issue`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: () => `/balance-transfer`
				},
				...endMenuItems
			];

			break;
		case 'recharge':
			menuItems = [
				...commonMenuItems,
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: () => `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: () => `/app/balance-transfer`
				},
				...endMenuItems
			];

			break;
		case 'registration':
			menuItems = [
				...commonMenuItems,
				{
					title: 'Visitor Registration',
					icon: UserPlus,
					url: () => `/app/visitor-registration`
				},
				{
					title: 'Search Visitors',
					icon: Search,
					url: () => `/app/search-visitors`
				},
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: () => `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: () => `/app/balance-transfer`
				},
				...endMenuItems
			];

			break;
		case 'super':
			menuItems = [
				...commonMenuItems,
				{
					title: 'Visitor Registration',
					icon: UserPlus,
					url: () => `/app/visitor-registration`
				},
				{
					title: 'Search Visitors',
					icon: Search,
					url: () => `/app/search-visitors`
				},
				{
					title: 'Add ₹ to QrCode',
					icon: Plus,
					// icon2: IndianRupee,
					// icon3: Wallet,
					url: () => `/app/recharge-qrcode`
				},
				{
					title: 'Balance Transfer',
					icon: ArrowRight,
					url: () => `/app/balance-transfer`
				},
				{
					title: 'Issue Cash(Volunteer)',
					icon: Plus,
					url: () => `/app/cash-issue`
				},
				{
					title: 'Cash Settlement',
					icon: PiggyBank,
					url: () => `/app/cash-settlement-collect`
				},
				{
					title: 'Issue Refund(Cash)',
					icon: IndianRupee,
					url: () => `/app/refund-issue`
				},
				...endMenuItems
			];
			break;

		default:
			menuItems = [];
			break;
	}
</script>

<Sheet.Root bind:open={LeftMenuPanel.value}>
	<Sheet.Trigger></Sheet.Trigger>
	<Sheet.Content side="left" class="no-scrollbar m-0 p-0 sm:max-w-xs">
		<ScrollArea class="no-scrollbar m-0 h-full w-full p-0">
			<nav class="grid gap-6">
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
					class="ml-4 w-[90%]"
					onclick={async () => {
						goto(`/app/event-selector`);
						QrScannerTitle.value = 'Scan Event QR Code';
						// QrScannerOnScan.value = await UpdateSelectedEvent;
						// QrScannerAutostart.value = false;
						// PopupQrScannerOpened.value = true;
						LeftMenuPanel.value = false;
					}}
				>
					<FerrisWheel class="mr-2 h-4 w-4" />
					{$eventLS.event_code && ((Date.now() / 1000) | 0) - $eventLS?.since < 3 * 60 * 60
						? $eventLS.event_name
						: 'Select Event'}
				</Button>

				{#each menuItems as menuItem}
					{@const Icon = menuItem.icon}
					{#if menuItem.visible !== false}
						<button
							onclick={() => {
								LeftMenuPanel.value = false;
								goto(menuItem.url());
							}}
							class="flex items-center gap-4 px-2.5 {$page.route.id === menuItem.url().toLowerCase()
								? 'text-foregroun'
								: 'text-muted-foreground hover:text-foreground'} "
						>
							<Icon class="h-5 w-5" />
							{menuItem.title}
						</button>
					{/if}
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
