<script lang="ts">
	import { calculator } from '$lib/stores';
	import { Button, Input } from '$lib/components/ui';

	function handleAddLeg() {
		calculator.addLeg();
	}

	function handleRemoveLeg(id: string) {
		calculator.removeLeg(id);
	}

	function handleInputChange(id: string, field: string, value: string) {
		const numValue = parseFloat(value) || 0;
		calculator.updateLeg(id, { [field]: numValue });
	}

	function handleTextChange(id: string, field: string, value: string) {
		calculator.updateLeg(id, { [field]: value });
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-lg font-semibold text-gray-900">Flight Legs</h2>
		<Button size="sm" onclick={handleAddLeg}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Add Leg
		</Button>
	</div>

	<div class="space-y-4">
		{#each $calculator.estimate.legs as leg, index (leg.id)}
			<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
				<div class="mb-3 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-700">Leg {index + 1}</span>
					{#if $calculator.estimate.legs.length > 1}
						<button
							type="button"
							onclick={() => handleRemoveLeg(leg.id)}
							class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-red-600"
							aria-label="Remove leg"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>

				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<Input
						label="Origin"
						placeholder="KJFK"
						value={leg.origin}
						oninput={(e) => handleTextChange(leg.id, 'origin', e.currentTarget.value)}
					/>
					<Input
						label="Destination"
						placeholder="KLAX"
						value={leg.destination}
						oninput={(e) => handleTextChange(leg.id, 'destination', e.currentTarget.value)}
					/>
					<div class="grid grid-cols-2 gap-2">
						<Input
							type="number"
							label="Hours"
							min="0"
							step="1"
							value={leg.flightTimeHours.toString()}
							oninput={(e) => handleInputChange(leg.id, 'flightTimeHours', e.currentTarget.value)}
						/>
						<Input
							type="number"
							label="Minutes"
							min="0"
							max="59"
							step="1"
							value={leg.flightTimeMinutes.toString()}
							oninput={(e) => handleInputChange(leg.id, 'flightTimeMinutes', e.currentTarget.value)}
						/>
					</div>
					<Input
						type="number"
						label="Fuel Burn (gal)"
						min="0"
						step="1"
						value={leg.fuelBurn.toString()}
						oninput={(e) => handleInputChange(leg.id, 'fuelBurn', e.currentTarget.value)}
					/>
				</div>
			</div>
		{/each}
	</div>
</div>
