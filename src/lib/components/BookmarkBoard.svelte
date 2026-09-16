<script lang="ts">
	import BookmarkCard from './BookmarkCard.svelte';
	import EditBookmarkDrawer from './EditBookmarkDrawer.svelte';
	import type { Bookmark, Category, Tag } from '#lib/types';

	let {
		bookmarks,
		pinnedBookmarks = [],
		categories,
		tags,
		heading,
		query = '',
		message
	}: {
		bookmarks: Bookmark[];
		pinnedBookmarks?: Bookmark[];
		categories: Category[];
		tags: Tag[];
		heading: string;
		query?: string;
		message?: string;
	} = $props();

	let editingId = $state<string | null>(null);
	let editingBookmark = $derived(
		pinnedBookmarks.find((item) => item.id === editingId) ??
			bookmarks.find((item) => item.id === editingId) ??
			null
	);

	function openEdit(id: string) {
		editingId = id;
	}
</script>

{#snippet bookmarkGrid(items: Bookmark[])}
	<div class="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(min(100%,18rem),20rem))]">
		{#each items as bookmark (bookmark.id)}
			<BookmarkCard {bookmark} onedit={openEdit} />
		{/each}
	</div>
{/snippet}

{#if pinnedBookmarks.length > 0}
	<section class="mb-10">
		<div class="mb-6">
			<h2 class="text-2xl font-semibold tracking-tight">Pinned</h2>
			<p class="text-sm text-muted-foreground">
				{pinnedBookmarks.length}
				{pinnedBookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
				{#if query}
					matching “{query}”
				{/if}
			</p>
		</div>
		{@render bookmarkGrid(pinnedBookmarks)}
	</section>
{/if}

<section>
	<div class="mb-6">
		<h1 class="text-2xl font-semibold tracking-tight">{heading}</h1>
		<p class="text-sm text-muted-foreground">
			{bookmarks.length}
			{bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
			{#if query}
				matching “{query}”
			{/if}
		</p>
	</div>

	{#if bookmarks.length > 0}
		{@render bookmarkGrid(bookmarks)}
	{/if}
</section>

<EditBookmarkDrawer
	bookmark={editingBookmark}
	{categories}
	{tags}
	{message}
	onclose={() => (editingId = null)}
/>
