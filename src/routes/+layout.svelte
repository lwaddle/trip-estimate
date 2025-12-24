<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { createSupabaseClient } from '$lib/supabase';
	import { auth } from '$lib/stores';
	import { Header } from '$lib/components/layout';
	import { AuthModal } from '$lib/components/auth';
	import { ToastContainer } from '$lib/components/ui';
	import { SaveModal } from '$lib/components/estimates';
	import { ShareModal } from '$lib/components/share';
	import { PdfPreviewModal } from '$lib/components/pdf';
	import { ProfileEditor } from '$lib/components/profiles';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	const supabase = createSupabaseClient();

	onMount(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			auth.setSession(session);
		});

		// Listen for auth changes
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			auth.setSession(session);
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Trip Estimate - Aviation Cost Calculator</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-gray-50">
	<Header />
	<main class="flex-1">
		{@render children()}
	</main>
</div>

<!-- Global modals -->
<AuthModal />
<SaveModal />
<ShareModal />
<PdfPreviewModal />
<ProfileEditor />
<ToastContainer />
