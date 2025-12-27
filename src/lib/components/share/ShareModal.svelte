<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { calculator, ui, auth } from '$lib/stores';
	import { Modal, Button, Input } from '$lib/components/ui';

	let shareUrl = $state('');
	let loading = $state(false);
	let copied = $state(false);
	let error = $state('');

	const supabase = createSupabaseClient();

	// Get the estimate ID and name from either shareContext or calculator store
	const estimateId = $derived($ui.shareContext?.estimateId ?? $calculator.savedId);
	const estimateName = $derived($ui.shareContext?.estimateName ?? $calculator.savedName ?? 'Shared Estimate');

	// Generate share link when modal opens
	$effect(() => {
		if ($ui.modals.share && estimateId) {
			generateShareLink();
		}
	});

	function handleClose() {
		ui.closeModal('share');
		shareUrl = '';
		error = '';
	}

	async function generateShareLink() {
		if (!estimateId || !$auth.user) return;

		loading = true;
		error = '';

		try {
			// Check if share already exists
			const { data: existing } = await supabase
				.from('estimate_shares')
				.select('share_token')
				.eq('estimate_id', estimateId)
				.single();

			if (existing) {
				shareUrl = `${window.location.origin}/share/${existing.share_token}`;
			} else {
				// Create new share
				const { data, error: createError } = await supabase
					.from('estimate_shares')
					.insert({
						estimate_id: estimateId,
						user_id: $auth.user.id,
						share_name: estimateName
					})
					.select('share_token')
					.single();

				if (createError) throw createError;

				shareUrl = `${window.location.origin}/share/${data.share_token}`;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate share link';
		} finally {
			loading = false;
		}
	}

	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copied = true;
			ui.showToast('Link copied to clipboard', 'success');
			setTimeout(() => {
				copied = false;
			}, 2000);
		} catch {
			ui.showToast('Failed to copy link', 'error');
		}
	}

	function handleEmail() {
		const subject = encodeURIComponent(`Trip Estimate: ${estimateName}`);
		const body = encodeURIComponent(`Here's a trip estimate I wanted to share with you:\n\n${shareUrl}`);
		window.open(`mailto:?subject=${subject}&body=${body}`);
	}

	async function handleNativeShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: `Trip Estimate: ${estimateName}`,
					url: shareUrl
				});
			} catch {
				// User cancelled or share failed
			}
		}
	}
</script>

<Modal open={$ui.modals.share} title="Share Estimate" size="md" onClose={handleClose}>
	{#if loading}
		<div class="flex items-center justify-center py-8">
			<svg class="h-8 w-8 animate-spin text-red-700" fill="none" viewBox="0 0 24 24">
				<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
				<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
			</svg>
		</div>
	{:else if error}
		<div class="rounded-lg bg-red-50 p-4 text-red-700">
			{error}
		</div>
	{:else}
		<div class="space-y-4">
			<p class="text-sm text-gray-600">
				Anyone with this link can view this estimate (read-only).
			</p>

			<div class="flex gap-2">
				<Input
					value={shareUrl}
					readonly
					class="flex-1 bg-gray-50"
					onclick={(e) => e.currentTarget.select()}
				/>
				<Button onclick={handleCopy} variant={copied ? 'primary' : 'secondary'}>
					{#if copied}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{:else}
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
						</svg>
					{/if}
					{copied ? 'Copied!' : 'Copy'}
				</Button>
			</div>

			<div class="flex gap-2 border-t border-gray-200 pt-4">
				<Button variant="secondary" class="flex-1" onclick={handleEmail}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
					Email
				</Button>
				{#if typeof navigator !== 'undefined' && navigator.share}
					<Button variant="secondary" class="flex-1" onclick={handleNativeShare}>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
						Share
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</Modal>
