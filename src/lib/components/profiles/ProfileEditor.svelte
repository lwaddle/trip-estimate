<script lang="ts">
	import { profiles, ui } from '$lib/stores';
	import { Modal, Button, Input } from '$lib/components/ui';
	import type { AircraftProfile } from '$lib/types/database';

	let name = $state('');
	let defaults = $state({
		fuelBurnPerHour: 200,
		pilotRate: 800,
		attendantRate: 500,
		hotelRate: 200,
		mealsRate: 75,
		maintenanceRate: 150,
		apuBurnPerLeg: 0,
		includeApuBurn: false,
		fuelPrice: 5.5
	});
	let error = $state('');

	// Reset form when modal opens
	$effect(() => {
		if ($ui.modals.profileEditor) {
			if ($profiles.editingProfile) {
				// Editing existing
				name = $profiles.editingProfile.name;
				defaults = { ...$profiles.editingProfile.defaults };
			} else {
				// Creating new
				name = '';
				defaults = {
					fuelBurnPerHour: 200,
					pilotRate: 800,
					attendantRate: 500,
					hotelRate: 200,
					mealsRate: 75,
					maintenanceRate: 150,
					apuBurnPerLeg: 0,
					includeApuBurn: false,
					fuelPrice: 5.5
				};
			}
			error = '';
		}
	});

	function handleClose() {
		ui.closeModal('profileEditor');
		profiles.stopEditing();
	}

	function handleSave(e: SubmitEvent) {
		e.preventDefault();

		if (!name.trim()) {
			error = 'Please enter a name';
			return;
		}

		if ($profiles.editingProfile) {
			// Update existing
			profiles.updateProfile($profiles.editingProfile.id, {
				name: name.trim(),
				defaults
			});
			ui.showToast('Profile updated', 'success');
		} else {
			// Create new
			const newProfile: AircraftProfile = {
				id: crypto.randomUUID(),
				name: name.trim(),
				type: 'custom',
				imageUrl: null,
				defaults,
				isCustom: true,
				isDefault: false
			};
			profiles.addProfile(newProfile);
			ui.showToast('Profile created', 'success');
		}

		handleClose();
	}

	function handleInputChange(field: keyof typeof defaults, value: string) {
		defaults = { ...defaults, [field]: parseFloat(value) || 0 };
	}
</script>

<Modal
	open={$ui.modals.profileEditor}
	title={$profiles.editingProfile ? 'Edit Profile' : 'New Profile'}
	size="lg"
	onClose={handleClose}
>
	<form onsubmit={handleSave} class="space-y-6">
		{#if error}
			<div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
				{error}
			</div>
		{/if}

		<Input label="Profile Name" bind:value={name} placeholder="e.g., My Citation X" required />

		<div class="border-t border-gray-200 pt-4">
			<h3 class="mb-4 text-sm font-medium text-gray-900">Default Values</h3>

			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					type="number"
					label="Fuel Burn (gal/hr)"
					min="0"
					step="10"
					value={defaults.fuelBurnPerHour.toString()}
					oninput={(e) => handleInputChange('fuelBurnPerHour', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Fuel Price ($/gal)"
					min="0"
					step="0.10"
					value={defaults.fuelPrice.toString()}
					oninput={(e) => handleInputChange('fuelPrice', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Pilot Rate ($/day)"
					min="0"
					step="50"
					value={defaults.pilotRate.toString()}
					oninput={(e) => handleInputChange('pilotRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="FA Rate ($/day)"
					min="0"
					step="50"
					value={defaults.attendantRate.toString()}
					oninput={(e) => handleInputChange('attendantRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Hotel Rate ($/night)"
					min="0"
					step="25"
					value={defaults.hotelRate.toString()}
					oninput={(e) => handleInputChange('hotelRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Meals Rate ($/day)"
					min="0"
					step="10"
					value={defaults.mealsRate.toString()}
					oninput={(e) => handleInputChange('mealsRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Maintenance ($/hr)"
					min="0"
					step="25"
					value={defaults.maintenanceRate.toString()}
					oninput={(e) => handleInputChange('maintenanceRate', e.currentTarget.value)}
				/>
				<div class="flex flex-col gap-2">
					<label class="flex cursor-pointer items-center gap-2">
						<input
							type="checkbox"
							bind:checked={defaults.includeApuBurn}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
						/>
						<span class="text-sm text-gray-700">Include APU burn</span>
					</label>
					{#if defaults.includeApuBurn}
						<Input
							type="number"
							label="APU Burn (lbs/leg)"
							min="0"
							step="10"
							value={defaults.apuBurnPerLeg.toString()}
							oninput={(e) => handleInputChange('apuBurnPerLeg', e.currentTarget.value)}
						/>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex justify-end gap-3 border-t border-gray-200 pt-4">
			<Button type="button" variant="secondary" onclick={handleClose}>
				Cancel
			</Button>
			<Button type="submit">
				{$profiles.editingProfile ? 'Update' : 'Create'} Profile
			</Button>
		</div>
	</form>
</Modal>
