<script lang="ts">
	const { data } = $props();
	// lib/functions
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';

	// state
	import {
		LeftMenuPanel,
		LoadingDialog,
		ConfirmDialogProps,
		PopupRouteProps,
		PopupPaymentProps
	} from '$lib/ui-item-states.svelte';

	// components
	import Navbar from '$lib/components/Navbar.svelte';
	import StepCounter from '$lib/components/StepCounter.svelte';

	// ui
	import { LogOut, Menu as MenuIcon } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { eventLS } from '$lib/web-storage.svelte.js';

	let currentValue = $state(0);

	function handleValueChange(newValue: number) {
		currentValue = newValue;
	}
</script>

<Navbar title="GS Fair 2024">
	{#snippet leftLink()}
		<Button
			variant="link"
			size="icon"
			class="[&_svg]:size-7"
			onclick={() => (LeftMenuPanel.value = true)}
			><MenuIcon />
		</Button>
	{/snippet}
	{#snippet rightLink()}
		<Button variant="link" size="icon" class="[&_svg]:size-7" onclick={() => goto('/logout')}
			><LogOut /></Button
		>
	{/snippet}
</Navbar>

<Button
	onclick={async () => {
		ConfirmDialogProps.open = true;
		ConfirmDialogProps.title = 'Confirm Logout';
		ConfirmDialogProps.description = 'Are you sure you want to logout?';
		ConfirmDialogProps.confirmButtonText = 'Yes';
		ConfirmDialogProps.cancelButtonText = 'No';
		ConfirmDialogProps.onConfirm = async () => {
			ConfirmDialogProps.open = false;
		};
	}}>Scan QR Code</Button
>

<Button
	onclick={async () => {
		PopupPaymentProps.title = 'Amount to Collect ₹ 100';
		PopupPaymentProps.open = true;
		PopupPaymentProps.qrcode_text = 'upi://pay?pa=99030868922@paytm&pn=ToyStore&am=100&cu=INR';
		PopupPaymentProps.qrcode_message = 'ToyStore Payment';
		PopupPaymentProps.onConfirm = async (method) => {
			console.log(`payment method ${method}`);
			PopupPaymentProps.open = false;
			ConfirmDialogProps.open = false;
		};
	}}>Scan QR Code</Button
>

<!-- <Dialog opened={confirmOpened} onBackdropClick={() => (confirmOpened = false)}>
				<svelte:fragment slot="title">Payment Mode : {$form.payment_method}</svelte:fragment>
				<p>Add ₹ {$form.recharge_amt} to {name}'s QrCode ?</p>
				<svelte:fragment slot="buttons">
					<DialogButton
						onClick={(e) => {
							e.preventDefault();
							confirmOpened = false;
						}}>No</DialogButton
					>
					<DialogButton
						strong
						type="submit"
						onClick={() => {
							confirmOpened = false;
							preloaderOpened = true;
							// formElement.requestSubmit();
						}}>Yes</DialogButton
					>
				</svelte:fragment>
			</Dialog> -->

<StepCounter bind:value={currentValue} />

<p>Current value: {currentValue}</p>
<!--
<div class="space-y-8">
	<div class="flex items-center">
		<div class="h-9 w-9">Text</div>

		<div class="ml-4 space-y-1">
			<p class="text-sm font-medium leading-none">Olivia Martin</p>
			<p class="text-sm text-muted-foreground">olivia.martin@email.com</p>
		</div>
		<div class="ml-auto font-medium">+$1,999.00</div>
	</div>
	<div class="flex items-center">
		<div class="h-9 w-9">Text</div>

		<div class="ml-4 space-y-1">
			<p class="text-sm font-medium leading-none">Jackson Lee</p>
			<p class="text-sm text-muted-foreground">jackson.lee@email.com</p>
		</div>
		<div class="ml-auto font-medium">+$39.00</div>
	</div>
	<div class="flex items-center">
		<div class="h-9 w-9">Text</div>

		<div class="ml-4 space-y-1">
			<p class="text-sm font-medium leading-none">Isabella Nguyen</p>
			<p class="text-sm text-muted-foreground">isabella.nguyen@email.com</p>
		</div>
		<div class="ml-auto font-medium">+$299.00</div>
	</div>
	<div class="flex items-center">
		<div class="h-9 w-9">Text</div>

		<div class="ml-4 space-y-1">
			<p class="text-sm font-medium leading-none">William Kim</p>
			<p class="text-sm text-muted-foreground">will@email.com</p>
		</div>
		<div class="ml-auto font-medium">+$99.00</div>
	</div>
	<div class="flex items-center">
		<div class="h-9 w-9">Text</div>

		<div class="ml-4 space-y-1">
			<p class="text-sm font-medium leading-none">Sofia Davis</p>
			<p class="text-sm text-muted-foreground">sofia.davis@email.com</p>
		</div>
		<div class="ml-auto font-medium">+$39.00</div>
	</div>
</div> -->
