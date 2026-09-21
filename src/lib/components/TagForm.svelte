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
			class="field mt-1"
		/>
	</label>

	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}

	<div class="form-actions">
		<button type="submit" class="btn btn-primary">Create tag</button>
		{#if oncancel}
			<button type="button" class="btn btn-secondary" onclick={oncancel}>Cancel</button>
		{/if}
	</div>
</form>
