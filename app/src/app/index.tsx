/**
 * The entry: the heart of the app. One question per page.
 *
 *   Tuesday, October 27 · 1 of 3                       evening   Sam
 *
 *   say it out loud                       (only on the pages that are not questions)
 *   Is there a dish you've been wanting to try making? _
 *
 *                     keep        not for us
 *                                                               [fold]
 *
 *  - The question types itself out. The underscore blinks until you answer.
 *  - "keep" means more like this; "not for us" hides it for good. Either
 *    one stays underlined, and the next page is a page turn away. Turning
 *    the page without marking anything is "not now": no judgement.
 *  - "what did they say?" opens a line to write down their answer.
 *  - After three, the last page sends you off to go talk to them.
 *  - "evening" switches to the end-of-day conversation: listen, don't fix.
 *
 * State lives in this component. For an app this size that is the right
 * amount of architecture; a global store would be overkill.
 */
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Line } from '@/components/Line';
import { Page } from '@/components/Page';
import { Small } from '@/components/Small';
import { Typewriter } from '@/components/Typewriter';
import { Word } from '@/components/Word';
import { Fonts, Ink, Margin, Spacing, Type } from '@/constants/theme';
import { api, describeError, Prompt, PromptKind, PromptMode, PromptsResponse, Score } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

const BATCH_SIZE = 3;

type Status = 'loading' | 'ready' | 'error';

/** A small grey note above the pages that are not plain questions, so the asker knows whether to ask or to act. */
const KIND_NOTE: Record<Exclude<PromptKind, 'question'>, string> = {
  appreciation: 'say it out loud',
  bid: 'one small thing today',
  dream: 'a bigger one',
  stress: 'just listen',
};

const COUNT_WORDS = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export default function EntryScreen() {
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [askName, setAskName] = useState('');
  const [mode, setMode] = useState<PromptMode>('day');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [nudges, setNudges] = useState<PromptsResponse['nudges'] | null>(null);
  const [index, setIndex] = useState(0);
  /** questionId -> the mark you gave it this session. */
  const [marks, setMarks] = useState<Record<string, Score>>({});
  const [marking, setMarking] = useState(false);
  /** The "what did they say?" line: whether it is open, its text, and which question already has one. */
  const [memoryOpen, setMemoryOpen] = useState(false);
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
      setMarks({});
      setMemoryOpen(false);
      setMemoryText('');
      setSavedMemoryFor(null);
      setStatus('ready');
    } catch (err) {
      setError(describeError(err));
      setStatus('error');
    }
  }, []);

  // Runs every time this screen becomes visible, including when coming back
  // from the profile page, so a renamed person shows up immediately.
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

  const current: Prompt | undefined = prompts[index];
  const finished = status === 'ready' && prompts.length > 0 && index >= prompts.length;

  const turn = () => {
    setIndex((i) => i + 1);
    setMemoryOpen(false);
    setMemoryText('');
  };

  const mark = async (score: Score) => {
    if (!profileId || !current || marking) return;
    setMarking(true);
    Haptics.impactAsync(score === 1 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setMarks((m) => ({ ...m, [current.id]: score })); // optimistic
    try {
      await api.rate(profileId, current.id, score);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setMarking(false);
    }
  };

  const saveMemory = async () => {
    if (!profileId || !current || !memoryText.trim()) return;
    setSavingMemory(true);
    try {
      await api.addMemory(profileId, memoryText.trim(), current.id);
      setSavedMemoryFor(current.id);
      setMemoryText('');
      setMemoryOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      setError(describeError(err));
    } finally {
      setSavingMemory(false);
    }
  };

  const switchMode = () => {
    if (!profileId) return;
    const next: PromptMode = mode === 'day' ? 'evening' : 'day';
    setMode(next);
    loadBatch(profileId, next);
  };

  const topLine = (
    <View style={styles.topLine}>
      <Small>{current ? `${today()} · ${index + 1} of ${prompts.length}` : today()}</Small>
      <View style={styles.topWords}>
        {status === 'ready' && (
          <Word
            label={mode === 'day' ? 'evening' : 'day'}
            tone="grey"
            size={Type.small}
            onPress={switchMode}
            accessibilityLabel={mode === 'day' ? 'Switch to evening questions' : 'Switch to day questions'}
            style={styles.topWord}
          />
        )}
        <Word label={askName || 'them'} tone="grey" size={Type.small} onPress={() => router.push('/profile')} accessibilityLabel="Their page" style={styles.topWord} />
      </View>
    </View>
  );

  if (status === 'loading') {
    return (
      <Page>
        {topLine}
        <View style={styles.middle}>
          <Text style={styles.waiting}>_</Text>
        </View>
      </Page>
    );
  }

  if (status === 'error') {
    return (
      <Page>
        {topLine}
        <View style={styles.middle}>
          <Typewriter text={error ?? 'Something went wrong.'} size={Type.heading} />
          <Word label="try again" tone="grey" onPress={() => profileId && loadBatch(profileId, mode)} style={styles.belowQuestion} />
        </View>
      </Page>
    );
  }

  if (prompts.length === 0) {
    return (
      <Page>
        {topLine}
        <View style={styles.middle}>
          <Typewriter text={`Nothing left to ask. Add a few more things ${askName} is into.`} size={Type.heading} />
          <Word label="their page" tone="grey" onPress={() => router.push('/profile')} style={styles.belowQuestion} />
        </View>
      </Page>
    );
  }

  if (finished || !current) {
    const upcoming = nudges?.upcomingDates[0];
    const count = COUNT_WORDS[prompts.length - 1] ?? String(prompts.length);
    return (
      <Page onTurn={() => profileId && loadBatch(profileId, mode)} turnLabel={`${capitalize(count)} more`}>
        {topLine}
        <View style={styles.middle}>
          <Typewriter
            text={mode === 'evening' ? `That's ${count}. Now go listen to ${askName}.` : `That's ${count}. Go talk to ${askName}.`}
            answered
          />
          {upcoming && (
            <Small style={styles.belowQuestion}>
              {`${upcoming.label} is ${upcoming.daysAway === 0 ? 'today' : upcoming.daysAway === 1 ? 'tomorrow' : `in ${upcoming.daysAway} days`}.`}
            </Small>
          )}
          {nudges?.reviewDetails && !upcoming && <Small style={styles.belowQuestion}>{`It's been a while. Is ${askName}'s page still true?`}</Small>}
        </View>
        <View style={styles.bottomRow}>
          <Word label="what they said" tone="grey" onPress={() => router.push('/memories')} />
        </View>
      </Page>
    );
  }

  const myMark = marks[current.id];
  const answered = myMark !== undefined;
  const canWriteDown = current.kind !== 'bid' && current.kind !== 'appreciation';

  return (
    <Page onTurn={turn}>
      {topLine}
      <View style={styles.middle}>
        {current.kind !== 'question' && <Small style={styles.kindNote}>{KIND_NOTE[current.kind]}</Small>}
        <Typewriter text={current.text} answered={answered} />

        {canWriteDown &&
          (savedMemoryFor === current.id ? (
            <Small style={styles.belowQuestion}>written down.</Small>
          ) : memoryOpen ? (
            <View style={styles.memory}>
              <Line
                value={memoryText}
                onChangeText={setMemoryText}
                placeholder={`what ${askName} said`}
                maxLength={500}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveMemory}
                accessibilityLabel="What did they say"
              />
              <Word label={savingMemory ? 'saving' : 'save'} tone="grey" onPress={saveMemory} disabled={savingMemory || !memoryText.trim()} />
            </View>
          ) : (
            <Word label="what did they say?" tone="grey" onPress={() => setMemoryOpen(true)} style={styles.belowQuestion} />
          ))}
      </View>

      <View style={styles.bottomRow}>
        <Word label="keep" marked={myMark === 1} tone={myMark === -1 ? 'faint' : 'ink'} onPress={() => mark(1)} disabled={marking} accessibilityLabel="Keep this question" />
        <Word label="not for us" marked={myMark === -1} tone={myMark === 1 ? 'faint' : 'ink'} onPress={() => mark(-1)} disabled={marking} accessibilityLabel="Not for us" />
      </View>
    </Page>
  );
}

/** "Tuesday, October 27". Hermes ships Intl, so this works on iOS and Android as well as on the web. */
function today(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  topWords: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  topWord: {
    minHeight: 24,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.lg,
  },
  waiting: {
    fontFamily: Fonts.type,
    fontSize: Type.question,
    color: Ink.ink,
  },
  kindNote: {
    marginBottom: Spacing.sm,
  },
  belowQuestion: {
    marginTop: Spacing.md,
    alignSelf: 'flex-start',
  },
  memory: {
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: Margin.bottom,
  },
});
