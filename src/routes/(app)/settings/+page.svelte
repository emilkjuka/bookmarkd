<script lang="ts">
	import AccountSettings from '#lib/components/AccountSettings.svelte';
	import CategoryManager from '#lib/components/CategoryManager.svelte';
	import TagManager from '#lib/components/TagManager.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let profileMessage = $derived(
		form && 'intent' in form && form.intent === 'profile' && 'message' in form
			? form.message
			: undefined
	);
	let emailMessage = $derived(
		form && 'intent' in form && form.intent === 'email' && 'message' in form
			? form.message
			: undefined
	);
	let passwordMessage = $derived(
		form && 'intent' in form && form.intent === 'password' && 'message' in form
			? form.message
			: undefined
	);
</script>

<svelte:head>
	<title>Settings · Bookmarkd</title>
</svelte:head>

<div class="mx-auto max-w-3xl space-y-8">
	<header>
		<h1 class="page-heading">Settings</h1>
		<p class="mt-1 text-sm text-muted-foreground">Manage your account, categories, and tags.</p>
	</header>

	<AccountSettings
		user={data.user}
		{profileMessage}
		{emailMessage}
		{passwordMessage}
	/>

	<CategoryManager
		categories={data.categories}
		message={form && 'intent' in form && form.intent === 'category' ? form.message : undefined}
	/>

	<TagManager
		tags={data.tags}
		message={form && 'intent' in form && form.intent === 'tag' ? form.message : undefined}
	/>
</div>
