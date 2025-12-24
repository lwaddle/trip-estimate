<script lang="ts">
	import { calculator } from '$lib/stores';

	function handleChange(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		calculator.updateNotes(target.value);
	}
</script>

<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
	<h2 class="mb-4 text-lg font-semibold text-gray-900">Trip Notes</h2>
	<textarea
		value={$calculator.estimate.notes}
		oninput={handleChange}
		placeholder="Add notes about this trip..."
		rows="4"
		class="block w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
	></textarea>
</div>
