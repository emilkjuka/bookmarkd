<script lang="ts">
	import BookmarkBoard from '#lib/components/BookmarkBoard.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Bookmarks · Bookmarkd</title>
</svelte:head>

<BookmarkBoard
	bookmarks={data.bookmarks}
	pinnedBookmarks={data.pinnedBookmarks}
	categories={data.categories}
	tags={data.tags}
	heading="All bookmarks"
	query={data.q}
	message={form && 'message' in form ? form.message : undefined}
/>
