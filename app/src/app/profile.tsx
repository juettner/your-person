/**
 * Edit the partner profile and pick a palette. Same card as onboarding, pre-filled.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { ThemePicker } from '@/components/ThemePicker';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Spacing } from '@/constants/theme';
import { api, describeError, Profile, ProfileInput } from '@/lib/api';
import { clearProfileId, getProfileId } from '@/lib/profile-store';

export default function ProfileScreen() {
  const p = usePalette();
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

  const header = (
    <View style={styles.header}>
      <Button title="Back" variant="link" onPress={() => router.back()} style={styles.back} />
      <Text style={[styles.title, { color: p.onGround }]} accessibilityRole="header">
        Your person
      </Text>
      <View style={styles.themeBlock}>
        <Text style={[styles.sectionLabel, { color: p.onGround }]}>Look</Text>
        <ThemePicker />
      </View>
    </View>
  );

  if (error) {
    return (
      <Screen>
        {header}
        <Text style={[styles.error, { color: p.danger }]}>{error}</Text>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        {header}
        <ActivityIndicator color={p.onGround} style={styles.spinner} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ProfileForm
        initial={profile}
        submitLabel="Save"
        onSubmit={save}
        header={header}
        footer={
          <>
            {profile.hiddenCount > 0 && (
              <Text style={[styles.hint, { color: p.onGround }]}>
                You&apos;ve hidden {profile.hiddenCount} question{profile.hiddenCount === 1 ? '' : 's'}.
              </Text>
            )}
            <Button title="Start over with a new profile" variant="link" onPress={startOver} style={styles.centerLink} />
          </>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.sm,
  },
  back: {
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  themeBlock: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  hint: {
    fontFamily: Fonts.medium,
    textAlign: 'center',
    fontSize: 14,
  },
  centerLink: {
    alignSelf: 'center',
  },
  error: {
    fontFamily: Fonts.bold,
    fontSize: 16,
    marginTop: Spacing.md,
  },
  spinner: {
    marginTop: Spacing.xxl,
  },
});
