<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import PasswordInput from '$lib/components/ui/password-input/password-input.svelte';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';

	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { newPasswordSchema } from '$lib/zod/schema.js';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	export let data: SuperValidated<Infer<typeof newPasswordSchema>>;
	const form = superForm(data, {
		validators: zodClient(newPasswordSchema),
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
	<Field {form} name="password">
		<Control let:attrs>
			<Label>Password</Label>
			<PasswordInput
				{...attrs}
				autocapitalize="off"
				type="password"
				bind:value={$formData.password}
			/>
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="confirmPassword">
		<Control let:attrs>
			<Label>Confirm Password</Label>
			<PasswordInput
				{...attrs}
				autocapitalize="off"
				type="password"
				bind:value={$formData.confirmPassword}
			/>
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>

	<Form.Button class="mt-8 w-full">Save</Form.Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/login" variant="outline" class="w-full">Login</Button>
</form>
