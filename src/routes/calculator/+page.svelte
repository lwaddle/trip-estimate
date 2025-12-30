<script lang="ts">
	import { untrack } from 'svelte';
	import { calculator, isAuthenticated, ui, profiles, selectedProfile, defaultProfile } from '$lib/stores';
	import { Button, ConfirmDialog } from '$lib/components/ui';
	import {
		FlightLegs,
		CrewSection,
		CostCategories,
		TotalBreakdown,
		TripNotes
	} from '$lib/components/calculator';

	let showResetConfirm = $state(false);

	// Track if initial profile has been applied for this "session"
	let initialProfileApplied = $state(false);

	// Apply default profile on initial load for new estimates
	$effect(() => {
		const profile = $defaultProfile;
		const profilesLoaded = !$profiles.loading;

		// Use untrack to read savedId without creating a reactive dependency
		// This prevents infinite loops since applyProfileDefaults updates the calculator store
		const savedId = untrack(() => $calculator.savedId);

		// Only apply on initial load for new estimates after profiles are loaded
		if (!initialProfileApplied && savedId === null && profilesLoaded && profile) {
			profiles.select(profile.id);
			calculator.setProfile(profile.id);
			calculator.applyProfileDefaults(profile.defaults);
			initialProfileApplied = true;
		}
	});

	// When loading a saved estimate, mark as applied so we don't override saved values
	$effect(() => {
		if ($calculator.savedId !== null) {
			initialProfileApplied = true;
		}
	});

	function handleSave() {
		if (!$isAuthenticated) {
			ui.openModal('signIn');
			return;
		}
		ui.openModal('saveEstimate');
	}

	function handleShare() {
		if (!$isAuthenticated) {
			ui.openModal('signIn');
			return;
		}
		if (!$calculator.savedId) {
			ui.showToast('Please save the estimate first', 'warning');
			return;
		}
		ui.openModal('share');
	}

	function handleExportPdf() {
		ui.openModal('pdfPreview');
	}

	function handleReset() {
		if ($calculator.hasUnsavedChanges) {
			showResetConfirm = true;
			return;
		}
		calculator.reset();
		initialProfileApplied = false; // Allow default profile to be re-applied
		ui.showToast('Calculator reset', 'info');
	}

	function confirmReset() {
		calculator.reset();
		initialProfileApplied = false; // Allow default profile to be re-applied
		ui.showToast('Calculator reset', 'info');
		showResetConfirm = false;
	}

	function cancelReset() {
		showResetConfirm = false;
	}

	function handleDiscardChanges() {
		calculator.discardChanges();
		ui.showToast('Changes discarded', 'info');
	}

	function handleProfileSelect(e: Event) {
		const target = e.target as HTMLSelectElement;
		const profileId = target.value || null;
		profiles.select(profileId);
		calculator.setProfile(profileId);

		if (profileId) {
			const profile = $profiles.profiles.find((p) => p.id === profileId);
			if (profile) {
				calculator.applyProfileDefaults(profile.defaults);
				ui.showToast(`Applied ${profile.name} defaults`, 'success');
			}
		}
	}

	function handleNewProfile() {
		profiles.startEditing(null);
		ui.openModal('profileEditor');
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">
				{#if $calculator.savedName}
					{$calculator.savedName}
				{:else}
					New Estimate
				{/if}
			</h1>
			{#if $calculator.hasUnsavedChanges}
				<p class="mt-1 flex items-center gap-2 text-sm text-amber-600">
					<span class="h-2 w-2 rounded-full bg-amber-500"></span>
					Unsaved changes
					<button type="button" onclick={handleDiscardChanges} class="underline hover:no-underline">
						Discard
					</button>
				</p>
			{/if}
		</div>

		<div class="flex flex-wrap items-center gap-3">
			<Button variant="secondary" onclick={handleReset}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Reset
			</Button>

			<Button variant="secondary" onclick={handleExportPdf}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
				</svg>
				PDF
			</Button>

			{#if $isAuthenticated && $calculator.savedId}
				<Button variant="secondary" onclick={handleShare}>
					<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
					</svg>
					Share
				</Button>
			{/if}

			<Button onclick={handleSave}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
				</svg>
				{$calculator.savedId ? 'Update' : 'Save'}
			</Button>
		</div>
	</div>

	<!-- Main Content -->
	<div class="grid gap-8 lg:grid-cols-3">
		<!-- Left Column - Calculator -->
		<div class="space-y-6 lg:col-span-2">
			<!-- Profile Section -->
			<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
				<h2 class="text-lg font-semibold text-gray-900">Profile</h2>
				<div class="mt-4 border-t border-gray-200 pt-4">
					<div class="flex items-center gap-4">
						<select
							value={$profiles.selectedId || ''}
							onchange={handleProfileSelect}
							class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
						>
							<option value="">Select Profile</option>
							{#each $profiles.profiles as profile}
								<option value={profile.id}>{profile.name}</option>
							{/each}
						</select>
						<Button variant="secondary" onclick={handleNewProfile}>New Profile</Button>
					</div>
				</div>
			</div>

			<FlightLegs />
			<CrewSection />
			<CostCategories />
			<TripNotes />
		</div>

		<!-- Right Column - Summary -->
		<div class="lg:sticky lg:top-8 lg:self-start">
			<TotalBreakdown />

			{#if !$isAuthenticated}
				<div class="mt-6 rounded-xl bg-gray-50 p-4 text-center">
					<p class="text-sm text-gray-700">
						<button type="button" onclick={() => ui.openModal('signIn')} class="font-medium underline hover:no-underline">
							Sign in
						</button>
						to save and share your estimates
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<ConfirmDialog
	open={showResetConfirm}
	title="Reset Calculator"
	message="You have unsaved changes. Are you sure you want to reset?"
	confirmText="Reset"
	variant="danger"
	onConfirm={confirmReset}
	onCancel={cancelReset}
/>
