<script lang="ts">
	const { data } = $props();
	import NewPasswordForm from './NewPasswordForm.svelte';
	import Logo from '$lib/images/goldenspiral-logo.svg';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Button } from '$lib/components/ui/button';
</script>

<Card.Root class="mx-auto w-full max-w-sm border-none shadow-none">
	<Card.Header>
		<Card.Title class="mx-auto mb-4 text-4xl font-medium">GS Fair 2024</Card.Title>
		<Card.Description
			><img class="mx-auto w-[80%] md:w-96" src={Logo} alt="Logo" /></Card.Description
		>
	</Card.Header>
	<Card.Content class="border-none">
		{#if data.invalidtoken}
			<div class="text-center">
				<h1 class="text-2xl font-medium">Invalid/Expired Password Reset Request</h1>
				<p class="text-center">
					<Button variant="link" href="/reset-password">Please click here request a new one.</Button
					>
				</p>
			</div>
		{:else}
			<NewPasswordForm data={data.form} />
		{/if}
	</Card.Content>
</Card.Root>
