<script lang="ts">
	let { children } = $props();
</script>

<div class="flex min-h-dvh items-center justify-center bg-background px-4 py-8 sm:py-12">
	<div class="w-full max-w-md">
		<a href="/login" class="mb-6 flex items-center justify-center gap-2 sm:mb-8">
			<span
				class="flex size-10 items-center justify-center rounded-md bg-primary font-semibold text-primary-foreground"
				>B</span
			>
			<span class="text-xl font-semibold tracking-tight">Bookmarkd</span>
		</a>
		<div class="rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
			{@render children()}
		</div>
	</div>
</div>
