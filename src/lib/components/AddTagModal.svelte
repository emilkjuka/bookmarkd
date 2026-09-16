<script lang="ts">
	import Modal from './Modal.svelte';
	import TagForm from './TagForm.svelte';

	let {
		visible = $bindable(false),
		onclose
	}: {
		visible?: boolean;
		onclose: () => void;
	} = $props();

	let message = $state<string | undefined>(undefined);

	function handleClose() {
		message = undefined;
		onclose();
	}
</script>

<Modal {visible} title="Add tag" onclose={handleClose}>
	{#if visible}
		<TagForm bind:message oncancel={handleClose} />
	{/if}
</Modal>
