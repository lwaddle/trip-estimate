<script lang="ts">
	import { createSupabaseClient } from '$lib/supabase';
	import { auth, isAuthenticated, ui } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import { goto } from '$app/navigation';
	import logoLight from '$lib/assets/logo-light.svg';

	let userMenuOpen = $state(false);
	const supabase = createSupabaseClient();

	async function handleSignOut() {
		await supabase.auth.signOut();
		auth.reset();
		ui.showToast('Signed out', 'info');
		goto('/');
	}

	function closeUserMenu() {
		userMenuOpen = false;
	}
</script>

<svelte:window onclick={closeUserMenu} />

<header class="border-b border-gray-200 bg-white">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="flex items-center">
			<img src={logoLight} alt="Aviation Trip Estimate" class="h-10" />
		</a>

		<!-- Desktop Nav -->
		<nav class="hidden items-center gap-6 md:flex">
			{#if $isAuthenticated}
				<a
					href="/calculator"
					class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
				>
					Calculator
				</a>
				<a
					href="/estimates"
					class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
				>
					My Estimates
				</a>
				<a
					href="/profiles"
					class="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
				>
					Profiles
				</a>
			{/if}
		</nav>

		<!-- User Menu -->
		<div class="flex items-center gap-4">
			{#if $isAuthenticated}
				<div class="relative">
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							userMenuOpen = !userMenuOpen;
						}}
						class="flex items-center gap-2 rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100"
					>
						<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
							{$auth.user?.email?.[0]?.toUpperCase() || 'U'}
						</div>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if userMenuOpen}
						<div
							class="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5"
							onclick={(e) => e.stopPropagation()}
						>
							<div class="border-b border-gray-100 px-4 py-2">
								<p class="text-sm font-medium text-gray-900">{$auth.user?.email}</p>
							</div>
							<a
								href="/calculator"
								class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
								onclick={closeUserMenu}
							>
								Calculator
							</a>
							<a
								href="/estimates"
								class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 md:hidden"
								onclick={closeUserMenu}
							>
								My Estimates
							</a>
							<button
								type="button"
								onclick={handleSignOut}
								class="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
							>
								Sign Out
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<Button variant="ghost" onclick={() => ui.openModal('signIn')}>Sign In</Button>
				<a href="/calculator">
					<Button>Try Calculator</Button>
				</a>
			{/if}
		</div>
	</div>
</header>
