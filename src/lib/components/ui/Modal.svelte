<script lang="ts">
	import { fade, fly } from 'svelte/transition';

	interface Props {
		open: boolean;
		title?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onClose?: () => void;
		children?: import('svelte').Snippet;
		footer?: import('svelte').Snippet;
	}

	let { open, title, size = 'md', onClose, children, footer }: Props = $props();

	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg',
		xl: 'max-w-xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && onClose) {
			onClose();
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget && onClose) {
			onClose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'modal-title' : undefined}
		transition:fade={{ duration: 150 }}
	>
		<!-- Backdrop -->
		<div
			class="absolute inset-0 bg-black/50 backdrop-blur-sm"
			onclick={handleBackdropClick}
			role="presentation"
		></div>

		<!-- Modal -->
		<div
			class="relative w-full {sizeClasses[size]} rounded-xl bg-white shadow-2xl"
			transition:fly={{ y: 20, duration: 200 }}
		>
			<!-- Header -->
			{#if title || onClose}
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					{#if title}
						<h2 id="modal-title" class="text-lg font-semibold text-gray-900">{title}</h2>
					{/if}
					{#if onClose}
						<button
							type="button"
							onclick={onClose}
							class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
							aria-label="Close modal"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<!-- Body -->
			<div class="px-6 py-4">
				{#if children}
					{@render children()}
				{/if}
			</div>

			<!-- Footer -->
			{#if footer}
				<div class="border-t border-gray-200 px-6 py-4">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
