<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import PasswordInput from '$lib/components/ui/password-input/password-input.svelte';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';

	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { loginSchema } from '$lib/zod/schema.js';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	export let data: SuperValidated<Infer<typeof loginSchema>>;
	const form = superForm(data, {
		validators: zodClient(loginSchema),
		resetForm: false,
		onSubmit: () => {
			LoadingDialog.open = true;

			// do something
		},
		onResult(event) {
			LoadingDialog.open = false;
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
					bind:value={$formData.username}
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
				<PasswordInput
					{...props}
					autocapitalize="off"
					type="password"
					bind:value={$formData.password}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors />
	</Field>

	<Form.Button class="mt-8 w-full">Login</Form.Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/register" variant="outline" class="w-full">Register</Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/reset-password" variant="ghost" class="w-full">Forgot Username or Password</Button>
</form>
