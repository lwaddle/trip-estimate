<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { ui } from '$lib/stores';
	import { Button, Input } from '$lib/components/ui';

	interface Props {
		onSuccess?: () => void;
		onBack?: () => void;
	}

	let { onSuccess, onBack }: Props = $props();

	let email = $state('');
	let loading = $state(false);
	let sent = $state(false);
	let error = $state('');

	const supabase = createSupabaseClient();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
				redirectTo: `${window.location.origin}/auth/reset-password`
			});

			if (resetError) throw resetError;

			sent = true;
			ui.showToast('Password reset email sent', 'success');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-4">
	<div class="text-center">
		<h2 class="text-xl font-semibold text-gray-900">Reset Password</h2>
		<p class="mt-1 text-sm text-gray-500">
			{sent ? 'Check your email for the reset link' : "Enter your email to receive a reset link"}
		</p>
	</div>

	{#if !sent}
		<form onsubmit={handleSubmit} class="space-y-4">
			{#if error}
				<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			{/if}

			<Input
				type="email"
				label="Email"
				bind:value={email}
				placeholder="you@example.com"
				required
				autocomplete="email"
			/>

			<Button type="submit" class="w-full" {loading}>
				Send Reset Link
			</Button>
		</form>
	{:else}
		<div class="rounded-lg bg-green-50 p-4 text-center text-sm text-green-700">
			<p>We've sent a password reset link to <strong>{email}</strong>.</p>
			<p class="mt-2">Check your inbox and follow the instructions.</p>
		</div>
	{/if}

	{#if onBack}
		<div class="text-center">
			<button type="button" onclick={onBack} class="text-sm text-red-700 hover:text-red-800">
				Back to sign in
			</button>
		</div>
	{/if}
</div>
