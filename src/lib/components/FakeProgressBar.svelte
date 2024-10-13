<script>
	import { tweened } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { navigating } from '$app/stores';
	import { Progress } from '$lib/components/ui/progress';

	const p = tweened(0, {
		duration: 200,
		easing: cubicOut
	});

	let isVisible = $state(false);

	function increase() {
		if ($p >= 0 && $p < 0.2) {
			p.update((_) => _ + 0.04);
		} else if ($p >= 0.2 && $p < 0.5) {
			p.update((_) => _ + 0.02);
		} else if ($p >= 0.5 && $p < 0.8) {
			p.update((_) => _ + 0.002);
		} else if ($p >= 0.8 && $p < 0.99) {
			p.update((_) => _ + 0.0005);
		} else {
			p.set(0);
		}

		if ($navigating) {
			const rand = Math.round(Math.random() * (300 - 50)) + 50;
			setTimeout(() => {
				increase();
			}, rand);
		}
	}

	$effect(() => {
		if ($navigating) {
			increase();
			isVisible = true;
		}
		if (!$navigating) {
			p.update((_) => _ + 0.3);
			setTimeout(() => {
				p.set(1);
				setTimeout(() => {
					isVisible = false;
					p.set(0);
				}, 100);
			}, 100);
		}
	});
</script>

{#if $p > 0 && $p < 1 && isVisible}
	<Progress class="fixed top-0 z-50 h-1 w-full rounded-none" value={$p * 100} max={100} />
{/if}
