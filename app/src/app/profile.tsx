/**
 * Edit the partner profile: the pages, dates that matter, the weekly nudge,
 * the paper, and the way to "what they said".
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { DatesEditor } from '@/components/DatesEditor';
import { Hand } from '@/components/Hand';
import { ProfileForm } from '@/components/ProfileForm';
import { Screen } from '@/components/Screen';
import { useTheme } from '@/components/ThemeProvider';
import { Thinking } from '@/components/Thinking';
import { Word } from '@/components/Word';
import { WordChoice } from '@/components/WordChoice';
import { Spacing, THEMES, ThemeId } from '@/constants/theme';
import { api, describeError, ImportantDate, Profile, ProfileInput } from '@/lib/api';
import { clearProfileId, getProfileId } from '@/lib/profile-store';
import { applyReminder, DEFAULT_REMINDER, loadReminder, ReminderSetting, WEEKDAYS } from '@/lib/reminders';

export default function ProfileScreen() {
  const { themeId, setThemeId } = useTheme();
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
        <Word title="Back" size="small" onPress={() => router.back()} />
        <Word title="What they said" size="small" onPress={() => router.push('/memories')} />
      </View>
      <View style={styles.section}>
        <Hand size="small" tone="muted">
          Paper
        </Hand>
        <WordChoice
          options={THEMES.map((t) => ({ id: t.id, label: t.name }))}
          selected={[themeId]}
          multi={false}
          onChange={(ids) => ids[0] && setThemeId(ids[0] as ThemeId)}
        />
      </View>
    </View>
  );

  if (error) {
    return (
      <Screen>
        {header}
        <Hand tone="muted" style={styles.spaced}>
          {error}
        </Hand>
      </Screen>
    );
  }

  if (!profile) {
    return (
      <Screen>
        {header}
        <View style={styles.spaced}>
          <Thinking />
        </View>
      </Screen>
    );
  }

  const hour12 = reminder.hour > 12 ? reminder.hour - 12 : reminder.hour;
  const ampm = reminder.hour >= 12 ? 'pm' : 'am';

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
            <View style={styles.section}>
              <Hand size="small" tone="muted">
                Dates that matter
              </Hand>
              <DatesEditor dates={dates} onChange={setDates} />
            </View>

            <View style={styles.section}>
              <Hand size="small" tone="muted">
                Weekly nudge
              </Hand>
              <View style={styles.reminderRow}>
                <Hand style={styles.reminderText}>Remind me once a week</Hand>
                <WordChoice
                  options={[
                    { id: 'on', label: 'On' },
                    { id: 'off', label: 'Off' },
                  ]}
                  selected={[reminder.enabled ? 'on' : 'off']}
                  multi={false}
                  size="small"
                  onChange={(ids) => ids[0] && toggleReminder(ids[0] === 'on')}
                />
              </View>
              <Hand size="small" tone="muted">
                {`${WEEKDAYS[reminder.weekday - 1]}s at ${hour12}${ampm}. Off by default, on purpose.`}
              </Hand>
              <Word title="Change the day" variant="quiet" size="small" onPress={cycleWeekday} />
              {reminderNote && (
                <Hand size="small" tone="muted">
                  {reminderNote}
                </Hand>
              )}
            </View>
          </>
        }
        footer={
          <View style={styles.footer}>
            {profile.hiddenCount > 0 && (
              <Hand size="small" tone="muted">
                You&apos;ve hidden {profile.hiddenCount} question{profile.hiddenCount === 1 ? '' : 's'}.
              </Hand>
            )}
            {profile.aiQuestionCount > 0 && (
              <Hand size="small" tone="muted">
                {profile.aiQuestionCount} question{profile.aiQuestionCount === 1 ? '' : 's'} written just for {profile.name}.
              </Hand>
            )}
            <Word title={generating ? 'Writing...' : 'Write new AI questions'} size="small" onPress={refreshAi} disabled={generating} />
            {aiNote && (
              <Hand size="small" tone="muted">
                {aiNote}
              </Hand>
            )}
            <Word title="Start over with a new profile" variant="quiet" size="small" onPress={startOver} />
            {/* Required by the typeface license, and deserved. */}
            <Hand size="small" tone="muted" style={styles.credit}>
              The hand is Allura, by Rob Leuschke, traced as pen strokes by Sheldon B. Michaels and Windell H. Oskay. SIL Open Font License.
            </Hand>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { gap: Spacing.sm },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  reminderText: { flex: 1 },
  footer: { gap: Spacing.sm, marginTop: Spacing.md },
  credit: { marginTop: Spacing.lg },
  spaced: { marginTop: Spacing.xl },
});
