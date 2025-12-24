import { writable, derived } from 'svelte/store';
import type { EstimateData, FlightLeg, CrewMember, CostCategory } from '$lib/types/database';

function generateId(): string {
	return crypto.randomUUID();
}

function createDefaultLeg(): FlightLeg {
	return {
		id: generateId(),
		origin: '',
		destination: '',
		flightTimeHours: 0,
		flightTimeMinutes: 0,
		fuelBurn: 0
	};
}

function createDefaultCrew(): CrewMember {
	return {
		id: generateId(),
		role: 'pilot',
		dailyRate: 800
	};
}

function createDefaultCosts(): CostCategory {
	return {
		crew: {
			hotelPerNight: 200,
			numberOfNights: 1,
			mealsPerDay: 75,
			numberOfDays: 1,
			perPersonExpenses: 0,
			rentalCar: 0,
			airfare: 0,
			mileage: 0
		},
		hourly: {
			maintenanceProgram: 150,
			consumables: 25,
			additionalReserve: 0
		},
		fuel: {
			pricePerGallon: 5.5,
			includeApuBurn: false,
			apuBurnPerHour: 50
		},
		airport: {
			landingFees: 0,
			catering: 0,
			handling: 0,
			passengerTransport: 0,
			facilityFees: 0,
			specialEventFees: 0,
			rampParking: 0,
			customs: 0,
			hangar: 0
		},
		misc: {
			tripCoordination: 0,
			other: 0
		}
	};
}

function createDefaultEstimate(): EstimateData {
	return {
		legs: [createDefaultLeg()],
		crew: [createDefaultCrew()],
		costs: createDefaultCosts(),
		notes: '',
		profileId: null
	};
}

interface CalculatorStore {
	estimate: EstimateData;
	savedId: string | null;
	savedName: string | null;
	hasUnsavedChanges: boolean;
	originalEstimate: EstimateData | null;
}

const initialState: CalculatorStore = {
	estimate: createDefaultEstimate(),
	savedId: null,
	savedName: null,
	hasUnsavedChanges: false,
	originalEstimate: null
};

function createCalculatorStore() {
	const { subscribe, set, update } = writable<CalculatorStore>(initialState);

	function markChanged() {
		update((state) => ({ ...state, hasUnsavedChanges: true }));
	}

	return {
		subscribe,

		// Leg operations
		addLeg: () => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					legs: [...state.estimate.legs, createDefaultLeg()]
				},
				hasUnsavedChanges: true
			}));
		},

		removeLeg: (id: string) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					legs: state.estimate.legs.filter((leg) => leg.id !== id)
				},
				hasUnsavedChanges: true
			}));
		},

		updateLeg: (id: string, updates: Partial<FlightLeg>) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					legs: state.estimate.legs.map((leg) => (leg.id === id ? { ...leg, ...updates } : leg))
				},
				hasUnsavedChanges: true
			}));
		},

		// Crew operations
		addCrew: () => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					crew: [...state.estimate.crew, createDefaultCrew()]
				},
				hasUnsavedChanges: true
			}));
		},

		removeCrew: (id: string) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					crew: state.estimate.crew.filter((member) => member.id !== id)
				},
				hasUnsavedChanges: true
			}));
		},

		updateCrew: (id: string, updates: Partial<CrewMember>) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					crew: state.estimate.crew.map((member) =>
						member.id === id ? { ...member, ...updates } : member
					)
				},
				hasUnsavedChanges: true
			}));
		},

		// Cost operations
		updateCosts: <K extends keyof CostCategory>(
			category: K,
			updates: Partial<CostCategory[K]>
		) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					costs: {
						...state.estimate.costs,
						[category]: {
							...state.estimate.costs[category],
							...updates
						}
					}
				},
				hasUnsavedChanges: true
			}));
		},

		// Notes
		updateNotes: (notes: string) => {
			update((state) => ({
				...state,
				estimate: { ...state.estimate, notes },
				hasUnsavedChanges: true
			}));
		},

		// Profile
		setProfile: (profileId: string | null) => {
			update((state) => ({
				...state,
				estimate: { ...state.estimate, profileId },
				hasUnsavedChanges: true
			}));
		},

		// Load/Save
		loadEstimate: (id: string, name: string, data: EstimateData) => {
			update(() => ({
				estimate: data,
				savedId: id,
				savedName: name,
				hasUnsavedChanges: false,
				originalEstimate: JSON.parse(JSON.stringify(data))
			}));
		},

		markSaved: (id: string, name: string) => {
			update((state) => ({
				...state,
				savedId: id,
				savedName: name,
				hasUnsavedChanges: false,
				originalEstimate: JSON.parse(JSON.stringify(state.estimate))
			}));
		},

		discardChanges: () => {
			update((state) => {
				if (state.originalEstimate) {
					return {
						...state,
						estimate: JSON.parse(JSON.stringify(state.originalEstimate)),
						hasUnsavedChanges: false
					};
				}
				return state;
			});
		},

		reset: () => {
			set({
				estimate: createDefaultEstimate(),
				savedId: null,
				savedName: null,
				hasUnsavedChanges: false,
				originalEstimate: null
			});
		},

		// Apply profile defaults
		applyProfileDefaults: (defaults: {
			fuelBurnPerHour?: number;
			pilotRate?: number;
			attendantRate?: number;
			hotelRate?: number;
			mealsRate?: number;
			maintenanceRate?: number;
			apuBurn?: number;
			fuelPrice?: number;
		}) => {
			update((state) => ({
				...state,
				estimate: {
					...state.estimate,
					costs: {
						...state.estimate.costs,
						crew: {
							...state.estimate.costs.crew,
							hotelPerNight: defaults.hotelRate ?? state.estimate.costs.crew.hotelPerNight,
							mealsPerDay: defaults.mealsRate ?? state.estimate.costs.crew.mealsPerDay
						},
						hourly: {
							...state.estimate.costs.hourly,
							maintenanceProgram:
								defaults.maintenanceRate ?? state.estimate.costs.hourly.maintenanceProgram
						},
						fuel: {
							...state.estimate.costs.fuel,
							pricePerGallon: defaults.fuelPrice ?? state.estimate.costs.fuel.pricePerGallon,
							apuBurnPerHour: defaults.apuBurn ?? state.estimate.costs.fuel.apuBurnPerHour
						}
					},
					crew: state.estimate.crew.map((member) => ({
						...member,
						dailyRate:
							member.role === 'pilot'
								? (defaults.pilotRate ?? member.dailyRate)
								: (defaults.attendantRate ?? member.dailyRate)
					}))
				},
				hasUnsavedChanges: true
			}));
		}
	};
}

export const calculator = createCalculatorStore();

// Derived stores for calculations
export const totalFlightTime = derived(calculator, ($calc) => {
	return $calc.estimate.legs.reduce((total, leg) => {
		return total + leg.flightTimeHours + leg.flightTimeMinutes / 60;
	}, 0);
});

export const totalFuelBurn = derived(calculator, ($calc) => {
	return $calc.estimate.legs.reduce((total, leg) => total + leg.fuelBurn, 0);
});

export const crewCount = derived(calculator, ($calc) => ({
	pilots: $calc.estimate.crew.filter((m) => m.role === 'pilot').length,
	attendants: $calc.estimate.crew.filter((m) => m.role === 'attendant').length,
	total: $calc.estimate.crew.length
}));

export const costBreakdown = derived(
	[calculator, totalFlightTime, totalFuelBurn, crewCount],
	([$calc, $flightTime, $fuelBurn, $crewCount]) => {
		const { costs, crew } = $calc.estimate;

		// Crew costs
		const totalDailyRates = crew.reduce((sum, m) => sum + m.dailyRate, 0);
		const crewCost =
			totalDailyRates * costs.crew.numberOfDays +
			costs.crew.hotelPerNight * costs.crew.numberOfNights * $crewCount.total +
			costs.crew.mealsPerDay * costs.crew.numberOfDays * $crewCount.total +
			costs.crew.perPersonExpenses * $crewCount.total +
			costs.crew.rentalCar +
			costs.crew.airfare +
			costs.crew.mileage;

		// Hourly costs
		const hourlyCost =
			(costs.hourly.maintenanceProgram + costs.hourly.consumables + costs.hourly.additionalReserve) *
			$flightTime;

		// Fuel costs
		let fuelGallons = $fuelBurn;
		if (costs.fuel.includeApuBurn) {
			fuelGallons += costs.fuel.apuBurnPerHour * $flightTime;
		}
		const fuelCost = fuelGallons * costs.fuel.pricePerGallon;

		// Airport costs
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

		// Misc costs
		const miscCost = costs.misc.tripCoordination + costs.misc.other;

		const total = crewCost + hourlyCost + fuelCost + airportCost + miscCost;

		return {
			crew: crewCost,
			hourly: hourlyCost,
			fuel: fuelCost,
			airport: airportCost,
			misc: miscCost,
			total,
			fuelGallons
		};
	}
);
