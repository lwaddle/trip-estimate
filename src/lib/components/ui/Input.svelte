<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {
		label?: string;
		error?: string;
		hint?: string;
		value?: string;
	}

	let { label, error, hint, id, value = $bindable(''), class: className = '', ...rest }: Props =
		$props();

	const inputId = $derived(id || `input-${crypto.randomUUID().slice(0, 8)}`);
</script>

<div class="w-full">
	{#if label}
		<label for={inputId} class="mb-1 block text-sm font-medium text-gray-700">
			{label}
		</label>
	{/if}
	<input
		id={inputId}
		bind:value
		class="block w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 {error
			? 'border-red-300 focus:border-red-500 focus:ring-red-500'
			: 'border-gray-300 focus:border-red-500 focus:ring-red-500'} {className}"
		{...rest}
	/>
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{:else if hint}
		<p class="mt-1 text-sm text-gray-500">{hint}</p>
	{/if}
</div>
