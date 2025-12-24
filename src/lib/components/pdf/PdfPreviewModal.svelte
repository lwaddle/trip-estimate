<script lang="ts">
	import { browser } from '$app/environment';
	import { calculator, ui } from '$lib/stores';
	import { Modal, Button } from '$lib/components/ui';
	import { downloadPDF, getPDFDataUrl } from '$lib/utils/pdf';

	let pdfUrl = $state('');
	let loading = $state(false);

	// Generate preview when modal opens
	$effect(() => {
		if ($ui.modals.pdfPreview && browser) {
			loading = true;
			// Small delay to let modal render
			setTimeout(() => {
				try {
					const name = $calculator.savedName || 'New Estimate';
					pdfUrl = getPDFDataUrl(name, $calculator.estimate);
				} catch (err) {
					ui.showToast('Failed to generate PDF preview', 'error');
				} finally {
					loading = false;
				}
			}, 100);
		}
	});

	function handleClose() {
		ui.closeModal('pdfPreview');
		pdfUrl = '';
	}

	function handleDownload() {
		try {
			const name = $calculator.savedName || 'New Estimate';
			downloadPDF(name, $calculator.estimate);
			ui.showToast('PDF downloaded', 'success');
		} catch (err) {
			ui.showToast('Failed to download PDF', 'error');
		}
	}
</script>

<Modal open={$ui.modals.pdfPreview} title="PDF Preview" size="xl" onClose={handleClose}>
	{#if loading}
		<div class="flex items-center justify-center py-20">
			<svg class="h-8 w-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if pdfUrl}
		<div class="space-y-4">
			<iframe
				src={pdfUrl}
				class="h-[60vh] w-full rounded-lg border border-gray-200"
				title="PDF Preview"
			></iframe>

			<div class="flex justify-end gap-3">
				<Button variant="secondary" onclick={handleClose}>
					Close
				</Button>
				<Button onclick={handleDownload}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
					</svg>
					Download PDF
				</Button>
			</div>
		</div>
	{/if}
</Modal>
