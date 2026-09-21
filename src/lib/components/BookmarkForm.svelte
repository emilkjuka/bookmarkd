<script lang="ts">
	import { enhance } from '$app/forms';
	import { urlMatchesAnyPattern } from '#lib/url-patterns';
	import type { Bookmark, Category, PageMetadata, Tag } from '#lib/types';

	let {
		categories,
		tags,
		bookmark = null,
		preview = $bindable(null),
		oncancel,
		message = $bindable(undefined),
		variant = 'card',
		createAction = '?/create',
		prefillAction = '?/prefill',
		updateAction = '?/update'
	}: {
		categories: Category[];
		tags: Tag[];
		bookmark?: Bookmark | null;
		preview?: PageMetadata | null;
		oncancel?: () => void;
		message?: string | undefined;
		variant?: 'card' | 'plain';
		createAction?: string;
		prefillAction?: string;
		updateAction?: string;
	} = $props();

	let urlInput = $state('');
	let selectedTagIds = $derived(new Set(bookmark?.tags.map((tag) => tag.id) ?? []));
	let action = $derived(bookmark ? updateAction : createAction);
	let title = $derived(preview?.title ?? bookmark?.title ?? '');
	let description = $derived(preview?.description ?? bookmark?.description ?? '');
	let suggestedCategoryId = $derived.by(() => {
		const matchUrl = preview?.url ?? urlInput;
		if (!matchUrl) return null;
		for (const category of categories) {
			if (
				category.urlPatterns.length > 0 &&
				urlMatchesAnyPattern(matchUrl, category.urlPatterns)
			) {
				return category.id;
			}
		}
		return null;
	});

	$effect(() => {
		if (bookmark) urlInput = bookmark.url;
		else if (preview?.url) urlInput = preview.url;
	});
</script>

<form
	method="post"
	{action}
	class={variant === 'card'
		? 'space-y-4 rounded-md border bg-card p-4 text-card-foreground shadow-sm'
		: 'space-y-4'}
	use:enhance={() => {
		return async ({ result, update }) => {
			const intent =
				result.type === 'success' && result.data && 'intent' in result.data
					? result.data.intent
					: result.type === 'failure' && result.data && 'intent' in result.data
						? result.data.intent
						: null;

			if (result.type === 'success' && result.data && 'preview' in result.data) {
				preview = result.data.preview as PageMetadata;
			}
			if (result.type === 'failure' && result.data && 'message' in result.data) {
				message = result.data.message as string;
			} else if (result.type === 'success') {
				message = undefined;
			}

			await update({
				reset: false,
				invalidateAll: intent === 'create' || intent === 'update' || intent === 'delete'
			});

			if (result.type === 'success' && oncancel && (intent === 'create' || intent === 'update')) {
				preview = null;
				oncancel();
			}
		};
	}}
>
	{#if bookmark}
		<input type="hidden" name="id" value={bookmark.id} />
	{/if}

	<div class="flex flex-col gap-2 sm:flex-row">
		<input
			type="url"
			name="url"
			required
			placeholder="https://example.com"
			bind:value={urlInput}
			class="field flex-1"
		/>
		<button type="submit" formaction={prefillAction} class="btn btn-secondary w-full sm:w-auto">
			Prefill form
		</button>
	</div>

	<label class="block text-sm font-medium">
		Title
		<input
			name="title"
			value={title}
			class="field mt-1"
		/>
	</label>

	<fieldset class="space-y-3">
		<legend class="text-sm font-medium">Category</legend>
		<label class="block text-sm">
			<span class="text-muted-foreground">Existing</span>
			<select
				name="categoryId"
				class="field mt-1"
			>
				<option value="">Uncategorized</option>
				{#each categories as category (category.id)}
					<option
						value={category.id}
						selected={bookmark
							? bookmark.categoryId === category.id
							: category.id === suggestedCategoryId}
					>
						{category.name}
					</option>
				{/each}
			</select>
		</label>
		<label class="block text-sm">
			<span class="text-muted-foreground">New category</span>
			<input
				name="newCategory"
				maxlength="50"
				placeholder="e.g. Reading list"
				class="field mt-1"
			/>
			<span class="mt-1 block text-xs text-muted-foreground"
				>Creates a category if it does not exist. Takes priority over the selection above.</span
			>
		</label>
	</fieldset>

	<label class="block text-sm font-medium">
		Description
		<textarea
			name="description"
			rows="2"
			value={description}
			class="field mt-1"
		></textarea>
	</label>

	<label class="block text-sm font-medium">
		Notes
		<textarea
			name="notes"
			rows="2"
			value={bookmark?.notes ?? ''}
			placeholder="Why you saved this…"
			class="field mt-1"
		></textarea>
	</label>

	<fieldset class="space-y-3">
		<legend class="text-sm font-medium">Tags</legend>
		{#if tags.length > 0}
			<div class="flex flex-wrap gap-2">
				{#each tags as tag (tag.id)}
					<label
						class="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs has-[:checked]:border-primary/60 has-[:checked]:bg-primary/15 has-[:checked]:text-primary"
					>
						<input
							type="checkbox"
							name="tagIds"
							value={tag.id}
							checked={selectedTagIds.has(tag.id)}
							class="sr-only"
						/>
						#{tag.name}
					</label>
				{/each}
			</div>
		{/if}
		<label class="block text-sm">
			<span class="text-muted-foreground">New tags</span>
			<input
				name="newTags"
				placeholder="research, later, inspirations"
				class="field mt-1"
			/>
			<span class="mt-1 block text-xs text-muted-foreground"
				>Comma-separated. New tags are created automatically.</span
			>
		</label>
	</fieldset>

	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}

	<div class="form-actions">
		<button type="submit" class="btn btn-primary">
			{bookmark ? 'Save changes' : 'Save bookmark'}
		</button>
	</div>
</form>
