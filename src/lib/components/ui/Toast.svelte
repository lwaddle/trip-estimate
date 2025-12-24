<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import { ui } from '$lib/stores';
	import type { Toast } from '$lib/stores/ui';

	interface Props {
		toast: Toast;
	}

	let { toast }: Props = $props();

	const iconPaths = {
		success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
		error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
		warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
		info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
	};

	const colorClasses = {
		success: 'bg-green-50 text-green-800 border-green-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
		info: 'bg-blue-50 text-blue-800 border-blue-200'
	};

	const iconColors = {
		success: 'text-green-500',
		error: 'text-red-500',
		warning: 'text-yellow-500',
		info: 'text-blue-500'
	};
</script>

<div
	class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg {colorClasses[toast.type]}"
	role="alert"
	in:fly={{ x: 100, duration: 200 }}
	out:fade={{ duration: 150 }}
>
	<svg class="h-5 w-5 shrink-0 {iconColors[toast.type]}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
		<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={iconPaths[toast.type]} />
	</svg>
	<p class="flex-1 text-sm font-medium">{toast.message}</p>
	<button
		type="button"
		onclick={() => ui.dismissToast(toast.id)}
		class="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
		aria-label="Dismiss"
	>
		<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	</button>
</div>
