<script lang="ts">
	// lib
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	// components

	// ui
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import PasswordInput from '$lib/components/ui/password-input/password-input.svelte';
	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	// state
	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { loginSchema } from '$lib/zod/schema.js';

	export let data: SuperValidated<Infer<typeof loginSchema>>;
	const form = superForm(data, {
		validators: zodClient(loginSchema),
		resetForm: false,
		onSubmit: () => {
			LoadingDialog.value = true;

			// do something
		},
		onResult(event) {
			LoadingDialog.value = false;
		},

		onError: (e: unknown) => {
			// do something else
			console.log('e :>> ', e);
		}
	});
	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<Field {form} name="username">
		<Control>
			{#snippet children({ props })}
				<Label>Username</Label>
				<Input
					{...props}
					type="text"
					autocapitalize="off"
					autocomplete="off"
					autocorrect="off"
					bind:value={$formData.email}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors />
	</Field>
	<Field {form} name="password">
		<Control>
			{#snippet children({ props })}
				<Label>Password</Label>
				<Input
					{...props}
					type="password"
					autocapitalize="off"
					autocomplete="off"
					autocorrect="off"
					bind:value={$formData.password}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors />
	</Field>

	<Form.Button class="mt-8 w-full">Login</Form.Button>
</form>
