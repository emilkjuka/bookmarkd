<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';

	let { query = '' }: { query?: string } = $props();
	let value = $derived(query);
	let timer: ReturnType<typeof setTimeout> | undefined;

	function search(next: string) {
		const trimmed = next.trim();
		const current = page.url.searchParams.get('q') ?? '';
		if (trimmed === current) return;
		const href = trimmed
			? `${page.url.pathname}?q=${encodeURIComponent(trimmed)}`
			: page.url.pathname;
		goto(href, { replace: true, reset: false });
	}

	function oninput(event: Event) {
		const next = (event.currentTarget as HTMLInputElement).value;
		value = next;
		clearTimeout(timer);
		timer = setTimeout(() => search(next), 300);
	}

	function onkeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			clearTimeout(timer);
			search(value);
		}
	}
</script>

<label class="relative block">
	<span class="sr-only">Search bookmarks</span>
	<Icon
		name="lucide--search"
		class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
	/>
	<input
		type="search"
		placeholder="Search title, URL, notes…"
		class="w-full rounded-md border border-input bg-card py-2 pr-3 pl-9 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		{value}
		{oninput}
		{onkeydown}
	/>
</label>
