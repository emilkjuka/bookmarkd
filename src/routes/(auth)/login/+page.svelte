<script lang="ts">
	import { goto } from '$app/navigation';
	import { signIn } from '#lib/auth-client';
	import { safeRedirectPath } from '#lib/auth/redirect';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let email = $state('');
	let password = $state('');
	let message = $state('');
	let loading = $state(false);

	const submit = async (e: SubmitEvent) => {
		e.preventDefault();
		loading = true;
		message = '';
		const res = await signIn.email({ email, password });
		loading = false;
		if (res.error) {
			message = res.error.message ?? 'Could not sign in';
		} else {
			await goto(safeRedirectPath(data.redirectTo), { invalidateAll: true });
		}
	};
</script>

<svelte:head>
	<title>Sign in · Bookmarkd</title>
</svelte:head>

<h1 class="text-xl font-semibold">Sign in</h1>
<p class="mt-1 text-sm text-muted-foreground">Welcome back. Your bookmarks are waiting.</p>

<form onsubmit={submit} class="mt-6 space-y-4">
	<label class="block text-sm font-medium">
		Email
		<input
			type="email"
			bind:value={email}
			required
			autocomplete="email"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>
	<label class="block text-sm font-medium">
		Password
		<input
			type="password"
			bind:value={password}
			required
			autocomplete="current-password"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>
	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}
	<button
		type="submit"
		disabled={loading}
		class="w-full rounded-md bg-primary px-4 py-2.5 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
	>
		{loading ? 'Signing in…' : 'Sign in'}
	</button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	No account yet?
	<a href="/register" class="font-medium text-primary hover:underline">Create one</a>
</p>
