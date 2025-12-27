<script lang="ts">
	import { isAuthenticated, ui } from '$lib/stores';
	import { Button } from '$lib/components/ui';
	import { goto } from '$app/navigation';

	function handleGetStarted() {
		if ($isAuthenticated) {
			goto('/calculator');
		} else {
			ui.openModal('signIn');
		}
	}
</script>

<div class="flex flex-1 flex-col">
	<!-- Hero Section -->
	<section class="bg-gradient-to-br from-red-700 to-red-900 py-20 text-white">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
					Aviation Cost Estimation
				</h1>
				<p class="mx-auto mt-6 max-w-2xl text-lg text-red-100 sm:text-xl">
					Calculate trip costs for private aviation with precision. Track fuel, crew expenses,
					airport fees, and more in one powerful tool.
				</p>
				<div class="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a href="/calculator">
						<Button size="lg" class="bg-white text-red-700 hover:bg-red-50">
							Try Calculator
						</Button>
					</a>
					{#if !$isAuthenticated}
						<Button size="lg" variant="ghost" class="text-white hover:bg-white/10" onclick={handleGetStarted}>
							Sign In to Save
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-20">
		<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
			<div class="text-center">
				<h2 class="text-3xl font-bold text-gray-900">Everything You Need</h2>
				<p class="mt-4 text-lg text-gray-600">
					Comprehensive cost tracking for all aspects of your trip
				</p>
			</div>

			<div class="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
				<!-- Feature 1 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Flight Legs</h3>
					<p class="mt-2 text-gray-600">
						Track multiple flight legs with origin, destination, flight time, and fuel burn calculations.
					</p>
				</div>

				<!-- Feature 2 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Crew Management</h3>
					<p class="mt-2 text-gray-600">
						Add pilots and flight attendants with customizable daily rates, hotels, and meal expenses.
					</p>
				</div>

				<!-- Feature 3 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Cost Categories</h3>
					<p class="mt-2 text-gray-600">
						Track fuel, maintenance, airport fees, catering, customs, and miscellaneous expenses.
					</p>
				</div>

				<!-- Feature 4 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Aircraft Profiles</h3>
					<p class="mt-2 text-gray-600">
						Choose from preset aircraft types or create custom profiles with your specific defaults.
					</p>
				</div>

				<!-- Feature 5 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 text-red-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">Share Estimates</h3>
					<p class="mt-2 text-gray-600">
						Generate shareable links to send estimates to clients or team members.
					</p>
				</div>

				<!-- Feature 6 -->
				<div class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
					<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
						</svg>
					</div>
					<h3 class="mt-4 text-lg font-semibold text-gray-900">PDF Export</h3>
					<p class="mt-2 text-gray-600">
						Generate professional PDF reports with complete cost breakdowns for your records.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA Section -->
	<section class="bg-gray-900 py-16">
		<div class="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
			<h2 class="text-3xl font-bold text-white">Ready to Get Started?</h2>
			<p class="mt-4 text-lg text-gray-300">
				Try the calculator now or sign in to save and share your estimates.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
				<a href="/calculator">
					<Button size="lg">Open Calculator</Button>
				</a>
			</div>
		</div>
	</section>
</div>
