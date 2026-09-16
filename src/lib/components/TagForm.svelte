<script lang="ts">
	import { enhance } from '$app/forms';

	let {
		oncancel,
		message = $bindable(undefined)
	}: {
		oncancel?: () => void;
		message?: string | undefined;
	} = $props();
</script>

<form
	method="post"
	action="?/createTag"
	class="space-y-4"
	use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'failure' && result.data && 'message' in result.data) {
				message = result.data.message as string;
			} else if (result.type === 'success') {
				message = undefined;
			}

			await update({ reset: result.type === 'success', invalidateAll: true });

			if (result.type === 'success' && oncancel) {
				oncancel();
			}
		};
	}}
>
	<label class="block text-sm font-medium">
		Name
		<input
			name="name"
			required
			maxlength="50"
			placeholder="e.g. reading-list"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>

	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}

	<div class="flex flex-row-reverse flex-wrap items-center gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Create tag
		</button>
		{#if oncancel}
			<button
				type="button"
				class="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
				onclick={oncancel}
			>
				Cancel
			</button>
		{/if}
	</div>
</form>
