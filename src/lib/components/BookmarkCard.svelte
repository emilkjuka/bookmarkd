<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '#lib/components/Icon.svelte';
	import { hostnameFromUrl } from '#lib/url';
	import type { Bookmark } from '#lib/types';

	let {
		bookmark,
		onedit
	}: {
		bookmark: Bookmark;
		onedit: (id: string) => void;
	} = $props();

	let faviconBroken = $state(false);
	let imageBroken = $state(false);
	let menuOpen = $state(false);
	let domain = $derived(hostnameFromUrl(bookmark.url));
	let createdLabel = $derived(
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		}).format(bookmark.createdAt)
	);
	let accentColor = $derived(bookmark.category?.color ?? '#5980e5');
	let heroStyle = $derived(
		bookmark.imageUrl && !imageBroken
			? undefined
			: `background: linear-gradient(135deg, color-mix(in oklab, ${accentColor} 55%, black) 0%, color-mix(in oklab, ${accentColor} 25%, black) 45%, var(--muted) 100%)`
	);

	const heroActionClass =
		'flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/90 backdrop-blur-sm hover:bg-black/70';
</script>

<article
	class="group flex w-full flex-col rounded-none border bg-card text-card-foreground transition hover:border-ring"
>
	<div class="relative">
	<div class="relative aspect-[5/3] overflow-hidden bg-muted" style={heroStyle}>
		{#if bookmark.imageUrl && !imageBroken}
			<img
				src={bookmark.imageUrl}
				alt=""
				class="absolute inset-0 h-full w-full object-cover"
				onerror={() => (imageBroken = true)}
			/>
			<div class="absolute inset-0 bg-black/20"></div>
		{/if}

		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-md border border-white/10 bg-black/45 text-lg font-semibold text-white backdrop-blur-sm"
			>
				{#if bookmark.faviconUrl && !faviconBroken}
					<img
						src={bookmark.faviconUrl}
						alt=""
						class="h-8 w-8 rounded-md"
						onerror={() => (faviconBroken = true)}
					/>
				{:else}
					{bookmark.title.slice(0, 1).toUpperCase()}
				{/if}
			</div>
		</div>

		{#if bookmark.pinned}
			<div
				class="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/90 backdrop-blur-sm"
				aria-label="Pinned"
			>
				<Icon name="lucide--pin" class="size-3" />
			</div>
		{/if}

		{#if bookmark.tags.length > 0}
			<div
				class="absolute right-2 bottom-2 flex items-center gap-1 rounded-none border border-white/10 bg-black/50 px-2 py-1 text-[10px] text-white/90 backdrop-blur-sm"
			>
				{#each bookmark.tags.slice(0, 3) as tag (tag.id)}
					<span>#{tag.name}</span>
				{/each}
				{#if bookmark.tags.length > 3}
					<span>+{bookmark.tags.length - 3}</span>
				{/if}
			</div>
		{/if}
	</div>

	<div class="absolute top-2 right-2 z-10 flex gap-1">
		<a
			href={bookmark.url}
			target="_blank"
			rel="noreferrer"
			class={heroActionClass}
			aria-label="Open link"
		>
			<Icon name="lucide--external-link" class="size-3.5" />
		</a>

		<div class="relative">
			<button
				type="button"
				class={heroActionClass}
				aria-label="More actions"
				aria-expanded={menuOpen}
				aria-haspopup="menu"
				onclick={() => (menuOpen = !menuOpen)}
			>
				<Icon name="lucide--ellipsis" class="size-3.5" />
			</button>
			{#if menuOpen}
				<button
					type="button"
					class="fixed inset-0 z-10 cursor-default"
					aria-label="Close menu"
					onclick={() => (menuOpen = false)}
				></button>
				<div
					role="menu"
					class="absolute right-0 z-20 mt-1 min-w-32 rounded-md border bg-popover py-1 text-popover-foreground shadow-lg"
				>
					<button
						type="button"
						role="menuitem"
						class="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
						onclick={() => {
							menuOpen = false;
							onedit(bookmark.id);
						}}
					>
						Edit
					</button>
					<form
						method="post"
						action="?/togglePin"
						use:enhance={() => {
							return async ({ update }) => {
								menuOpen = false;
								await update();
							};
						}}
					>
						<input type="hidden" name="id" value={bookmark.id} />
						<button
							type="submit"
							role="menuitem"
							class="block w-full px-3 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
						>
							{bookmark.pinned ? 'Unpin' : 'Pin'}
						</button>
					</form>
					<form
						method="post"
						action="?/delete"
						use:enhance={() => {
							return async ({ update }) => {
								menuOpen = false;
								await update({ invalidateAll: true });
							};
						}}
						onsubmit={(event) => {
							if (!confirm('Delete this bookmark?')) event.preventDefault();
						}}
					>
						<input type="hidden" name="id" value={bookmark.id} />
						<button
							type="submit"
							role="menuitem"
							class="block w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
						>
							Delete
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
	</div>

	<div class="flex flex-1 flex-col gap-2 p-3">
		<a
			href={bookmark.url}
			target="_blank"
			rel="noreferrer"
			class="line-clamp-2 text-sm leading-snug font-medium text-primary hover:underline"
		>
			{bookmark.title}
		</a>
		<div class="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
			<Icon name="lucide--link" class="size-3 shrink-0" />
			<span class="truncate">{domain}</span>
		</div>
	</div>

	<div
		class="flex items-center justify-between gap-3 border-t px-3 py-2 text-xs text-muted-foreground"
	>
		<div class="flex min-w-0 items-center gap-1.5">
			<Icon name="lucide--folder" class="size-3 shrink-0 text-primary" />
			{#if bookmark.category}
				<a href="/categories/{bookmark.category.slug}" class="truncate hover:text-primary">
					{bookmark.category.name}
				</a>
			{:else}
				<span class="truncate">Uncategorized</span>
			{/if}
		</div>
		<div class="flex shrink-0 items-center gap-1.5">
			<Icon name="lucide--calendar" class="size-3 shrink-0" />
			<time datetime={bookmark.createdAt.toISOString()}>{createdLabel}</time>
		</div>
	</div>
</article>
