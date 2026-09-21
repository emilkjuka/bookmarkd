<script lang="ts">
	import { page } from '$app/state';
	import { setAddBookmarkContext } from '#lib/add-bookmark.svelte';
	import AddBookmarkModal from './AddBookmarkModal.svelte';
	import AddCategoryModal from './AddCategoryModal.svelte';
	import AddTagModal from './AddTagModal.svelte';
	import Icon from './Icon.svelte';
	import SearchBar from './SearchBar.svelte';
	import type { Category, Tag } from '#lib/types';

	let {
		user,
		categories,
		tags,
		children
	}: {
		user: { name: string; email: string };
		categories: Category[];
		tags: Tag[];
		children: import('svelte').Snippet;
	} = $props();

	let sidebarOpen = $state(false);
	let addOpen = $state(false);
	let categoryOpen = $state(false);
	let tagOpen = $state(false);
	let pathname = $derived(page.url.pathname);
	let query = $derived(page.url.searchParams.get('q') ?? '');

	setAddBookmarkContext({
		open: () => {
			addOpen = true;
		}
	});

	function closeSidebar() {
		sidebarOpen = false;
	}

	function closeAddModal() {
		addOpen = false;
	}

	function closeCategoryModal() {
		categoryOpen = false;
	}

	function closeTagModal() {
		tagOpen = false;
	}

	function navClass(active: boolean) {
		return [
			'flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition',
			active
				? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
				: 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
		];
	}
</script>

<div class="min-h-screen bg-background text-foreground">
	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-30 bg-black/60 md:hidden"
			aria-label="Close sidebar"
			onclick={() => (sidebarOpen = false)}
		></button>
	{/if}

	<aside
		class={[
			'fixed inset-y-0 left-0 z-40 flex w-[min(100vw,16rem)] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform sm:w-64 md:translate-x-0',
			sidebarOpen ? 'translate-x-0' : '-translate-x-full'
		]}
	>
		<div class="flex items-center gap-2 px-4 py-5">
			<span
				class="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
			>
				<Icon name="lucide--book-bookmark" class="size-5" />
			</span>
			<span class="text-lg font-semibold tracking-tight">Bookmarkd</span>
		</div>

		<div class="px-3 pb-4">
			<SearchBar {query} />
		</div>

		<nav class="flex-1 space-y-6 overflow-y-auto px-3 pb-4">
			<div>
				<a href="/bookmarks" class={navClass(pathname === '/bookmarks')} onclick={closeSidebar}
					>All bookmarks</a
				>
			</div>

			<div>
				<div class="flex items-center justify-between px-3 pb-1">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
						Categories
					</p>
					<button
						type="button"
						class="btn-icon-ghost text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						aria-label="Add category"
						onclick={() => (categoryOpen = true)}
					>
						<Icon name="lucide--plus" class="size-4" />
					</button>
				</div>
				{#each categories as category (category.id)}
					<a
						href="/categories/{category.slug}"
						class={navClass(pathname === `/categories/${category.slug}`)}
						onclick={closeSidebar}
					>
						<span
							class="h-2 w-2 shrink-0 rounded-full"
							style:background-color={category.color ?? '#a8a29e'}
						></span>
						<span class="truncate">{category.name}</span>
					</a>
				{/each}
			</div>

			<div>
				<div class="flex items-center justify-between px-3 pb-1">
					<p class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tags</p>
					<button
						type="button"
						class="btn-icon-ghost text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
						aria-label="Add tag"
						onclick={() => (tagOpen = true)}
					>
						<Icon name="lucide--plus" class="size-4" />
					</button>
				</div>
				{#each tags as tag (tag.id)}
					<a
						href="/tags/{tag.slug}"
						class={navClass(pathname === `/tags/${tag.slug}`)}
						onclick={closeSidebar}
					>
						<span class="text-muted-foreground">#</span>
						<span class="truncate">{tag.name}</span>
					</a>
				{/each}
			</div>
		</nav>

		<div class="border-t border-sidebar-border p-3">
			<a href="/settings" class={navClass(pathname === '/settings')} onclick={closeSidebar}
				>Settings</a
			>
			<p class="mt-2 truncate px-3 text-xs font-medium">{user.name}</p>
			<p class="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
		</div>
	</aside>

	<div class="min-h-screen md:pl-64">
		<header
			class="mobile-header sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-sm md:hidden"
		>
			<button
				type="button"
				class="btn-icon shrink-0"
				aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
				aria-expanded={sidebarOpen}
				onclick={() => (sidebarOpen = !sidebarOpen)}
			>
				<Icon name={sidebarOpen ? 'lucide--x' : 'lucide--menu'} class="size-5" />
			</button>
			<a href="/bookmarks" class="flex min-w-0 items-center gap-2">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					<Icon name="lucide--book-bookmark" class="size-4.5" />
				</span>
				<span class="truncate text-base font-semibold tracking-tight">Bookmarkd</span>
			</a>
		</header>

		<main class="main-offset-bottom w-full px-3 pt-4 sm:px-4 md:px-6 md:pt-6">
			{@render children()}
		</main>
	</div>

	<button
		type="button"
		class="safe-bottom fixed right-4 z-30 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition hover:bg-primary/90 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none md:right-6"
		aria-label="Add bookmark"
		onclick={() => (addOpen = true)}
	>
		<Icon name="lucide--plus" class="size-6" />
	</button>

	<AddBookmarkModal bind:visible={addOpen} {categories} {tags} onclose={closeAddModal} />
	<AddCategoryModal bind:visible={categoryOpen} onclose={closeCategoryModal} />
	<AddTagModal bind:visible={tagOpen} onclose={closeTagModal} />
</div>
