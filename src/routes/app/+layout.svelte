<script lang="ts">
	const { data, children } = $props();

	// lib
	import { getFlash } from 'sveltekit-flash-message';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	// state

	// components
	import Menu from '$lib/components/Menu.svelte';

	const flash = getFlash(page);

	function showMessage(type, message = 'Success') {
		$flash = { type, message };
	}

	let refreshId: NodeJS.Timeout | undefined;

	$effect(() => {
		refreshId = setInterval(
			async () => {
				const resp = await fetch('/app/ticktock');
				const data = await resp.json();
				console.log('data :>> ', data);
				if (data.status !== 'ok') {
					clearInterval(refreshId);
					showMessage('error', 'Session Expired');
					goto('/login');
				}
			},
			5 * 60 * 1000
		);
	});

	$effect(() => {
		return () => clearInterval(refreshId);
	});
</script>

<div class="">
	<!-- keep div to keep navbar visible while scrolling -->
	{@render children()}
	<Menu />
</div>
