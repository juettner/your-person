/**
 * Today: the heart of the app. One question fills the screen. Thumbs up or
 * down to teach the app what works for you. "Next" moves on. After the batch,
 * ask for more.
 *
 * State lives in this component. For an app this size that is the right
 * amount of architecture; a global store (Redux, Zustand) would be overkill.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { PromptCard } from '@/components/PromptCard';
import { Screen } from '@/components/Screen';
import { Spacing, usePalette } from '@/constants/theme';
import { api, describeError, Prompt, Score } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

const BATCH_SIZE = 3;

type Status = 'loading' | 'ready' | 'error';

export default function TodayScreen() {
  const palette = usePalette();

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [askName, setAskName] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [index, setIndex] = useState(0);
  /** questionId -> score the user gave this session, for button highlighting. */
  const [ratings, setRatings] = useState<Record<string, Score>>({});
  const [rating, setRating] = useState(false);

  const loadBatch = useCallback(async (id: string) => {
    setStatus('loading');
    setError(null);
    try {
      const res = await api.getPrompts(id, BATCH_SIZE);
      setAskName(res.askName);
      setPrompts(res.questions);
      setIndex(0);
      setRatings({});
      setStatus('ready');
    } catch (err) {
      setError(describeError(err));
      setStatus('error');
    }
  }, []);

  // useFocusEffect runs every time this screen becomes visible, including when
  // coming back from the profile screen, so a renamed partner shows up immediately.
  // We only fetch a fresh batch when there isn't one in progress.
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
          await loadBatch(id);
        } else {
          // Just refresh the name in case it changed.
          api.getProfile(id).then((p) => !cancelled && setAskName(p.name)).catch(() => {});
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

  const rate = async (score: Score) => {
    if (!profileId || !current || rating) return;
    setRating(true);
    // Optimistic update: show the choice immediately, then tell the server.
    setRatings((r) => ({ ...r, [current.id]: score }));
    try {
      await api.rate(profileId, current.id, score);
      // A thumbs-down means "not this one"; move along without another tap.
      if (score === -1) setIndex((i) => i + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setRating(false);
    }
  };

  const next = () => setIndex((i) => i + 1);

  return (
    <Screen>
      {/* Top row: who we're asking, and the way to the profile screen. */}
      <View style={styles.topRow}>
        <Text style={[styles.askName, { color: palette.muted }]}>
          {askName ? `Ask ${askName}` : ' '}
        </Text>
        <Button
          title="Profile"
          variant="ghost"
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
        />
      </View>

      {status === 'loading' && (
        <View style={styles.center}>
          <ActivityIndicator color={palette.accent} size="large" />
        </View>
      )}

      {status === 'error' && (
        <View style={[styles.center, { gap: Spacing.md }]}>
          <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
          <Button title="Try again" onPress={() => profileId && loadBatch(profileId)} />
        </View>
      )}

      {status === 'ready' && prompts.length === 0 && (
        <View style={[styles.center, { gap: Spacing.md }]}>
          <Text style={[styles.doneTitle, { color: palette.text }]}>No questions left</Text>
          <Text style={[styles.doneText, { color: palette.muted }]}>
            Add a few more interests to the profile to unlock more.
          </Text>
          <Button title="Edit profile" onPress={() => router.push('/profile')} />
        </View>
      )}

      {status === 'ready' && current && (
        <>
          <PromptCard prompt={current} />

          <Text style={[styles.progress, { color: palette.muted }]}>
            {index + 1} of {prompts.length}
          </Text>

          {/* Thumbs: big targets, side by side. */}
          <View style={styles.thumbs}>
            <Button
              title="👎"
              variant={ratings[current.id] === -1 ? 'primary' : 'secondary'}
              onPress={() => rate(-1)}
              disabled={rating}
              style={styles.thumb}
              accessibilityLabel="Hide this question"
            />
            <Button
              title="👍"
              variant={ratings[current.id] === 1 ? 'primary' : 'secondary'}
              onPress={() => rate(1)}
              disabled={rating}
              style={styles.thumb}
              accessibilityLabel="Good question"
            />
          </View>
          <Button
            title={index + 1 < prompts.length ? 'Next' : 'Done'}
            onPress={next}
            style={styles.next}
          />
        </>
      )}

      {finished && prompts.length > 0 && (
        <View style={[styles.center, { gap: Spacing.md }]}>
          <Text style={[styles.doneTitle, { color: palette.text }]}>That&apos;s {prompts.length}.</Text>
          <Text style={[styles.doneText, { color: palette.muted }]}>Go talk to {askName}.</Text>
          <Button
            title={`${prompts.length} more`}
            variant="secondary"
            onPress={() => profileId && loadBatch(profileId)}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  askName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileButton: {
    minHeight: 40,
    paddingHorizontal: Spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  progress: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  thumbs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  thumb: {
    flex: 1,
  },
  next: {
    marginBottom: Spacing.lg,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  doneText: {
    fontSize: 18,
    textAlign: 'center',
  },
});
