<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Minus, Plus } from 'lucide-svelte';

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		disabled = false,
		inputDisabled = true,
		height = 11,
		textSize = '2xl',
		onPlus = increment,
		onMinus = decrement,
		onValueChange = () => {},
		...restProps
	} = $props<{
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		disabled?: boolean;
		inputDisabled?: boolean;
		height?: number;
		textSize?: string;
		class?: string;
		onPlus?: (value: number) => void;
		onMinus?: (value: number) => void;
		onValueChange?: (value: number) => void;
	}>();

	$effect(() => {
		if (onValueChange) {
			onValueChange(value);
		}
	});

	function increment() {
		if (value + step <= max) {
			value = value + step;
			onPlus(value);
		}
	}

	function decrement() {
		if (value - step >= min) {
			value = value - step;
			onMinus(value);
		}
	}

	function handleInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const newValue = parseInt(input.value);

		if (isNaN(newValue)) {
			value = min;
			return;
		}

		if (newValue > max) {
			value = max;
		} else if (newValue < min) {
			value = min;
		} else {
			value = newValue;
		}
	}
</script>

<div class="relative flex items-center {restProps.class}">
	<Button
		class="h-{height} rounded-none rounded-s-lg "
		onclick={onMinus}
		disabled={disabled || value <= min}
	>
		<Minus class="h-4 w-4" />
	</Button>
	<Input
		type="number"
		{min}
		{max}
		{step}
		disabled={inputDisabled}
		{value}
		oninput={handleInput}
		class="h-{height} w-32 rounded-none text-center text-{textSize} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
	/>
	<Button
		onclick={onPlus}
		disabled={disabled || value >= max}
		class="h-{height} rounded-none rounded-e-lg "
	>
		<Plus class="h-4 w-4" />
	</Button>
</div>
