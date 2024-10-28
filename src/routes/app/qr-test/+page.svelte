<script lang="ts">
	import type { PageData } from './$types';
	import StyledQrCode from '$lib/components/StyledQRCode.svelte';
	export let data: PageData;
</script>

<div class="flex justify-center">
	<StyledQrCode qrcodeText="PRN" message="CHECK YOUR BALANCE" />
</div>
