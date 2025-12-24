<script lang="ts">
	import { ui } from '$lib/stores';
	import Toast from './Toast.svelte';
</script>

<div class="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
	{#each $ui.toasts as toast (toast.id)}
		<Toast {toast} />
	{/each}
</div>
