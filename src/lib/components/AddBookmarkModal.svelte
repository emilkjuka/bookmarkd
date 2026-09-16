<script lang="ts">
	import Modal from './Modal.svelte';
	import BookmarkForm from './BookmarkForm.svelte';
	import type { Category, PageMetadata, Tag } from '#lib/types';

	let {
		visible = $bindable(false),
		categories,
		tags,
		onclose
	}: {
		visible?: boolean;
		categories: Category[];
		tags: Tag[];
		onclose: () => void;
	} = $props();

	let preview = $state<PageMetadata | null>(null);
	let message = $state<string | undefined>(undefined);

	function handleClose() {
		preview = null;
		message = undefined;
		onclose();
	}
</script>

<Modal {visible} title="Add bookmark" onclose={handleClose}>
	{#if visible}
		<BookmarkForm
			{categories}
			{tags}
			bind:preview
			bind:message
			variant="plain"
			createAction="?/createBookmark"
			prefillAction="?/prefill"
			oncancel={handleClose}
		/>
	{/if}
</Modal>
