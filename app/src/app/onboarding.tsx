/**
 * First-run screen: fill in the card, then start asking.
 */
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { api, ProfileInput } from '@/lib/api';
import { setProfileId } from '@/lib/profile-store';

export default function OnboardingScreen() {
  const p = usePalette();

  const create = async (values: ProfileInput) => {
    const profile = await api.createProfile(values);
    await setProfileId(profile.id);
    // `replace` instead of `push` so the back gesture doesn't return here.
    router.replace('/');
  };

  return (
    <Screen>
      <ProfileForm
        submitLabel="Deal me in"
        onSubmit={create}
        header={
          <View style={styles.header}>
            <View style={[styles.step, { backgroundColor: p.accent }]}>
              <Text style={[styles.stepText, { color: p.onAccent }]}>STEP 1 · YOUR PERSON</Text>
            </View>
            <Text style={[styles.title, { color: p.onGround }]} accessibilityRole="header">
              Fill in the card.
            </Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  step: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  stepText: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
});
