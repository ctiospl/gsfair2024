<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import PasswordInput from '$lib/components/ui/password-input/password-input.svelte';
	import { Control, Field, FieldErrors, Label } from 'formsnap';

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
		<Control>
			{#snippet children({ props })}
				<Label>First Name</Label>
				<Input
					{...props}
					type="text"
					autocapitalize="on"
					autocomplete="on"
					autocorrect="off"
					bind:value={$formData.firstname}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="lastname">
		<Control>
			{#snippet children({ props })}
				<Label>Last Name</Label>
				<Input
					{...props}
					type="text"
					autocapitalize="on"
					autocomplete="on"
					autocorrect="off"
					bind:value={$formData.lastname}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="email">
		<Control>
			{#snippet children({ props })}
				<Label>Email</Label>
				<Input
					{...props}
					type="email"
					autocapitalize="off"
					autocomplete="off"
					autocorrect="off"
					bind:value={$formData.email}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
	<Field {form} name="phone">
		<Control>
			{#snippet children({ props })}
				<Label>Phone</Label>
				<Input
					{...props}
					type="tel"
					autocapitalize="off"
					autocomplete="on"
					autocorrect="off"
					bind:value={$formData.phone}
					onkeyup={(e) => {
						const target = e.target as HTMLInputElement;
						if (target?.value) {
							target.value = cleanPhoneNumber(target.value);
						}
					}}
				/>
			{/snippet}
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>
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
		<FieldErrors class="text-xs italic text-red-500" />
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
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>

	<Form.Button class="mt-8 w-full">Register</Form.Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/login" variant="outline" class="w-full">Login</Button>
</form>
