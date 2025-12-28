<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { calculator, ui } from '$lib/stores';
	import { Button, ConfirmDialog } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import type { EstimateData } from '$lib/types/database';

	interface Estimate {
		id: string;
		name: string;
		estimate_data: EstimateData;
		created_at: string;
		updated_at: string;
	}

	interface Props {
		estimates: Estimate[];
		onRefresh: () => void;
		onNewEstimate: () => void;
	}

	let { estimates, onRefresh, onNewEstimate }: Props = $props();

	let deleteId = $state<string | null>(null);
	let deleteName = $state('');
	let deleting = $state(false);

	const supabase = createSupabaseClient();

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function calculateTotal(data: EstimateData): number {
		const { costs, crew, legs } = data;

		const totalFlightTime = legs.reduce((sum, leg) => sum + leg.flightTimeHours + leg.flightTimeMinutes / 60, 0);
		const totalFuelBurnLbs = legs.reduce((sum, leg) => sum + leg.fuelBurnLbs, 0);
		const fuelDensity = costs.fuel.fuelDensity || 6.7;
		const crewCount = crew.length;
		const totalDailyRates = crew.reduce((sum, m) => sum + m.dailyRate, 0);

		const crewCost =
			totalDailyRates * costs.crew.numberOfDays +
			costs.crew.hotelPerNight * costs.crew.numberOfNights * crewCount +
			costs.crew.mealsPerDay * costs.crew.numberOfDays * crewCount +
			costs.crew.perPersonExpenses * crewCount +
			costs.crew.rentalCar +
			costs.crew.airfare +
			costs.crew.mileage;

		const hourlyCost = (costs.hourly.maintenanceProgram + costs.hourly.consumables + costs.hourly.additionalReserve) * totalFlightTime;

		// Convert fuel burn from lbs to gallons and always include APU burn
		const legCount = legs.length;
		const apuGallons = (costs.fuel.apuBurnPerLeg / fuelDensity) * legCount;
		const fuelGallons = (totalFuelBurnLbs / fuelDensity) + apuGallons;
		const fuelCost = fuelGallons * costs.fuel.pricePerGallon;

		const airportCost =
			costs.airport.landingFees +
			costs.airport.catering +
			costs.airport.handling +
			costs.airport.passengerTransport +
			costs.airport.facilityFees +
			costs.airport.specialEventFees +
			costs.airport.rampParking +
			costs.airport.customs +
			costs.airport.hangar;

		const miscCost = costs.misc.tripCoordination + costs.misc.other;

		return crewCost + hourlyCost + fuelCost + airportCost + miscCost;
	}

	function getRouteDisplay(data: EstimateData): string {
		const legs = data.legs.filter((l) => l.origin || l.destination);
		if (legs.length === 0) return 'No legs';

		const origins = legs.map((l) => l.origin).filter(Boolean);
		const destinations = legs.map((l) => l.destination).filter(Boolean);

		if (origins.length === 0 && destinations.length === 0) return 'No legs';

		const first = origins[0] || '???';
		const last = destinations[destinations.length - 1] || '???';

		return `${first} → ${last}`;
	}

	function handleLoad(estimate: Estimate) {
		if ($calculator.hasUnsavedChanges) {
			if (!confirm('You have unsaved changes. Load this estimate anyway?')) {
				return;
			}
		}

		calculator.loadEstimate(estimate.id, estimate.name, estimate.estimate_data);
		ui.showToast(`Loaded "${estimate.name}"`, 'success');
		goto('/calculator');
	}

	function handleDeleteClick(estimate: Estimate) {
		deleteId = estimate.id;
		deleteName = estimate.name;
	}

	async function handleConfirmDelete() {
		if (!deleteId) return;

		deleting = true;
		try {
			const { error } = await supabase.from('estimates').delete().eq('id', deleteId);

			if (error) throw error;

			ui.showToast('Estimate deleted', 'success');
			onRefresh();

			// Clear current estimate if it was deleted
			if ($calculator.savedId === deleteId) {
				calculator.reset();
			}
		} catch (err) {
			ui.showToast('Failed to delete estimate', 'error');
		} finally {
			deleting = false;
			deleteId = null;
		}
	}

	function handleCancelDelete() {
		deleteId = null;
	}
</script>

{#if estimates.length === 0}
	<div class="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
		<svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
		<h3 class="mt-4 text-lg font-medium text-gray-900">No saved estimates</h3>
		<p class="mt-2 text-gray-500">Create your first estimate to get started.</p>
		<div class="mt-6">
			<Button onclick={onNewEstimate}>New Estimate</Button>
		</div>
	</div>
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each estimates as estimate (estimate.id)}
			<div class="group relative rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md">
				<div class="mb-4">
					<h3 class="font-semibold text-gray-900 group-hover:text-red-700">
						{estimate.name}
					</h3>
					<p class="mt-1 text-sm text-gray-500">
						{getRouteDisplay(estimate.estimate_data)}
					</p>
				</div>

				<div class="mb-4 flex items-center justify-between">
					<span class="text-2xl font-bold text-gray-900">
						{formatCurrency(calculateTotal(estimate.estimate_data))}
					</span>
				</div>

				<div class="mb-4 text-xs text-gray-400">
					Updated {formatDate(estimate.updated_at)}
				</div>

				<div class="flex gap-2">
					<Button size="sm" class="flex-1" onclick={() => handleLoad(estimate)}>
						Load
					</Button>
					<Button size="sm" variant="ghost" onclick={() => ui.openShareModal(estimate.id, estimate.name)}>
						<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
					</Button>
					<Button size="sm" variant="ghost" onclick={() => handleDeleteClick(estimate)}>
						<svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</Button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<ConfirmDialog
	open={!!deleteId}
	title="Delete Estimate"
	message={`Are you sure you want to delete "${deleteName}"? This cannot be undone.`}
	confirmText="Delete"
	variant="danger"
	loading={deleting}
	onConfirm={handleConfirmDelete}
	onCancel={handleCancelDelete}
/>
