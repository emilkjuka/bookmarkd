<script lang="ts">
	import BookmarkBoard from '#lib/components/BookmarkBoard.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>{data.category.name} · Bookmarkd</title>
</svelte:head>

<BookmarkBoard
	bookmarks={data.bookmarks}
	categories={data.categories}
	tags={data.tags}
	heading={data.category.name}
	query={data.q}
	message={form && 'message' in form ? form.message : undefined}
/>
