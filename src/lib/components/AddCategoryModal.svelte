<script lang="ts">
	import Modal from './Modal.svelte';
	import CategoryForm from './CategoryForm.svelte';

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

<Modal {visible} title="Add category" onclose={handleClose}>
	{#if visible}
		<CategoryForm bind:message oncancel={handleClose} />
	{/if}
</Modal>
