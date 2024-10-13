<script>
	import '../app.pcss';
	import { App, KonstaProvider } from 'konsta/svelte';
	const { children } = $props();
</script>

<KonstaProvider theme="ios">
	<App theme="ios" class="k-ios">
		{@render children()}
	</App>
</KonstaProvider>
