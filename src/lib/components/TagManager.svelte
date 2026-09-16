<script lang="ts">
	import { enhance } from '$app/forms';
	import type { Tag } from '#lib/types';

	let { tags, message }: { tags: Tag[]; message?: string } = $props();
	let editingId = $state<string | null>(null);
</script>

<section class="rounded-md border bg-card p-5 text-card-foreground shadow-sm">
	<h2 class="text-lg font-semibold">Tags</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Rename or remove tags. Create tags from the sidebar.
	</p>

	{#if message}
		<p class="mt-3 text-sm text-destructive">{message}</p>
	{/if}

	<ul class="mt-4 divide-y divide-border">
		{#each tags as tag (tag.id)}
			<li class="py-3">
				{#if editingId === tag.id}
					<form
						method="post"
						action="?/updateTag"
						class="flex flex-col gap-3 sm:flex-row sm:items-center"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								editingId = null;
							};
						}}
					>
						<input type="hidden" name="id" value={tag.id} />
						<input
							name="name"
							required
							value={tag.name}
							class="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
						/>
						<div class="flex items-center gap-3">
							<button type="submit" class="text-sm font-medium text-primary">Save</button>
							<button
								type="button"
								class="text-sm text-muted-foreground hover:text-foreground"
								onclick={() => (editingId = null)}>Cancel</button
							>
						</div>
					</form>
				{:else}
					<div class="flex items-center gap-3">
						<span class="w-2.5 shrink-0 text-center text-sm text-muted-foreground">#</span>
						<a href="/tags/{tag.slug}" class="min-w-0 flex-1 font-medium hover:text-primary"
							>{tag.name}</a
						>
						<div class="flex shrink-0 items-center gap-3">
							<button
								type="button"
								class="text-sm text-muted-foreground hover:text-foreground"
								onclick={() => (editingId = tag.id)}>Rename</button
							>
							<form
								method="post"
								action="?/deleteTag"
								use:enhance
								onsubmit={(event) => {
									if (!confirm('Delete this tag? It will be removed from all bookmarks.')) {
										event.preventDefault();
									}
								}}
							>
								<input type="hidden" name="id" value={tag.id} />
								<button
									type="submit"
									class="text-sm text-muted-foreground hover:text-destructive">Delete</button
								>
							</form>
						</div>
					</div>
				{/if}
			</li>
		{:else}
			<li class="py-4 text-sm text-muted-foreground">No tags yet.</li>
		{/each}
	</ul>
</section>
