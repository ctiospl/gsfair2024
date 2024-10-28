<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { SwitchCamera } from 'lucide-svelte';
	import type { CameraDevice } from 'html5-qrcode';

	interface CameraSelectorProps {
		devices: CameraDevice[];
		currentCamera: string;
		onCameraChange: (cameraId: string) => Promise<void>;
	}

	let { devices, currentCamera = $bindable(), onCameraChange } = $props<CameraSelectorProps>();
	let showCameraSelector = $state(false);

	async function handleCameraChange(label: string) {
		const selectedDevice = devices.find((device) => device.label === label);
		if (selectedDevice) {
			await onCameraChange(selectedDevice.id);
			showCameraSelector = false;
		}
	}
</script>

<div class="absolute right-0 top-0 z-50 h-10 translate-x-[-50%]">
	<Sheet.Root bind:open={showCameraSelector}>
		<Sheet.Trigger asChild let:builder>
			<Button builders={[builder]} class="rounded-full bg-white p-2" variant="outline">
				<SwitchCamera />
			</Button>
		</Sheet.Trigger>
		<Sheet.Content side="bottom">
			<Sheet.Header>
				<Sheet.Title>Select Camera</Sheet.Title>
				<Sheet.Description>Choose a camera for QR code scanning</Sheet.Description>
			</Sheet.Header>
			<RadioGroup.Root value={currentCamera} onValueChange={handleCameraChange}>
				{#each devices as device}
					<div class="flex items-center space-x-2">
						<RadioGroup.Item value={device.label} id={device.id} />
						<Label for={device.id}>{device.label}</Label>
					</div>
				{/each}
			</RadioGroup.Root>
		</Sheet.Content>
	</Sheet.Root>
</div>
