<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Control, Description, Field, FieldErrors, Label } from 'formsnap';

	import { LoadingDialog } from '$lib/ui-item-states.svelte';
	import { resetAuthSchema } from '$lib/zod/schema.js';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import { Button } from '$lib/components/ui/button';
	import Separator from '$lib/components/ui/separator/separator.svelte';

	export let data: SuperValidated<Infer<typeof resetAuthSchema>>;
	const form = superForm(data, {
		validators: zodClient(resetAuthSchema),
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
	<Field {form} name="phone">
		<Control let:attrs>
			<Label>Phone Number ( without country code )</Label>
			<Input
				{...attrs}
				type="tel"
				autocapitalize="off"
				autocomplete="on"
				autocorrect="off"
				bind:value={$formData.phone}
				placeholder="e.g. 9823456789"
				onkeyup={(e) => {
					if (e?.target?.value) {
						e.target.value = cleanPhoneNumber(e.target.value);
					}
				}}
			/>
		</Control>
		<!-- <Description>OMS Username</Description> -->
		<FieldErrors class="text-xs italic text-red-500" />
	</Field>

	<Form.Button class="mt-8 w-full">Email me the new password</Form.Button>
	<Separator class="mx-auto my-4 w-[90%]" />
	<Button href="/login" variant="outline" class="w-full">Login</Button>
</form>
