<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends HTMLSelectAttributes {
		label?: string;
		error?: string;
		children?: Snippet;
	}

	let { label, error, id, class: className = '', children, ...rest }: Props = $props();

	const selectId = $derived(id || `select-${crypto.randomUUID().slice(0, 8)}`);
</script>

<div class="w-full">
	{#if label}
		<label for={selectId} class="mb-1 block text-sm font-medium text-gray-700">
			{label}
		</label>
	{/if}
	<select
		id={selectId}
		class="block w-full rounded-lg border bg-white px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 {error
			? 'border-red-300 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-red-500 focus:ring-red-500'} {className}"
		{...rest}
	>
		{#if children}
			{@render children()}
		{/if}
	</select>
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
</div>
