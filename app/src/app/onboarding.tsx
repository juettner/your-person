/**
 * First-run screen: fill in the cards, then start asking.
 */
import { router } from 'expo-router';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { api, ProfileInput } from '@/lib/api';
import { setProfileId } from '@/lib/profile-store';

export default function OnboardingScreen() {
  const create = async (values: ProfileInput) => {
    const profile = await api.createProfile(values);
    await setProfileId(profile.id);
    // `replace` instead of `push` so the back gesture doesn't return here.
    router.replace('/');
  };

  return (
    <Screen>
      <ProfileForm mode="create" title="Fill in the card." submitLabel="Deal me in" onSubmit={create} />
    </Screen>
  );
}
