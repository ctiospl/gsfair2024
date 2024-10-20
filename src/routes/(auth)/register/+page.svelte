<script lang="ts">
	const { data } = $props();
	import RegistrationForm from './RegistrationForm.svelte';
	import Logo from '$lib/images/goldenspiral-logo.svg';
	import * as Card from '$lib/components/ui/card/index.js';
</script>

<Card.Root class="mx-auto w-full max-w-sm border-none shadow-none">
	<Card.Header>
		<Card.Title class="mx-auto mb-4 text-4xl font-medium">GS Fair 2024</Card.Title>
		<Card.Description
			><img class="mx-auto w-[80%] md:w-96" src={Logo} alt="Logo" /></Card.Description
		>
	</Card.Header>
	<Card.Content class="border-none">
		<RegistrationForm data={data.form} />
	</Card.Content>
</Card.Root>
