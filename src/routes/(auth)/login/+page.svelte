<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
	<title>Sign in · Bookmarkd</title>
</svelte:head>

<h1 class="text-xl font-semibold">Sign in</h1>
<p class="mt-1 text-sm text-muted-foreground">Welcome back. Your bookmarks are waiting.</p>

<form method="post" class="mt-6 space-y-4" use:enhance>
	<input type="hidden" name="redirectTo" value={data.redirectTo} />
	<label class="block text-sm font-medium">
		Email
		<input
			type="email"
			name="email"
			required
			autocomplete="email"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>
	<label class="block text-sm font-medium">
		Password
		<input
			type="password"
			name="password"
			required
			autocomplete="current-password"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>
	{#if form?.message}
		<p class="text-sm text-destructive">{form.message}</p>
	{/if}
	<button
		type="submit"
		class="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90"
	>
		Sign in
	</button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	No account yet?
	<a href="/register" class="font-medium text-primary hover:underline">Create one</a>
</p>
