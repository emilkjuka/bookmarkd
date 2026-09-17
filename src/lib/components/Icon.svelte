<script lang="ts">
	import '../../../node_modules/.iconify/generated.css';
	import type { IconName } from '$iconifyTypes';

	let { name, class: className }: { name: IconName; class?: string } = $props();
</script>

<span
	class={[
		'inline-block size-[1em] shrink-0 bg-current mask-(--svg) mask-size-[100%_100%] mask-no-repeat',
		`icon--${name}`,
		className
	]}
></span>
