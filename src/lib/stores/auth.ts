import { writable, derived } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
	user: User | null;
	session: Session | null;
	loading: boolean;
	initialized: boolean;
}

const initialState: AuthState = {
	user: null,
	session: null,
	loading: true,
	initialized: false
};

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>(initialState);

	return {
		subscribe,
		setSession: (session: Session | null) => {
			update((state) => ({
				...state,
				session,
				user: session?.user ?? null,
				loading: false,
				initialized: true
			}));
		},
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},
		reset: () => {
			set({ ...initialState, loading: false, initialized: true });
		}
	};
}

export const auth = createAuthStore();

export const isAuthenticated = derived(auth, ($auth) => !!$auth.user);
export const isLoading = derived(auth, ($auth) => $auth.loading);
export const currentUser = derived(auth, ($auth) => $auth.user);
