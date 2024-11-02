<script lang="ts">
	import type { PageData } from '../$types';
	import {
		Page,
		Popup,
		Notification,
		Navbar,
		NavbarBackLink,
		Link,
		Dialog,
		DialogButton,
		Fab,
		List,
		ListItem,
		Block,
		Button as ButtonKonsta
	} from 'konsta/svelte';
	import {
		PUBLIC_UPI_URL,
		PUBLIC_REGISTRATION_FEE_ADULT,
		PUBLIC_REGISTRATION_FEE_CHILD
	} from '$env/static/public';
	export let data: PageData;
	import StyledQrCode from '$components/StyledQRCode.svelte';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { Printer, Users } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { Button } from '$components/ui/button';
	import QrScanner from '$components/QrScanner.svelte';
	import { QrCode, RefreshCw } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { startScan, stopScan } from '$components/QrScanner.svelte';
	import { getContext } from 'svelte';

	import { Switch } from '$lib/components/ui/switch';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';

	const { form, errors, message, constraints, enhance, delayed } = superForm(data.form, {
		dataType: 'json',
		resetForm: true,
		async onResult({ result }) {
			if (result.type == 'success') {
				notificationTitle = 'QrCode Added/Updated Successfully';
				notificationColor = '!bg-emerald-500';
				preloaderOpened = false;
				popupOpened = false;
				openNotification(() => (notificationWithButton = true));
			}
			// name = '';
			// balance = 0;
		},
		onUpdated({ form }) {
			preloaderOpened = false;
			if (form.message) {
				notificationSubTitle = form.message.text;
				openNotification(() => (notificationWithButton = true));
			}
		},
		onError({ result }) {
			preloaderOpened = false;
			popupOpened = false;
			if (result.type == 'error') {
				notificationTitle = 'Error';
				notificationSubTitle = result.error.message;
				openNotification(() => (notificationWithButton = true));
			}
		}
	});
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
	let sheetOpened = false;
	let confirmOpened = false;
	let preloaderOpened = false;

	$: _x = loadingDialogOpened.set($delayed);

	let scanTarget = '';
	let loadingDialogOpened = getContext('loadingDialogOpened');

	let dialogTitle = '';
	let dialogText = '';
	let dialogType = 'alert';
	$: dialogCancelText = dialogType == 'confirm' ? 'No' : 'OK';
	let dialogConfirmText = 'Yes';
	let dialogOpened = false;
	let dialogCancelFunction = async () => {};
	let dialogConfirmFunction = async () => {};

	let assignmentForm: HTMLFormElement;
	$: reregisterUsers = [];

	function confirmGroupQrChange(status) {
		if (status) {
			dialogTitle = 'Group the QrCodes';
			dialogText = `Please Confirm you wish to group all the QrCodes`;
			dialogType = 'confirm';
			dialogConfirmText = 'Yes';
			dialogCancelText = 'No';
			dialogOpened = true;
			dialogCancelFunction = async () => {
				data.userData[0].group_qr = false;
			};
			dialogConfirmFunction = async () => {
				dialogOpened = false;
				preloaderOpened = true;
				const res = await fetch(
					`/app/api/visitor-registration/group-qr/${data.userData[0].master_user_id}`,
					{
						method: 'POST'
					}
				);
				preloaderOpened = false;

				if (res.ok === true) {
					const retData = await res.json();

					notificationColor = 'bg-green-500';
					notificationTitle = 'Success';
					notificationSubTitle = 'Grouped QrCode Successfully';
					// notificationText = `New Balance: ₹ ${Math.abs(retData.balance_amount)}`;
					openNotification(() => (notificationWithButton = true));
					invalidateAll();
				} else {
					notificationColor = 'bg-red-500';
					notificationTitle = 'Error';
					notificationSubTitle = 'Error in Grouping QrCode';
					// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
					openNotification(() => (notificationWithButton = true));
				}
			};
		} else {
			dialogTitle = 'UnGroup the QrCodes';
			dialogText = `Please Confirm you wish to ungroup all the QrCodes`;
			dialogType = 'confirm';
			dialogConfirmText = 'Yes';
			dialogCancelText = 'No';
			dialogOpened = true;
			dialogCancelFunction = async () => {
				data.userData[0].group_qr = true;
			};
			dialogConfirmFunction = async () => {
				console.log('ungroup');
				dialogOpened = false;
				preloaderOpened = true;
				const res = await fetch(
					`/app/api/visitor-registration/ungroup-qr/${data.userData[0].master_user_id}`,
					{
						method: 'POST'
					}
				);
				preloaderOpened = false;

				const retData = await res.json();
				if (res.ok === true) {
					notificationColor = 'bg-green-500';
					notificationTitle = 'Success';
					notificationSubTitle = 'Ungrouped QrCode Successfully';
					// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
					openNotification(() => (notificationWithButton = true));
				} else {
					notificationColor = 'bg-red-500';
					notificationTitle = 'Error';
					notificationSubTitle = 'Error in Ungrouping QrCode';
					// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
					openNotification(() => (notificationWithButton = true));
				}
			};
		}
	}

	let paymentPopupOpened = false;
	$: adults_from_gs = reregisterUsers
		.map((user) => !user.is_child && user.from_gs)
		.filter((x) => x).length;
	$: console.log('adults_from_gs :>> ', adults_from_gs);

	$: children_from_gs = reregisterUsers
		.map((user) => user.is_child && user.from_gs)
		.filter((x) => x).length;
	$: console.log('children_from_gs :>> ', children_from_gs);

	$: non_gs_adults = reregisterUsers
		.map((user) => !user.is_child && !user.from_gs && !user.is_volunteer && !user.is_guest)
		.filter((x) => x).length;
	$: console.log('non_gs_adults :>> ', non_gs_adults);

	$: non_gs_children = reregisterUsers
		.map((user) => user.is_child && !user.from_gs && !user.is_volunteer && !user.is_guest)
		.filter((x) => x).length;
	$: console.log('non_gs_children :>> ', non_gs_children);

	$: volunteers = reregisterUsers.map((user) => user.is_volunteer).filter((x) => x).length;
	$: console.log('volunteers :>> ', volunteers);

	$: invited_guests = reregisterUsers.map((user) => user.is_guest).filter((x) => x).length;
	$: console.log('invited_guests :>> ', invited_guests);

	$: registration_amount =
		non_gs_adults * parseInt(PUBLIC_REGISTRATION_FEE_ADULT) +
		non_gs_children * parseInt(PUBLIC_REGISTRATION_FEE_CHILD);

	let payment_status = false;
	let payment_method = '';
	let disabled = false;
</script>

<Navbar title="Add/Update Visitor QrCodes">
	<NavbarBackLink
		slot="left"
		text="Back"
		onClick={() => {
			history.back();
			// goto('/app/visitor-registration/register', { replaceState: true });
		}}
	/>
	<!-- <Link
		slot="right"
		navbar
		onClick={() => {
			alert('Print All Labels. Print Logic to be added after the printer is finalized ');
		}}><Printer /></Link
	> -->
</Navbar>
<div class="flex justify-between items-center mt-2 mb-4">
	<div>
		<Switch
			id="group-switch"
			bind:checked={data.userData[0].group_qr}
			onCheckedChange={(e) => {
				confirmGroupQrChange(e);
			}}
		/>
		<Label class="ml-2" for="group-switch">Grouped QR</Label>
	</div>
	{#if reregisterUsers.length > 0}
		<Fab
			text="Register"
			onClick={() => {
				paymentPopupOpened = true;
			}}
			class="fixed text-xs right-4-safe top-16-safe z-20 !bg-green-500"
		></Fab>
	{/if}
</div>
<form bind:this={assignmentForm} method="POST" use:enhance class="mx-4">
	{#each data.userData as user, i (i)}
		<div class="pb-8 mb-4 border-b-2 border-slate-300">
			<div class="text-xl flex justify-center mb-0">
				{user.name}
			</div>
			<div class="text-xl flex justify-center mb-4">
				Balance: ₹ {user.balance_amount}
			</div>
			<div class="flex justify-around content-center justify-items-center">
				<div class="flex self-center">
					{#if !user.uid}
						<Button
							class="self-center text-md !bg-red-500"
							on:click={(e) => {
								e.preventDefault();
								popupOpened = true;
								startScan();
								$form.visitor_id = parseInt(user.id);
							}}
						>
							<QrCode class="mr-4" />
							Assign
						</Button>
					{:else}
						<div class="grid grid-cols-3 gap-4 content-center justify-center justify-items-center">
							{#if !user.day_2}
								<div class="flex items-center space-x-2">
									<Switch
										id="reregister{i + 1}-switch"
										checked={user.day_2}
										onCheckedChange={(e) => {
											if (e) {
												reregisterUsers[i] = { ...user, day_2: e };
												if (i !== 0) {
													reregisterUsers[0] = { ...data.userData[0], day_2: true };
												}
											} else {
												reregisterUsers = reregisterUsers.filter(
													(reregisterUser) => reregisterUser.id != user.id
												);
											}

											console.log('reregisterUsers :>> ', reregisterUsers);
										}}
									/>
									<Label for="reregister{i + 1}-switch">Re-Register</Label>
								</div>
							{/if}
							<div class="flex justify-center w-12 h-12">
								<svelte:component this={StyledQrCode} qrcodeText={user.uid} />
							</div>
							<div>
								<div class="self-center">{user.uid}</div>
								{#if user.expired}
									<div class="text-sm text-red-500">(Expired)</div>
								{/if}
							</div>
						</div>
						<div class="flex self-center">
							{#if user.day_2}
								<div>
									<Button
										class="self-center text-md !bg-red-500"
										on:click={(e) => {
											e.preventDefault();
											popupOpened = true;
											startScan();
											$form.visitor_id = parseInt(user.id);
										}}
									>
										<RefreshCw class="mr-4" />
										New
									</Button>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/each}
</form>

<Popup
	opened={popupOpened}
	onBackdropClick={() => {
		popupOpened = false;
		stopScan();
	}}
>
	<Page>
		<Navbar title="Assign New QrCode Scanner">
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
				$form.qrcode_value = e.detail;
				// await data.userData.find((user) => user.id == $form.visitor_id).uid = e.detail;

				if (assignmentForm.requestSubmit) {
					assignmentForm.requestSubmit();
				} else {
					assignmentForm.submit();
				}
			}}
		/>
	</Page>
</Popup>

<!-- <Popup
	opened={paymentPopupOpened}
	onBackdropClick={() => {
		paymentPopupOpened = false;
	}}
>
	<Page>
		<Navbar title="Collect payment">
			<Link
				slot="right"
				navbar
				onClick={() => {
					paymentPopupOpened = false;
				}}>Close</Link
			>
		</Navbar>
		<div class="flex flex-col justify-center items-center">
			<div class="text-xl flex justify-center mb-4">
				Total Amount: ₹ {reregisterUsers.length * 100}
			</div>
			<div class="flex justify-around content-center justify-items-center">
				<div class="flex self-center">
					<Button
						class="self-center text-md !bg-red-500"
						on:click={async (e) => {
							e.preventDefault();
							paymentPopupOpened = false;
							preloaderOpened = true;
							const res = await fetch(
								`/app/api/visitor-registration/collect-payment/${data.userData[0].master_user_id}`,
								{
									method: 'POST',
									body: JSON.stringify(reregisterUsers)
								}
							);
							preloaderOpened = false;

							const retData = await res.json();
							if (res.ok === true) {
								notificationColor = 'bg-green-500';
								notificationTitle = 'Success';
								notificationSubTitle = 'Payment Collected Successfully';
								// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
								invalidateAll();
							} else {
								notificationColor = 'bg-red-500';
								notificationTitle = 'Error';
								notificationSubTitle = 'Error in Collecting Payment';
								// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
							}
						}}
					>
						Collect Payment
					</Button>
				</div>
			</div>
		</div></Page
	>
</Popup> -->
<Popup opened={paymentPopupOpened} onBackdropClick={() => (paymentPopupOpened = false)}>
	<Page class="!bg-white min-h-full">
		<Navbar title="Collect Amount: ₹ {registration_amount}">
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
				class="font-semibold border-black"
				after={`₹ ${registration_amount}`}
			></ListItem>
			<List nested>
				{#if adults_from_gs > 0}
					<ListItem
						class="text-sm ml-8"
						title="{adults_from_gs == 1 ? 'Adult' : 'Adults'} (GS) - {adults_from_gs} - Free Entry"
						after="₹ 0"
					/>
				{/if}
				{#if non_gs_adults > 0}
					<ListItem
						class="text-sm ml-8"
						title="{non_gs_adults == 1
							? 'Adult'
							: 'Adults'} - {non_gs_adults} x ₹ {PUBLIC_REGISTRATION_FEE_ADULT}"
						after={`₹ ${non_gs_adults * parseInt(PUBLIC_REGISTRATION_FEE_ADULT)}`}
					/>
				{/if}
				{#if volunteers > 0}
					<ListItem
						class="text-sm ml-8"
						title="{volunteers == 1 ? 'Volunteer' : 'Volunteers'} - {volunteers} - Free Entry"
						after="₹ 0"
					/>
				{/if}

				{#if invited_guests > 0}
					<ListItem
						class="text-sm ml-8"
						title="{invited_guests == 1
							? 'Invited Guest'
							: 'Invited Guest'} - {invited_guests} - Free Entry"
						after="₹ 0"
					/>
				{/if}
				{#if children_from_gs > 0}
					<ListItem
						class="text-sm ml-8"
						title="{children_from_gs == 1
							? 'Child'
							: 'Children'} (GS) - {children_from_gs} - Free Entry"
						after="₹ 0"
					/>
				{/if}
				{#if non_gs_children > 0}
					<ListItem
						class="text-sm ml-8"
						title="{non_gs_children == 1
							? 'Child'
							: 'Children'} - {non_gs_children} x ₹ {PUBLIC_REGISTRATION_FEE_CHILD}"
						after={`₹ ${non_gs_children * parseInt(PUBLIC_REGISTRATION_FEE_CHILD)}`}
					/>
				{/if}
			</List>

			<ListItem
				class="font-bold border-t-2 border-b-2 border-black"
				title="Total"
				after={`₹ ${registration_amount}`}
			/>
		</List>
		<Block>
			<div class="flex justify-center">
				{#key registration_amount}
					<svelte:component
						this={StyledQrCode}
						qrcodeText={`${PUBLIC_UPI_URL}${registration_amount}`}
					/>
				{/key}
			</div>
		</Block>
		<Block strong outlineIos class="space-y-2">
			<div class="grid grid-cols-2 gap-x-4">
				<ButtonKonsta
					onClick={(e) => {
						e.preventDefault();
						payment_status = true;
						payment_method = 'UPI';
						dialogTitle = 'Confirm UPI Received';
						dialogText = `Please Confirm you received the UPI Amount of ₹ ${registration_amount}`;
						dialogType = 'confirm';
						dialogConfirmText = 'Yes';
						dialogCancelText = 'No';
						dialogOpened = true;
						dialogCancelFunction = async () => {};
						console.log({ reregisterUsers, payment_status, payment_method });
						dialogConfirmFunction = async () => {
							dialogOpened = false;
							preloaderOpened = true;
							const res = await fetch(`/app/api/visitor-registration/reregister`, {
								method: 'POST',
								body: JSON.stringify({
									reregisterUsers,
									payment_status,
									payment_method,
									registration_amount
								})
							});
							preloaderOpened = false;

							if (res.ok === true) {
								const retData = await res.json();

								notificationColor = 'bg-green-500';
								notificationTitle = 'Success';
								notificationSubTitle = 'Reregistered Successfully';
								reregisterUsers = [];
								// notificationText = `New Balance: ₹ ${Math.abs(retData.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
								invalidateAll();
							} else {
								notificationColor = 'bg-red-500';
								notificationTitle = 'Error';
								notificationSubTitle = 'Error while reregistering';
								// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
							}
						};
						paymentPopupOpened = false;
					}}
					large
					class="!bg-blue-600">UPI</ButtonKonsta
				>
				<ButtonKonsta
					onClick={(e) => {
						e.preventDefault();
						payment_status = true;
						payment_method = 'Cash';

						dialogTitle = 'Confirm Cash Received';
						dialogText = `Please Confirm You received the Cash Amount of ₹ ${registration_amount}`;
						dialogType = 'confirm';
						dialogConfirmText = 'Yes';
						dialogCancelText = 'No';
						dialogOpened = true;
						dialogCancelFunction = async () => {};
						console.log({ reregisterUsers, payment_status, payment_method });
						dialogConfirmFunction = async () => {
							dialogOpened = false;
							preloaderOpened = true;
							const res = await fetch(`/app/api/visitor-registration/reregister`, {
								method: 'POST',
								body: JSON.stringify({
									reregisterUsers,
									payment_status,
									payment_method,
									registration_amount
								})
							});
							preloaderOpened = false;

							if (res.ok === true) {
								const retData = await res.json();

								notificationColor = 'bg-green-500';
								notificationTitle = 'Success';
								notificationSubTitle = 'Reregistered Successfully';
								reregisterUsers = [];
								// notificationText = `New Balance: ₹ ${Math.abs(retData.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
								invalidateAll();
							} else {
								notificationColor = 'bg-red-500';
								notificationTitle = 'Error';
								notificationSubTitle = 'Error while reregistering';
								// notificationText = `New Balance: ₹ ${Math.abs(data.balance_amount)}`;
								openNotification(() => (notificationWithButton = true));
							}
						};
						paymentPopupOpened = false;
					}}
					large
					class="!bg-emerald-600">CASH</ButtonKonsta
				>
			</div>
		</Block>
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
		{#if dialogType == 'confirm'}
			<DialogButton
				onClick={async () => {
					await dialogCancelFunction();
					dialogOpened = false;
				}}>{dialogCancelText}</DialogButton
			>
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
