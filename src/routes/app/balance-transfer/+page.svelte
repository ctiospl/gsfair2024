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

	const { form, errors, message, constraints, delayed, enhance } = superForm(data.form, {
		dataType: 'json',
		// applyAction: true,
		invalidateAll: true,
		resetForm: false,
		onUpdated({ form }) {
			notificationColor = 'bg-emerald-500';
			transferFromBalance = 0;
			$form.transferFromId = 0;
			transferFromName = '';
			transferToBalance = 0;
			$form.transferToId = 0;
			transferToName = '';

			if (form.message) {
				// console.log('form.message :>> ', form.message);
				notificationTitle = form.message.text;
				if (form.message.balances) {
					updatedBalances = form.message.balances;
				}
				// notificationSubTitle = 'Issue Id: ' + form.message.issue_id;
				// issueId = form.message.issue_id;

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

	$form.transferFromId = 0;
	let transferFromName: string;
	let transferFromBalance: number;
	interface updatedBalance {
		visitor_id: number;
		balance: number;
		name: string;
	}
	let updatedBalances: updatedBalance[] = [];
	$form.transferToId = 0;
	let transferToName: string;
	let transferToBalance: number;

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
	let transferForm: HTMLFormElement;
	let dialogConfirmFunction = async () => {};

	const openNotification = (setter: any) => {
		notificationWithButton = false;
		setter();
		setTimeout(() => {
			notificationWithButton = false;
		}, 5000);
	};

	async function CheckBalance(uid: string) {
		const res = await fetch(`/app/api/qrcode/get-balance/${uid}`);
		const data = await res.json();
		if ('error' in data) {
			notificationTitle = 'Error';
			notificationSubTitle = data.message;
			openNotification(() => (notificationWithButton = true));
			return;
		}
		if (scanTarget == 'from') {
			if (data.balance_amount == 0) {
				notificationColor = 'bg-red-500';
				notificationTitle = 'Error';
				notificationSubTitle = `${data.name} has 'No Balance' left to transfer`;
				openNotification(() => (notificationWithButton = true));
				return;
			}

			$form.transferFromId = data.id;
			transferFromName = data.name;
			transferFromBalance = data.balance_amount;
			$form.from_balance = parseFloat(data.balance_amount);
		} else {
			if (data.id == $form.transferFromId) {
				notificationColor = 'bg-red-500';
				notificationTitle = 'Error';
				notificationSubTitle = `Cannot transfer to same person/group`;
				openNotification(() => (notificationWithButton = true));
				return;
			}
			$form.transferToId = data.id;
			transferToName = data.name;
			transferToBalance = data.balance_amount;
		}
	}

	function onScan(scanResult: string) {
		// console.log('scanResult :>> ', scanResult);
		CheckBalance(scanResult);
		qrCodePopupOpened = false;
	}

	function confirmBalanceTransfer() {
		dialogTitle = 'Confirm Balance Transfer';
		dialogText = `Please Confirm the Balance Transfer of ₹ ${$form.from_balance} from ${transferFromName} to ${transferToName}`;
		dialogType = 'confirm';
		dialogConfirmText = 'Yes';
		dialogCancelText = 'No';
		dialogOpened = true;
		dialogConfirmFunction = async () => {
			dialogOpened = false;
			paymentPopupOpened = false;

			if (transferForm.requestSubmit) {
				transferForm.requestSubmit();
			} else {
				transferForm.submit();
			}
		};
	}
</script>

<Navbar title="Balance Transfer">
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>

{#if updatedBalances.length > 0}
	<div class="h-[100dvh] grid grid-cols-1 gap-4">
		<div class="text-center text-2xl py-4">
			<p>Balance Transfer Complete</p>
			<p>Current Qrcode Balance</p>
		</div>
		{#each updatedBalances as balance}
			<div class="flex justify-around text-2xl py-4">
				<div class="">
					{balance.name}
				</div>
				<div class="">
					₹ {balance.balance}
				</div>
			</div>
		{/each}

		<div class="flex justify-around text-2xl py-4">
			<!-- Button to confirm payment -->
			<div class="">
				<Button
					class="w-48 h-20 text-3xl !bg-black"
					on:click={(e) => {
						e.preventDefault();
						$form.transferFromId = 0;
						transferFromBalance = 0;
						transferFromName = '';
						$form.transferToId = 0;
						transferToBalance = 0;
						transferToName = '';
						updatedBalances = [];
					}}
				>
					New Transfer
				</Button>
			</div>
		</div>
	</div>
{:else}
	<form bind:this={transferForm} method="POST" use:enhance>
		<div
			class="h-[80dvh] grid grid-flow-row auto-rows-fr content-center items-center justify-items-center"
		>
			<!-- top -->
			<!-- has a button to scan qr code called from -->
			<!-- centered items -->
			{#if !transferFromName}
				<div class="">
					<Button
						class="w-48 h-20 text-3xl !bg-red-500"
						on:click={(e) => {
							e.preventDefault();
							scanTarget = 'from';
							qrCodePopupOpened = true;
							$form.transferFromId = 0;
							transferFromBalance = 0;
							startScan();
						}}
					>
						<QrCode class="h-12 w-12 mr-4" />
						From
					</Button>
				</div>
			{:else}
				<div class="w-full flex justify-around text-2xl py-4">
					<div>From</div>
					<div class="">
						{transferFromName}
					</div>
					<div class="">
						₹ <input
							type="number"
							class="w-28"
							value={transferFromBalance}
							on:keyup={(e) => {
								$form.from_balance = e.target.value == '' ? 0 : parseInt(e.target.value) ?? 0;
							}}
						/>
					</div>
					<div class="">
						<Button
							class=" m-0 p-0 !bg-transparent !text-red-500 "
							on:click={(e) => {
								e.preventDefault();
								scanTarget = 'from';
								qrCodePopupOpened = true;
								$form.transferFromId = 0;
								transferFromBalance = 0;
								startScan();
							}}
						>
							<QrCode class="h-12 w-12 py-2 px-1" />
						</Button>
					</div>
				</div>
			{/if}
			<!-- middle -->
			{#if transferFromName && transferFromBalance}
				{#if !transferToName}
					<div class="">
						<!-- has a button to scan qr code called to -->
						<Button
							class="w-48 h-20 text-3xl !bg-emerald-500"
							on:click={(e) => {
								e.preventDefault();
								scanTarget = 'to';
								qrCodePopupOpened = true;
								$form.transferToId = 0;
								transferToBalance = 0;
								startScan();
							}}
						>
							<QrCode class="h-12 w-12 mr-4" />
							To
						</Button>
					</div>
				{:else}
					<div class="w-full flex justify-around text-2xl py-4">
						<div>To</div>
						<div class="">
							{transferToName}
						</div>
						<div class="">
							₹ {transferToBalance}
						</div>
						<div class="">
							<Button
								class=" m-0 p-0 !bg-transparent !text-emerald-500 "
								on:click={(e) => {
									e.preventDefault();
									scanTarget = 'to';
									qrCodePopupOpened = true;
									$form.transferToId = 0;
									transferToBalance = 0;
									startScan();
								}}
							>
								<QrCode class="h-12 w-12 py-2 px-1" />
							</Button>
						</div>
					</div>
				{/if}
			{:else}
				<div class="flex justify-around text-2xl py-4"></div>
			{/if}
			<!-- bottom -->
			{#if transferFromName && transferToName}
				<div class="flex justify-around text-2xl py-4">
					<!-- Button to confirm payment -->
					<div class="">
						<Button
							class="w-48 h-20 text-3xl !bg-black"
							on:click={(e) => {
								e.preventDefault();
								confirmBalanceTransfer();
							}}
						>
							Transfer
						</Button>
					</div>
				</div>
			{:else}
				<div class="flex justify-around text-2xl py-4">
					<!-- Button to confirm payment -->
				</div>
			{/if}
		</div>
	</form>
{/if}

<Popup opened={qrCodePopupOpened} onBackdropClick={() => (qrCodePopupOpened = false)}>
	<Page>
		<Navbar title="{scanTarget.toUpperCase()} Visitor QrCode Scanner">
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
