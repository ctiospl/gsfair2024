<script lang="ts">
	import { page } from '$app/stores';
	import { Copy, Target, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import * as flashModule from 'sveltekit-flash-message/client';
	import StyledQrCode from '$components/StyledQRCode.svelte';
	import {
		PUBLIC_UPI_URL,
		PUBLIC_REGISTRATION_FEE_ADULT,
		PUBLIC_REGISTRATION_FEE_CHILD
	} from '$env/static/public';
	import { Switch } from '$lib/components/ui/switch';
	// import { Checkbox } from "$lib/components/ui/checkbox";
	import { Label } from '$lib/components/ui/label';

	import {
		Page,
		Link,
		Popup,
		List,
		ListInput,
		ListItem,
		Button,
		Toggle,
		Navbar,
		NavbarBackLink,
		Block,
		BlockTitle,
		Checkbox,
		Notification,
		Radio
	} from 'konsta/svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { map } from 'zod';

	export let data;
	let notificationWithButton = false;
	let notificationTitle = '';
	let notificationSubTitle = '';
	let notificationText = '';
	const openNotification = (setter: any) => {
		notificationWithButton = false;
		setter();
	};
	$: () => {
		invalidateAll();
	};

	const { form, errors, message, constraints, enhance } = superForm(data.form, {
		taintedMessage: null,
		dataType: 'json',
		onUpdated({ form }) {
			if (form.message) {
				invalidateAll();
				// notificationTitle = form.message.type;
				notificationSubTitle = form.message;
				openNotification(() => (notificationWithButton = true));
			}
		},
		onError({ result }) {
			if (result.type == 'error') {
				notificationTitle = 'Error';
				notificationSubTitle = result.error.message;
				openNotification(() => (notificationWithButton = true));
			}
		}
	});
	let total_guests = 0;
	$: $form.registration_amount =
		($form.from_gs || $form.is_volunteer || $form.is_guest
			? 0
			: parseInt(PUBLIC_REGISTRATION_FEE_ADULT)) +
		$form.guests
			.map((g) =>
				g.from_gs || g.is_volunteer || g.is_guest
					? 0
					: g.is_child
						? parseInt(PUBLIC_REGISTRATION_FEE_CHILD)
						: parseInt(PUBLIC_REGISTRATION_FEE_ADULT)
			)
			.reduce((a, b) => a + b, 0);

	$: $form.payment_amount =
		$form.registration_amount +
		$form.recharge_amt +
		$form.guests.map((g) => g.recharge_amt).reduce((a, b) => a + b, 0);

	$form.eventId = $event.id;
	let paymentPopupOpened = false;
	let rechargePopupOpened = false;

	$: disabled =
		$form.name && !$form.guests.map((g) => (g.name ? true : false)).includes(false) ? false : true;
	// $: console.log('disabled :>> ', disabled);
	// $: console.log('$errors :>> ', $errors);
	// $: console.log('$form :>> ', $form);
	// $: console.log('$constraints :>> ', $constraints);
	$: adults_from_gs =
		($form.from_gs ? 1 : 0) + $form.guests.filter((g) => !g.is_child && g.from_gs).length;

	$: children_from_gs = 0 + $form.guests.filter((g) => g.is_child && g.from_gs).length;

	$: non_gs_adults =
		(!$form.from_gs && !$form.is_volunteer && !$form.is_guest ? 1 : 0) +
		$form.guests.filter((g) => !g.is_child && !g.from_gs && !g.is_volunteer && !g.is_guest).length;

	$: non_gs_children =
		0 +
		$form.guests.filter((g) => g.is_child && !g.from_gs && !g.is_volunteer && !g.is_guest).length;

	$: volunteers = $form.is_volunteer ? 1 : 0 + $form.guests.filter((g) => g.is_volunteer).length;

	$: invited_guests = $form.is_guest ? 1 : 0 + $form.guests.filter((g) => g.is_guest).length;
</script>

<Navbar title="Register New Visitor">
	<!-- <NavbarBackLink
		slot="left"
		text="Back"
		onClick={() => goto('/app/visitor-registration', { replaceState: true })}
	/> -->
	<NavbarBackLink slot="left" text="Back" onClick={() => history.back()} />
</Navbar>

<!-- {#if $message}
	<div class="status" class:error={$page.status >= 400} class:success={$page.status == 200}>
		{$message}
	</div>
{/if} -->
<div class="min-h-full bg-white">
	<form method="POST" use:enhance>
		<List class="mt-0 pt-0" strongIos insetIos>
			<ListInput
				type="text"
				name="name"
				clearButton={$form.name != ''}
				autocapitalize="words"
				spellcheck="false"
				autocomplete="off"
				id="name"
				bind:value={$form.name}
				aria-invalid={$errors.name ? 'true' : undefined}
				error={$errors.name ? $errors.name : ''}
				onInput={(e) => {
					$form.name = e.target.value;
				}}
				onClear={() => {
					$form.name = '';
				}}
				{...$constraints.name}
			>
				<div slot="label" class="flex flex-col">
					<div class="flex w-full justify-between">
						<div>Full Name *</div>
						<div class="flex items-center space-x-2">
							<Switch
								id="gs-switch"
								checked={$form.from_gs}
								onCheckedChange={(e) => {
									$form.from_gs = e;
									if (e) {
										$form.is_volunteer = false;
										$form.is_guest = false;
									}
								}}
							/>
							<Label for="gs-switch">From GS</Label>
						</div>
					</div>
					{#if !$form.from_gs}
						<div class="mt-2">
							<div class="flex w-full justify-end space-x-2">
								<div class="flex items-center space-x-2">
									<Switch
										id="vol-switch"
										checked={$form.is_volunteer}
										onCheckedChange={(e) => {
											$form.is_volunteer = e;
											if (e) {
												$form.is_guest = false;
											}
										}}
									/>
									<Label for="vol-switch">Volunteer</Label>
								</div>
								<div class="flex items-center space-x-2">
									<Switch
										id="guest-switch"
										checked={$form.is_guest}
										onCheckedChange={(e) => {
											$form.is_guest = e;
											if (e) {
												$form.is_volunteer = false;
											}
										}}
									/>
									<Label for="guest-switch">Invited</Label>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</ListInput>

			<ListInput
				type="email"
				name="email"
				inputmode="email"
				clearButton={$form.email != ('' || undefined)}
				id="email"
				label="Email"
				bind:value={$form.email}
				aria-invalid={$errors.email ? 'true' : undefined}
				error={$errors.email ? $errors.email : ''}
				{...$constraints.email}
				onInput={(e) => {
					$form.email = e.target.value;
				}}
				onClear={() => {
					$form.email = undefined;
				}}
			></ListInput>
			<ListInput
				type="tel"
				accept="number"
				inputmode="numeric"
				clearButton={$form.phone != ''}
				name="phone"
				id="phone"
				label="Phone *"
				maxlength="10"
				info="Don't add +91 and spaces"
				bind:value={$form.phone}
				aria-invalid={$errors.phone ? 'true' : undefined}
				error={$errors.phone ? $errors.phone : ''}
				{...$constraints.phone}
				onInput={(e) => {
					$form.phone = e.target.value;
				}}
				onClear={() => {
					$form.phone = '';
				}}
			></ListInput>

			<ListInput
				type="text"
				name="area"
				autocapitalize="words"
				spellcheck="false"
				autocomplete="off"
				id="area"
				label="Area"
				bind:value={$form.area}
				aria-invalid={$errors.area ? 'true' : undefined}
				error={$errors.area ? $errors.area : ''}
				onInput={(e) => {
					$form.area = e.target.value;
				}}
				{...$constraints.area}
			></ListInput>

			<ListInput
				type="text"
				name="hear_about_us"
				autocapitalize="words"
				spellcheck="false"
				autocomplete="off"
				id="hear_about_us"
				label="Where did you hear about us?"
				bind:value={$form.hear_about_us}
				aria-invalid={$errors.hear_about_us ? 'true' : undefined}
				error={$errors.hear_about_us ? $errors.hear_about_us : ''}
				onInput={(e) => {
					$form.hear_about_us = e.target.value;
				}}
				{...$constraints.hear_about_us}
			></ListInput>

			<ListInput
				name="number_of_guests"
				label="Number of Guests {$form.payment_status ? '(Payment Received)' : ''}"
				type="select"
				dropdown
				disabled={$form.payment_status}
				defaultValue="0"
				placeholder="Please choose..."
				onClick={(e) => {
					e.preventDefault();
					if ($form.payment_status) {
						notificationTitle = 'Error';
						notificationSubTitle = 'Payment already received';
						openNotification(() => (notificationWithButton = true));
					}
				}}
				onInput={(e) => {
					$form.guests = Array.from({ length: e.target.value }).map((_, i) => ({
						name: $form.guests[i]?.name ?? '',
						recharge_amt: 0,
						is_child: false,
						from_gs: false
					}));
					$form.number_of_guests = parseInt(e.target.value);
					$form.payment_status = false;
				}}
			>
				<option selected value="0">0</option>
				<option value="1">1</option>
				<option value="2">2</option>
				<option value="3">3</option>
				<option value="4">4</option>
				<option value="5">5</option>
				<option value="6">6</option>
				<option value="7">7</option>
				<option value="8">8</option>
				<option value="9">9</option>
				<option value="10">10</option>
				<option value="11">11</option>
				<option value="12">12</option>
				<option value="13">13</option>
				<option value="14">14</option>
				<option value="15">15</option>
			</ListInput>

			{#if $form.number_of_guests > 0}
				<ListItem label title="Group QR">
					<Toggle
						name="groupedqr"
						slot="after"
						component="div"
						class="-my-1"
						checked={$form.group_qr}
						onChange={() => {
							$form.group_qr = !$form.group_qr;
						}}
					/>
				</ListItem>
				<ListItem
					titleWrapClass="flex-row-reverse"
					onClick={(e) => {
						e.preventDefault();
						$form.guests = $form.guests.map((g, i) => ({
							...g,
							name: g.name ? g.name : `Guest ${i + 1} - ` + $form.name
						}));
					}}
				>
					<button slot="title" type="button" class="flex"
						><Copy class="mx-2" />Copy Visitor Details</button
					>
				</ListItem>

				{#each Array.from({ length: $form.number_of_guests }) as _, i}
					<!-- {#each Array.from({ length: number_of_guests }) as _, i} -->
					<ListInput
						type="text"
						id="name"
						autocapitalize="words"
						spellcheck="false"
						autocomplete="off"
						clearButton={$form.guests[i].name != ''}
						bind:value={$form.guests[i].name}
						aria-invalid={$errors.guests?.[i]?.name ? 'true' : undefined}
						error={$errors.guests?.[i]?.name ? $errors.guests?.[i]?.name : ''}
						data-invalid={$errors.guests?.[i]?.name}
						onInput={(e) => {
							$form.guests[i].name = e.target.value;
						}}
						onClear={() => {
							$form.guests[i].name = '';
						}}
						{...$constraints.guests?.name}
					>
						<div slot="label" class="flex-col">
							<div class="flex w-full justify-between">
								<div>Guest {i + 1} - Name</div>
								<div class="flex items-center space-x-2">
									<Switch
										id="child{i + 1}-switch"
										disabled={$form.payment_status}
										checked={$form.guests[i].is_child}
										onCheckedChange={(e) => {
											$form.guests[i].is_child = e;
											if (e) {
												$form.guests[i].is_volunteer = false;
											}
										}}
									/>
									<Label for="child{i + 1}-switch">Child</Label>

									<Switch
										id="gs{i + 1}-switch"
										disabled={$form.payment_status}
										checked={$form.guests[i].from_gs}
										onCheckedChange={(e) => {
											$form.guests[i].from_gs = e;
											if (e) {
												$form.guests[i].is_volunteer = false;
												$form.guests[i].is_guest = false;
											}
										}}
									/>
									<Label for="vol{i + 1}-switch">From GS</Label>
								</div>
							</div>
							{#if !$form.guests[i].from_gs}
								<div class="mt-2 flex">
									<div class="flex w-full justify-end space-x-2">
										<div class="flex items-center space-x-1">
											<Switch
												id="vol{i + 1}-switch"
												disabled={$form.payment_status}
												checked={$form.guests[i].is_volunteer}
												onCheckedChange={(e) => {
													$form.guests[i].is_volunteer = e;
													if (e) {
														$form.guests[i].is_guest = false;
														$form.guests[i].is_child = false;
													}
												}}
											/>
											<Label for="vol{i + 1}-switch">Volunteer</Label>
										</div>
										<div class="flex items-center space-x-2">
											<Switch
												id="guest{i + 1}-switch"
												disabled={$form.payment_status}
												checked={$form.guests[i].is_guest}
												onCheckedChange={(e) => {
													$form.guests[i].is_guest = e;
													if (e) {
														$form.guests[i].is_volunteer = false;
													}
												}}
											/>
											<Label for="guest{i + 1}-switch">Invited</Label>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</ListInput>
				{/each}
			{/if}

			{#if $form.name && !$form.guests
					.map((g) => (g.name ? true : false))
					.includes(false) && !$form.payment_status}
				<ListItem dividers={false}
					><Button
						class="pe-4-safe mx-auto ml-2 mt-8 w-[85] rounded !bg-green-600 py-2.5 active:bg-green-600"
						raised
						large
						onClick={(e) => {
							e.preventDefault();
							rechargePopupOpened = true;
						}}
						activeBgIos>Add Money to QrCodes</Button
					></ListItem
				>
			{/if}
			{#if $form.payment_status}
				<ListItem label title="Payment Received">
					<Checkbox
						slot="media"
						component="div"
						checked={$form.payment_status}
						onChange={() => {
							$form.payment_status = false;
						}}
					/>
				</ListItem>
			{/if}
			{#if $form.payment_status}
				<ListItem
					><Button
						class="pe-4-safe mx-auto ml-2 mt-8 w-[85] rounded !bg-primary py-2.5 active:bg-primary "
						{disabled}
						raised
						large
						type="submit"
						activeBgIos>Register</Button
					></ListItem
				>
			{:else}
				<ListItem
					><Button
						class="pe-4-safe mx-auto ml-2 mt-8 w-[85] rounded py-2.5 {disabled
							? ''
							: '!bg-primary active:bg-primary'}"
						raised
						large
						{disabled}
						onClick={(e) => {
							e.preventDefault();
							paymentPopupOpened = true;
						}}
						activeBgIos>Collect Payment</Button
					></ListItem
				>
			{/if}
		</List>

		<Popup opened={paymentPopupOpened} onBackdropClick={() => (paymentPopupOpened = false)}>
			<Page class="min-h-full !bg-white">
				<Navbar title="Collect Amount: ₹ {$form.payment_amount}">
					<Link
						slot="right"
						navbar
						onClick={(e) => {
							e.preventDefault();
							paymentPopupOpened = false;
						}}>Close</Link
					>
				</Navbar>
				<List class="mt-0 pt-0">
					<ListItem
						title="Registration"
						class="border-black font-semibold"
						after={`₹ ${$form.registration_amount}`}
					></ListItem>
					<List nested>
						{#if adults_from_gs > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{adults_from_gs == 1
									? 'Adult'
									: 'Adults'} (GS) - {adults_from_gs} - Free Entry"
								after="₹ 0"
							/>
						{/if}
						{#if non_gs_adults > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{non_gs_adults == 1
									? 'Adult'
									: 'Adults'} - {non_gs_adults} x ₹ {PUBLIC_REGISTRATION_FEE_ADULT}"
								after={`₹ ${non_gs_adults * parseInt(PUBLIC_REGISTRATION_FEE_ADULT)}`}
							/>
						{/if}
						{#if volunteers > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{volunteers == 1 ? 'Volunteer' : 'Volunteers'} - {volunteers} - Free Entry"
								after="₹ 0"
							/>
						{/if}

						{#if invited_guests > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{invited_guests == 1
									? 'Invited Guest'
									: 'Invited Guest'} - {invited_guests} - Free Entry"
								after="₹ 0"
							/>
						{/if}
						{#if children_from_gs > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{children_from_gs == 1
									? 'Child'
									: 'Children'} (GS) - {children_from_gs} - Free Entry"
								after="₹ 0"
							/>
						{/if}
						{#if non_gs_children > 0}
							<ListItem
								class="ml-8 text-sm"
								title="{non_gs_children == 1
									? 'Child'
									: 'Children'} - {non_gs_children} x ₹ {PUBLIC_REGISTRATION_FEE_CHILD}"
								after={`₹ ${non_gs_children * parseInt(PUBLIC_REGISTRATION_FEE_CHILD)}`}
							/>
						{/if}
					</List>

					<ListItem
						class="border-black font-semibold"
						title="QrCode Recharge"
						after={`₹ ${
							$form.recharge_amt +
							$form.guests.map((g) => g.recharge_amt).reduce((a, b) => a + b, 0)
						}`}
					/>
					<List nested>
						<ListItem class="ml-8 text-sm" title={$form.name} after={`₹ ${$form.recharge_amt}`} />
						{#each Array.from({ length: $form.number_of_guests }) as _, i}
							<List nested>
								<ListItem
									class="ml-8 text-sm"
									title={$form.guests[i].name}
									after={`₹ ${$form.guests[i].recharge_amt}`}
								/>
							</List>
						{/each}
					</List>
					<ListItem
						class="border-b-2 border-t-2 border-black font-bold"
						title="Total"
						after={`₹ ${$form.payment_amount}`}
					/>
				</List>
				<Block>
					<div class="flex justify-center">
						{#key $form.payment_amount}
							<svelte:component
								this={StyledQrCode}
								qrcodeText={`${PUBLIC_UPI_URL}${$form.payment_amount}`}
							/>
						{/key}
					</div>
				</Block>
				<Block strong outlineIos class="space-y-2">
					<div class="grid grid-cols-2 gap-x-4">
						<Button
							onClick={(e) => {
								e.preventDefault();
								$form.payment_status = true;
								$form.payment_method = 'UPI';
								paymentPopupOpened = false;
							}}
							large
							class="!bg-blue-600">UPI</Button
						>
						<Button
							onClick={(e) => {
								e.preventDefault();
								$form.payment_status = true;
								$form.payment_method = 'Cash';
								paymentPopupOpened = false;
							}}
							large
							class="!bg-emerald-600">CASH</Button
						>
					</div>
				</Block>
			</Page>
		</Popup>

		<Popup opened={rechargePopupOpened} onBackdropClick={() => (rechargePopupOpened = false)}>
			<Page class="min-h-full !bg-white">
				<Navbar title="Recharge QrCodes">
					<Link
						slot="right"
						navbar
						onClick={(e) => {
							e.preventDefault();
							$form.recharge_amt = 0;
							$form.guests = $form.guests.map((g) => ({ ...g, recharge_amt: 0 }));
							rechargePopupOpened = false;
						}}>Close</Link
					>
				</Navbar>
				<BlockTitle
					>Total Recharge: ₹ {$form.recharge_amt +
						$form.guests.map((g) => g.recharge_amt ?? 0).reduce((a, b) => a + b, 0)}</BlockTitle
				>

				<List>
					<ListInput
						type="tel"
						accept="number"
						inputmode="numeric"
						clearButton={$form.recharge_amt != 0}
						label="Name: {$form.name} - {$form.is_child ? 'Child' : 'Adult'}"
						bind:value={$form.recharge_amt}
						{...$constraints.recharge_amt}
						onInput={(e) => {
							$form.recharge_amt = e.target.value == '' ? 0 : (parseInt(e.target.value) ?? 0);
						}}
						onClear={() => {
							$form.recharge_amt = 0;
						}}
					></ListInput>
					{#if !$form.group_qr}
						{#each Array.from({ length: $form.number_of_guests }) as _, i}
							<ListInput
								type="tel"
								accept="number"
								inputmode="numeric"
								clearButton={$form.guests[i].recharge_amt != 0}
								label="Name: {$form.guests[i].name} - {$form.guests[i].is_child
									? 'Child'
									: 'Adult'}"
								bind:value={$form.guests[i].recharge_amt}
								onInput={(e) => {
									$form.guests[i].recharge_amt =
										e.target.value == '' ? 0 : (parseInt(e.target.value) ?? 0);
								}}
								onClear={() => {
									$form.guests[i].recharge_amt = 0;
								}}
							></ListInput>
						{/each}
					{/if}
				</List>

				<Block strong outlineIos class="space-y-2">
					<div class="grid grid-cols-2 gap-x-4">
						<Button
							onClick={(e) => {
								e.preventDefault();
								$form.recharge_amt = 0;
								$form.guests = $form.guests.map((g) => ({ ...g, recharge_amt: 0 }));
								rechargePopupOpened = false;
							}}
							large
							class="!bg-blue-600">Cancel</Button
						>
						<Button
							onClick={(e) => {
								e.preventDefault();
								rechargePopupOpened = false;
							}}
							large
							class="!bg-emerald-600">ADD</Button
						>
					</div>
				</Block>
			</Page>
		</Popup>
	</form>
</div>

<Notification
	opened={notificationWithButton}
	class="!bg-red-500 text-white"
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
