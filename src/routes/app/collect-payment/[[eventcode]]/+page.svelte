<script lang="ts">
	// lib
	import { onMount, tick } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';
	import { SetEvent } from '$lib/common-utils.svelte.js';
	import { PUBLIC_UPI_URL } from '$env/static/public';

	// components
	import Navbar from '$lib/components/Navbar.svelte';
	import StepCounter from '$lib/components/StepCounter.svelte';
	import * as Card from '$lib/components/ui/card';

	// states
	import {
		LeftMenuPanel,
		QrScannerTitle,
		QrScannerOnScan,
		QrScannerAutostart,
		PopupQrScannerOpened,
		CurrentEvent,
		ConfirmDialogProps,
		PopupPaymentProps,
		ResetPopupPaymentProps
	} from '$lib/ui-item-states.svelte';
	import { eventLS } from '$lib/web-storage.svelte';

	import { Menu } from 'lucide-svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { Switch } from '$lib/components/ui/switch';

	// import { Checkbox } from "$lib/components/ui/checkbox";
	import { Label } from '$lib/components/ui/label';
	import { QrCode, IndianRupee } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import Separator from '$lib/components/ui/separator/separator.svelte';

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
		if (CurrentEvent.event_code == '' || CurrentEvent.event_code != data.eventcode) {
			SetEvent(data.eventcode);
		}
		// SetEvent('T1');
		// CheckBalance('PRN');
	});

	const {
		form,
		errors,
		message,
		constraints,
		delayed,
		enhance,
		reset: resetForm
	} = superForm(data.form, {
		dataType: 'json',
		// applyAction: true,
		invalidateAll: true,
		resetForm: false,
		onUpdated({ form }) {
			name = '';
			balance = 0;
			uid = '';
			ResetPopupPaymentProps();
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
		$form.guest_sub_id = data.sub_id;
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
		console.log('$form :>> ', $form);
	}

	async function onScanToy(scanResult: string) {
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
		history.back();
		updateFormTotal();
	}

	async function onScanVisitor(scanResult: string) {
		ResetPopupPaymentProps();
		resetForm();
		uid = scanResult;
		await CheckBalance(scanResult);
		updateFormTotal();
	}

	$effect.pre(async () => {
		console.log('eventLS :>> ', $eventLS);
		if ($eventLS.event_code && ((Date.now() / 1000) | 0) - $eventLS?.since < 3 * 60 * 60) {
		} else {
			showMessage(page, { type: 'error', text: 'Selct an Event' });
			goto('/app/event-selector');
		}
	});
</script>

<Navbar title="Collect Payment {$eventLS.event_name}">
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

			<div class="flex min-h-[60vh] flex-col items-center justify-center text-center">
				{#if !CurrentEvent.has_items}
					<div>
						<div class="mb-1 block text-lg">Ticket - {CurrentEvent.event_name}</div>
						<div class="text-5xl">
							₹ {CurrentEvent.price}
						</div>
					</div>

					<!-- <div class="block text-xs mb-1">count</div> -->

					<StepCounter
						class="py-6"
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

					<div>
						<div class="mb-1 block text-lg">Total</div>
						<div class="text-5xl">
							₹ {CurrentEvent.price * $form.items[0].units}
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
						{/each}
					{:else}
						{#each CurrentEvent?.event_items ?? [] as item, i}
							<div class="">
								<div class="flex flex-col">
									<div class="mb-2 block text-lg">{item.item_name}</div>
									<!-- <div class="flex items-center justify-around"> -->
									<div class="flex flex-col">
										<div class="text-3xl">
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
									<!-- </div> -->
								</div>
								<Separator class="my-4" />
							</div>
						{/each}
					{/if}

					<div>
						<div class="my-4 block text-lg">Total</div>
						<div class="text-5xl">
							₹ {$form.total_amount}
						</div>
					</div>
				{/if}

				{#if $form.total_amount > ($form.use_qrcode_balance ? balance : 0) + ('recharge_amt' in $form && $form.recharge_amt ? $form.recharge_amt : 0)}
					<div class="text-center text-2xl text-red-500">Insufficient QrCode Balance</div>
					{#if CurrentEvent.event_code == 'T1'}
						<div class="mt-8 w-full">
							<Button
								class="mt-4 h-24 w-[70%] !bg-emerald-500 text-2xl"
								onclick={(e) => {
									e.preventDefault;

									let recharge_amt = $form.total_amount - ($form.use_qrcode_balance ? balance : 0);
									PopupPaymentProps.title = `Amount to Collect - ₹ ${recharge_amt.toFixed(2)}`;
									PopupPaymentProps.guest_name = name;
									PopupPaymentProps.items = $form.items.map((item) => ({
										name: item.item_name,
										amount: item.price * item.units,
										units: item.units
									}));
									PopupPaymentProps.total_amount = $form.total_amount;
									PopupPaymentProps.recharge_amt = recharge_amt;
									PopupPaymentProps.use_qrcode_balance = $form.use_qrcode_balance ?? false;
									PopupPaymentProps.qrcode_balance = balance;
									PopupPaymentProps.guest_id = $form.guest_id;
									PopupPaymentProps.guest_name = name;
									PopupPaymentProps.qrcode_text = `${PUBLIC_UPI_URL}${recharge_amt}`;
									PopupPaymentProps.qrcode_message = `Paying ${$eventLS.event_name} - Rs ${recharge_amt.toFixed(2)}`;
									PopupPaymentProps.onConfirm = async (param: string) => {
										console.log('param :>> ', param);
									};
									PopupPaymentProps.open = true;
								}}
							>
								<IndianRupee class="mr-2 h-8 w-8" />
								Add Balance
							</Button>
						</div>
					{/if}
				{:else}
					<div class="mt-8 w-full">
						<Button class="mt-4 h-24 w-[70%] text-2xl" type="submit">
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
						QrScannerOnScan.value = await onScanToy;
						PopupQrScannerOpened.value = true;
					}}
					class="fixed bottom-4 left-4 z-20 rounded-full !bg-green-500 p-6 text-2xl [&_svg]:size-7"
				>
					<QrCode /> Toys
				</Button>
			{/if}
		{:else}
			<!-- add last_payment_info -->
			<!-- {$form.last_payment_info}
             last_payment_info: {
                visitor_id: 490,
                visitor_name: 'Nyra Thakkar',
                sub_visitor_id: 492,
                sub_visitor_name: 'Chintan',
                trx_amount: -50,
                payment_method: 'qrcode',
                trx_ts: 1730989321
            }

            -->

			<div class="flex h-[calc(100dvh-5rem)] flex-col">
				<div class="flex flex-1 items-center justify-center">
					<div class="flex flex-col items-center justify-center text-center">
						<p class="text-2xl">{$eventLS.event_name}</p>
						<p class="text-2xl font-bold">Scan Visitor's QrCode <br />to Collect Payment</p>
					</div>
				</div>
				<!-- {#if data.last_payment_info} -->
				<div class="flex flex-1 items-center justify-center">
					<Card.Root class="w-full max-w-md">
						<Card.Header>
							<Card.Title class="flex items-center justify-between">
								<span>Last Payment Details</span>
								<span
									class={`text-lg font-bold ${data.last_payment_info.trx_amount < 0 ? 'text-red-500' : 'text-green-500'}`}
								>
									₹{Math.abs(data.last_payment_info.trx_amount)}
								</span>
							</Card.Title>
							<Card.Description>
								Transaction ID: {data.last_payment_info.visitor_id}-{data.last_payment_info
									.sub_visitor_id}
							</Card.Description>
						</Card.Header>

						<Card.Content class="space-y-4">
							<div class="grid grid-cols-2 gap-4">
								{#if data.last_payment_info.sub_visitor_name}
									<div>
										<p class="font-medium">{data.last_payment_info.sub_visitor_name}</p>
									</div>
								{/if}
								<div>
									<p class="font-medium">{data.last_payment_info.visitor_name}</p>
								</div>
							</div>

							<div class="flex items-center justify-between border-t pt-4">
								<div>
									<p class="text-sm text-muted-foreground">Payment Method</p>
									<p class="font-medium capitalize">{data.last_payment_info.payment_method}</p>
								</div>
								<div class="text-right">
									<p class="text-sm text-muted-foreground">Date</p>
									<p class="font-medium">{data.last_payment_info.trx_ts}</p>
								</div>
							</div>
						</Card.Content>
					</Card.Root>
				</div>
				<!-- {/if} -->
			</div>
		{/if}
	{/if}
</form>

<Button
	onclick={async () => {
		QrScannerTitle.value = 'Scan Visitor QR Code';
		QrScannerOnScan.value = await onScanVisitor;
		PopupQrScannerOpened.value = true;
	}}
	class="fixed bottom-4 right-4 h-16 w-16  rounded-full !bg-red-500"
>
	<QrCode class="!size-7" />
</Button>
