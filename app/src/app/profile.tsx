/**
 * Their page: everything the journal knows about your person, on one long
 * page you can write on. Name, where they live, what they're into with
 * every follow-up, what's going on lately, dates that matter, the weekly
 * nudge, and the AI deck. "save" at the bottom; "start over" below it.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { DatesEditor } from '@/components/DatesEditor';
import { FollowUpAnswer } from '@/components/FollowUpAnswer';
import { Interests } from '@/components/Interests';
import { Line } from '@/components/Line';
import { Page } from '@/components/Page';
import { Small } from '@/components/Small';
import { Typewriter } from '@/components/Typewriter';
import { Word } from '@/components/Word';
import { Margin, Spacing, Type } from '@/constants/theme';
import { api, describeError, ImportantDate, Interest, InterestDetails, Profile, ProfileLocation } from '@/lib/api';
import { detectLocation } from '@/lib/location';
import { clearProfileId, getProfileId } from '@/lib/profile-store';
import { applyReminder, DEFAULT_REMINDER, loadReminder, ReminderSetting, WEEKDAYS } from '@/lib/reminders';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [options, setOptions] = useState<Interest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState<ProfileLocation | null>(null);
  const [locating, setLocating] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [details, setDetails] = useState<InterestDetails>({});
  const [lately, setLately] = useState('');
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [saving, setSaving] = useState(false);

  const [reminder, setReminder] = useState<ReminderSetting>(DEFAULT_REMINDER);
  const [reminderNote, setReminderNote] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const id = await getProfileId();
        if (!id) {
          router.replace('/onboarding');
          return;
        }
        const [loaded, taxonomy, savedReminder] = await Promise.all([api.getProfile(id), api.listInterests(), loadReminder()]);
        if (cancelled) return;
        setProfile(loaded);
        setOptions(taxonomy);
        setName(loaded.name);
        setLocation(loaded.location ?? null);
        setInterests(loaded.interests);
        setDetails(loaded.interestDetails ?? {});
        setLately(loaded.currentFocus ?? '');
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

  const save = async () => {
    if (!profile || saving || !name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const city = location?.city.trim();
      await api.updateProfile(profile.id, {
        name: name.trim(),
        interests,
        interestDetails: details,
        location: city ? { ...location, city } : null,
        currentFocus: lately.trim() || undefined,
        dates,
      });
      router.back();
    } catch (err) {
      setError(describeError(err));
      setSaving(false);
    }
  };

  const startOver = async () => {
    await clearProfileId();
    router.replace('/onboarding');
  };

  const useMyLocation = async () => {
    setLocating(true);
    const result = await detectLocation();
    if (result.status === 'ok') setLocation(result.location);
    setLocating(false);
  };

  const toggleReminder = async () => {
    const next = { ...reminder, enabled: !reminder.enabled };
    setReminder(next);
    const on = await applyReminder(next, name || 'them');
    setReminderNote(
      next.enabled && !on
        ? Platform.OS === 'web'
          ? 'Reminders work in the phone app, not in the browser.'
          : 'Could not schedule it here. Reminders need the installed app and notification permission.'
        : null,
    );
  };

  const cycleWeekday = async () => {
    const next = { ...reminder, weekday: (reminder.weekday % 7) + 1 };
    setReminder(next);
    if (next.enabled) await applyReminder(next, name || 'them');
  };

  // Ask the server to write a fresh AI deck. Harmless when the engine is off.
  const refreshAi = async () => {
    if (!profile) return;
    setGenerating(true);
    setAiNote(null);
    try {
      const res = await api.generate(profile.id);
      setAiNote(res.enabled ? `Wrote ${res.generated} new question${res.generated === 1 ? '' : 's'} for ${name}.` : 'AI questions are switched off on this server.');
      setProfile(await api.getProfile(profile.id));
    } catch (err) {
      setAiNote(describeError(err));
    } finally {
      setGenerating(false);
    }
  };

  const topLine = (
    <View style={styles.topLine}>
      <Word label="back" tone="grey" size={Type.small} onPress={() => router.back()} style={styles.topWord} />
      <Word label="what they said" tone="grey" size={Type.small} onPress={() => router.push('/memories')} style={styles.topWord} />
    </View>
  );

  if (!profile) {
    return (
      <Page>
        {topLine}
        <View style={styles.middle}>{error ? <Typewriter text={error} size={Type.heading} /> : <Small> </Small>}</View>
      </Page>
    );
  }

  const chosen = options.filter((i) => interests.includes(i.id) && i.followUps.length > 0);
  const hour = reminder.hour > 12 ? reminder.hour - 12 : reminder.hour;

  return (
    <Page>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {topLine}
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Line value={name} onChangeText={setName} placeholder="Sam" autoCapitalize="words" autoCorrect={false} maxLength={60} size={Type.heading} accessibilityLabel="Their name" />

          <Small style={styles.label}>where they live</Small>
          <Line value={location?.city ?? ''} onChangeText={(city) => setLocation(city ? { city } : null)} placeholder="Minneapolis" autoCapitalize="words" autoCorrect={false} maxLength={80} accessibilityLabel="Where they live" />
          <Word label={locating ? 'finding you' : 'use my location'} tone="grey" size={Type.small} onPress={useMyLocation} disabled={locating} style={styles.inlineWord} />

          <Small style={styles.label}>into</Small>
          <Interests interests={options} selected={interests} onChange={setInterests} />

          {chosen.map((interest) => (
            <View key={interest.id}>
              <Small style={styles.label}>{interest.label.toLowerCase()}</Small>
              {interest.followUps.map((followUp) => (
                <View key={followUp.id} style={styles.followUp}>
                  <Small tone="muted">{followUp.prompt}</Small>
                  <FollowUpAnswer
                    followUp={followUp}
                    value={details[interest.id]?.[followUp.id]}
                    onChange={(v) => setDetails((d) => ({ ...d, [interest.id]: { ...d[interest.id], [followUp.id]: v } }))}
                  />
                </View>
              ))}
            </View>
          ))}

          <Small style={styles.label}>lately</Small>
          <Line value={lately} onChangeText={setLately} placeholder="what's going on in their world" multiline maxLength={500} style={styles.multiline} accessibilityLabel="What is going on in their world lately" />

          <Small style={styles.label}>dates that matter</Small>
          <DatesEditor dates={dates} onChange={setDates} />

          <Small style={styles.label}>weekly nudge</Small>
          <View style={styles.row}>
            <Word label="off" marked={!reminder.enabled} tone={reminder.enabled ? 'faint' : 'ink'} onPress={() => reminder.enabled && toggleReminder()} accessibilityLabel="Weekly reminder off" />
            <Word label="on" marked={reminder.enabled} tone={reminder.enabled ? 'ink' : 'faint'} onPress={() => !reminder.enabled && toggleReminder()} accessibilityLabel="Weekly reminder on" />
            <Word
              label={`${WEEKDAYS[reminder.weekday - 1]}s at ${hour}${reminder.hour >= 12 ? 'pm' : 'am'}`}
              tone="grey"
              onPress={cycleWeekday}
              accessibilityLabel="Change the day"
            />
          </View>
          {reminderNote && <Small>{reminderNote}</Small>}

          <Small style={styles.label}>{`questions written for ${profile.name}`}</Small>
          <Small tone="muted">
            {profile.aiQuestionCount > 0 ? `${profile.aiQuestionCount} in the deck. ` : ''}
            {profile.hiddenCount > 0 ? `${profile.hiddenCount} marked not for us.` : ''}
          </Small>
          <Word label={generating ? 'writing' : 'write new ones'} tone="grey" onPress={refreshAi} disabled={generating} accessibilityLabel="Write new AI questions" style={styles.inlineWord} />
          {aiNote && <Small>{aiNote}</Small>}

          {error && <Small style={styles.gap}>{error}</Small>}
          <View style={styles.actions}>
            <Word label={saving ? 'saving' : 'save'} size={Type.body} onPress={save} disabled={saving || !name.trim()} accessibilityLabel="Save" />
            <Word label="start over" tone="grey" onPress={startOver} accessibilityLabel="Start over with a new profile" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Page>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 24 },
  topWord: { minHeight: 24 },
  middle: { flex: 1, justifyContent: 'center' },
  content: { paddingTop: Spacing.lg, paddingBottom: Margin.bottom, gap: Spacing.xs },
  label: { marginTop: Spacing.xl },
  inlineWord: { alignSelf: 'flex-start', minHeight: 36 },
  followUp: { marginTop: Spacing.sm, gap: Spacing.xs },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, flexWrap: 'wrap' },
  gap: { marginTop: Spacing.md },
  actions: { marginTop: Spacing.xl, gap: Spacing.sm },
});
