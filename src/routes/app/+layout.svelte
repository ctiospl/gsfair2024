<script lang="ts">
	const { data, children } = $props();

	// lib/functions
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { showMessage } from '$lib/flash-messages.svelte';

	// state

	// components
	import Menu from '$lib/components/Menu.svelte';

	let refreshId: number | undefined;

	$effect(() => {
		refreshId = setInterval(
			async () => {
				const resp = await fetch('/app/ticktock');
				const data = await resp.json();
				if (data.status !== 'ok') {
					clearInterval(refreshId);
					showMessage(page, {
						type: 'error',
						title: 'Session Expired',
						text: 'Please login again'
					});
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
