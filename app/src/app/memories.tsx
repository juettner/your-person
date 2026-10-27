/**
 * What they said: their answers, written down as quotes, newest first.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Page } from '@/components/Page';
import { Small } from '@/components/Small';
import { Typewriter } from '@/components/Typewriter';
import { Word } from '@/components/Word';
import { Fonts, Ink, Margin, Spacing, Type } from '@/constants/theme';
import { api, describeError, Memory } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

export default function MemoriesScreen() {
  const [profileId, setProfileId] = useState<string | null>(null);
  const [askName, setAskName] = useState('');
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          const id = await getProfileId();
          if (!id) {
            router.replace('/onboarding');
            return;
          }
          setProfileId(id);
          const [list, profile] = await Promise.all([api.listMemories(id), api.getProfile(id)]);
          if (cancelled) return;
          setMemories(list);
          setAskName(profile.name);
        } catch (err) {
          if (!cancelled) setError(describeError(err));
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const remove = async (memory: Memory) => {
    if (!profileId) return;
    setMemories((list) => (list ?? []).filter((m) => m.id !== memory.id)); // optimistic
    try {
      await api.deleteMemory(profileId, memory.id);
    } catch (err) {
      setError(describeError(err));
    }
  };

  return (
    <Page>
      <View style={styles.topLine}>
        <Word label="back" tone="grey" size={Type.small} onPress={() => router.back()} style={styles.topWord} />
        <Small>{askName ? `${askName} said` : ' '}</Small>
      </View>

      {error && <Small style={styles.error}>{error}</Small>}

      {memories && memories.length === 0 ? (
        <View style={styles.middle}>
          <Typewriter text="Nothing yet. After a question, write down what they said. It makes the next questions better." size={Type.heading} answered />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {(memories ?? []).map((memory) => (
            <View key={memory.id} style={styles.quote}>
              <Text style={styles.quoteText}>{`“${memory.text}”`}</Text>
              <View style={styles.quoteLine}>
                <Small>{new Date(memory.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Small>
                <Word label="remove" tone="grey" size={Type.small} onPress={() => remove(memory)} accessibilityLabel={`Remove: ${memory.text}`} style={styles.remove} />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  topWord: { minHeight: 24 },
  error: { marginTop: Spacing.md },
  middle: { flex: 1, justifyContent: 'center', paddingBottom: Margin.bottom },
  list: { paddingTop: Spacing.xxl, paddingBottom: Margin.bottom, gap: Spacing.xl },
  quote: { gap: Spacing.xs },
  quoteText: {
    fontFamily: Fonts.type,
    fontSize: 20,
    lineHeight: 32,
    color: Ink.ink,
  },
  quoteLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  remove: { minHeight: 24 },
});
