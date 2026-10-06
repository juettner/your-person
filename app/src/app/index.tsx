/**
 * Today: the heart of the app. One card at a time.
 *
 *  - "Nope" hides it and moves on; "Good one" keeps it coming back; "Not now"
 *    skips without judging it.
 *  - After a question, "What did they say?" writes a one-line memory.
 *  - Day mode deals questions with the occasional appreciation, bid, or
 *    dream card. Evening mode deals the end-of-day conversation.
 *
 * State lives in this component. For an app this size that is the right
 * amount of architecture; a global store would be overkill.
 */
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ThumbsDown, ThumbsUp } from '@/components/Icons';
import { PromptCard } from '@/components/PromptCard';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { api, describeError, Prompt, PromptMode, PromptsResponse, Score } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

const BATCH_SIZE = 3;

type Status = 'loading' | 'ready' | 'error';

export default function TodayScreen() {
  const p = usePalette();

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [askName, setAskName] = useState('');
  const [mode, setMode] = useState<PromptMode>('day');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [nudges, setNudges] = useState<PromptsResponse['nudges'] | null>(null);
  const [index, setIndex] = useState(0);
  /** questionId -> score the user gave this session, for button highlighting. */
  const [ratings, setRatings] = useState<Record<string, Score>>({});
  const [rating, setRating] = useState(false);
  /** The "what did they say?" box: its text, and whether this card already saved one. */
  const [memoryText, setMemoryText] = useState('');
  const [savedMemoryFor, setSavedMemoryFor] = useState<string | null>(null);
  const [savingMemory, setSavingMemory] = useState(false);

  const loadBatch = useCallback(async (id: string, nextMode: PromptMode) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await api.getPrompts(id, BATCH_SIZE, nextMode);
      setAskName(res.askName);
      setPrompts(res.questions);
      setNudges(res.nudges);
      setIndex(0);
      setRatings({});
      setMemoryText('');
      setSavedMemoryFor(null);
      setStatus('ready');
    } catch (err) {
      setError(describeError(err));
      setStatus('error');
    }
  }, []);

  // Runs every time this screen becomes visible, including when coming back
  // from the profile screen, so a renamed partner shows up immediately.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const id = await getProfileId();
        if (cancelled) return;
        if (!id) {
          router.replace('/onboarding');
          return;
        }
        setProfileId(id);
        if (prompts.length === 0) {
          await loadBatch(id, mode);
        } else {
          api.getProfile(id).then((prof) => !cancelled && setAskName(prof.name)).catch(() => {});
        }
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadBatch]),
  );

  const current = prompts[index];
  const finished = status === 'ready' && index >= prompts.length;

  const advance = () => {
    setIndex((i) => i + 1);
    setMemoryText('');
  };

  const rate = async (score: Score) => {
    if (!profileId || !current || rating) return;
    setRating(true);
    Haptics.impactAsync(score === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRatings((r) => ({ ...r, [current.id]: score })); // optimistic
    try {
      await api.rate(profileId, current.id, score);
      if (score === -1) advance(); // "Nope" means "not this one"; move along without another tap.
    } catch (err) {
      setError(describeError(err));
    } finally {
      setRating(false);
    }
  };

  const saveMemory = async () => {
    if (!profileId || !current || !memoryText.trim()) return;
    setSavingMemory(true);
    try {
      await api.addMemory(profileId, memoryText.trim(), current.id);
      setSavedMemoryFor(current.id);
      setMemoryText('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSavingMemory(false);
    }
  };

  const switchMode = (next: PromptMode) => {
    if (next === mode || !profileId) return;
    setMode(next);
    loadBatch(profileId, next);
  };

  const thumbColor = (score: Score) => (ratings[current?.id ?? ''] === score ? p.onAccent : p.outlineText);
  const upcoming = nudges?.upcomingDates[0];

  return (
    <Screen>
      {/* Top row: who we're asking, the day/evening switch, and the way to the profile. */}
      <View style={styles.topRow}>
        <Text style={[styles.askName, { color: p.onGround }]}>{askName ? `Ask ${askName}` : ' '}</Text>
        <View style={styles.topRight}>
          <ModeSwitch mode={mode} onChange={switchMode} />
          <Button title="Profile" variant="link" onPress={() => router.push('/profile')} />
        </View>
      </View>

      {/* Gentle nudges from the server: a date coming up, or details worth a second look. */}
      {status === 'ready' && (upcoming || nudges?.reviewDetails) && (
        <Pressable
          onPress={() => router.push('/profile')}
          accessibilityRole="button"
          style={[styles.nudge, { borderColor: p.outlineBorder }]}
        >
          <Text style={[styles.nudgeText, { color: p.onGround }]}>
            {upcoming
              ? `${upcoming.label} is ${upcoming.daysAway === 0 ? 'today' : upcoming.daysAway === 1 ? 'tomorrow' : `in ${upcoming.daysAway} days`}.`
              : `It's been a while. Still true? Give ${askName}'s card a once-over.`}
          </Text>
        </Pressable>
      )}

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={p.onGround} size="large" />
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center}>
          <Card contentStyle={styles.messageCard}>
            <Text style={[styles.messageTitle, { color: p.ink }]}>Hmm.</Text>
            <Text style={[styles.messageText, { color: p.muted }]}>{error}</Text>
          </Card>
          <Button title="Try again" onPress={() => profileId && loadBatch(profileId, mode)} style={styles.messageButton} />
        </View>
      )}

      {status === 'ready' && prompts.length === 0 && (
        <View style={styles.center}>
          <Card contentStyle={styles.messageCard}>
            <Text style={[styles.messageTitle, { color: p.ink }]}>No cards left</Text>
            <Text style={[styles.messageText, { color: p.muted }]}>Add a few more interests to the profile to unlock more.</Text>
          </Card>
          <Button title="Edit profile" onPress={() => router.push('/profile')} style={styles.messageButton} />
        </View>
      )}

      {status === 'ready' && current && (
        <>
          <View style={styles.cardArea}>
            <PromptCard prompt={current} index={index} total={prompts.length} askName={askName} />
          </View>

          {/* "What did they say?" Only for cards that ask something. */}
          {current.kind !== 'bid' && current.kind !== 'appreciation' && (
            <View style={styles.memoryRow}>
              {savedMemoryFor === current.id ? (
                <Text style={[styles.memorySaved, { color: p.onGround }]}>Saved. It will shape the next cards.</Text>
              ) : (
                <>
                  <TextInput
                    value={memoryText}
                    onChangeText={setMemoryText}
                    placeholder={`What did ${askName} say?`}
                    placeholderTextColor={p.muted}
                    maxLength={500}
                    style={[styles.memoryInput, { color: p.ink, borderColor: p.ink, backgroundColor: p.card }]}
                    accessibilityLabel="What did they say"
                    returnKeyType="done"
                    onSubmitEditing={saveMemory}
                  />
                  <Button
                    title="Save"
                    variant="outline"
                    onPress={saveMemory}
                    disabled={!memoryText.trim()}
                    busy={savingMemory}
                    style={styles.memoryButton}
                  />
                </>
              )}
            </View>
          )}

          <View style={styles.actions}>
            <View style={styles.thumbs}>
              <Button
                title="Nope"
                variant="outline"
                icon={<ThumbsDown color={thumbColor(-1)} />}
                selected={ratings[current.id] === -1}
                onPress={() => rate(-1)}
                disabled={rating}
                style={styles.thumb}
                accessibilityLabel="Hide this question"
              />
              <Button
                title="Good one"
                variant="outline"
                icon={<ThumbsUp color={thumbColor(1)} />}
                selected={ratings[current.id] === 1}
                onPress={() => rate(1)}
                disabled={rating}
                style={styles.thumb}
                accessibilityLabel="Good question"
              />
            </View>
            <Button title={index + 1 < prompts.length ? 'Next card' : 'Done'} onPress={advance} />
            <Button title="Not now" variant="link" onPress={advance} style={styles.notNow} accessibilityLabel="Skip this card for now" />
          </View>
        </>
      )}

      {finished && prompts.length > 0 && (
        <View style={styles.center}>
          <Card contentStyle={styles.messageCard}>
            <Text style={[styles.messageTitle, { color: p.ink }]}>That&apos;s {prompts.length}.</Text>
            <Text style={[styles.messageText, { color: p.muted }]}>
              {mode === 'evening' ? `Now go listen to ${askName}.` : `Go talk to ${askName}.`}
            </Text>
          </Card>
          <Button title={`${prompts.length} more`} onPress={() => profileId && loadBatch(profileId, mode)} style={styles.messageButton} />
        </View>
      )}
    </Screen>
  );
}

/** Day / Evening toggle. Evening deals the end-of-day conversation: listen, take their side, don't fix. */
function ModeSwitch({ mode, onChange }: { mode: PromptMode; onChange: (m: PromptMode) => void }) {
  const p = usePalette();
  return (
    <View style={[styles.switch, { borderColor: p.outlineBorder }]} accessibilityRole="radiogroup">
      {(['day', 'evening'] as const).map((m) => {
        const on = m === mode;
        return (
          <Pressable
            key={m}
            onPress={() => onChange(m)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            aria-checked={on}
            accessibilityLabel={m === 'day' ? 'Day mode' : 'Evening mode'}
            style={[styles.switchOption, on && { backgroundColor: p.outlineBorder }]}
          >
            <Text style={[styles.switchText, { color: on ? p.ground : p.onGround }]}>{m === 'day' ? 'Day' : 'Evening'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  askName: {
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  switch: {
    flexDirection: 'row',
    borderWidth: 2,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  switchOption: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minHeight: 32,
    justifyContent: 'center',
  },
  switchText: {
    fontFamily: Fonts.bold,
    fontSize: 12,
  },
  nudge: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: Spacing.xs,
  },
  nudgeText: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 6,
    paddingBottom: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingRight: 6,
  },
  messageCard: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  messageTitle: {
    fontFamily: Fonts.extraBold,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  messageText: {
    fontFamily: Fonts.medium,
    fontSize: 18,
    lineHeight: 26,
  },
  messageButton: {
    marginBottom: Spacing.xl,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 12,
    minHeight: 48,
  },
  memoryInput: {
    flex: 1,
    fontFamily: Fonts.medium,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: Radius.md,
  },
  memoryButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
  },
  memorySaved: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  actions: {
    gap: 12,
    paddingBottom: Spacing.md,
    paddingRight: 4,
  },
  thumbs: {
    flexDirection: 'row',
    gap: 14,
  },
  thumb: {
    flex: 1,
  },
  notNow: {
    alignSelf: 'center',
    minHeight: 36,
  },
});
