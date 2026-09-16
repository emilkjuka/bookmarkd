<script lang="ts">
	import AppShell from '#lib/components/AppShell.svelte';
	import type { LayoutServerData } from './$types';

	let { data, children }: { data: LayoutServerData; children: import('svelte').Snippet } = $props();
</script>

<AppShell user={data.user} categories={data.categories} tags={data.tags}>
	{@render children()}
</AppShell>
