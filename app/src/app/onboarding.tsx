/**
 * First-run screen: set up the partner profile, then go to Today.
 */
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { Spacing, usePalette } from '@/constants/theme';
import { api, ProfileInput } from '@/lib/api';
import { setProfileId } from '@/lib/profile-store';

export default function OnboardingScreen() {
  const palette = usePalette();

  const create = async (values: ProfileInput) => {
    const profile = await api.createProfile(values);
    await setProfileId(profile.id);
    // `replace` instead of `push` so the back gesture doesn't return here.
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.text }]}>Tell us about your person</Text>
        <Text style={[styles.subtitle, { color: palette.muted }]}>
          Takes about a minute. You can change it any time.
        </Text>
      </View>
      <ProfileForm submitLabel="Let's go" onSubmit={create} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
  },
});
