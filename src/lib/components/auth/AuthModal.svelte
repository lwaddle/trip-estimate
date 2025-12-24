<script lang="ts">
	import { ui } from '$lib/stores';
	import { Modal } from '$lib/components/ui';
	import SignInForm from './SignInForm.svelte';
	import PasswordReset from './PasswordReset.svelte';

	let view: 'signin' | 'reset' = $state('signin');

	function handleClose() {
		ui.closeModal('signIn');
		// Reset view after modal closes
		setTimeout(() => {
			view = 'signin';
		}, 200);
	}

	function handleSuccess() {
		handleClose();
	}
</script>

<Modal open={$ui.modals.signIn} onClose={handleClose} size="sm">
	{#if view === 'signin'}
		<SignInForm onSuccess={handleSuccess} onSwitchToReset={() => (view = 'reset')} />
	{:else}
		<PasswordReset onSuccess={() => (view = 'signin')} onBack={() => (view = 'signin')} />
	{/if}
</Modal>
