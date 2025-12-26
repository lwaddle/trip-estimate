import { writable, derived } from 'svelte/store';
import type { AircraftProfile } from '$lib/types/database';

// Standard built-in profile
const STANDARD_PROFILE: AircraftProfile = {
	id: 'standard',
	name: 'Standard',
	imageUrl: null,
	defaults: {
		fuelPrice: 5.5,
		fuelDensity: 6.7,
		pilotsRequired: 2,
		pilotRate: 1400,
		attendantsRequired: 0,
		attendantRate: 500,
		hotelRate: 200,
		mealsRate: 75,
		maintenanceRate: 600,
		apuBurnPerLeg: 0
	},
	isCustom: false,
	isDefault: true
};

interface ProfilesStore {
	profiles: AircraftProfile[];
	selectedId: string | null;
	editingProfile: AircraftProfile | null;
	loading: boolean;
}

const initialState: ProfilesStore = {
	profiles: [STANDARD_PROFILE],
	selectedId: 'standard',
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
				profiles: [STANDARD_PROFILE, ...customProfiles],
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
				selectedId: state.selectedId === id ? 'standard' : state.selectedId
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

		// Get standard profile
		getStandardProfile: () => STANDARD_PROFILE
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
	return $profiles.profiles.find((p) => p.isDefault) || STANDARD_PROFILE;
});
