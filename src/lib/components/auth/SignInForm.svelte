<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { ui } from '$lib/stores';
	import { Button, Input } from '$lib/components/ui';

	interface Props {
		onSuccess?: () => void;
		onSwitchToReset?: () => void;
	}

	let { onSuccess, onSwitchToReset }: Props = $props();

	let mode: 'signin' | 'signup' = $state('signin');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');

	const supabase = createSupabaseClient();

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		try {
			if (mode === 'signup') {
				if (password !== confirmPassword) {
					error = 'Passwords do not match';
					loading = false;
					return;
				}
				if (password.length < 6) {
					error = 'Password must be at least 6 characters';
					loading = false;
					return;
				}

				const { error: signUpError } = await supabase.auth.signUp({
					email,
					password
				});

				if (signUpError) throw signUpError;

				ui.showToast('Account created! Check your email to confirm.', 'success');
				mode = 'signin';
			} else {
				const { error: signInError } = await supabase.auth.signInWithPassword({
					email,
					password
				});

				if (signInError) throw signInError;

				ui.showToast('Signed in successfully', 'success');
				onSuccess?.();
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			loading = false;
		}
	}

	function toggleMode() {
		mode = mode === 'signin' ? 'signup' : 'signin';
		error = '';
		confirmPassword = '';
	}
</script>

<form onsubmit={handleSubmit} class="space-y-4">
	<div class="text-center">
		<h2 class="text-xl font-semibold text-gray-900">
			{mode === 'signin' ? 'Sign In' : 'Create Account'}
		</h2>
		<p class="mt-1 text-sm text-gray-500">
			{mode === 'signin' ? 'Welcome back' : 'Get started with Trip Estimate'}
		</p>
	</div>

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

	<Input
		type="password"
		label="Password"
		bind:value={password}
		placeholder="Enter your password"
		required
		autocomplete={mode === 'signin' ? 'current-password' : 'new-password'}
	/>

	{#if mode === 'signup'}
		<Input
			type="password"
			label="Confirm Password"
			bind:value={confirmPassword}
			placeholder="Confirm your password"
			required
			autocomplete="new-password"
		/>
	{/if}

	<Button type="submit" class="w-full" {loading}>
		{mode === 'signin' ? 'Sign In' : 'Create Account'}
	</Button>

	<div class="flex flex-col items-center gap-2 text-sm">
		<button type="button" onclick={toggleMode} class="text-blue-600 hover:text-blue-800">
			{mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
		</button>

		{#if mode === 'signin' && onSwitchToReset}
			<button type="button" onclick={onSwitchToReset} class="text-gray-500 hover:text-gray-700">
				Forgot your password?
			</button>
		{/if}
	</div>
</form>
