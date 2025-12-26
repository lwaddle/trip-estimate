import { writable, derived, get } from 'svelte/store';
import type { AircraftProfile } from '$lib/types/database';
import { loadUserProfiles, saveUserProfiles } from '$lib/services/profilesDb';

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
	userId: string | null;
}

const initialState: ProfilesStore = {
	profiles: [STANDARD_PROFILE],
	selectedId: 'standard',
	editingProfile: null,
	loading: false,
	userId: null
};

function createProfilesStore() {
	const { subscribe, set, update } = writable<ProfilesStore>(initialState);

	// Helper to persist to database
	async function persistToDb() {
		const state = get({ subscribe });
		if (!state.userId) return;

		const defaultProfile = state.profiles.find((p) => p.isDefault);
		await saveUserProfiles(state.userId, state.profiles, defaultProfile?.id || null);
	}

	return {
		subscribe,

		// Selection
		select: (id: string | null) => {
			update((state) => ({ ...state, selectedId: id }));
		},

		// Load from database
		loadFromDatabase: async (userId: string) => {
			update((state) => ({ ...state, loading: true, userId }));

			const result = await loadUserProfiles(userId);

			if (result) {
				// Determine which profile should be marked as default
				const defaultId = result.defaultId;

				// Update isDefault flag on loaded profiles
				const customProfiles = result.profiles.map((p) => ({
					...p,
					isDefault: p.id === defaultId
				}));

				// Check if Standard should be default
				const standardIsDefault = defaultId === 'standard' || !defaultId;

				update((state) => ({
					...state,
					profiles: [
						{ ...STANDARD_PROFILE, isDefault: standardIsDefault },
						...customProfiles
					],
					selectedId: defaultId || 'standard',
					loading: false
				}));
			} else {
				// No saved profiles, just use Standard
				update((state) => ({
					...state,
					profiles: [STANDARD_PROFILE],
					selectedId: 'standard',
					loading: false
				}));
			}
		},

		// Legacy load method (for compatibility)
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
			persistToDb();
		},

		// Update profile
		updateProfile: (id: string, updates: Partial<AircraftProfile>) => {
			update((state) => ({
				...state,
				profiles: state.profiles.map((p) => (p.id === id ? { ...p, ...updates } : p))
			}));
			persistToDb();
		},

		// Delete profile
		deleteProfile: (id: string) => {
			update((state) => ({
				...state,
				profiles: state.profiles.filter((p) => p.id !== id),
				selectedId: state.selectedId === id ? 'standard' : state.selectedId
			}));
			persistToDb();
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
			persistToDb();
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
			persistToDb();
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

		// Reset (on logout)
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
