<script lang="ts">
	const { data } = $props();

	// lib/functions
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { superForm } from 'sveltekit-superforms/client';
	import { PUBLIC_UPI_URL } from '$env/static/public';

	// components
	import Button from '$lib/components/ui/button/button.svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import StyledQrCode from '$components/StyledQRCode.svelte';

	// ui
	import { Menu, QrCode, IndianRupee, Plus } from 'lucide-svelte';

	// state
	import {
		QrScannerTitle,
		QrScannerOnScan,
		LeftMenuPanel,
		PopupQrScannerOpened,
		LoadingDialog,
		ConfirmDialogProps,
		PopupPaymentProps
	} from '$lib/ui-item-states.svelte';
	import { eventLS } from '$lib/web-storage.svelte.js';

	let balance = $state(0);
	let name = $state('');
	let qrcode = $state('');

	$effect(async () => {
		QrScannerTitle.value = 'Visitor Check QR Balance';
		QrScannerOnScan.value = await CheckVisitorBalance;

		return () => {
			QrScannerTitle.value = '';
			QrScannerOnScan.value = async () => {};
		};
	});

	async function CheckVisitorBalance(uid: string) {
		console.log('CheckVisitorBalance');
		LoadingDialog.open = true;
		const res = await fetch(`/app/api/qrcode/get-balance/${uid}`);
		const data = await res.json();
		LoadingDialog.open = false;
		if ('error' in data) {
			LoadingDialog.open = false;
			return showMessage(page, { type: 'error', text: data.message });
		}
		balance = data.balance_amount;
		name = data.name;
		qrcode = uid;
	}

	const { form, errors, message, constraints, enhance } = superForm(data.form, {
		dataType: 'json',
		resetForm: true,
		async onResult({ result }) {
			if (result.type == 'success') {
				LoadingDialog.open = false;
				PopupPaymentProps.open = false;
				await CheckVisitorBalance(qrcode);
				showMessage(page, {
					type: 'success',
					title: 'QrCode Recharged Successfully',
					text: `QrCode Balance: ₹ ${balance}`
				});
				openNotification(() => (notificationWithButton = true));
			}
			// name = '';
			// balance = 0;
		},
		onUpdated({ form }) {
			LoadingDialog.open = false;
			$form.uuid = self.crypto.randomUUID();
			if (form.message) {
				showMessage(page, { type: 'error', text: form.message.text });
			}
		},
		onError({ result }) {
			LoadingDialog.open = false;
			if (result.type == 'error') {
				showMessage(page, { type: 'error', text: form.message.text });
			}
		}
	});

	let paymentPopupOpened = false;
	let sheetOpened = false;
	let confirmOpened = false;

	$form.event_id = $eventLS.event_id;
	$form.uuid = self.crypto.randomUUID();

	let formElement: HTMLFormElement;
</script>

<Navbar title="Recharge QrCode">
	{#snippet leftLink()}
		<Button
			variant="link"
			size="icon"
			class="[&_svg]:size-7"
			onclick={() => (LeftMenuPanel.value = true)}
			><Menu />
		</Button>
	{/snippet}
</Navbar>

{#if name}
	<div class="flex flex-col items-center justify-center">
		<p class="text-2xl">{name}-({qrcode})</p>
		<p class="text-2xl font-bold">₹ {balance}</p>
	</div>
{/if}

<div class="flex h-[calc(100dvh-5rem)] flex-col">
	{#if name}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<p class="text-2xl">Visitor-QrCode</p>
				<p class="text-3xl font-bold">{name}-({qrcode})</p>
			</div>
		</div>

		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<p class="text-2xl">QrCode Balance</p>
				<p class="text-3xl font-bold">₹ {balance}</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-1 items-center justify-center">
			<div class="flex flex-col items-center justify-center">
				<p class="pb-8 text-center text-3xl">
					Scan the visitor's QR Code <br />to check their Balance
				</p>

				<Button
					class="h-24 px-6 text-4xl [&_svg]:size-10"
					onclick={() => (PopupQrScannerOpened.value = true)}><QrCode /> Scan QR Code</Button
				>
			</div>
		</div>
	{/if}
</div>

<Button
	onclick={async () => {
		QrScannerTitle.value = 'Scan Visitor QR Code';
		QrScannerOnScan.value = await CheckVisitorBalance;
		PopupQrScannerOpened.value = true;
	}}
	class="fixed bottom-4 right-4 h-16 w-16  rounded-full !bg-red-500"
>
	<QrCode class="!size-7" />
</Button>

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
							$form.recharge_amt = e.target.value == '' ? 0 : (parseInt(e.target.value) ?? 0);
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
							<p slot="title" class="text-2xl font-semibold text-blue-600">UPI</p>
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
							<p slot="title" class="text-2xl font-semibold text-emerald-600">Cash</p>
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
