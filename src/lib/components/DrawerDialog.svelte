<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		visible = false,
		title,
		onclose,
		children
	}: {
		visible?: boolean;
		title: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	function onkeydown(event: KeyboardEvent) {
		if (visible && event.key === 'Escape') onclose();
	}
</script>

<svelte:window {onkeydown} />

<div
	class={[
		'fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4',
		visible ? '' : 'pointer-events-none invisible'
	]}
	aria-hidden={!visible}
>
	<button
		type="button"
		class={['absolute inset-0 bg-black/60', visible ? '' : 'hidden']}
		aria-label="Close dialog"
		tabindex={visible ? 0 : -1}
		onclick={onclose}
	></button>

	<div
		role="dialog"
		aria-modal="true"
		aria-labelledby="drawer-dialog-title"
		class="relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-md border bg-card text-card-foreground shadow-xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-md"
	>
		<div class="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
			<h2 id="drawer-dialog-title" class="text-lg font-semibold">{title}</h2>
			<button
				type="button"
				class="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
				aria-label="Close"
				onclick={onclose}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg
				>
			</button>
		</div>
		<div class="overflow-y-auto px-5 py-4">
			{@render children()}
		</div>
	</div>
</div>
