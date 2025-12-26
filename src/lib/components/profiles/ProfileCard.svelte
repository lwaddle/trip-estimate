<script lang="ts">
	import { profiles, ui } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import type { AircraftProfile } from '$lib/types/database';

	interface Props {
		profile: AircraftProfile;
		selected: boolean;
		onSelect: (id: string) => void;
	}

	let { profile, selected, onSelect }: Props = $props();

	function handleEdit() {
		profiles.startEditing(profile);
		ui.openModal('profileEditor');
	}

	function handleDuplicate() {
		profiles.duplicateProfile(profile.id);
		ui.showToast(`Duplicated "${profile.name}"`, 'success');
	}

	function handleDelete() {
		if (confirm(`Delete "${profile.name}"? This cannot be undone.`)) {
			profiles.deleteProfile(profile.id);
			ui.showToast('Profile deleted', 'success');
		}
	}

	function handleSetDefault() {
		profiles.setDefault(profile.id);
		ui.showToast(`"${profile.name}" set as default`, 'success');
	}
</script>

<div
	class="relative rounded-xl border-2 bg-white p-4 transition-all {selected
		? 'border-blue-500 ring-2 ring-blue-100'
		: 'border-gray-200 hover:border-gray-300'}"
>
	{#if profile.isDefault}
		<span
			class="absolute -top-2 right-3 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
		>
			Default
		</span>
	{/if}

	<div class="mb-3">
		<h3 class="font-semibold text-gray-900">{profile.name}</h3>
	</div>

	<div class="mb-4 grid grid-cols-2 gap-2 text-sm">
		<div>
			<span class="text-gray-500">Pilots:</span>
			<span class="ml-1 font-medium text-gray-900">{profile.defaults.pilotsRequired}</span>
		</div>
		<div>
			<span class="text-gray-500">FAs:</span>
			<span class="ml-1 font-medium text-gray-900">{profile.defaults.attendantsRequired}</span>
		</div>
		<div>
			<span class="text-gray-500">Fuel:</span>
			<span class="ml-1 font-medium text-gray-900">${profile.defaults.fuelPrice}/gal</span>
		</div>
		<div>
			<span class="text-gray-500">Maint:</span>
			<span class="ml-1 font-medium text-gray-900">${profile.defaults.maintenanceRate}/hr</span>
		</div>
	</div>

	<div class="flex flex-wrap gap-2">
		<Button size="sm" variant={selected ? 'primary' : 'secondary'} onclick={() => onSelect(profile.id)}>
			{selected ? 'Selected' : 'Select'}
		</Button>

		{#if profile.isCustom}
			<Button size="sm" variant="ghost" onclick={handleEdit}>
				Edit
			</Button>
		{/if}

		<Button size="sm" variant="ghost" onclick={handleDuplicate}>
			Duplicate
		</Button>

		{#if !profile.isDefault}
			<Button size="sm" variant="ghost" onclick={handleSetDefault}>
				Set Default
			</Button>
		{/if}

		{#if profile.isCustom}
			<Button size="sm" variant="ghost" onclick={handleDelete}>
				<svg class="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</Button>
		{/if}
	</div>
</div>
