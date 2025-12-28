<script lang="ts">
	import { profiles, ui } from '$lib/stores';
	import { Modal, Button, Input } from '$lib/components/ui';
	import type { AircraftProfile } from '$lib/types/database';

	let name = $state('');
	let isDefault = $state(false);
	let defaults = $state({
		fuelPrice: 5.5,
		fuelDensity: 6.7,
		pilotsRequired: 2,
		pilotRate: 800,
		attendantsRequired: 0,
		attendantRate: 500,
		hotelRate: 200,
		mealsRate: 75,
		maintenanceRate: 150,
		apuBurnPerLeg: 0
	});
	let error = $state('');

	// Reset form when modal opens
	$effect(() => {
		if ($ui.modals.profileEditor) {
			if ($profiles.editingProfile) {
				// Editing existing
				name = $profiles.editingProfile.name;
				isDefault = $profiles.editingProfile.isDefault;
				defaults = { ...$profiles.editingProfile.defaults };
			} else {
				// Creating new
				name = '';
				isDefault = false;
				defaults = {
					fuelPrice: 5.5,
					fuelDensity: 6.7,
					pilotsRequired: 2,
					pilotRate: 800,
					attendantsRequired: 0,
					attendantRate: 500,
					hotelRate: 200,
					mealsRate: 75,
					maintenanceRate: 150,
					apuBurnPerLeg: 0
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
			if (isDefault) {
				profiles.setDefault($profiles.editingProfile.id);
			}
			ui.showToast('Profile updated', 'success');
		} else {
			// Create new
			const newProfile: AircraftProfile = {
				id: crypto.randomUUID(),
				name: name.trim(),
				imageUrl: null,
				defaults,
				isCustom: true,
				isDefault: false
			};
			profiles.addProfile(newProfile);
			if (isDefault) {
				profiles.setDefault(newProfile.id);
			}
			ui.showToast('Profile created', 'success');
		}

		handleClose();
	}

	function handleInputChange(field: keyof typeof defaults, value: string) {
		defaults = { ...defaults, [field]: parseFloat(value) || 0 };
	}

	function handleIntInputChange(field: keyof typeof defaults, value: string) {
		defaults = { ...defaults, [field]: parseInt(value) || 0 };
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

		<Input label="Name" bind:value={name} placeholder="e.g., My Citation X" required />

		<!-- Fuel Settings -->
		<div class="border-t border-gray-200 pt-4">
			<h3 class="mb-4 text-sm font-medium text-gray-900">Fuel Settings</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					type="number"
					label="Fuel Price ($/gallon)"
					min="0"
					step="0.01"
					value={defaults.fuelPrice.toString()}
					oninput={(e) => handleInputChange('fuelPrice', e.currentTarget.value)}
					required
				/>
				<Input
					type="number"
					label="Fuel Density (lbs/gallon)"
					min="0"
					step="0.01"
					value={defaults.fuelDensity.toString()}
					oninput={(e) => handleInputChange('fuelDensity', e.currentTarget.value)}
					required
				/>
			</div>
		</div>

		<!-- Crew -->
		<div class="border-t border-gray-200 pt-4">
			<h3 class="mb-4 text-sm font-medium text-gray-900">Crew</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					type="number"
					label="Pilots Required"
					min="0"
					step="1"
					value={defaults.pilotsRequired.toString()}
					oninput={(e) => handleIntInputChange('pilotsRequired', e.currentTarget.value)}
					required
				/>
				<Input
					type="number"
					label="Pilot Daily Rate ($)"
					min="0"
					step="50"
					value={defaults.pilotRate.toString()}
					oninput={(e) => handleInputChange('pilotRate', e.currentTarget.value)}
					required
				/>
				<Input
					type="number"
					label="Flight Attendants Required"
					min="0"
					step="1"
					value={defaults.attendantsRequired.toString()}
					oninput={(e) => handleIntInputChange('attendantsRequired', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Flight Attendant Daily Rate ($)"
					min="0"
					step="50"
					value={defaults.attendantRate.toString()}
					oninput={(e) => handleInputChange('attendantRate', e.currentTarget.value)}
				/>
			</div>
		</div>

		<!-- Crew Expenses -->
		<div class="border-t border-gray-200 pt-4">
			<h3 class="mb-4 text-sm font-medium text-gray-900">Crew Expenses</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					type="number"
					label="Hotel ($/night/person)"
					min="0"
					step="25"
					value={defaults.hotelRate.toString()}
					oninput={(e) => handleInputChange('hotelRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="Meals ($/day/person)"
					min="0"
					step="10"
					value={defaults.mealsRate.toString()}
					oninput={(e) => handleInputChange('mealsRate', e.currentTarget.value)}
				/>
			</div>
		</div>

		<!-- Aircraft Operations -->
		<div class="border-t border-gray-200 pt-4">
			<h3 class="mb-4 text-sm font-medium text-gray-900">Aircraft Operations</h3>
			<div class="grid gap-4 sm:grid-cols-2">
				<Input
					type="number"
					label="Maintenance Programs ($/hour)"
					min="0"
					step="0.01"
					value={defaults.maintenanceRate.toString()}
					oninput={(e) => handleInputChange('maintenanceRate', e.currentTarget.value)}
				/>
				<Input
					type="number"
					label="APU Burn (lbs/leg)"
					min="0"
					step="10"
					value={defaults.apuBurnPerLeg.toString()}
					oninput={(e) => handleInputChange('apuBurnPerLeg', e.currentTarget.value)}
				/>
			</div>
		</div>

		<!-- Default Profile -->
		<div class="rounded-lg bg-gray-50 p-4">
			<label class="flex cursor-pointer items-center gap-3">
				<input
					type="checkbox"
					bind:checked={isDefault}
					class="h-5 w-5 rounded border-gray-300 accent-red-700 focus:ring-red-500"
				/>
				<span class="text-sm text-gray-700">Make this my default profile</span>
			</label>
		</div>

		<div class="flex justify-end gap-3 border-t border-gray-200 pt-4">
			<Button type="button" variant="secondary" onclick={handleClose}>
				Cancel
			</Button>
			<Button type="submit">
				Save Profile
			</Button>
		</div>
	</form>
</Modal>
