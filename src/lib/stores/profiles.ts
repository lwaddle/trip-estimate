import { writable, derived } from 'svelte/store';
import type { AircraftProfile } from '$lib/types/database';

// Preset profiles
const PRESET_PROFILES: AircraftProfile[] = [
	{
		id: 'jet-large',
		name: 'Large Jet',
		type: 'jet-large',
		imageUrl: null,
		defaults: {
			fuelBurnPerHour: 350,
			pilotRate: 1000,
			attendantRate: 600,
			hotelRate: 250,
			mealsRate: 100,
			maintenanceRate: 250,
			apuBurn: 80,
			fuelPrice: 5.5
		},
		isCustom: false,
		isDefault: false
	},
	{
		id: 'jet-medium',
		name: 'Medium Jet',
		type: 'jet-medium',
		imageUrl: null,
		defaults: {
			fuelBurnPerHour: 250,
			pilotRate: 900,
			attendantRate: 550,
			hotelRate: 225,
			mealsRate: 85,
			maintenanceRate: 200,
			apuBurn: 60,
			fuelPrice: 5.5
		},
		isCustom: false,
		isDefault: false
	},
	{
		id: 'jet-small',
		name: 'Small Jet',
		type: 'jet-small',
		imageUrl: null,
		defaults: {
			fuelBurnPerHour: 180,
			pilotRate: 800,
			attendantRate: 500,
			hotelRate: 200,
			mealsRate: 75,
			maintenanceRate: 150,
			apuBurn: 50,
			fuelPrice: 5.5
		},
		isCustom: false,
		isDefault: true
	},
	{
		id: 'turboprop-twin',
		name: 'Twin Turboprop',
		type: 'turboprop-twin',
		imageUrl: null,
		defaults: {
			fuelBurnPerHour: 120,
			pilotRate: 700,
			attendantRate: 450,
			hotelRate: 175,
			mealsRate: 65,
			maintenanceRate: 100,
			apuBurn: 30,
			fuelPrice: 5.5
		},
		isCustom: false,
		isDefault: false
	},
	{
		id: 'turboprop-single',
		name: 'Single Turboprop',
		type: 'turboprop-single',
		imageUrl: null,
		defaults: {
			fuelBurnPerHour: 60,
			pilotRate: 600,
			attendantRate: 400,
			hotelRate: 150,
			mealsRate: 55,
			maintenanceRate: 75,
			apuBurn: 0,
			fuelPrice: 5.5
		},
		isCustom: false,
		isDefault: false
	}
];

interface ProfilesStore {
	profiles: AircraftProfile[];
	selectedId: string | null;
	editingProfile: AircraftProfile | null;
	loading: boolean;
}

const initialState: ProfilesStore = {
	profiles: [...PRESET_PROFILES],
	selectedId: 'jet-small',
	editingProfile: null,
	loading: false
};

function createProfilesStore() {
	const { subscribe, set, update } = writable<ProfilesStore>(initialState);

	return {
		subscribe,

		// Selection
		select: (id: string | null) => {
			update((state) => ({ ...state, selectedId: id }));
		},

		// Load from database
		loadProfiles: (customProfiles: AircraftProfile[], defaultId: string | null) => {
			update((state) => ({
				...state,
				profiles: [...PRESET_PROFILES, ...customProfiles],
				selectedId: defaultId || state.selectedId,
				loading: false
			}));
		},

		// Add custom profile
		addProfile: (profile: AircraftProfile) => {
			update((state) => ({
				...state,
				profiles: [...state.profiles, profile]
			}));
		},

		// Update profile
		updateProfile: (id: string, updates: Partial<AircraftProfile>) => {
			update((state) => ({
				...state,
				profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p))
			}));
		},

		// Delete profile
		deleteProfile: (id: string) => {
			update((state) => ({
				...state,
				profiles: state.profiles.filter((p) => p.id !== id),
				selectedId: state.selectedId === id ? 'jet-small' : state.selectedId
			}));
		},

		// Duplicate profile
		duplicateProfile: (id: string) => {
			update((state) => {
				const original = state.profiles.find((p) => p.id === id);
				if (!original) return state;

				const newProfile: AircraftProfile = {
					...original,
					id: crypto.randomUUID(),
					name: `${original.name} (Copy)`,
					isCustom: true,
					isDefault: false
				};

				return {
					...state,
					profiles: [...state.profiles, newProfile]
				};
			});
		},

		// Set default profile
		setDefault: (id: string) => {
			update((state) => ({
				...state,
				profiles: state.profiles.map((p) => ({
					...p,
					isDefault: p.id === id
				}))
			}));
		},

		// Edit mode
		startEditing: (profile: AircraftProfile | null) => {
			update((state) => ({ ...state, editingProfile: profile }));
		},

		stopEditing: () => {
			update((state) => ({ ...state, editingProfile: null }));
		},

		// Loading state
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},

		// Reset
		reset: () => set(initialState),

		// Get preset profiles
		getPresets: () => PRESET_PROFILES
	};
}

export const profiles = createProfilesStore();

export const selectedProfile = derived(profiles, ($profiles) => {
	return $profiles.profiles.find((p) => p.id === $profiles.selectedId) || null;
});

export const customProfiles = derived(profiles, ($profiles) => {
	return $profiles.profiles.filter((p) => p.isCustom);
});

export const defaultProfile = derived(profiles, ($profiles) => {
	return $profiles.profiles.find((p) => p.isDefault) || PRESET_PROFILES[2];
});
