<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';

	import { getFlash } from 'sveltekit-flash-message';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';

	import FakeProgressBar from '$lib/components/FakeProgressBar.svelte';
	import PopupQrScanner from '$lib/components/PopupQrScanner.svelte';
	import PopupRoute from '$lib/components/PopupRoute.svelte';
	import Preloader from '$lib/components/Preloader.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import {
		QrScannerTitle,
		QrScannerOnScan,
		QrScannerAutostart,
		PopupQrScannerOpened,
		LoadingDialog,
		ConfirmDialogProps,
		PopupRouteProps
	} from '$lib/ui-item-states.svelte';

	// const { children } = $props();

	let { children } = $props();

	const flash = getFlash(page);
	let notificationWithButton = $state(false);
	let notificationColor = $state('!bg-[#B12646]');
	let notificationButtonColor = $state('!text-[#B12646]');
	let notificationBorderColor = $state('border-[#B12646]');
	let notificationTitle = $state('');
	let notificationText = $state('');

	$effect(() => {
		// console.log("$flash :>> ", $flash);
		if ($flash) {
			notificationColor = $flash.type === 'success' ? '!bg-[#72A17D]' : '!bg-[#B12646]';
			notificationButtonColor = $flash.type === 'success' ? '!text-[#72A17D]' : '!text-[#B12646]';
			notificationBorderColor = $flash.type === 'success' ? 'border-[#72A17D]' : 'border-[#B12646]';
			notificationTitle = $flash.message.title
				? $flash.message.title
				: $flash.type === 'success'
					? 'Success'
					: 'Error';
			notificationText = $flash.message.text;
			notificationWithButton = true;

			toast(notificationTitle, {
				description: notificationText,
				classes: {
					toast: notificationColor,
					title: 'text-white font-bold text-lg',
					description: '!text-white text-md',
					closeButton: `bg-white ${notificationButtonColor} border-2 ${notificationBorderColor}`
				}
			});

			$flash = undefined;
		}
	});

	$effect(() => {
		if (!$page.state.popupQrScannerOpened) {
			// PopupQrScannerOpened.value = false;
			// if ($page.state.popupQrScannerOpened) {
			// 	history.back();
			// }
		}
		if (!$page.state.popupRouteOpened) {
			// PopupRouteProps.open = false;
			// if ($page.state.popupRouteOpened) {
			// 	history.back();
			// }
		}
	});
</script>

<div class="!h-dvh !min-h-dvh">
	{@render children()}
	<Toaster position="top-center" closeButton={notificationWithButton} />

	<ConfirmDialog
		bind:open={ConfirmDialogProps.open}
		title={ConfirmDialogProps.title}
		description={ConfirmDialogProps.description}
		onConfirm={ConfirmDialogProps.onConfirm}
		onCancel={ConfirmDialogProps.onCancel}
	/>

	<FakeProgressBar />

	<PopupQrScanner
		onScanSuccess={QrScannerOnScan.value}
		scannerTitle={QrScannerTitle.value}
		autostart={QrScannerAutostart.value}
	/>
	<PopupRoute />
	<Preloader bind:open={LoadingDialog.value} />
</div>
