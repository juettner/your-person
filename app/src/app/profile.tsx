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

  // Ask the server to write a fresh AI deck. Harmless when the engine is off.
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const refreshAi = async () => {
    if (!profile) return;
    setGenerating(true);
    setAiNote(null);
    try {
      const res = await api.generate(profile.id);
      setAiNote(
        res.enabled
          ? `Wrote ${res.generated} new question${res.generated === 1 ? '' : 's'} for ${profile.name}.`
          : 'AI questions are switched off on this server.',
      );
      const fresh = await api.getProfile(profile.id);
      setProfile(fresh);
    } catch (err) {
      setAiNote(describeError(err));
    } finally {
      setGenerating(false);
    }
  };

  const header = (
    <View style={styles.header}>
      <Button title="Back" variant="link" onPress={() => router.back()} style={styles.back} />
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
        mode="edit"
        title="Your person."
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
            {profile.aiQuestionCount > 0 && (
              <Text style={[styles.hint, { color: p.onGround }]}>
                {profile.aiQuestionCount} question{profile.aiQuestionCount === 1 ? '' : 's'} written just for {profile.name}.
              </Text>
            )}
            <Button
              title={generating ? 'Writing...' : 'Write new AI questions'}
              variant="outline"
              onPress={refreshAi}
              disabled={generating}
            />
            {aiNote && <Text style={[styles.hint, { color: p.onGround }]}>{aiNote}</Text>}
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
