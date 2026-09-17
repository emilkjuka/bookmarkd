<script lang="ts">
	import { browser } from '$app/env';
	import { toast } from 'svelte-sonner';
	import type { FlashMessage } from '#lib/types';

	let { flash }: { flash: FlashMessage | null } = $props();

	$effect(() => {
		if (!browser || !flash) return;

		switch (flash.type) {
			case 'success':
				toast.success(flash.message);
				break;
			case 'error':
				toast.error(flash.message);
				break;
			default:
				toast.info(flash.message);
		}
	});
</script>
