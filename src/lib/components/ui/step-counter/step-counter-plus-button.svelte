<script lang="ts">
	import { Button, buttonVariants, type ButtonProps } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		children,
		...restProps
	}: ButtonProps = $props();
</script>

<Button
	bind:ref
	class={cn(
		buttonVariants(),
		'h-11 rounded-e-lg border border-gray-300 bg-gray-100 p-3 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700',
		className
	)}
	{variant}
	{size}
	{href}
	{type}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<svg
			class="h-3 w-3 text-gray-900 dark:text-white"
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 18 18"
		>
			<path
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9 1v16M1 9h16"
			/>
		</svg>
	{/if}
</Button>
