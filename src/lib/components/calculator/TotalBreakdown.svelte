<script lang="ts">
	import { costBreakdown, totalFlightTime, totalFuelBurn } from '$lib/stores';

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(value);
	}

	function formatHours(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}h ${m}m`;
	}

	const categories = [
		{ key: 'crew', label: 'Crew Costs', color: 'bg-green-500' },
		{ key: 'hourly', label: 'Hourly Programs & Reserves', color: 'bg-blue-500' },
		{ key: 'fuel', label: 'Fuel', color: 'bg-yellow-500' },
		{ key: 'airport', label: 'Airport & Ground', color: 'bg-purple-500' },
		{ key: 'misc', label: 'Miscellaneous', color: 'bg-gray-500' }
	] as const;
</script>

<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Cost Breakdown</h2>

	<!-- Summary Stats -->
	<div class="mb-6 grid gap-4 sm:grid-cols-3">
		<div class="rounded-lg bg-gray-50 p-4">
			<p class="text-sm text-gray-500">Flight Time</p>
			<p class="text-xl font-semibold text-gray-900">{formatHours($totalFlightTime)}</p>
		</div>
		<div class="rounded-lg bg-gray-50 p-4">
			<p class="text-sm text-gray-500">Fuel (gallons)</p>
			<p class="text-xl font-semibold text-gray-900">{$costBreakdown.fuelGallons.toLocaleString()}</p>
		</div>
		<div class="rounded-lg bg-blue-50 p-4">
			<p class="text-sm text-blue-600">Total Estimate</p>
			<p class="text-2xl font-bold text-blue-700">{formatCurrency($costBreakdown.total)}</p>
		</div>
	</div>

	<!-- Category Breakdown -->
	<div class="space-y-3">
		{#each categories as cat}
			{@const value = $costBreakdown[cat.key]}
			{@const percentage = $costBreakdown.total > 0 ? (value / $costBreakdown.total) * 100 : 0}
			<div>
				<div class="mb-1 flex items-center justify-between text-sm">
					<span class="text-gray-600">{cat.label}</span>
					<span class="font-medium text-gray-900">{formatCurrency(value)}</span>
				</div>
				<div class="h-2 overflow-hidden rounded-full bg-gray-100">
					<div
						class="{cat.color} h-full rounded-full transition-all duration-300"
						style="width: {percentage}%"
					></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Total -->
	<div class="mt-6 border-t border-gray-200 pt-4">
		<div class="flex items-center justify-between">
			<span class="text-lg font-semibold text-gray-900">Total</span>
			<span class="text-2xl font-bold text-gray-900">{formatCurrency($costBreakdown.total)}</span>
		</div>
	</div>
</div>
