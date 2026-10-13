/**
 * Today: the heart of the app. One prompt at a time, written in front of you.
 *
 *  - "nope" hides it and moves on; "good one" keeps it coming back; "not now"
 *    skips without judging it.
 *  - After a question, "what did they say?" writes a one-line memory.
 *  - Day mode deals questions with the occasional appreciation, bid, or
 *    dream card. Evening mode deals the end-of-day conversation.
 *
 * State lives in this component. For an app this size that is the right
 * amount of architecture; a global store would be overkill.
 */
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Hand } from '@/components/Hand';
import { HandInput } from '@/components/HandInput';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Thinking } from '@/components/Thinking';
import { Word } from '@/components/Word';
import { WordChoice } from '@/components/WordChoice';
import { HandSize, Spacing } from '@/constants/theme';
import { Handwriting } from '@/handwriting/Handwriting';
import { api, describeError, Prompt, PromptKind, PromptMode, PromptsResponse, Score } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

const BATCH_SIZE = 3;

type Status = 'loading' | 'ready' | 'error';

/** The small line above a card that says what to do with it. */
const KIND_LABEL: Record<Exclude<PromptKind, 'question'>, string> = {
  appreciation: 'say it out loud',
  bid: 'today',
  dream: 'go deeper',
  stress: 'just listen',
};

function hintFor(prompt: Prompt, askName: string): string {
  switch (prompt.kind) {
    case 'appreciation':
      return `not a question. tell ${askName}, in your own words.`;
    case 'bid':
      return 'one small thing. good one if it landed.';
    case 'dream':
      return 'a bigger one. no rush, and no fixing.';
    case 'stress':
      return "listen, take their side, don't solve it.";
    default:
      return prompt.source === 'ai' ? `written for ${askName}. rate it to teach the deck.` : 'rate it so your deck gets better.';
  }
}

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
  /** questionId -> score the user gave this session, so a chosen word stays circled. */
  const [ratings, setRatings] = useState<Record<string, Score>>({});
  const [rating, setRating] = useState(false);
  /** True once the current prompt has finished writing itself; the hint waits for it. */
  const [written, setWritten] = useState(false);
  /** The "what did they say?" line: its text, and whether this card already saved one. */
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
      setWritten(false);
      setStatus('ready');
    } catch (err) {
      setError(describeError(err));
      setStatus('error');
    }
  }, []);

  // The focus effect below is created once, so it would see the first render's
  // `mode` and `prompts` forever. A ref always holds the latest values instead.
  const latest = useRef({ mode, hasPrompts: prompts.length > 0 });
  useEffect(() => {
    latest.current = { mode, hasPrompts: prompts.length > 0 };
  });

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
        if (!latest.current.hasPrompts) {
          await loadBatch(id, latest.current.mode);
        } else {
          api.getProfile(id).then((prof) => !cancelled && setAskName(prof.name)).catch(() => {});
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [loadBatch]),
  );

  const current = prompts[index];
  const finished = status === 'ready' && index >= prompts.length;

  const advance = () => {
    setIndex((i) => i + 1);
    setMemoryText('');
    setWritten(false);
  };

  const rate = async (score: Score) => {
    if (!profileId || !current || rating) return;
    setRating(true);
    Haptics.impactAsync(score === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRatings((r) => ({ ...r, [current.id]: score })); // optimistic
    try {
      await api.rate(profileId, current.id, score);
      if (score === -1) advance(); // "nope" means "not this one"; move along without another tap.
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

  const upcoming = nudges?.upcomingDates[0];
  const nudge = upcoming
    ? `${upcoming.label} is ${upcoming.daysAway === 0 ? 'today' : upcoming.daysAway === 1 ? 'tomorrow' : `in ${upcoming.daysAway} days`}.`
    : nudges?.reviewDetails
      ? `it's been a while. still true? give ${askName}'s page a once-over.`
      : null;

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top: who we're asking, day or evening, and the way to the profile. */}
        <View style={styles.topRow}>
          <Hand size="small" tone="muted">
            {askName ? `ask ${askName}.` : ' '}
          </Hand>
          <Word title="profile" size="small" onPress={() => router.push('/profile')} />
        </View>
        <View style={styles.modeRow}>
          <WordChoice
            options={[
              { id: 'day', label: 'day' },
              { id: 'evening', label: 'evening' },
            ]}
            selected={[mode]}
            multi={false}
            size="small"
            onChange={(ids) => ids[0] && switchMode(ids[0] as PromptMode)}
          />
        </View>

        {/* A gentle nudge from the server: a date coming up, or details worth a second look. */}
        {status === 'ready' && nudge && <Word title={nudge} variant="quiet" size="small" onPress={() => router.push('/profile')} />}

        {status === 'loading' && (
          <View style={styles.center}>
            <Thinking />
          </View>
        )}

        {status === 'error' && (
          <View style={styles.center}>
            <Handwriting text="hmm." color={p.ink} size={HandSize.title} />
            <Hand tone="muted">{error}</Hand>
            <Word title="try again" onPress={() => profileId && loadBatch(profileId, mode)} />
          </View>
        )}

        {status === 'ready' && prompts.length === 0 && (
          <View style={styles.center}>
            <Handwriting text="no cards left." color={p.ink} size={HandSize.title} />
            <Hand tone="muted">add a few more interests to the profile to unlock more.</Hand>
            <Word title="edit profile" onPress={() => router.push('/profile')} />
          </View>
        )}

        {status === 'ready' && current && (
          <>
            {/* The prompt, written in front of you. Long ones get a smaller pen. */}
            <View style={styles.cardArea}>
              <Hand size="small" tone="muted">
                {current.kind === 'question' ? (current.interest ?? 'just because') : KIND_LABEL[current.kind]}
              </Hand>
              <Handwriting
                key={current.id}
                text={current.text}
                color={p.ink}
                size={current.text.length > 110 ? HandSize.body + 3 : HandSize.hero}
                delay={0.35}
                onDone={() => setWritten(true)}
                style={styles.prompt}
              />
              <Hand size="small" tone="muted" style={{ opacity: written ? 1 : 0 }}>
                {hintFor(current, askName)}
              </Hand>
            </View>

            {/* "what did they say?" Only for cards that ask something. */}
            {current.kind !== 'bid' && current.kind !== 'appreciation' && (
              <View style={styles.memoryRow}>
                {savedMemoryFor === current.id ? (
                  <Hand size="small" tone="muted">
                    saved. it will shape the next cards.
                  </Hand>
                ) : (
                  <>
                    <HandInput
                      value={memoryText}
                      onChangeText={setMemoryText}
                      placeholder={`what did ${askName} say?`}
                      maxLength={500}
                      size="small"
                      style={styles.memoryInput}
                      accessibilityLabel="What did they say"
                      returnKeyType="done"
                      onSubmitEditing={saveMemory}
                    />
                    <Word title="save" size="small" onPress={saveMemory} disabled={!memoryText.trim()} busy={savingMemory} />
                  </>
                )}
              </View>
            )}

            <View style={styles.actions}>
              <View style={styles.actionRow}>
                <View style={styles.thumbs}>
                  <Word
                    title="nope"
                    variant="toggle"
                    selected={ratings[current.id] === -1}
                    onPress={() => rate(-1)}
                    disabled={rating}
                    accessibilityLabel="Hide this question"
                  />
                  <Word
                    title="good one"
                    variant="toggle"
                    selected={ratings[current.id] === 1}
                    onPress={() => rate(1)}
                    disabled={rating}
                    accessibilityLabel="Good question"
                  />
                </View>
                <Word title={index + 1 < prompts.length ? 'next' : 'done'} weight="medium" onPress={advance} />
              </View>
              <View style={styles.actionRow}>
                <Hand size="small" tone="muted">
                  {index + 1} of {prompts.length}
                </Hand>
                <Word title="not now" variant="quiet" size="small" onPress={advance} accessibilityLabel="Skip this card for now" />
              </View>
            </View>
          </>
        )}

        {finished && prompts.length > 0 && (
          <View style={styles.center}>
            <Handwriting
              text={`that's ${prompts.length}.\n${mode === 'evening' ? `now go listen to ${askName}.` : `go talk to ${askName}.`}`}
              color={p.ink}
              size={HandSize.title}
            />
            <Word title={`${prompts.length} more`} onPress={() => profileId && loadBatch(profileId, mode)} />
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  modeRow: {
    minHeight: 40,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  prompt: {
    marginVertical: Spacing.xs,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    minHeight: 48,
  },
  memoryInput: {
    flex: 1,
  },
  actions: {
    paddingBottom: Spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbs: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
});
