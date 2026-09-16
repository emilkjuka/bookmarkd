<script lang="ts">
	import DrawerDialog from './DrawerDialog.svelte';
	import BookmarkForm from './BookmarkForm.svelte';
	import type { Bookmark, Category, Tag } from '#lib/types';

	let {
		bookmark = null,
		categories,
		tags,
		message,
		onclose
	}: {
		bookmark?: Bookmark | null;
		categories: Category[];
		tags: Tag[];
		message?: string;
		onclose: () => void;
	} = $props();
</script>

<DrawerDialog visible={bookmark !== null} title="Edit bookmark" onclose={onclose}>
	{#if bookmark}
		<BookmarkForm
			{categories}
			{tags}
			{bookmark}
			{message}
			variant="plain"
			oncancel={onclose}
		/>
	{/if}
</DrawerDialog>
