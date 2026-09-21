<script lang="ts">
	import { goto } from '$app/navigation';
	import { signUp } from '#lib/auth-client';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let message = $state('');
	let loading = $state(false);

	const submit = async (e: SubmitEvent) => {
		e.preventDefault();
		if (password.length < 8) {
			message = 'Password must be at least 8 characters';
			return;
		}
		loading = true;
		message = '';
		const res = await signUp.email({ name, email, password });
		loading = false;
		if (res.error) {
			message = res.error.message ?? 'Could not create account';
		} else {
			await goto('/bookmarks', { invalidateAll: true });
		}
	};
</script>

<svelte:head>
	<title>Create account · Bookmarkd</title>
</svelte:head>

<h1 class="text-xl font-semibold">Create account</h1>
<p class="mt-1 text-sm text-muted-foreground">Save links, organize them, find them later.</p>

<form onsubmit={submit} class="mt-6 space-y-4">
	<label class="block text-sm font-medium">
		Name
		<input
			bind:value={name}
			required
			autocomplete="name"
			class="field mt-1"
		/>
	</label>
	<label class="block text-sm font-medium">
		Email
		<input
			type="email"
			bind:value={email}
			required
			autocomplete="email"
			class="field mt-1"
		/>
	</label>
	<label class="block text-sm font-medium">
		Password
		<input
			type="password"
			bind:value={password}
			required
			minlength="8"
			autocomplete="new-password"
			class="field mt-1"
		/>
	</label>
	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}
	<button
		type="submit"
		disabled={loading}
		class="btn btn-primary w-full"
	>
		{loading ? 'Creating account…' : 'Create account'}
	</button>
</form>

<p class="mt-6 text-center text-sm text-muted-foreground">
	Already have an account?
	<a href="/login" class="font-medium text-primary hover:underline">Sign in</a>
</p>
