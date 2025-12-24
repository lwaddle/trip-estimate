<script lang="ts">
	import Modal from './Modal.svelte';

	interface Props {
		open: boolean;
		title?: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'danger' | 'warning' | 'default';
		loading?: boolean;
		onConfirm: () => void | Promise<void>;
		onCancel: () => void;
	}

	let {
		open,
		title = 'Confirm',
		message,
		confirmText = 'Confirm',
		cancelText = 'Cancel',
		variant = 'default',
		loading = false,
		onConfirm,
		onCancel
	}: Props = $props();

	const buttonVariants = {
		danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
		warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
		default: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
	};

	async function handleConfirm() {
		await onConfirm();
	}
</script>

<Modal {open} {title} size="sm" onClose={onCancel}>
	<p class="text-gray-600">{message}</p>

	{#snippet footer()}
		<div class="flex justify-end gap-3">
			<button
				type="button"
				onclick={onCancel}
				disabled={loading}
				class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{cancelText}
			</button>
			<button
				type="button"
				onclick={handleConfirm}
				disabled={loading}
				class="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 {buttonVariants[variant]}"
			>
				{#if loading}
					<span class="flex items-center gap-2">
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
						Processing...
					</span>
				{:else}
					{confirmText}
				{/if}
			</button>
		</div>
	{/snippet}
</Modal>
