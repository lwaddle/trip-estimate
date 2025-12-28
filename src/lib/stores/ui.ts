import { writable, derived } from 'svelte/store';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
}

interface ModalState {
	signIn: boolean;
	passwordReset: boolean;
	saveEstimate: boolean;
	deleteConfirm: boolean;
	share: boolean;
	profileEditor: boolean;
	pdfPreview: boolean;
}

interface ShareContext {
	estimateId: string;
	estimateName: string;
}

interface UIState {
	modals: ModalState;
	toasts: Toast[];
	mobileMenuOpen: boolean;
	currentView: 'calculator' | 'estimates' | 'profiles';
	shareContext: ShareContext | null;
}

const initialState: UIState = {
	modals: {
		signIn: false,
		passwordReset: false,
		saveEstimate: false,
		deleteConfirm: false,
		share: false,
		profileEditor: false,
		pdfPreview: false
	},
	toasts: [],
	mobileMenuOpen: false,
	currentView: 'calculator',
	shareContext: null
};

function createUIStore() {
	const { subscribe, set, update } = writable<UIState>(initialState);

	let toastId = 0;

	return {
		subscribe,

		openModal: (modal: keyof ModalState) => {
			update((state) => ({
				...state,
				modals: { ...state.modals, [modal]: true }
			}));
		},

		closeModal: (modal: keyof ModalState) => {
			update((state) => ({
				...state,
				modals: { ...state.modals, [modal]: false },
				// Clear share context when closing share modal
				shareContext: modal === 'share' ? null : state.shareContext
			}));
		},

		closeAllModals: () => {
			update((state) => ({
				...state,
				modals: initialState.modals,
				shareContext: null
			}));
		},

		openShareModal: (estimateId: string, estimateName: string) => {
			update((state) => ({
				...state,
				shareContext: { estimateId, estimateName },
				modals: { ...state.modals, share: true }
			}));
		},

		showToast: (message: string, type: ToastType = 'info', duration = 4000) => {
			const id = `toast-${++toastId}`;
			const toast: Toast = { id, message, type, duration };

			update((state) => ({
				...state,
				toasts: [...state.toasts, toast]
			}));

			if (duration > 0) {
				setTimeout(() => {
					update((state) => ({
						...state,
						toasts: state.toasts.filter((t) => t.id !== id)
					}));
				}, duration);
			}

			return id;
		},

		dismissToast: (id: string) => {
			update((state) => ({
				...state,
				toasts: state.toasts.filter((t) => t.id !== id)
			}));
		},

		toggleMobileMenu: () => {
			update((state) => ({
				...state,
				mobileMenuOpen: !state.mobileMenuOpen
			}));
		},

		closeMobileMenu: () => {
			update((state) => ({
				...state,
				mobileMenuOpen: false
			}));
		},

		setView: (view: UIState['currentView']) => {
			update((state) => ({
				...state,
				currentView: view,
				mobileMenuOpen: false
			}));
		},

		reset: () => set(initialState)
	};
}

export const ui = createUIStore();

export const activeModal = derived(ui, ($ui) => {
	const entries = Object.entries($ui.modals) as [keyof ModalState, boolean][];
	const active = entries.find(([, isOpen]) => isOpen);
	return active ? active[0] : null;
});

export const hasOpenModal = derived(ui, ($ui) => Object.values($ui.modals).some((open) => open));
