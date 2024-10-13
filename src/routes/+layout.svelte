<script lang="ts">
	import '../app.pcss';
	import { page } from '$app/stores';
	import { App, Dialog, KonstaProvider, Notification, Preloader } from 'konsta/svelte';
	import { getFlash } from 'sveltekit-flash-message';

	import FakeProgressBar from '$lib/components/FakeProgressBar.svelte';
	import { LoadingDialog } from '$lib/ui-item-states.svelte';

	const { children } = $props();

	const flash = getFlash(page);
	let notificationWithButton = $state(false);
	let notificationColor = $state('!bg-red-500');
	let notificationTitle = $state('');
	let notificationText = $state('');
	const openNotification = (setter: unknown) => {
		notificationWithButton = true;
		(setter as () => void)();
		if (notificationWithButton) {
			setTimeout(() => {
				notificationWithButton = false;
			}, 3000);
		}
	};
	$effect(() => {
		// console.log("$flash :>> ", $flash);
		if ($flash) {
			notificationColor = $flash.type === 'success' ? '!bg-emerald-500' : '!bg-red-500';
			notificationTitle = $flash.type === 'success' ? 'Success' : 'Error';
			notificationText = $flash.message;
			notificationWithButton = true;
			openNotification(() => {});
			$flash = undefined;
		}
	});
</script>

<KonstaProvider theme="ios">
	<App theme="ios" class="!h-dvh !min-h-dvh">
		{@render children()}
		<Notification
			opened={notificationWithButton}
			class="{notificationColor} fixed top-0 text-white"
			colors={{
				titleIos: 'text-white',
				bgIos: notificationColor,
				subtitleIos: 'text-white',
				deleteIconIos: 'text-white'
			}}
			title={notificationTitle}
			text={notificationText}
			onClose={async () => {
				notificationWithButton = false;
			}}
		></Notification>
		<Dialog opened={LoadingDialog.value} colors={{ bgIos: 'transparent' }}>
			<Preloader size="w-16 h-16" />
		</Dialog>
	</App>
</KonstaProvider>
<FakeProgressBar />
