<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { cn } from '$lib/utils.js';
	let {
		open = $bindable(false),
		title,
		description,
		onConfirm,
		onCancel,
		confirmButtonText = 'Confirm',
		cancelButtonText = 'Cancel',
		class: className,
		...restProps
	} = $props<{
		open: boolean;
		title: string;
		description: string;
		confirmButtonText?: string;
		cancelButtonText?: string;
		onConfirm?: () => void;
		onCancel?: () => void;
		class?: string;
	}>();
</script>

<AlertDialog.Root bind:open>
	<AlertDialog.Content class={cn('!z-50', className)}>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>
				{@html description}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer class="flex flex-row justify-around gap-4">
			<AlertDialog.Cancel class="!mt-0" onclick={onCancel}>{cancelButtonText}</AlertDialog.Cancel>
			<AlertDialog.Action onclick={onConfirm}>{confirmButtonText}</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
