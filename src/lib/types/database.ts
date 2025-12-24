export interface Database {
	public: {
		Tables: {
			user_defaults: {
				Row: {
					id: string;
					user_id: string;
					fuel_price: number;
					fuel_density: number;
					pilot_rate: number;
					attendant_rate: number;
					hotel_rate: number;
					meals_rate: number;
					maintenance_rate: number;
					apu_burn: number;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<
					Database['public']['Tables']['user_defaults']['Row'],
					'id' | 'created_at' | 'updated_at'
				>;
				Update: Partial<Database['public']['Tables']['user_defaults']['Insert']>;
			};
			estimates: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					estimate_data: EstimateData;
					created_at: string;
					updated_at: string;
					creator_email: string | null;
				};
				Insert: Omit<
					Database['public']['Tables']['estimates']['Row'],
					'id' | 'created_at' | 'updated_at'
				>;
				Update: Partial<Database['public']['Tables']['estimates']['Insert']>;
			};
			estimate_shares: {
				Row: {
					id: string;
					estimate_id: string;
					user_id: string;
					share_token: string;
					share_name: string;
					created_at: string;
					expires_at: string | null;
				};
				Insert: Omit<Database['public']['Tables']['estimate_shares']['Row'], 'id' | 'created_at'>;
				Update: Partial<Database['public']['Tables']['estimate_shares']['Insert']>;
			};
			user_profiles: {
				Row: {
					id: string;
					user_id: string;
					profiles_data: AircraftProfile[];
					default_profile_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: Omit<
					Database['public']['Tables']['user_profiles']['Row'],
					'id' | 'created_at' | 'updated_at'
				>;
				Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
			};
		};
	};
}

export interface FlightLeg {
	id: string;
	origin: string;
	destination: string;
	flightTimeHours: number;
	flightTimeMinutes: number;
	fuelBurn: number;
}

export interface CrewMember {
	id: string;
	role: 'pilot' | 'attendant';
	dailyRate: number;
}

export interface CostCategory {
	crew: {
		hotelPerNight: number;
		numberOfNights: number;
		mealsPerDay: number;
		numberOfDays: number;
		perPersonExpenses: number;
		rentalCar: number;
		airfare: number;
		mileage: number;
	};
	hourly: {
		maintenanceProgram: number;
		consumables: number;
		additionalReserve: number;
	};
	fuel: {
		pricePerGallon: number;
		includeApuBurn: boolean;
		apuBurnPerHour: number;
	};
	airport: {
		landingFees: number;
		catering: number;
		handling: number;
		passengerTransport: number;
		facilityFees: number;
		specialEventFees: number;
		rampParking: number;
		customs: number;
		hangar: number;
	};
	misc: {
		tripCoordination: number;
		other: number;
	};
}

export interface EstimateData {
	legs: FlightLeg[];
	crew: CrewMember[];
	costs: CostCategory;
	notes: string;
	profileId: string | null;
}

export interface AircraftProfile {
	id: string;
	name: string;
	type: 'jet-large' | 'jet-medium' | 'jet-small' | 'turboprop-twin' | 'turboprop-single' | 'custom';
	imageUrl: string | null;
	defaults: {
		fuelBurnPerHour: number;
		pilotRate: number;
		attendantRate: number;
		hotelRate: number;
		mealsRate: number;
		maintenanceRate: number;
		apuBurn: number;
		fuelPrice: number;
	};
	isCustom: boolean;
	isDefault: boolean;
}

export interface CalculatorState {
	currentEstimate: EstimateData;
	savedEstimateId: string | null;
	savedEstimateName: string | null;
	hasUnsavedChanges: boolean;
	selectedProfileId: string | null;
}
