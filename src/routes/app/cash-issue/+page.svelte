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
	import { goto, invalidateAll } from '$app/navigation';
	import { Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { event } from '$lib/stores';
	export let data;
	let name: string;
	let balance: number;
	let uid: string;
	$: issueId = '';

	const { form, errors, message, constraints, delayed, enhance } = superForm(data.form, {
		dataType: 'json',
		// applyAction: true,
		invalidateAll: true,
		resetForm: false,
		onUpdated({ form }) {
			notificationColor = 'bg-emerald-500';
			balance = 0;
			name = '';

			if (form.message) {
				console.log('form.message :>> ', form.message);
				notificationTitle = form.message.text;
				notificationSubTitle = 'Issue Id: ' + form.message.issue_id;
				issueId = form.message.issue_id;

				openNotification(() => (notificationWithButton = true));
			}
			invalidateAll();
		},
		onError({ result }) {
			notificationColor = 'bg-red-500';
			if (result.type == 'error') {
				notificationTitle = 'Error';
				notificationSubTitle = result.error.message;
				openNotification(() => (notificationWithButton = true));
			}
		}
		// onSubmit({ formData }) {
		// formData.set('extra', 'value')
		// }
	});

	$: _x = loadingDialogOpened.set($delayed);

	let scanTarget = '';
	let loadingDialogOpened = getContext('loadingDialogOpened');
	let leftPanelOpened = getContext('leftPanelOpened');

	let notificationWithButton = false;
	let notificationTitle = '';
	let notificationSubTitle = '';
	let notificationText = '';
	let notificationColor = 'bg-red-500';

	let qrCodePopupOpened = false;
	let paymentPopupOpened = false;

	let dialogTitle = '';
	let dialogText = '';
	let dialogType = 'alert';
	$: dialogCancelText = dialogType == 'confirm' ? 'No' : 'OK';
	let dialogConfirmText = 'Yes';
	let dialogOpened = false;
	let collectionForm: HTMLFormElement;
	let dialogConfirmFunction = async () => {};

	const openNotification = (setter: any) => {
		notificationWithButton = false;
		setter();
		setTimeout(() => {
			notificationWithButton = false;
		}, 5000);
	};

	async function CheckBalance(uid: string) {
		const res = await fetch(`/app/api/qrcode/get-cash-balance/${uid}`);
		const data = await res.json();
		console.log('data :>> ', data);
		balance = parseFloat(data.balance_amount);
		$form.issue_amount = 2000;
		name = data.firstname + ' ' + data.lastname;
		uid = uid;
		qrCodePopupOpened = false;
	}

	function onScan(scanResult: string) {
		uid = scanResult;
		$form.volunteer_id = uid;
		CheckBalance(uid);
		qrCodePopupOpened = false;
	}

	function confirmPaymentReceipt() {
		dialogTitle = 'Confirm Cash Issue';
		dialogText = `Please Confirm the Cash of Amount ₹ ${$form.issue_amount} has been given to ${name}`;
		dialogType = 'confirm';
		dialogConfirmText = 'Yes';
		dialogCancelText = 'No';
		dialogOpened = true;
		dialogConfirmFunction = async () => {
			dialogOpened = false;
			paymentPopupOpened = false;

			if (collectionForm.requestSubmit) {
				collectionForm.requestSubmit();
			} else {
				collectionForm.submit();
			}
		};
	}
</script>

<Navbar title="Issue Cash to Volunteer">
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>

<form bind:this={collectionForm} method="POST" use:enhance>
	{#if issueId}
		<div class="flex justify-around text-4xl py-4 mt-16">
			Issue Id: {issueId}
		</div>
	{/if}
	{#if name}
		<div class="flex justify-around bg-black text-white text-3xl py-4">
			<div class="">
				{name}
			</div>
			<div class="">
				₹ {balance}
			</div>
		</div>
		<List class="mt-8 pt-0">
			<ListInput
				type="tel"
				inputClass="!text-4xl text-center"
				colors={{
					labelTextIos: '!text-3xl text-center !my-4',
					labelTextFocusIos: '!text-3xl text-center !my-4'
				}}
				max={balance}
				accept="number"
				label="Issue Cash Amount(₹)"
				inputmode="numeric"
				clearButton={$form.issue_amount != 0}
				bind:value={$form.issue_amount}
				{...$constraints.issue_amount}
				onInput={(e) => {
					$form.issue_amount =
						e.target.value == ''
							? 0
							: parseInt(e.target.value) > 2000
							  ? 2000
							  : parseInt(e.target.value) < 0
							    ? 0
							    : parseInt(e.target.value) ?? 0;
				}}
				onClear={() => {
					$form.issue_amount = 0;
				}}
			>
				<!-- <span class="text-3xl text-center" slot="label"></span> -->
			</ListInput>
		</List>
		<List>
			<KonstaButton
				onClick={(e) => {
					e.preventDefault();
					confirmPaymentReceipt();
				}}
				large
				class="!bg-black w-[90%]">Issue Cash</KonstaButton
			>
		</List>
		<div class="flex justify-around text-black text-3xl py-4">
			<div class="">
				Balance Left: ₹ {parseFloat(balance) + $form.issue_amount}
			</div>
		</div>
	{/if}
</form>

<Popup opened={qrCodePopupOpened} onBackdropClick={() => (qrCodePopupOpened = false)}>
	<Page>
		<Navbar title="Volunteer QrCode Scanner">
			<Link
				slot="right"
				navbar
				onClick={() => {
					qrCodePopupOpened = false;
					stopScan();
				}}>Close</Link
			>
		</Navbar>
		<QrScanner
			on:scan={(e) => {
				onScan(e.detail);
			}}
		/>
	</Page>
</Popup>

<Fab
	onClick={() => {
		invalidateAll();
		issueId = '';
		name = '';
		qrCodePopupOpened = true;
		startScan();
	}}
	class="fixed right-4-safe bottom-4-safe z-20 !bg-red-500"
>
	<svelte:component this={QrCode} slot="icon" />
</Fab>

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
