<script lang="ts">
	import * as Menubar from '$lib/components/ui/menubar/index.js';
	let {
		leftLink,
		title,
		rightLink
	}: { leftLink: () => any; title: string; rightLink?: () => any } = $props();
</script>

<Menubar.Root class="flex h-10 w-full justify-items-end">
	<div class="justify-start">
		{@render leftLink()}
	</div>
	<div class="grow text-center">{title}</div>
	{#if rightLink}
		<div class="justify-end">{@render rightLink()}</div>
	{/if}
</Menubar.Root>
