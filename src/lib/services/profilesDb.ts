import { createSupabaseClient } from '$lib/supabase';
import type { AircraftProfile } from '$lib/types/database';

const supabase = createSupabaseClient();

export interface UserProfilesRow {
	id: string;
	user_id: string;
	profiles_data: AircraftProfile[];
	default_profile_id: string | null;
	created_at: string;
	updated_at: string;
}

export async function loadUserProfiles(
	userId: string
): Promise<{ profiles: AircraftProfile[]; defaultId: string | null } | null> {
	const { data, error } = await supabase
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No row found - user has no saved profiles yet
			return null;
		}
		console.error('Error loading profiles:', error);
		return null;
	}

	return {
		profiles: (data.profiles_data as AircraftProfile[]) || [],
		defaultId: data.default_profile_id
	};
}

export async function saveUserProfiles(
	userId: string,
	profiles: AircraftProfile[],
	defaultProfileId: string | null
): Promise<boolean> {
	// Filter to only custom profiles (don't save the Standard profile)
	const customProfiles = profiles.filter((p) => p.isCustom);

	const { error } = await supabase.from('user_profiles').upsert(
		{
			user_id: userId,
			profiles_data: customProfiles,
			default_profile_id: defaultProfileId
		},
		{
			onConflict: 'user_id'
		}
	);

	if (error) {
		console.error('Error saving profiles:', error);
		return false;
	}

	return true;
}
