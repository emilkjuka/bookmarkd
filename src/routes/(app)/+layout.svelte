<script lang="ts">
	import AppShell from '#lib/components/AppShell.svelte';
	import FlashToaster from '#lib/components/FlashToaster.svelte';
	import type { LayoutServerData } from './$types';

	let { data, children }: { data: LayoutServerData; children: import('svelte').Snippet } = $props();
</script>

<FlashToaster flash={data.flash} />

<AppShell user={data.user} categories={data.categories} tags={data.tags}>
	{@render children()}
</AppShell>
