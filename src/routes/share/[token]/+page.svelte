<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { createSupabaseClient } from '$lib/supabase';
	import { Button } from '$lib/components/ui';
	import { DetailedCostBreakdown } from '$lib/components/share';
	import { downloadPDF } from '$lib/utils/pdf';
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
	let copied = $state(false);
	let shareUrl = $state('');

	const supabase = createSupabaseClient();

	onMount(async () => {
		const token = $page.params.token;
		shareUrl = window.location.href;

		try {
			const { data, error: fetchError } = await supabase
				.from('estimate_shares')
				.select(
					`
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
				`
				)
				.eq('share_token', token)
				.single();

			if (fetchError) throw fetchError;
			if (!data || !data.estimate) throw new Error('Estimate not found');

			shareData = data as unknown as ShareData;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load estimate';
		} finally {
			loading = false;
		}
	});

	function formatDateTime(dateStr: string): string {
		const date = new Date(dateStr);
		const dateFormatted = date.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric',
			timeZone: 'UTC'
		});
		const hours = date.getUTCHours().toString().padStart(2, '0');
		const minutes = date.getUTCMinutes().toString().padStart(2, '0');
		return `${dateFormatted} ${hours}:${minutes} UTC`;
	}

	function formatHours(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}h ${m}m`;
	}

	function formatGallons(fuelBurnLbs: number): string {
		const gallons = Math.round(fuelBurnLbs / 6.7);
		return `${gallons.toLocaleString()} gal`;
	}

	function handleDownloadPdf() {
		if (!shareData) return;
		downloadPDF(shareData.estimate.name, shareData.estimate.estimate_data);
	}

	async function handleCopyLink() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
		}
	}

	function handleEmail() {
		if (!shareData) return;
		const subject = encodeURIComponent(`Trip Estimate: ${shareData.estimate.name}`);
		const body = encodeURIComponent(
			`Here's a trip estimate I wanted to share with you:\n\n${shareUrl}`
		);
		window.open(`mailto:?subject=${subject}&body=${body}`);
	}

	async function handleNativeShare() {
		if (!shareData || !navigator.share) return;
		try {
			await navigator.share({
				title: `Trip Estimate: ${shareData.estimate.name}`,
				url: shareUrl
			});
		} catch {
			// User cancelled or share failed
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	{#if loading}
		<div class="flex min-h-screen items-center justify-center">
			<svg class="h-8 w-8 animate-spin text-red-700" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
				/>
			</svg>
		</div>
	{:else if error}
		<div class="flex min-h-screen items-center justify-center px-4">
			<div class="w-full max-w-md rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
				<svg
					class="mx-auto h-12 w-12 text-red-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
				<h2 class="mt-4 text-lg font-medium text-gray-900">Estimate Not Found</h2>
				<p class="mt-2 text-gray-500">This share link may have expired or been removed.</p>
				<div class="mt-6">
					<a href="/">
						<Button>Go Home</Button>
					</a>
				</div>
			</div>
		</div>
	{:else if shareData}
		{@const estimate = shareData.estimate}
		{@const data = estimate.estimate_data}

		<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Estimate Header -->
			<div class="mb-8 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
				<h1 class="text-2xl font-bold text-gray-900">{estimate.name}</h1>
				<p class="mt-1 text-sm text-gray-500">
					Prepared {formatDateTime(estimate.updated_at)}{estimate.creator_email ? ` by ${estimate.creator_email}` : ''}
				</p>
			</div>

			<!-- Flight Legs -->
			<div class="mb-8 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Flight Itinerary</h2>
				<div class="space-y-3">
					{#each data.legs as leg, i}
						<div class="flex items-start gap-4 rounded-lg bg-gray-50 p-4 sm:items-center">
							<div
								class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-700"
							>
								{i + 1}
							</div>
							<div class="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
								<div class="flex items-center gap-2 font-medium text-gray-900 sm:min-w-35">
									<span>{leg.origin || '???'}</span>
									<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
									</svg>
									<span>{leg.destination || '???'}</span>
								</div>
								<div class="flex items-center gap-3 text-sm text-gray-500">
									<span>{formatHours(leg.flightTimeHours + leg.flightTimeMinutes / 60)}</span>
									<span class="text-gray-300">|</span>
									<span>{formatGallons(leg.fuelBurnLbs)}</span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Notes -->
			{#if data.notes}
				<div class="mb-8 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">Notes</h2>
					<p class="whitespace-pre-wrap text-gray-600">{data.notes}</p>
				</div>
			{/if}

			<!-- Cost Breakdown -->
			<div class="mb-8 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
				<h2 class="mb-6 text-lg font-semibold text-gray-900">Cost Breakdown</h2>
				<DetailedCostBreakdown {data} />
			</div>

			<!-- Action Buttons -->
			<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">Share This Estimate</h2>
				<div class="flex flex-wrap gap-3">
					<Button onclick={handleDownloadPdf}>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Save as PDF
					</Button>
					<Button variant="secondary" onclick={handleCopyLink}>
						{#if copied}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied!
						{:else}
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Copy Link
						{/if}
					</Button>
					<Button variant="secondary" onclick={handleEmail}>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
						</svg>
						Email
					</Button>
					{#if typeof navigator !== 'undefined' && navigator.share}
						<Button variant="secondary" onclick={handleNativeShare}>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
							</svg>
							Share
						</Button>
					{/if}
				</div>
			</div>

			<!-- Footer -->
			<div class="mt-8 text-center text-sm text-gray-500">
				<p>
					Want to create your own estimates?
					<a href="/calculator" class="font-medium text-red-700 hover:text-red-800">
						Get started here
					</a>
				</p>
			</div>
		</main>
	{/if}
</div>
