<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { createSupabaseClient } from '$lib/supabase';
	import { TotalBreakdown } from '$lib/components/calculator';
	import { calculator } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import type { EstimateData } from '$lib/types/database';

	interface ShareData {
		id: string;
		share_name: string;
		created_at: string;
		estimate: {
			id: string;
			name: string;
			estimate_data: EstimateData;
			created_at: string;
			updated_at: string;
			creator_email: string | null;
		};
	}

	let shareData = $state<ShareData | null>(null);
	let loading = $state(true);
	let error = $state('');

	const supabase = createSupabaseClient();

	onMount(async () => {
		const token = $page.params.token;

		try {
			const { data, error: fetchError } = await supabase
				.from('estimate_shares')
				.select(`
					id,
					share_name,
					created_at,
					estimate:estimates (
						id,
						name,
						estimate_data,
						created_at,
						updated_at,
						creator_email
					)
				`)
				.eq('share_token', token)
				.single();

			if (fetchError) throw fetchError;
			if (!data || !data.estimate) throw new Error('Estimate not found');

			shareData = data as unknown as ShareData;

			// Load into calculator store for TotalBreakdown to work
			const estimate = shareData.estimate;
			calculator.loadEstimate(estimate.id, estimate.name, estimate.estimate_data);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load estimate';
		} finally {
			loading = false;
		}
	});

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatHours(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}h ${m}m`;
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<svg class="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if error}
		<div class="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
			<svg class="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
			<h2 class="mt-4 text-lg font-medium text-gray-900">Estimate Not Found</h2>
			<p class="mt-2 text-gray-500">This share link may have expired or been removed.</p>
			<div class="mt-6">
				<a href="/">
					<Button>Go Home</Button>
				</a>
			</div>
		</div>
	{:else if shareData}
		{@const estimate = shareData.estimate}
		{@const data = estimate.estimate_data}

		<!-- Header -->
		<div class="mb-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-2xl font-bold text-gray-900">{estimate.name}</h1>
					<p class="mt-1 text-sm text-gray-500">
						{#if estimate.creator_email}
							Shared by {estimate.creator_email}
						{/if}
					</p>
				</div>
				<div class="text-right text-sm text-gray-500">
					<p>Created {formatDate(estimate.created_at)}</p>
					<p>Updated {formatDate(estimate.updated_at)}</p>
				</div>
			</div>
		</div>

		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Left: Details -->
			<div class="space-y-6">
				<!-- Flight Legs -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Flight Legs</h2>
					<div class="space-y-3">
						{#each data.legs as leg, i}
							<div class="rounded-lg bg-gray-50 p-3">
								<div class="flex items-center justify-between">
									<span class="font-medium text-gray-900">
										{leg.origin || '???'} → {leg.destination || '???'}
									</span>
									<span class="text-sm text-gray-500">Leg {i + 1}</span>
								</div>
								<div class="mt-1 text-sm text-gray-600">
									{formatHours(leg.flightTimeHours + leg.flightTimeMinutes / 60)} •
									{leg.fuelBurn.toLocaleString()} gal
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Crew -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Crew</h2>
					<div class="space-y-2">
						{#each data.crew as member}
							<div class="flex items-center justify-between text-sm">
								<span class="text-gray-600">
									{member.role === 'pilot' ? 'Pilot' : 'Flight Attendant'}
								</span>
								<span class="font-medium text-gray-900">${member.dailyRate}/day</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Notes -->
				{#if data.notes}
					<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
						<h2 class="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
						<p class="whitespace-pre-wrap text-gray-600">{data.notes}</p>
					</div>
				{/if}
			</div>

			<!-- Right: Cost Breakdown -->
			<div>
				<TotalBreakdown />
			</div>
		</div>

		<!-- View-only notice -->
		<div class="mt-8 rounded-lg bg-blue-50 p-4 text-center text-sm text-blue-700">
			This is a read-only view.
			<a href="/calculator" class="font-medium underline hover:no-underline">
				Create your own estimate
			</a>
		</div>
	{/if}
</div>
