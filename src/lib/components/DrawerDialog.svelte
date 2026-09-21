<script lang="ts">
	import Icon from '#lib/components/Icon.svelte';
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
		class="relative z-10 flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-xl border bg-card pb-[env(safe-area-inset-bottom,0px)] text-card-foreground shadow-xl sm:max-h-[90vh] sm:max-w-lg sm:rounded-md sm:pb-0"
	>
		<div class="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
			<h2 id="drawer-dialog-title" class="text-lg font-semibold">{title}</h2>
			<button type="button" class="btn-icon-ghost -mr-1" aria-label="Close" onclick={onclose}>
				<Icon name="lucide--x" class="size-5" />
			</button>
		</div>
		<div class="overflow-y-auto px-5 py-4">
			{@render children()}
		</div>
	</div>
</div>
