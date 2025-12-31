<script lang="ts">
	import type { EstimateData } from '$lib/types/database';

	interface Props {
		data: EstimateData;
	}

	let { data }: Props = $props();

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

	function formatDecimalHours(hours: number): string {
		return `${hours.toFixed(1)} hrs`;
	}

	function formatRate(value: number): string {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: value < 100 ? 2 : 0,
			maximumFractionDigits: value < 100 ? 2 : 0
		}).format(value);
	}

	// Calculate all derived values
	const calculations = $derived.by(() => {
		const { costs, crew, legs } = data;

		const totalFlightTime = legs.reduce(
			(sum, leg) => sum + leg.flightTimeHours + leg.flightTimeMinutes / 60,
			0
		);
		const totalFuelBurnLbs = legs.reduce((sum, leg) => sum + leg.fuelBurnLbs, 0);
		const fuelDensity = costs.fuel.fuelDensity || 6.7;
		const crewCount = crew.length;
		const pilotCount = crew.filter((m) => m.role === 'pilot').length;
		const attendantCount = crew.filter((m) => m.role === 'attendant').length;
		const totalDailyRates = crew.reduce((sum, m) => sum + m.dailyRate, 0);
		const legCount = legs.length;

		// Crew costs breakdown
		const crewDailyRates = totalDailyRates * costs.crew.numberOfDays;
		const crewHotel = costs.crew.hotelPerNight * costs.crew.numberOfNights * crewCount;
		const crewMeals = costs.crew.mealsPerDay * costs.crew.numberOfDays * crewCount;
		const crewPerPerson = costs.crew.perPersonExpenses * crewCount;
		const crewRentalCar = costs.crew.rentalCar;
		const crewAirfare = costs.crew.airfare;
		const crewMileage = costs.crew.mileage;
		const crewTotal =
			crewDailyRates +
			crewHotel +
			crewMeals +
			crewPerPerson +
			crewRentalCar +
			crewAirfare +
			crewMileage;

		// Hourly costs breakdown
		const hourlyMaintenance = costs.hourly.maintenanceProgram * totalFlightTime;
		const hourlyConsumables = costs.hourly.consumables * totalFlightTime;
		const hourlyReserve = costs.hourly.additionalReserve * totalFlightTime;
		const hourlyTotal = hourlyMaintenance + hourlyConsumables + hourlyReserve;

		// Fuel costs breakdown
		const fuelGallons = totalFuelBurnLbs / fuelDensity;
		const apuGallons = (costs.fuel.apuBurnPerLeg / fuelDensity) * legCount;
		const totalFuelGallons = fuelGallons + apuGallons;
		const fuelBurnCost = fuelGallons * costs.fuel.pricePerGallon;
		const apuCost = apuGallons * costs.fuel.pricePerGallon;
		const fuelTotal = fuelBurnCost + apuCost;

		// Airport costs breakdown
		const airportTotal =
			costs.airport.landingFees +
			costs.airport.catering +
			costs.airport.handling +
			costs.airport.passengerTransport +
			costs.airport.facilityFees +
			costs.airport.specialEventFees +
			costs.airport.rampParking +
			costs.airport.customs +
			costs.airport.hangar;

		// Misc costs breakdown
		const miscTotal = costs.misc.tripCoordination + costs.misc.other;

		// Grand total
		const grandTotal = crewTotal + hourlyTotal + fuelTotal + airportTotal + miscTotal;

		return {
			totalFlightTime,
			totalFuelGallons,
			crewCount,
			pilotCount,
			attendantCount,
			crew: {
				dailyRates: crewDailyRates,
				hotel: crewHotel,
				meals: crewMeals,
				perPerson: crewPerPerson,
				rentalCar: crewRentalCar,
				airfare: crewAirfare,
				mileage: crewMileage,
				total: crewTotal
			},
			hourly: {
				maintenance: hourlyMaintenance,
				consumables: hourlyConsumables,
				reserve: hourlyReserve,
				total: hourlyTotal
			},
			fuel: {
				gallons: fuelGallons,
				apuGallons,
				totalGallons: totalFuelGallons,
				burnCost: fuelBurnCost,
				apuCost,
				total: fuelTotal
			},
			airport: {
				landingFees: costs.airport.landingFees,
				catering: costs.airport.catering,
				handling: costs.airport.handling,
				passengerTransport: costs.airport.passengerTransport,
				facilityFees: costs.airport.facilityFees,
				specialEventFees: costs.airport.specialEventFees,
				rampParking: costs.airport.rampParking,
				customs: costs.airport.customs,
				hangar: costs.airport.hangar,
				total: airportTotal
			},
			misc: {
				tripCoordination: costs.misc.tripCoordination,
				other: costs.misc.other,
				total: miscTotal
			},
			grandTotal
		};
	});

	interface LineItem {
		label: string;
		detail?: string; // Rate breakdown shown on second line on mobile
		value: number;
		show?: boolean;
	}

	function getLineItems(items: LineItem[]): LineItem[] {
		return items.filter((item) => item.show !== false && item.value > 0);
	}

	const categories = [
		{ key: 'crew', label: 'Crew Costs', color: 'bg-green-500', borderColor: 'border-green-500' },
		{
			key: 'hourly',
			label: 'Hourly Programs & Reserves',
			color: 'bg-red-500',
			borderColor: 'border-red-500'
		},
		{ key: 'fuel', label: 'Fuel', color: 'bg-yellow-500', borderColor: 'border-yellow-500' },
		{
			key: 'airport',
			label: 'Airport & Ground',
			color: 'bg-purple-500',
			borderColor: 'border-purple-500'
		},
		{ key: 'misc', label: 'Miscellaneous', color: 'bg-gray-500', borderColor: 'border-gray-500' }
	] as const;
</script>

<div class="space-y-6">
	<!-- Summary Stats -->
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="rounded-lg bg-gray-50 p-4 text-center">
			<p class="text-sm text-gray-500">Total Flight Time</p>
			<p class="text-xl font-semibold text-gray-900">{formatHours(calculations.totalFlightTime)}</p>
		</div>
		<div class="rounded-lg bg-gray-50 p-4 text-center">
			<p class="text-sm text-gray-500">Total Fuel</p>
			<p class="text-xl font-semibold text-gray-900">
				{Math.round(calculations.totalFuelGallons).toLocaleString()} gal
			</p>
		</div>
	</div>

	<!-- Crew Costs -->
	{#if calculations.crew.total > 0}
		<div class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 sm:p-4">
			<div class="mb-3">
				<h3 class="font-semibold text-gray-900">Crew Costs</h3>
			</div>
			<div class="space-y-2 text-sm">
				{#each getLineItems([
					{ label: 'Daily rates', detail: `${data.costs.crew.numberOfDays} days @ ${formatRate(data.crew.reduce((sum, m) => sum + m.dailyRate, 0))}/day`, value: calculations.crew.dailyRates },
					{ label: 'Hotel', detail: `${data.costs.crew.numberOfNights} nights × ${calculations.crewCount} crew @ ${formatRate(data.costs.crew.hotelPerNight)}/night`, value: calculations.crew.hotel },
					{ label: 'Meals', detail: `${data.costs.crew.numberOfDays} days × ${calculations.crewCount} crew @ ${formatRate(data.costs.crew.mealsPerDay)}/day`, value: calculations.crew.meals },
					{ label: 'Per-person expenses', detail: `${calculations.crewCount} crew @ ${formatRate(data.costs.crew.perPersonExpenses)}/person`, value: calculations.crew.perPerson },
					{ label: 'Rental car', value: calculations.crew.rentalCar },
					{ label: 'Airfare', value: calculations.crew.airfare },
					{ label: 'Mileage', value: calculations.crew.mileage }
				]) as item}
					<div class="line-item">
						<div class="line-item-label">
							<span class="text-gray-600">{item.label}</span>
							{#if item.detail}
								<span class="line-item-detail">{item.detail}</span>
							{/if}
						</div>
						<span class="whitespace-nowrap font-medium text-gray-900">{formatCurrency(item.value)}</span>
					</div>
				{/each}
				<div class="line-item mt-2">
					<span class="font-semibold text-gray-900">Subtotal</span>
					<span class="whitespace-nowrap font-bold text-gray-900">{formatCurrency(calculations.crew.total)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Hourly Programs & Reserves -->
	{#if calculations.hourly.total > 0}
		<div class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 sm:p-4">
			<div class="mb-3">
				<h3 class="font-semibold text-gray-900">Hourly Programs & Reserves</h3>
			</div>
			<div class="space-y-2 text-sm">
				{#each getLineItems([
					{ label: 'Maintenance', detail: `${formatDecimalHours(calculations.totalFlightTime)} @ ${formatRate(data.costs.hourly.maintenanceProgram)}/hr`, value: calculations.hourly.maintenance },
					{ label: 'Consumables', detail: `${formatDecimalHours(calculations.totalFlightTime)} @ ${formatRate(data.costs.hourly.consumables)}/hr`, value: calculations.hourly.consumables },
					{ label: 'Additional reserve', detail: `${formatDecimalHours(calculations.totalFlightTime)} @ ${formatRate(data.costs.hourly.additionalReserve)}/hr`, value: calculations.hourly.reserve }
				]) as item}
					<div class="line-item">
						<div class="line-item-label">
							<span class="text-gray-600">{item.label}</span>
							{#if item.detail}
								<span class="line-item-detail">{item.detail}</span>
							{/if}
						</div>
						<span class="whitespace-nowrap font-medium text-gray-900">{formatCurrency(item.value)}</span>
					</div>
				{/each}
				<div class="line-item mt-2">
					<span class="font-semibold text-gray-900">Subtotal</span>
					<span class="whitespace-nowrap font-bold text-gray-900">{formatCurrency(calculations.hourly.total)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Fuel -->
	{#if calculations.fuel.total > 0}
		<div class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 sm:p-4">
			<div class="mb-3">
				<h3 class="font-semibold text-gray-900">Fuel</h3>
			</div>
			<div class="space-y-2 text-sm">
				{#each getLineItems([
					{ label: 'Flight fuel', detail: `${Math.round(calculations.fuel.gallons).toLocaleString()} gal @ ${formatRate(data.costs.fuel.pricePerGallon)}/gal`, value: calculations.fuel.burnCost },
					{ label: 'APU', detail: `${Math.round(calculations.fuel.apuGallons).toLocaleString()} gal @ ${formatRate(data.costs.fuel.pricePerGallon)}/gal`, value: calculations.fuel.apuCost }
				]) as item}
					<div class="line-item">
						<div class="line-item-label">
							<span class="text-gray-600">{item.label}</span>
							{#if item.detail}
								<span class="line-item-detail">{item.detail}</span>
							{/if}
						</div>
						<span class="whitespace-nowrap font-medium text-gray-900">{formatCurrency(item.value)}</span>
					</div>
				{/each}
				<div class="line-item mt-2">
					<span class="font-semibold text-gray-900">Subtotal</span>
					<span class="whitespace-nowrap font-bold text-gray-900">{formatCurrency(calculations.fuel.total)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Airport & Ground -->
	{#if calculations.airport.total > 0}
		<div class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 sm:p-4">
			<div class="mb-3">
				<h3 class="font-semibold text-gray-900">Airport & Ground</h3>
			</div>
			<div class="space-y-2 text-sm">
				{#each getLineItems([
					{ label: 'Landing fees', value: calculations.airport.landingFees },
					{ label: 'Catering', value: calculations.airport.catering },
					{ label: 'Ground handling', value: calculations.airport.handling },
					{ label: 'Passenger transport', value: calculations.airport.passengerTransport },
					{ label: 'Facility fees', value: calculations.airport.facilityFees },
					{ label: 'Special event fees', value: calculations.airport.specialEventFees },
					{ label: 'Ramp parking', value: calculations.airport.rampParking },
					{ label: 'Customs', value: calculations.airport.customs },
					{ label: 'Hangar', value: calculations.airport.hangar }
				]) as item}
					<div class="line-item">
						<div class="line-item-label">
							<span class="text-gray-600">{item.label}</span>
							{#if item.detail}
								<span class="line-item-detail">{item.detail}</span>
							{/if}
						</div>
						<span class="whitespace-nowrap font-medium text-gray-900">{formatCurrency(item.value)}</span>
					</div>
				{/each}
				<div class="line-item mt-2">
					<span class="font-semibold text-gray-900">Subtotal</span>
					<span class="whitespace-nowrap font-bold text-gray-900">{formatCurrency(calculations.airport.total)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Miscellaneous -->
	{#if calculations.misc.total > 0}
		<div class="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200 sm:p-4">
			<div class="mb-3">
				<h3 class="font-semibold text-gray-900">Miscellaneous</h3>
			</div>
			<div class="space-y-2 text-sm">
				{#each getLineItems([
					{ label: 'Trip coordination', value: calculations.misc.tripCoordination },
					{ label: 'Other', value: calculations.misc.other }
				]) as item}
					<div class="line-item">
						<div class="line-item-label">
							<span class="text-gray-600">{item.label}</span>
							{#if item.detail}
								<span class="line-item-detail">{item.detail}</span>
							{/if}
						</div>
						<span class="whitespace-nowrap font-medium text-gray-900">{formatCurrency(item.value)}</span>
					</div>
				{/each}
				<div class="line-item mt-2">
					<span class="font-semibold text-gray-900">Subtotal</span>
					<span class="whitespace-nowrap font-bold text-gray-900">{formatCurrency(calculations.misc.total)}</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- Grand Total -->
	<div class="rounded-xl bg-gray-100 p-6">
		<div class="flex items-center justify-between">
			<span class="text-lg font-semibold text-gray-900">Total Estimate</span>
			<span class="text-xl font-bold text-gray-900">{formatCurrency(calculations.grandTotal)}</span>
		</div>
	</div>
</div>
