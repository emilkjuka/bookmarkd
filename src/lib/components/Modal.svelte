<script lang="ts">
	import DrawerDialog from './DrawerDialog.svelte';
	import type { Snippet } from 'svelte';

	let {
		visible = false,
		title,
		onclose,
		children
	}: {
		visible?: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
	} = $props();
</script>

<DrawerDialog {visible} {title} {onclose}>
	{@render children()}
</DrawerDialog>
