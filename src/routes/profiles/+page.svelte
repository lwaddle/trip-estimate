<script lang="ts">
	import { ProfileSelector } from '$lib/components/profiles';
</script>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900">Aircraft Profiles</h1>
		<p class="mt-1 text-gray-500">
			Manage aircraft profiles with preset default values for your estimates.
		</p>
	</div>

	<ProfileSelector />
</div>
