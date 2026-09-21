<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORY_COLORS } from '#lib/colors';
	import type { Category } from '#lib/types';

	let { categories, message }: { categories: Category[]; message?: string } = $props();
	let editingId = $state<string | null>(null);
</script>

<section class="rounded-md border bg-card p-5 text-card-foreground shadow-sm">
	<h2 class="text-lg font-semibold">Categories</h2>
	<p class="mt-1 text-sm text-muted-foreground">
		Edit names, colors, and URL auto-assign rules. Create categories from the sidebar.
	</p>

	{#if message}
		<p class="mt-3 text-sm text-destructive">{message}</p>
	{/if}

	<ul class="mt-4 divide-y divide-border">
		{#each categories as category (category.id)}
			<li class="py-3">
				{#if editingId === category.id}
					<form
						method="post"
						action="?/updateCategory"
						class="space-y-3"
						use:enhance={() => {
							return async ({ update }) => {
								await update();
								editingId = null;
							};
						}}
					>
						<input type="hidden" name="id" value={category.id} />
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
							<input
								name="name"
								required
								value={category.name}
								class="field min-w-0 flex-1 !py-2"
							/>
							<div class="flex items-center gap-1">
								{#each CATEGORY_COLORS as color (color)}
									<label class="cursor-pointer">
										<input
											type="radio"
											name="color"
											value={color}
											checked={category.color === color ||
												(!category.color && color === CATEGORY_COLORS[0])}
											class="peer sr-only"
										/>
										<span
											class="block h-5 w-5 rounded-full ring-offset-2 ring-offset-card peer-checked:ring-2 peer-checked:ring-foreground"
											style:background-color={color}
										></span>
									</label>
								{/each}
							</div>
						</div>
						<label class="block text-sm">
							<span class="font-medium">Rules</span>
							<textarea
								name="urlPatterns"
								rows="2"
								placeholder="reddit.com"
								class="field mt-1"
								>{category.urlPatterns.join('\n')}</textarea
							>
						</label>
						<div class="form-actions !flex-row">
							<button type="submit" class="btn btn-primary">Save</button>
							<button type="button" class="btn btn-ghost" onclick={() => (editingId = null)}
								>Cancel</button
							>
						</div>
					</form>
				{:else}
					<div class="list-row">
						<span
							class="h-2.5 w-2.5 shrink-0 rounded-full"
							style:background-color={category.color ?? '#a1a1aa'}
						></span>
						<div class="min-w-0 flex-1">
							<a href="/categories/{category.slug}" class="font-medium hover:text-primary"
								>{category.name}</a
							>
							{#if category.urlPatterns.length > 0}
								<p class="mt-0.5 truncate text-xs text-muted-foreground">
									{category.urlPatterns.join(', ')}
								</p>
							{/if}
						</div>
						<div class="list-row-actions">
							<button
								type="button"
								class="btn btn-ghost"
								onclick={() => (editingId = category.id)}>Edit</button
							>
							<form
								method="post"
								action="?/deleteCategory"
								use:enhance
								onsubmit={(event) => {
									if (!confirm('Delete this category? Bookmarks stay, uncategorized.')) {
										event.preventDefault();
									}
								}}
							>
								<input type="hidden" name="id" value={category.id} />
								<button type="submit" class="btn btn-ghost btn-destructive">Delete</button>
							</form>
						</div>
					</div>
				{/if}
			</li>
		{:else}
			<li class="py-4 text-sm text-muted-foreground">No categories yet.</li>
		{/each}
	</ul>
</section>
