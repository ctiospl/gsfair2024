<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { SwitchCamera, Lightbulb, LightbulbOff } from 'lucide-svelte';
	import * as Sheet from '$lib/components/ui/sheet';
	import * as RadioGroup from '$lib/components/ui/radio-group';
	import { Label } from '$lib/components/ui/label';
	import { LoadingDialog } from '$lib/ui-item-states.svelte';

	type Props = {
		videoDevices: MediaDeviceInfo[];
		currentCamera: string;
		showCameraSelector: boolean;
		torchSupport: boolean;
		torchOn: boolean;
		onCameraChange: (label: string) => void;
		onTorchToggle: () => void;
	};

	let {
		videoDevices = [],
		currentCamera = '',
		showCameraSelector = $bindable(false),
		torchSupport = false,
		torchOn = $bindable(false),
		onCameraChange,
		onTorchToggle
	} = $props<Props>();

	async function onValueChange(value: string) {
		LoadingDialog.open = true;
		await onCameraChange(value);
		showCameraSelector = false;
		LoadingDialog.open = false;
	}

	const TorchIcon = $derived(torchOn ? Lightbulb : LightbulbOff);
</script>

<Button
	variant="ghost"
	class="absolute right-0 top-0 z-50 h-12 w-12 rounded-full bg-white p-2 [&_svg]:size-7"
	onclick={() => {
		showCameraSelector = true;
	}}
>
	<SwitchCamera />
</Button>

<Sheet.Root bind:open={showCameraSelector}>
	<Sheet.Content side="bottom">
		<Sheet.Header>
			<Sheet.Title>Select Camera</Sheet.Title>
			<Sheet.Description>Choose a camera for QR code scanning</Sheet.Description>
		</Sheet.Header>
		<RadioGroup.Root value={currentCamera} {onValueChange}>
			{#each videoDevices as device}
				<div class="flex items-center space-x-2">
					<RadioGroup.Item value={device.label} id={device.id} />
					<Label for={device.id}>{device.label}</Label>
				</div>
			{/each}
		</RadioGroup.Root>
	</Sheet.Content>
</Sheet.Root>

{#if torchSupport}
	<TorchIcon
		class="right-4-safe bottom-4-safe fixed z-20 h-14 w-14 rounded-full bg-black p-4 text-white [&_svg]:size-7 {torchOn
			? 'bg-yellow-600'
			: ''}"
		onclick={onTorchToggle}
	/>
{/if}
