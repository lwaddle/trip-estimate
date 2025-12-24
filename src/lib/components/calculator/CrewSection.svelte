<script lang="ts">
	import { calculator, crewCount } from '$lib/stores';
	import { Button, Input, Select } from '$lib/components/ui';

	const defaultRates = {
		pilot: 800,
		attendant: 500
	};

	function handleAddCrew() {
		calculator.addCrew();
	}

	function handleRemoveCrew(id: string) {
		calculator.removeCrew(id);
	}

	function handleRoleChange(id: string, role: 'pilot' | 'attendant') {
		calculator.updateCrew(id, { role, dailyRate: defaultRates[role] });
	}

	function handleRateChange(id: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateCrew(id, { dailyRate: numValue });
	}

	function handleCostChange(category: string, field: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateCosts('crew', { [field]: numValue });
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
	<div class="mb-4 flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold text-gray-900">Crew</h2>
			<p class="text-sm text-gray-500">
				{$crewCount.pilots} pilot{$crewCount.pilots !== 1 ? 's' : ''}, {$crewCount.attendants} FA{$crewCount.attendants !== 1 ? 's' : ''}
			</p>
		</div>
		<Button size="sm" onclick={handleAddCrew}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Crew
		</Button>
	</div>

	<!-- Crew Members -->
	<div class="mb-6 space-y-3">
		{#each $calculator.estimate.crew as member, index (member.id)}
			<div class="flex items-center gap-3">
				<span class="w-8 text-sm text-gray-500">{index + 1}.</span>
				<Select
					class="w-40"
					value={member.role}
					onchange={(e) => handleRoleChange(member.id, e.currentTarget.value as 'pilot' | 'attendant')}
				>
					<option value="pilot">Pilot</option>
					<option value="attendant">Flight Attendant</option>
				</Select>
				<div class="flex items-center gap-1">
					<span class="text-sm text-gray-500">$</span>
					<Input
						type="number"
						class="w-24"
						min="0"
						step="50"
						value={member.dailyRate.toString()}
						oninput={(e) => handleRateChange(member.id, e.currentTarget.value)}
					/>
					<span class="text-sm text-gray-500">/day</span>
				</div>
				{#if $calculator.estimate.crew.length > 1}
					<button
						type="button"
						onclick={() => handleRemoveCrew(member.id)}
						class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
						aria-label="Remove crew member"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		{/each}
	</div>

	<!-- Crew Expenses -->
	<div class="border-t border-gray-200 pt-4">
		<h3 class="mb-3 text-sm font-medium text-gray-700">Crew Expenses</h3>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div class="flex items-center gap-2">
				<Input
					type="number"
					label="Hotel/Night"
					min="0"
					step="25"
					value={$calculator.estimate.costs.crew.hotelPerNight.toString()}
					oninput={(e) => handleCostChange('crew', 'hotelPerNight', e.currentTarget.value)}
				/>
			</div>
			<Input
				type="number"
				label="# Nights"
				min="0"
				step="1"
				value={$calculator.estimate.costs.crew.numberOfNights.toString()}
				oninput={(e) => handleCostChange('crew', 'numberOfNights', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Meals/Day"
				min="0"
				step="10"
				value={$calculator.estimate.costs.crew.mealsPerDay.toString()}
				oninput={(e) => handleCostChange('crew', 'mealsPerDay', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="# Days"
				min="0"
				step="1"
				value={$calculator.estimate.costs.crew.numberOfDays.toString()}
				oninput={(e) => handleCostChange('crew', 'numberOfDays', e.currentTarget.value)}
			/>
		</div>

		<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<Input
				type="number"
				label="Per Person Expenses"
				min="0"
				step="25"
				value={$calculator.estimate.costs.crew.perPersonExpenses.toString()}
				oninput={(e) => handleCostChange('crew', 'perPersonExpenses', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Rental Car"
				min="0"
				step="25"
				value={$calculator.estimate.costs.crew.rentalCar.toString()}
				oninput={(e) => handleCostChange('crew', 'rentalCar', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Airfare"
				min="0"
				step="50"
				value={$calculator.estimate.costs.crew.airfare.toString()}
				oninput={(e) => handleCostChange('crew', 'airfare', e.currentTarget.value)}
			/>
			<Input
				type="number"
				label="Mileage"
				min="0"
				step="10"
				value={$calculator.estimate.costs.crew.mileage.toString()}
				oninput={(e) => handleCostChange('crew', 'mileage', e.currentTarget.value)}
			/>
		</div>
	</div>
</div>
