<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { calculator, ui, auth } from '$lib/stores';
	import { Modal, Button, Input } from '$lib/components/ui';

	let name = $state($calculator.savedName || '');
	let loading = $state(false);
	let error = $state('');

	const supabase = createSupabaseClient();

	// Reset form when modal opens
	$effect(() => {
		if ($ui.modals.saveEstimate) {
			name = $calculator.savedName || '';
			error = '';
		}
	});

	function handleClose() {
		ui.closeModal('saveEstimate');
	}

	async function handleSave(e: SubmitEvent) {
		e.preventDefault();

		if (!name.trim()) {
			error = 'Please enter a name';
			return;
		}

		if (!$auth.user) {
			error = 'You must be signed in';
			return;
		}

		loading = true;
		error = '';

		try {
			const estimateData = $calculator.estimate;

			if ($calculator.savedId) {
				// Update existing
				const { error: updateError } = await supabase
					.from('estimates')
					.update({
						name: name.trim(),
						estimate_data: estimateData
					})
					.eq('id', $calculator.savedId);

				if (updateError) throw updateError;

				calculator.markSaved($calculator.savedId, name.trim());
				ui.showToast('Estimate updated', 'success');
			} else {
				// Create new
				const { data, error: insertError } = await supabase
					.from('estimates')
					.insert({
						user_id: $auth.user.id,
						name: name.trim(),
						estimate_data: estimateData,
						creator_email: $auth.user.email
					})
					.select()
					.single();

				if (insertError) throw insertError;

				calculator.markSaved(data.id, name.trim());
				ui.showToast('Estimate saved', 'success');
			}

			handleClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save estimate';
		} finally {
			loading = false;
		}
	}
</script>

<Modal open={$ui.modals.saveEstimate} title="Save Estimate" size="sm" onClose={handleClose}>
	<form onsubmit={handleSave} class="space-y-4">
		{#if error}
			<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
				{error}
			</div>
		{/if}

		<Input
			label="Estimate Name"
			bind:value={name}
			placeholder="e.g., NYC to LA - March 2025"
			required
			autofocus
		/>

		<div class="flex justify-end gap-3">
			<Button type="button" variant="secondary" onclick={handleClose} disabled={loading}>
				Cancel
			</Button>
			<Button type="submit" {loading}>
				{$calculator.savedId ? 'Update' : 'Save'}
			</Button>
		</div>
	</form>
</Modal>
