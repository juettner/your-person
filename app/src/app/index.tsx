/**
 * Today: the heart of the app. One question on a card. "Nope" hides it and
 * moves on, "Good one" keeps it coming back, "Next card" advances. After the
 * batch, deal three more.
 *
 * State lives in this component. For an app this size that is the right
 * amount of architecture; a global store (Redux, Zustand) would be overkill.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ThumbsDown, ThumbsUp } from '@/components/Icons';
import { PromptCard } from '@/components/PromptCard';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Spacing } from '@/constants/theme';
import { api, describeError, Prompt, Score } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

const BATCH_SIZE = 3;

type Status = 'loading' | 'ready' | 'error';

export default function TodayScreen() {
  const p = usePalette();

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

  const rate = async (score: Score) => {
    if (!profileId || !current || rating) return;
    setRating(true);
    // Optimistic update: show the choice immediately, then tell the server.
    setRatings((r) => ({ ...r, [current.id]: score }));
    try {
      await api.rate(profileId, current.id, score);
      // "Nope" means "not this one"; move along without another tap.
      if (score === -1) setIndex((i) => i + 1);
    } catch (err) {
      setError(describeError(err));
    } finally {
      setRating(false);
    }
  };

  const next = () => setIndex((i) => i + 1);

  const thumbColor = (score: Score) => (ratings[current?.id ?? ''] === score ? p.onAccent : p.outlineText);

  return (
    <Screen>
      {/* Top row: who we're asking, and the way to the profile screen. */}
      <View style={styles.topRow}>
        <Text style={[styles.askName, { color: p.onGround }]}>{askName ? `Ask ${askName}` : ' '}</Text>
        <Button title="Profile" variant="link" onPress={() => router.push('/profile')} />
      </View>

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
          <Button title="Try again" onPress={() => profileId && loadBatch(profileId)} style={styles.messageButton} />
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
            <PromptCard prompt={current} index={index} total={prompts.length} />
          </View>

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
            <Button title={index + 1 < prompts.length ? 'Next card' : 'Done'} onPress={next} />
          </View>
        </>
      )}

      {finished && prompts.length > 0 && (
        <View style={styles.center}>
          <Card contentStyle={styles.messageCard}>
            <Text style={[styles.messageTitle, { color: p.ink }]}>That&apos;s {prompts.length}.</Text>
            <Text style={[styles.messageText, { color: p.muted }]}>Go talk to {askName}.</Text>
          </Card>
          <Button title={`${prompts.length} more`} onPress={() => profileId && loadBatch(profileId)} style={styles.messageButton} />
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
    fontFamily: Fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.4,
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    // Leave room for the hard shadow and the tilt.
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
  actions: {
    gap: 14,
    paddingBottom: Spacing.lg,
    paddingRight: 4,
  },
  thumbs: {
    flexDirection: 'row',
    gap: 14,
  },
  thumb: {
    flex: 1,
  },
});
