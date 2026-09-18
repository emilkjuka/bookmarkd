<script lang="ts">
	import '#iconify';
	import type { IconName } from '#iconify-types';

	let { name, class: className }: { name: IconName; class?: string } = $props();
</script>

<span
	class={[
		'inline-block size-[1em] shrink-0 bg-current mask-(--svg) mask-size-[100%_100%] mask-no-repeat',
		`icon--${name}`,
		className
	]}
></span>
