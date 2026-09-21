<script lang="ts">
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { signOut } from '#lib/auth-client';

	let {
		user,
		profileMessage,
		emailMessage,
		passwordMessage
	}: {
		user: { name: string; email: string };
		profileMessage?: string;
		emailMessage?: string;
		passwordMessage?: string;
	} = $props();

	let editingProfile = $state(false);
	let editingEmail = $state(false);
	let editingPassword = $state(false);

	let showProfileForm = $derived(editingProfile || !!profileMessage);
	let showEmailForm = $derived(editingEmail || !!emailMessage);
	let showPasswordForm = $derived(editingPassword || !!passwordMessage);

	const inputClass = 'field mt-1';

	const handleSignOut = async () => {
		await signOut();
		await goto('/login', { invalidateAll: true });
	};
</script>

<section class="rounded-md border bg-card p-5 text-card-foreground shadow-sm">
	<h2 class="text-lg font-semibold">Account</h2>
	<p class="mt-1 text-sm text-muted-foreground">Your profile and sign-in details.</p>

	<div class="mt-4 divide-y divide-border">
		<div class="py-3">
			{#if showProfileForm}
				<form
					method="post"
					action="?/updateProfile"
					class="space-y-3"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ invalidateAll: result.type === 'success' });
							if (result.type === 'success') editingProfile = false;
						};
					}}
				>
					<div>
						<h3 class="text-sm font-medium">Name</h3>
						<p class="text-xs text-muted-foreground">How your name appears in the app.</p>
					</div>
					<label class="block text-sm">
						<input name="name" required maxlength="100" value={user.name} class={inputClass} />
					</label>
					{#if profileMessage}
						<p class="text-sm text-destructive">{profileMessage}</p>
					{/if}
					<div class="form-actions !flex-row">
						<button type="submit" class="btn btn-primary">Save</button>
						{#if !profileMessage}
							<button type="button" class="btn btn-ghost" onclick={() => (editingProfile = false)}
								>Cancel</button
							>
						{/if}
					</div>
				</form>
			{:else}
				<div class="list-row">
					<div class="min-w-0 flex-1">
						<p class="text-sm text-muted-foreground">Name</p>
						<p class="font-medium">{user.name}</p>
					</div>
					<button type="button" class="btn btn-ghost list-row-actions" onclick={() => (editingProfile = true)}
						>Edit</button
					>
				</div>
			{/if}
		</div>

		<div class="py-3">
			{#if showEmailForm}
				<form
					method="post"
					action="?/changeEmail"
					class="space-y-3"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ invalidateAll: result.type === 'success' });
							if (result.type === 'success') editingEmail = false;
						};
					}}
				>
					<div>
						<h3 class="text-sm font-medium">Email</h3>
						<p class="text-xs text-muted-foreground">Used to sign in to your account.</p>
					</div>
					<label class="block text-sm">
						<input
							type="email"
							name="email"
							required
							autocomplete="email"
							value={user.email}
							class={inputClass}
						/>
					</label>
					{#if emailMessage}
						<p class="text-sm text-destructive">{emailMessage}</p>
					{/if}
					<div class="form-actions !flex-row">
						<button type="submit" class="btn btn-primary">Save</button>
						{#if !emailMessage}
							<button type="button" class="btn btn-ghost" onclick={() => (editingEmail = false)}
								>Cancel</button
							>
						{/if}
					</div>
				</form>
			{:else}
				<div class="list-row">
					<div class="min-w-0 flex-1">
						<p class="text-sm text-muted-foreground">Email</p>
						<p class="font-medium">{user.email}</p>
					</div>
					<button type="button" class="btn btn-ghost list-row-actions" onclick={() => (editingEmail = true)}
						>Edit</button
					>
				</div>
			{/if}
		</div>

		<div class="py-3">
			{#if showPasswordForm}
				<form
					method="post"
					action="?/changePassword"
					class="space-y-3"
					use:enhance={() => {
						return async ({ result, update }) => {
							await update({ reset: result.type === 'success' });
							if (result.type === 'success') editingPassword = false;
						};
					}}
				>
					<div>
						<h3 class="text-sm font-medium">Password</h3>
						<p class="text-xs text-muted-foreground">Use at least 8 characters.</p>
					</div>
					<label class="block text-sm">
						<span class="text-muted-foreground">Current password</span>
						<input
							type="password"
							name="currentPassword"
							required
							autocomplete="current-password"
							class={inputClass}
						/>
					</label>
					<label class="block text-sm">
						<span class="text-muted-foreground">New password</span>
						<input
							type="password"
							name="newPassword"
							required
							minlength="8"
							autocomplete="new-password"
							class={inputClass}
						/>
					</label>
					<label class="block text-sm">
						<span class="text-muted-foreground">Confirm new password</span>
						<input
							type="password"
							name="confirmPassword"
							required
							minlength="8"
							autocomplete="new-password"
							class={inputClass}
						/>
					</label>
					{#if passwordMessage}
						<p class="text-sm text-destructive">{passwordMessage}</p>
					{/if}
					<div class="form-actions !flex-row">
						<button type="submit" class="btn btn-primary">Save</button>
						{#if !passwordMessage}
							<button type="button" class="btn btn-ghost" onclick={() => (editingPassword = false)}
								>Cancel</button
							>
						{/if}
					</div>
				</form>
			{:else}
				<div class="list-row">
					<div class="min-w-0 flex-1">
						<p class="text-sm text-muted-foreground">Password</p>
						<p class="font-medium">••••••••</p>
					</div>
					<button type="button" class="btn btn-ghost list-row-actions" onclick={() => (editingPassword = true)}
						>Change</button
					>
				</div>
			{/if}
		</div>

		<div class="flex justify-stretch pt-3 sm:justify-end">
			<button type="button" onclick={handleSignOut} class="btn btn-secondary w-full sm:w-auto">
				Sign out
			</button>
		</div>
	</div>
</section>
