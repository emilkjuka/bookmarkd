<script lang="ts">
	import { enhance } from '$app/forms';
	import { CATEGORY_COLORS } from '#lib/colors';

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
	action="?/createCategory"
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
			placeholder="e.g. Reddit"
			class="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		/>
	</label>

	<fieldset class="space-y-2">
		<legend class="text-sm font-medium">Color</legend>
		<div class="flex flex-wrap items-center gap-2">
			{#each CATEGORY_COLORS as color, index (color)}
				<label class="cursor-pointer">
					<input
						type="radio"
						name="color"
						value={color}
						checked={index === 0}
						class="peer sr-only"
					/>
					<span
						class="block h-6 w-6 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-card peer-checked:ring-foreground"
						style:background-color={color}
					></span>
					<span class="sr-only">{color}</span>
				</label>
			{/each}
		</div>
	</fieldset>

	<fieldset class="space-y-2">
		<legend class="text-sm font-medium">Rules</legend>
		<p class="text-xs text-muted-foreground">
			Optional. Auto-assign bookmarks whose URL matches a pattern. One pattern per line.
		</p>
		<textarea
			name="urlPatterns"
			rows="3"
			placeholder="reddit.com&#10;*.reddit.com"
			class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
		></textarea>
		<p class="text-xs text-muted-foreground">
			Example: a Reddit category with <span class="font-mono">reddit.com</span> matches links like
			<span class="font-mono">https://www.reddit.com/r/sveltejs</span>.
		</p>
	</fieldset>

	{#if message}
		<p class="text-sm text-destructive">{message}</p>
	{/if}

	<div class="flex flex-row-reverse flex-wrap items-center gap-2">
		<button
			type="submit"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Create category
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
