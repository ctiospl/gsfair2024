<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';

	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { loginSchema } from '$lib/zod/schema.js';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

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
		<Control let:attrs>
			<Label>Username</Label>
			<Input
				{...attrs}
				type="text"
				autocapitalize="off"
				autocomplete="off"
				autocorrect="off"
				bind:value={$formData.username}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors />
	</Field>
	<Field {form} name="password">
		<Control let:attrs>
			<Label>Password</Label>
			<Input {...attrs} autocapitalize="off" type="password" bind:value={$formData.password} />
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors />
	</Field>

	<Form.Button class="mt-8 w-full">Login</Form.Button>
</form>
