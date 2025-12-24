<script lang="ts">
	import { calculator, totalFlightTime, totalFuelBurn } from '$lib/stores';
	import { Input } from '$lib/components/ui';

	function handleHourlyChange(field: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateCosts('hourly', { [field]: numValue });
	}

	function handleFuelChange(field: string, value: string | boolean) {
		if (typeof value === 'boolean') {
			calculator.updateCosts('fuel', { [field]: value });
		} else {
			calculator.updateCosts('fuel', { [field]: parseFloat(value) || 0 });
		}
	}

	function handleAirportChange(field: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateCosts('airport', { [field]: numValue });
	}

	function handleMiscChange(field: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateCosts('misc', { [field]: numValue });
	}

	// Format display
	function formatHours(hours: number): string {
		const h = Math.floor(hours);
		const m = Math.round((hours - h) * 60);
		return `${h}h ${m}m`;
	}
</script>

<div class="space-y-6">
	<!-- Hourly Programs -->
	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Hourly Programs</h2>
			<p class="text-sm text-gray-500">
				Total flight time: {formatHours($totalFlightTime)}
			</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-3">
			<Input
				type="number"
				label="Maintenance Program ($/hr)"
				min="0"
				step="25"
				value={$calculator.estimate.costs.hourly.maintenanceProgram.toString()}
				oninput={(e) => handleHourlyChange('maintenanceProgram', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Consumables ($/hr)"
				min="0"
				step="5"
				value={$calculator.estimate.costs.hourly.consumables.toString()}
				oninput={(e) => handleHourlyChange('consumables', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Additional Reserve ($/hr)"
				min="0"
				step="10"
				value={$calculator.estimate.costs.hourly.additionalReserve.toString()}
				oninput={(e) => handleHourlyChange('additionalReserve', e.currentTarget.value)}
			/>
		</div>
	</div>

	<!-- Fuel -->
	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<div class="mb-4">
			<h2 class="text-lg font-semibold text-gray-900">Fuel</h2>
			<p class="text-sm text-gray-500">
				Total fuel burn: {$totalFuelBurn.toLocaleString()} gallons
			</p>
		</div>
		<div class="grid gap-4 sm:grid-cols-2">
			<Input
				type="number"
				label="Price per Gallon"
				min="0"
				step="0.10"
				value={$calculator.estimate.costs.fuel.pricePerGallon.toString()}
				oninput={(e) => handleFuelChange('pricePerGallon', e.currentTarget.value)}
			/>
			<div class="flex items-end gap-4 pb-2">
				<label class="flex cursor-pointer items-center gap-2">
					<input
						type="checkbox"
						checked={$calculator.estimate.costs.fuel.includeApuBurn}
						onchange={(e) => handleFuelChange('includeApuBurn', e.currentTarget.checked)}
						class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
					/>
					<span class="text-sm text-gray-700">Include APU burn</span>
				</label>
			</div>
		</div>
		{#if $calculator.estimate.costs.fuel.includeApuBurn}
			<div class="mt-4">
				<Input
					type="number"
					label="APU Burn (lbs/leg)"
					min="0"
					step="10"
					value={$calculator.estimate.costs.fuel.apuBurnPerLeg.toString()}
					oninput={(e) => handleFuelChange('apuBurnPerLeg', e.currentTarget.value)}
				/>
			</div>
		{/if}
	</div>

	<!-- Airport & Ground -->
	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Airport & Ground</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<Input
				type="number"
				label="Landing Fees"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.landingFees.toString()}
				oninput={(e) => handleAirportChange('landingFees', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Catering"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.catering.toString()}
				oninput={(e) => handleAirportChange('catering', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Handling"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.handling.toString()}
				oninput={(e) => handleAirportChange('handling', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Passenger Transport"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.passengerTransport.toString()}
				oninput={(e) => handleAirportChange('passengerTransport', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Facility Fees"
				min="0"
				step="25"
				value={$calculator.estimate.costs.airport.facilityFees.toString()}
				oninput={(e) => handleAirportChange('facilityFees', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Special Event Fees"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.specialEventFees.toString()}
				oninput={(e) => handleAirportChange('specialEventFees', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Ramp/Parking"
				min="0"
				step="25"
				value={$calculator.estimate.costs.airport.rampParking.toString()}
				oninput={(e) => handleAirportChange('rampParking', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Customs"
				min="0"
				step="50"
				value={$calculator.estimate.costs.airport.customs.toString()}
				oninput={(e) => handleAirportChange('customs', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Hangar"
				min="0"
				step="100"
				value={$calculator.estimate.costs.airport.hangar.toString()}
				oninput={(e) => handleAirportChange('hangar', e.currentTarget.value)}
			/>
		</div>
	</div>

	<!-- Miscellaneous -->
	<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
		<h2 class="mb-4 text-lg font-semibold text-gray-900">Miscellaneous</h2>
		<div class="grid gap-4 sm:grid-cols-2">
			<Input
				type="number"
				label="Trip Coordination"
				min="0"
				step="50"
				value={$calculator.estimate.costs.misc.tripCoordination.toString()}
				oninput={(e) => handleMiscChange('tripCoordination', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Other"
				min="0"
				step="50"
				value={$calculator.estimate.costs.misc.other.toString()}
				oninput={(e) => handleMiscChange('other', e.currentTarget.value)}
			/>
		</div>
	</div>
</div>
