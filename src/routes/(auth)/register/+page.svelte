<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Create account · Bookmarkd</title>
</svelte:head>

<h1 class="text-xl font-semibold">Create account</h1>
<p class="mt-1 text-sm text-muted-foreground">Save links, organize them, find them later.</p>

<form method="post" class="mt-6 space-y-4" use:enhance>
	<label class="block text-sm font-medium">
		Name
		<input
			name="name"
			required
			autocomplete="name"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>
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
			minlength="8"
			autocomplete="new-password"
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
		Create account
	</button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	Already have an account?
	<a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
</p>
