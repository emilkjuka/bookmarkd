<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
	<div class="w-full max-w-md">
		<a href="/login" class="mb-8 flex items-center justify-center gap-2">
			<span
				class="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground"
				>B</span
			>
			<span class="text-xl font-semibold tracking-tight">Bookmarkd</span>
		</a>
		<div class="rounded-md border bg-card p-8 text-card-foreground shadow-sm">
			{@render children()}
		</div>
	</div>
</div>
