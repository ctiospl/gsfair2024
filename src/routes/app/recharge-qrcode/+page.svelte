<script lang="ts">
	import type { PageData } from './$types';
	import QrScanner from '$components/QrScanner.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { startScan, stopScan } from '$components/QrScanner.svelte';
	import {
		Page,
		Navbar,
		NavbarBackLink,
		Popup,
		Block,
		Link,
		Button,
		Fab,
		BlockTitle,
		List,
		ListInput,
		ListItem,
		Sheet,
		Notification,
		Toolbar,
		Radio,
		Dialog,
		DialogButton,
		Preloader
	} from 'konsta/svelte';
	import { IndianRupee, Plus, QrCode, Menu } from 'lucide-svelte';
	import { getContext } from 'svelte';
	let leftPanelOpened = getContext('leftPanelOpened');
	import { goto } from '$app/navigation';
	import StyledQrCode from '$components/StyledQRCode.svelte';
	import { event } from '$lib/stores';
	import { PUBLIC_UPI_URL } from '$env/static/public';
	// import { randomUUID } from 'crypto';

	export let data: PageData;

	const { form, errors, message, constraints, enhance } = superForm(data.form, {
		dataType: 'json',
		resetForm: true,
		async onResult({ result }) {
			if (result.type == 'success') {
				notificationTitle = 'QrCode Recharged Successfully';
				notificationColor = '!bg-emerald-500';
				preloaderOpened = false;
				paymentPopupOpened = false;
				await CheckBalance(uid);
				notificationText = `QrCode Balance: ₹ ${balance}`;
				openNotification(() => (notificationWithButton = true));
			}
			// name = '';
			// balance = 0;
		},
		onUpdated({ form }) {
			preloaderOpened = false;
			$form.uuid = self.crypto.randomUUID();
			if (form.message) {
				// notificationTitle = form.message.type;
				notificationSubTitle = form.message.text;
				openNotification(() => (notificationWithButton = true));
			}
		},
		onError({ result }) {
			preloaderOpened = false;
			if (result.type == 'error') {
				notificationTitle = 'Error';
				notificationSubTitle = result.error.message;
				openNotification(() => (notificationWithButton = true));
			}
		}
	});

	async function CheckBalance(scan_uid) {
		const res = await fetch(`/app/api/qrcode/get-balance/${scan_uid}`);
		const data = await res.json();
		if ('error' in data) {
			notificationTitle = 'Error';
			notificationSubTitle = data.message;
			openNotification(() => (notificationWithButton = true));
			return;
		}
		popupOpened = false;
		balance = data.balance_amount;
		name = data.name;
		uid = scan_uid;
		$form.uid = data.uid;
	}
	let name = '';
	let balance = 0;
	let uid = '';

	let notificationWithButton = false;
	let notificationTitle = '';
	let notificationSubTitle = '';
	let notificationText = '';
	let notificationColor = '!bg-red-500';
	const openNotification = (setter: any) => {
		notificationWithButton = false;
		setter();
		if (notificationWithButton) {
			setTimeout(() => {
				notificationWithButton = false;
			}, 3000);
		}
	};

	let popupOpened = false;
	let paymentPopupOpened = false;
	let sheetOpened = false;
	let confirmOpened = false;
	let preloaderOpened = false;
	$form.event_id = $event.id;
	$form.uuid = self.crypto.randomUUID();
	$: console.log('$form :>> ', $form.uuid);
	let formElement: HTMLFormElement;
</script>

<!-- Select Event / Category from Dropdown or scan Event QRCODE -->
<Navbar title="Recharge QrCode">
	<!-- <NavbarBackLink
		slot="left"
		text="Back"
		onClick={() => {
			goto('/app', { replaceState: true });
		}}
	/>
     -->
	<Link
		slot="left"
		navbar
		onClick={async () => {
			leftPanelOpened.set(true);
		}}><Menu /></Link
	>
</Navbar>
{#if name}
	<BlockTitle large class="!justify-center">
		{name}
	</BlockTitle>
	<BlockTitle large class="!justify-center">
		₹ {balance}
	</BlockTitle>
{/if}
<!-- {#if $form.uid}
	<Fab
		onClick={() => {
			paymentPopupOpened = true;
		}}
		class="fixed left-1/2 bottom-4-safe transform -translate-x-1/2 z-20 !bg-emerald-500"
	>
		<svelte:fragment slot="text">
			<svelte:component this={Plus} />
		</svelte:fragment>
	</Fab>
{/if} -->

<Fab
	onClick={() => {
		name = '';
		popupOpened = true;
		$form.recharge_amt = 0;
		$form.payment_method = '';
		startScan();
	}}
	class="fixed right-4-safe bottom-4-safe z-20 !bg-red-500"
>
	<svelte:component this={QrCode} slot="icon" />
</Fab>

<Popup opened={popupOpened} onBackdropClick={() => (popupOpened = false)}>
	<Page>
		<Navbar title="Recharge QrCode Scanner">
			<Link
				slot="right"
				navbar
				onClick={() => {
					popupOpened = false;
					stopScan();
				}}>Close</Link
			>
		</Navbar>
		<QrScanner
			on:scan={async (e) => {
				await CheckBalance(e.detail);
				paymentPopupOpened = true;
			}}
		/>
	</Page>
</Popup>

<Popup opened={paymentPopupOpened} onBackdropClick={() => (paymentPopupOpened = false)}>
	<Page>
		<Navbar title="{name}: ₹ {balance}">
			<Link
				slot="right"
				navbar
				onClick={() => {
					paymentPopupOpened = false;
				}}>Close</Link
			>
		</Navbar>
		<form bind:this={formElement} method="POST" use:enhance>
			<List>
				<BlockTitle>Recharge Amount</BlockTitle>
				<Block>
					<ListInput
						type="tel"
						inputmode="numeric"
						name="recharge_amt"
						clearButton={$form.recharge_amt ? true : false}
						id="recharge_amt"
						placeholder="Enter Amount"
						inputClass="text-3xl"
						bind:value={$form.recharge_amt}
						aria-invalid={$errors.recharge_amt ? 'true' : undefined}
						error={$errors.recharge_amt ?? ''}
						{...$constraints.recharge_amt}
						onInput={(e) => {
							// $form.recharge_amt = isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value);
							$form.recharge_amt = e.target.value == '' ? 0 : parseInt(e.target.value) ?? 0;
						}}
						onClear={() => {
							$form.recharge_amt = 0;
						}}
					></ListInput>
				</Block>
				{#if $form.recharge_amt > 0}
					<BlockTitle>Payment Method</BlockTitle>
					<Block>
						<ListItem label>
							<Radio
								slot="media"
								component="div"
								value="UPI"
								colors={{
									bgCheckedIos: 'bg-blue-600',
									borderCheckedIos: 'border-blue-600',
									borderIos: 'border-blue-600'
								}}
								checked={$form.payment_method === 'UPI'}
								onChange={() => {
									sheetOpened = true;
									$form.payment_method = 'UPI';
								}}
							/>
							<p slot="title" class="text-blue-600 text-2xl font-semibold">UPI</p>
						</ListItem>
						<ListItem label>
							<Radio
								slot="media"
								component="div"
								value="Cash"
								colors={{
									borderCheckedIos: '!border-emerald-600',
									borderIos: '!border-emerald-600'
								}}
								checked={$form.payment_method === 'Cash'}
								onChange={() => ($form.payment_method = 'Cash')}
							/>
							<p slot="title" class="text-emerald-600 text-2xl font-semibold">Cash</p>
						</ListItem>
					</Block>
				{/if}
				{#if $form.payment_method}
					<Block>
						<Button
							type="submit"
							large
							class="py-4 text-2xl {$form.payment_method === 'UPI'
								? '!bg-blue-600'
								: '!bg-emerald-600'}"
							onClick={(e) => {
								e.preventDefault();
								confirmOpened = true;
								// paymentPopupOpened = false;
							}}
						>
							ADD
						</Button>
					</Block>
				{/if}
			</List>
			<Dialog opened={confirmOpened} onBackdropClick={() => (confirmOpened = false)}>
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
			</Dialog>
		</form>
	</Page>
</Popup>

<Notification
	opened={notificationWithButton}
	class="{notificationColor} text-white"
	colors={{
		titleIos: 'text-white',
		bgIos: 'bg-red-500',
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

<Sheet class="pb-safe w-full" opened={sheetOpened} onBackdropClick={() => (sheetOpened = false)}>
	<Toolbar top>
		<div class="left" />
		<div class="right">
			<Link toolbar onClick={() => (sheetOpened = false)}>Done</Link>
		</div>
	</Toolbar>
	<div class="flex justify-center">
		<BlockTitle>Amount Payable: ₹ {$form.recharge_amt}</BlockTitle>
	</div>
	<Block>
		<div class="flex justify-center">
			{#if $form.payment_method === 'UPI'}
				{#key $form.recharge_amt}
					<svelte:component
						this={StyledQrCode}
						qrcodeText={`${PUBLIC_UPI_URL}${$form.recharge_amt}`}
					/>
				{/key}
			{/if}
		</div>
	</Block>
</Sheet>

<Dialog opened={preloaderOpened} onBackdropClick={() => (preloaderOpened = false)}>
	<svelte:fragment slot="title">Saving</svelte:fragment>
	<Preloader />
</Dialog>
