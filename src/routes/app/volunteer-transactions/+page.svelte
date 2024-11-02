<script lang="ts">
	import QrScanner from '$components/QrScanner.svelte';
	import { startScan, stopScan } from '$components/QrScanner.svelte';
	import { PUBLIC_UPI_URL } from '$env/static/public';
	import {
		Page,
		Navbar,
		Popup,
		Block,
		Link,
		Fab,
		BlockTitle,
		Stepper,
		Notification,
		List,
		ListItem,
		ListInput,
		Dialog,
		DialogButton,
		Button as KonstaButton
	} from 'konsta/svelte';
	import { QrCode, FerrisWheel, IndianRupee } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import { superForm } from 'sveltekit-superforms/client';
	import StyledQrCode from '$components/StyledQRCode.svelte';
	import { onMount, tick } from 'svelte';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { event } from '$lib/stores';
	import * as Table from '$lib/components/ui/table';
	import { format, fromUnixTime } from 'date-fns';
	import { getTimezoneOffset } from 'date-fns-tz';

	const timeZone = 'Asia/Kolkata';
	const timeZoneOffset = getTimezoneOffset(timeZone);
	let loadingDialogOpened = getContext('loadingDialogOpened');
	let leftPanelOpened = getContext('leftPanelOpened');

	export let data;
	$: transactions = data.transactions;
	let notificationWithButton = false;
	let notificationTitle = '';
	let notificationSubTitle = '';
	let notificationText = '';
	let notificationColor = 'bg-red-500';

	let dialogTitle = '';
	let dialogText = '';
	let dialogType = 'alert';
	$: dialogCancelText = dialogType == 'confirm' ? 'No' : 'OK';
	let dialogConfirmText = 'Yes';
	let dialogOpened = false;
	let hideButton = false;

	let dialogConfirmFunction = async () => {};

	const openNotification = (setter: any) => {
		notificationWithButton = false;
		setter();
		setTimeout(async () => {
			notificationWithButton = false;
			await invalidateAll();
		}, 5000);
	};
	function confirmTransactionReversal(amount, name, id) {
		dialogTitle = 'Undo Transaction?';
		dialogText = `Please Confirm you wish to Undo this transaction for ₹ ${Math.abs(
			amount
		)} of ${name}`;
		dialogType = 'confirm';
		dialogConfirmText = 'Yes';
		dialogCancelText = 'No';
		dialogOpened = true;
		dialogConfirmFunction = async () => {
			dialogOpened = false;
			hideButton = true;
			loadingDialogOpened.set(true);
			const res = await fetch(`/app/api/reversal/${id}`, {
				method: 'POST'
			});
			loadingDialogOpened.set(false);
			const data = await res.json();
			console.log('data :>> ', data);
			notificationColor = 'bg-green-500';
			notificationTitle = 'Success';
			notificationSubTitle = 'Reversal Successful';
			notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
			openNotification(() => (notificationWithButton = true));
		};
	}
</script>

<Navbar title="Transactions">
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>
<div class="text-xs">
	{#if transactions.length == 0}
		<div class="text-center font-bold">No Transactions Found</div>
	{:else}
		<div class="text-center font-bold">A list of your recent Transactions.</div>
	{/if}
	{#each transactions as transaction, i (transaction.id)}
		<div class="p-2 border-b-2 border-slate-300">
			<div class="flex justify-between">
				<div class="font-semibold">
					{format(fromUnixTime(transaction.trx_ts), 'dd-MM-yy - hh:ss a')}
				</div>
				<div class="text-right">
					{#if transaction.event_name}
						{transaction.event_name}
					{/if}
					{#if transaction.notes && transaction.event_name}
						<br />
					{/if}

					{#if transaction.notes}
						({transaction.notes})
					{/if}
				</div>
			</div>
			<div class="flex justify-between">
				<div>
					{transaction.name} ({transaction.group_uids ? transaction.group_uids : transaction.uid})
					{#if transaction.notes == 'payment' && hideButton == false}
						{#if !transaction.reversal_count}
							<Button
								on:click={async () => {
									confirmTransactionReversal(
										transaction.trx_amount,
										transaction.name,
										transaction.id
									);
								}}
								class="!bg-red-500 m-0 p-1 ml-4 text-sm h-6">Undo</Button
							>
						{:else}
							<div class="text-red-500">Reversed</div>
						{/if}
					{/if}
				</div>
				<div class="font-semibold">
					₹ {Math.abs(transaction.trx_amount)}
				</div>
			</div>
		</div>
	{/each}
</div>

<Notification
	opened={notificationWithButton}
	colors={{
		titleIos: 'text-white',
		bgIos: notificationColor,
		subtitleIos: 'text-white',
		deleteIconIos: 'text-white'
	}}
	title={notificationTitle}
	subtitle={notificationSubTitle}
	text={notificationText}
	button
	onClose={async () => {
		notificationWithButton = false;
		// await goto('/login');
	}}
>
	<!-- <DemoIcon slot="icon" /> -->
</Notification>

<Dialog
	opened={dialogOpened}
	onBackdropClick={() => {
		dialogOpened = false;
	}}
>
	<svelte:fragment slot="title">{dialogTitle}</svelte:fragment>
	{dialogText}

	<svelte:fragment slot="buttons">
		<DialogButton
			onClick={() => {
				dialogOpened = false;
			}}>{dialogCancelText}</DialogButton
		>
		{#if dialogType == 'confirm'}
			<DialogButton
				strong
				onClick={async () => {
					await dialogConfirmFunction();
					dialogOpened = false;
				}}>{dialogConfirmText}</DialogButton
			>
		{/if}
	</svelte:fragment>
</Dialog>
