/**
 * Edit the partner profile: the cards, dates that matter, the weekly nudge,
 * the look, and the way to "what they said".
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DatesEditor } from '@/components/DatesEditor';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { ThemePicker } from '@/components/ThemePicker';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Spacing } from '@/constants/theme';
import { api, describeError, ImportantDate, Profile, ProfileInput } from '@/lib/api';
import { clearProfileId, getProfileId } from '@/lib/profile-store';
import { applyReminder, DEFAULT_REMINDER, loadReminder, ReminderSetting, WEEKDAYS } from '@/lib/reminders';

export default function ProfileScreen() {
  const p = usePalette();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [reminder, setReminder] = useState<ReminderSetting>(DEFAULT_REMINDER);
  const [reminderNote, setReminderNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await getProfileId();
        if (!id) {
          router.replace('/onboarding');
          return;
        }
        const [loaded, savedReminder] = await Promise.all([api.getProfile(id), loadReminder()]);
        if (cancelled) return;
        setProfile(loaded);
        setDates(loaded.dates);
        setReminder(savedReminder);
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
    await api.updateProfile(profile.id, { ...values, dates });
    router.back();
  };

  const startOver = async () => {
    await clearProfileId();
    router.replace('/onboarding');
  };

  const toggleReminder = async (enabled: boolean) => {
    const next = { ...reminder, enabled };
    setReminder(next);
    const on = await applyReminder(next, profile?.name ?? 'them');
    if (enabled && !on) {
      setReminderNote(
        Platform.OS === 'web'
          ? 'Reminders work in the phone app, not in the browser.'
          : 'Could not schedule it here. Reminders need the installed app and notification permission.',
      );
    } else {
      setReminderNote(null);
    }
  };

  const cycleWeekday = async () => {
    const next = { ...reminder, weekday: (reminder.weekday % 7) + 1 };
    setReminder(next);
    if (next.enabled) await applyReminder(next, profile?.name ?? 'them');
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
      <View style={styles.headerRow}>
        <Button title="Back" variant="link" onPress={() => router.back()} />
        <Button title="What they said" variant="link" onPress={() => router.push('/memories')} />
      </View>
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
        afterCard={
          <>
            <Text style={[styles.sectionLabel, { color: p.onGround }]}>Dates that matter</Text>
            <Card contentStyle={styles.sectionCard}>
              <DatesEditor dates={dates} onChange={setDates} />
            </Card>

            <Text style={[styles.sectionLabel, { color: p.onGround }]}>Weekly nudge</Text>
            <Card contentStyle={styles.sectionCard}>
              <View style={styles.switchRow}>
                <View style={styles.switchText}>
                  <Text style={[styles.switchTitle, { color: p.ink }]}>Remind me once a week</Text>
                  <Text style={[styles.switchHint, { color: p.muted }]}>
                    {WEEKDAYS[reminder.weekday - 1]}s at {reminder.hour > 12 ? reminder.hour - 12 : reminder.hour}
                    {reminder.hour >= 12 ? 'pm' : 'am'}. Off by default, on purpose.
                  </Text>
                </View>
                <Switch
                  value={reminder.enabled}
                  onValueChange={toggleReminder}
                  accessibilityLabel="Weekly reminder"
                  trackColor={{ true: p.accent, false: p.muted }}
                />
              </View>
              <Button title="Change the day" variant="link" tone="card" onPress={cycleWeekday} style={styles.inlineLink} />
              {reminderNote && <Text style={[styles.note, { color: p.muted }]}>{reminderNote}</Text>}
            </Card>
          </>
        }
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
  header: { gap: Spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  themeBlock: { gap: Spacing.sm, paddingVertical: Spacing.sm },
  sectionLabel: { fontFamily: Fonts.bold, fontSize: 15 },
  sectionCard: { gap: Spacing.sm, padding: Spacing.md + 4 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchText: { flex: 1, gap: 2 },
  switchTitle: { fontFamily: Fonts.bold, fontSize: 16 },
  switchHint: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 18 },
  inlineLink: { alignSelf: 'flex-start', minHeight: 36 },
  note: { fontFamily: Fonts.medium, fontSize: 13 },
  hint: { fontFamily: Fonts.medium, textAlign: 'center', fontSize: 14 },
  centerLink: { alignSelf: 'center' },
  error: { fontFamily: Fonts.bold, fontSize: 16, marginTop: Spacing.md },
  spinner: { marginTop: Spacing.xxl },
});
