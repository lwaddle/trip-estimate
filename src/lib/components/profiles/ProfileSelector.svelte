<script lang="ts">
	import { profiles, ui, calculator } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import ProfileCard from './ProfileCard.svelte';

	function handleCreateNew() {
		profiles.startEditing(null);
		ui.openModal('profileEditor');
	}

	function handleSelect(id: string) {
		profiles.select(id);
		calculator.setProfile(id);

		const profile = $profiles.profiles.find((p) => p.id === id);
		if (profile) {
			calculator.applyProfileDefaults(profile.defaults);
			ui.showToast(`Applied ${profile.name} defaults`, 'success');
		}
	}

	function handleExport() {
		const customProfiles = $profiles.profiles.filter((p) => p.isCustom);
		if (customProfiles.length === 0) {
			ui.showToast('No custom profiles to export', 'warning');
			return;
		}

		const json = JSON.stringify(customProfiles, null, 2);
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'trip-estimate-profiles.json';
		a.click();
		URL.revokeObjectURL(url);

		ui.showToast('Profiles exported', 'success');
	}

	function handleImport() {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = '.json';
		input.onchange = async (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;

			try {
				const text = await file.text();
				const imported = JSON.parse(text);

				if (!Array.isArray(imported)) {
					throw new Error('Invalid format');
				}

				let count = 0;
				for (const profile of imported) {
					if (profile.name && profile.defaults) {
						profiles.addProfile({
							...profile,
							id: crypto.randomUUID(),
							isCustom: true,
							isDefault: false
						});
						count++;
					}
				}

				ui.showToast(`Imported ${count} profile(s)`, 'success');
			} catch {
				ui.showToast('Failed to import profiles', 'error');
			}
		};
		input.click();
	}

	const presetProfiles = $derived($profiles.profiles.filter((p) => !p.isCustom));
	const customProfiles = $derived($profiles.profiles.filter((p) => p.isCustom));
</script>

<div class="space-y-8">
	<!-- Actions -->
	<div class="flex flex-wrap gap-3">
		<Button onclick={handleCreateNew}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			New Profile
		</Button>
		<Button variant="secondary" onclick={handleImport}>
			<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
				/>
			</svg>
			Import
		</Button>
		{#if customProfiles.length > 0}
			<Button variant="secondary" onclick={handleExport}>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
					/>
				</svg>
				Export
			</Button>
		{/if}
	</div>

	<!-- Preset Profiles -->
	<div>
		<h3 class="mb-4 text-lg font-semibold text-gray-900">Preset Profiles</h3>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each presetProfiles as profile (profile.id)}
				<ProfileCard {profile} selected={$profiles.selectedId === profile.id} onSelect={handleSelect} />
			{/each}
		</div>
	</div>

	<!-- Custom Profiles -->
	{#if customProfiles.length > 0}
		<div>
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Custom Profiles</h3>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each customProfiles as profile (profile.id)}
					<ProfileCard
						{profile}
						selected={$profiles.selectedId === profile.id}
						onSelect={handleSelect}
					/>
				{/each}
			</div>
		</div>
	{/if}
</div>
