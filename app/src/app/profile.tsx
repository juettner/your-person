/**
 * Edit the partner profile. Same form as onboarding, pre-filled.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { Spacing, usePalette } from '@/constants/theme';
import { api, describeError, Profile, ProfileInput } from '@/lib/api';
import { clearProfileId, getProfileId } from '@/lib/profile-store';

export default function ProfileScreen() {
  const palette = usePalette();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await getProfileId();
        if (!id) {
          router.replace('/onboarding');
          return;
        }
        const loaded = await api.getProfile(id);
        if (!cancelled) setProfile(loaded);
      } catch (err) {
        if (!cancelled) setError(describeError(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (values: ProfileInput) => {
    if (!profile) return;
    await api.updateProfile(profile.id, values);
    router.back();
  };

  const startOver = async () => {
    await clearProfileId();
    router.replace('/onboarding');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Button title="Back" variant="ghost" onPress={() => router.back()} style={styles.back} />
        <Text style={[styles.title, { color: palette.text }]}>Your person</Text>
      </View>

      {error ? (
        <Text style={{ color: palette.danger }}>{error}</Text>
      ) : profile ? (
        <ProfileForm
          initial={profile}
          submitLabel="Save"
          onSubmit={save}
          footer={
            <>
              {profile.hiddenCount > 0 && (
                <Text style={[styles.hint, { color: palette.muted }]}>
                  You&apos;ve hidden {profile.hiddenCount} question{profile.hiddenCount === 1 ? '' : 's'}.
                </Text>
              )}
              <Button
                title="Start over with a new profile"
                variant="ghost"
                onPress={startOver}
              />
            </>
          }
        />
      ) : (
        <ActivityIndicator color={palette.accent} style={styles.spinner} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  back: {
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
    minHeight: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  hint: {
    textAlign: 'center',
    fontSize: 14,
  },
  spinner: {
    marginTop: Spacing.xxl,
  },
});
