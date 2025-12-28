<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { createSupabaseClient } from '$lib/supabase';
	import { isAuthenticated, auth, ui, calculator } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import { EstimateList } from '$lib/components/estimates';
	import type { EstimateData } from '$lib/types/database';

	interface Estimate {
		id: string;
		name: string;
		estimate_data: EstimateData;
		created_at: string;
		updated_at: string;
	}

	let estimates = $state<Estimate[]>([]);
	let loading = $state(true);
	let error = $state('');

	const supabase = createSupabaseClient();

	async function loadEstimates() {
		if (!$auth.user) return;

		loading = true;
		error = '';

		try {
			const { data, error: fetchError } = await supabase
				.from('estimates')
				.select('*')
				.eq('user_id', $auth.user.id)
				.order('updated_at', { ascending: false });

			if (fetchError) throw fetchError;

			estimates = data || [];
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load estimates';
			ui.showToast(error, 'error');
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		// Redirect if not authenticated
		if (!$isAuthenticated) {
			goto('/');
			return;
		}

		loadEstimates();
	});

	// Watch for auth changes
	$effect(() => {
		if ($auth.initialized && !$isAuthenticated) {
			goto('/');
		} else if ($auth.user) {
			loadEstimates();
		}
	});

	function handleNewEstimate() {
		if ($calculator.hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Start a new estimate anyway?')) {
				return;
			}
		}
		calculator.reset();
		goto('/calculator');
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">My Estimates</h1>
			<p class="mt-1 text-gray-500">
				{estimates.length} saved estimate{estimates.length !== 1 ? 's' : ''}
			</p>
		</div>
		<Button onclick={handleNewEstimate}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Estimate
		</Button>
	</div>

	{#if loading}
		<div class="flex items-center justify-center py-12">
			<svg class="h-8 w-8 animate-spin text-red-700" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-700">
			{error}
			<button type="button" onclick={loadEstimates} class="ml-2 underline">
				Try again
			</button>
		</div>
	{:else}
		<EstimateList {estimates} onRefresh={loadEstimates} onNewEstimate={handleNewEstimate} />
	{/if}
</div>
