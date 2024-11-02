<script lang="ts">
	// lib
	import { onMount, tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';

	// components
	import Navbar from '$lib/components/Navbar.svelte';
	import StepCounter from '$lib/components/StepCounter.svelte';

	// states
	import {
		LeftMenuPanel,
		QrScannerTitle,
		QrScannerOnScan,
		QrScannerAutostart,
		PopupQrScannerOpened,
		CurrentEvent,
		ConfirmDialogProps
	} from '$lib/ui-item-states.svelte';

	import { Menu } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Switch } from '$lib/components/ui/switch';
	// import { Checkbox } from "$lib/components/ui/checkbox";
	import { Label } from '$lib/components/ui/label';
	import { QrCode, IndianRupee } from 'lucide-svelte';

	type formItem = {
		event_item_id: number;
		units: number;
		price: number;
		item_code: string;
	};

	let { data } = $props();
	let name: string = $state('');
	let balance: number = $state(0);
	let scanTarget: string = $state('Visitor');
	let uid: string = $state('');
	let paymentPopupOpened = $state(false);
	let collectionForm: HTMLFormElement;

	onMount(async () => {
		QrScannerTitle.value = 'Visitor Check QR Balance';
		QrScannerOnScan.value = await onScanVisitor;
		QrScannerAutostart.value = true;
	});

	const { form, errors, message, constraints, delayed, enhance } = superForm(data.form, {
		dataType: 'json',
		// applyAction: true,
		invalidateAll: true,
		resetForm: false,
		onUpdated({ form }) {
			name = '';
			if (form.message) {
				showMessage(page, {
					type: 'success',
					title: form.message.text,
					text: 'QrCode Balance: ' + form.message.balance_amount
				});
			}
		},
		onError({ result }) {
			if (result.type == 'error') {
				showMessage(page, { type: 'error', text: result.error.message });
			}
		}
	});

	async function CheckBalance(uid: string) {
		const res = await fetch(`/app/api/qrcode/get-balance/${uid}`);
		const data = await res.json();
		if ('error' in data) {
			return showMessage(page, { type: 'error', text: data.message });
		}
		balance = parseFloat(data.balance_amount);
		name = data.name;
		uid = uid;
		$form.guest_id = data.id;
		PopupQrScannerOpened.value = false;
	}

	function checkFormTotal(itemid: number) {
		let total = ($form.items as formItem[])
			.map((item, i) => {
				if (i == itemid) {
					return item.price * (item.units + 1);
				} else {
					return item.price * item.units;
				}
			})
			.reduce((acc, item) => {
				return acc + item;
			}, 0);

		if (total <= balance) {
			return true;
		} else {
			return false;
		}
	}

	function updateFormTotal() {
		form.update(
			($form) => {
				$form.total_amount = ($form.items as formItem[]).reduce((acc, item) => {
					return acc + item.price * item.units;
				}, 0);
				return $form;
			},
			{ taint: false }
		);
	}

	function onScanToy(scanResult: string) {
		const toyCode = scanResult;
		let findFormIndex = ($form.items as formItem[]).findIndex((i) => i.item_code == toyCode);

		if (findFormIndex == -1 && CurrentEvent?.event_items) {
			let findEventIndex = CurrentEvent.event_items.findIndex((i) => i.item_code == toyCode);
			let { item_code, price, id, item_name } = CurrentEvent.event_items[findEventIndex];
			let newItem = { units: 1, item_code, price, item_name, event_item_id: id };
			$form.items = [...$form.items, newItem];
		} else if (findFormIndex >= 0) {
			$form.items[findFormIndex].units = $form.items[findFormIndex].units + 1;
		}

		PopupQrScannerOpened.value = false;
		updateFormTotal();
	}

	async function onScanVisitor(scanResult: string) {
		uid = scanResult;
		await CheckBalance(scanResult);
		updateFormTotal();
	}

	function confirmPaymentReceipt() {
		ConfirmDialogProps.open = true;
		ConfirmDialogProps.title = 'Confirm Payment Receipt';
		ConfirmDialogProps.description = `Please Confirm the reciept of Amount ₹ ${$form.recharge_amt} from ${name} (${$form.recharge_payment_method})`;
		ConfirmDialogProps.confirmButtonText = 'Yes';
		ConfirmDialogProps.cancelButtonText = 'No';
		ConfirmDialogProps.onConfirm = async () => {
			ConfirmDialogProps.open = false;
			paymentPopupOpened = false;
			return Promise.resolve();
		};
	}
</script>

<Navbar title="Collect Payment">
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

<form bind:this={collectionForm} method="POST" use:enhance>
	{#if ('items' in $form && $form.items.length > 0) || CurrentEvent.event_code == 'T1'}
		{#if name}
			<div class="flex justify-around bg-black py-4 text-3xl text-white">
				<div class="">
					{name}
				</div>

				<div class="flex items-center space-x-2">
					<div class="">
						₹ {balance}
					</div>
					{#if CurrentEvent.event_code == 'T1'}
						<Switch
							id="use-qrcode-bal-switch"
							checked={$form.use_qrcode_balance}
							onCheckedChange={(e) => {
								$form.use_qrcode_balance = e;
							}}
						/>
						<Label for="use-qrcode-bal-switch">From QR</Label>
					{/if}
				</div>
			</div>
			{#if $form.recharge_amt}
				<div class="flex justify-around bg-emerald-500 py-4 text-3xl text-white">
					<div class="">
						{$form.recharge_payment_method}
					</div>
					<div class="">
						₹ {$form.recharge_amt}
					</div>
				</div>
			{/if}

			<div class="mt-4 text-center">
				{#if !CurrentEvent.has_items}
					<div>
						<div class="mb-1 block text-lg">Ticket</div>
						<div class="text-5xl">
							{CurrentEvent.price}
						</div>
					</div>

					<div class="py-8">
						<!-- <div class="block text-xs mb-1">count</div> -->

						<StepCounter
							value={$form.items[0].units}
							onPlus={() => {
								if (checkFormTotal(0)) {
									$form.items[0].units = $form.items[0].units + 1;
									updateFormTotal();
								}
							}}
							onMinus={() => {
								$form.items[0].units = $form.items[0].units - 1 < 1 ? 1 : $form.items[0].units - 1;
								updateFormTotal();
							}}
						/>
					</div>
					<div>
						<div class="mb-1 block text-lg">Total</div>
						<div class="text-5xl">
							{CurrentEvent.price * $form.items[0].units}
						</div>
					</div>
				{:else}
					{#if CurrentEvent.event_code == 'T1'}
						{#each $form.items as item, i}
							<div class="mb-4 flex flex-col">
								<div class="mb-2 block text-lg">{item.item_name}</div>
								<div class="flex items-center justify-around">
									<div class="flex flex-col">
										<div class="text-5xl">
											{item.price}
										</div>
									</div>

									<div class=" content-center">
										<StepCounter
											value={$form.items[i].units}
											onPlus={() => {
												// if (checkFormTotal(i)) {
												$form.items[i].units = $form.items[i].units + 1;
												updateFormTotal();
												// }
											}}
											onMinus={() => {
												$form.items[i].units =
													$form.items[i].units - 1 < 0 ? 0 : $form.items[i].units - 1;
												updateFormTotal();
											}}
										/>
									</div>
								</div>
							</div>
						{/each}
					{:else}
						{#each CurrentEvent?.event_items ?? [] as item, i}
							<div class="mb-4 flex flex-col">
								<div class="mb-2 block text-lg">{item.item_name}</div>
								<div class="flex items-center justify-around">
									<div class="flex flex-col">
										<div class="text-5xl">
											{item.price}
										</div>
									</div>

									<div class=" content-center">
										<StepCounter
											value={$form.items[i].units}
											onPlus={() => {
												if (checkFormTotal(i)) {
													$form.items[i].units = $form.items[i].units + 1;
													updateFormTotal();
												}
											}}
											onMinus={() => {
												$form.items[i].units =
													$form.items[i].units - 1 < 0 ? 0 : $form.items[i].units - 1;
												updateFormTotal();
											}}
										/>
									</div>
								</div>
							</div>
						{/each}
					{/if}

					<div>
						<div class="my-4 block text-lg">Total</div>
						<div class="text-5xl">
							{$form.total_amount}
						</div>
					</div>
				{/if}

				{#if $form.total_amount > ($form.use_qrcode_balance ? balance : 0) + ('recharge_amt' in $form && $form.recharge_amt ? $form.recharge_amt : 0)}
					<div class="text-center text-2xl text-red-500">Insufficient QrCode Balance</div>
					{#if CurrentEvent.event_code == 'T1'}
						<div class="mt-8">
							<Button
								class="mt-4 h-24 w-[90%] !bg-emerald-500 text-2xl"
								onclick={(e) => {
									e.preventDefault;
									paymentPopupOpened = true;
									$form.recharge_amt =
										$form.total_amount - ($form.use_qrcode_balance ? balance : 0);
								}}
							>
								<IndianRupee class="mr-2 h-8 w-8" />
								Add Balance
							</Button>
						</div>
					{/if}
				{:else}
					<div class="mt-8">
						<Button class="mt-4 h-24 w-[90%] !bg-black text-2xl" type="submit">
							<IndianRupee class="mr-2 h-8 w-8" />
							Collect Payment
						</Button>
					</div>
				{/if}
			</div>
			{#if CurrentEvent.event_code == 'T1'}
				<Button
					onclick={async () => {
						QrScannerTitle.value = 'Scan Toys QR Code';
						QrScannerOnScan.value = await onScanVisitor;
						PopupQrScannerOpened.value = true;
					}}
					class="left-4-safe bottom-4-safe fixed z-20 !bg-green-500"
				>
					<QrCode /> Toys
				</Button>
			{/if}
		{/if}
	{/if}
</form>

<Button
	onclick={async () => {
		QrScannerTitle.value = 'Scan Toys QR Code';
		QrScannerOnScan.value = await onScanVisitor;
		PopupQrScannerOpened.value = true;
	}}
	class="fixed bottom-4 right-4 z-20 rounded-full !bg-green-500"
>
	<QrCode /> Toys
</Button>
