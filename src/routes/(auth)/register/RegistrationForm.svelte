<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';

	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { authSchema } from '$lib/zod/schema.js';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	export let data: SuperValidated<Infer<typeof authSchema>>;
	const form = superForm(data, {
		validators: zodClient(authSchema),
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
	function cleanPhoneNumber(phoneNumber: string | number): string {
		const stringNumber = String(phoneNumber);

		// Remove country code, spaces, hyphens, and parentheses
		const cleaned = stringNumber.replace(/^(\+|00)\d{1,3}[-\s]?|\D/g, '');

		// Limit to maximum 10 digits
		return cleaned.slice(0, 10);
	}
	const { form: formData, enhance } = form;
</script>

<form method="POST" use:enhance>
	<Field {form} name="firstname">
		<Control let:attrs>
			<Label>First Name</Label>
			<Input
				{...attrs}
				type="text"
				autocapitalize="on"
				autocomplete="on"
				autocorrect="off"
				bind:value={$formData.firstname}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="lastname">
		<Control let:attrs>
			<Label>Last Name</Label>
			<Input
				{...attrs}
				type="text"
				autocapitalize="on"
				autocomplete="on"
				autocorrect="off"
				bind:value={$formData.lastname}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="email">
		<Control let:attrs>
			<Label>Email</Label>
			<Input
				{...attrs}
				type="email"
				autocapitalize="off"
				autocomplete="off"
				autocorrect="off"
				bind:value={$formData.email}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="phone">
		<Control let:attrs>
			<Label>Phone</Label>
			<Input
				{...attrs}
				type="tel"
				autocapitalize="off"
				autocomplete="on"
				autocorrect="off"
				bind:value={$formData.phone}
				onkeyup={(e) => {
					if (e?.target?.value) {
						e.target.value = cleanPhoneNumber(e.target.value);
					}
					// console.log('e.taget.value :>> ', e.taget.value);
					// // console.log('e.key :>> ', e.key);
					// if (e.key === ' ') {
					// 	e.preventDefault();
					// }
				}}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
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
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="password">
		<Control let:attrs>
			<Label>Password</Label>
			<Input {...attrs} autocapitalize="off" type="password" bind:value={$formData.password} />
		</Control>
		<!-- <Description>OMS Password.</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>

	<Form.Button class="mt-8 w-full">Register</Form.Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/login" variant="outline" class="w-full">Login</Button>
</form>
