/**
 * What they said. The list of memories written down after questions, newest first.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Spacing } from '@/constants/theme';
import { api, describeError, Memory } from '@/lib/api';
import { getProfileId } from '@/lib/profile-store';

export default function MemoriesScreen() {
  const p = usePalette();
  const [profileId, setProfileId] = useState<string | null>(null);
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
          const list = await api.listMemories(id);
          if (!cancelled) setMemories(list);
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
    <Screen>
      <View style={styles.header}>
        <Button title="Back" variant="link" onPress={() => router.back()} style={styles.back} />
        <Text style={[styles.title, { color: p.onGround }]} accessibilityRole="header">
          What they said.
        </Text>
      </View>

      {error && <Text style={[styles.error, { color: p.danger }]}>{error}</Text>}

      {memories === null ? (
        <ActivityIndicator color={p.onGround} style={styles.spinner} />
      ) : memories.length === 0 ? (
        <Card contentStyle={styles.emptyCard}>
          <Text style={[styles.emptyTitle, { color: p.ink }]}>Nothing yet.</Text>
          <Text style={[styles.emptyText, { color: p.muted }]}>
            After you ask a question, jot down what they said. It shows up here, and it makes the next questions better.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Card contentStyle={styles.memoryCard}>
              {item.questionText ? <Text style={[styles.question, { color: p.muted }]}>{item.questionText}</Text> : null}
              <Text style={[styles.text, { color: p.ink }]}>{item.text}</Text>
              <View style={styles.footer}>
                <Text style={[styles.date, { color: p.muted }]}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                <Button title="Remove" variant="link" tone="card" onPress={() => remove(item)} style={styles.remove} />
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, paddingBottom: Spacing.md },
  back: { alignSelf: 'flex-start' },
  title: { fontFamily: Fonts.extraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  error: { fontFamily: Fonts.bold, fontSize: 14, marginBottom: Spacing.sm },
  spinner: { marginTop: Spacing.xxl },
  list: { gap: Spacing.md, paddingRight: 6, paddingBottom: Spacing.xl },
  emptyCard: { gap: Spacing.sm },
  emptyTitle: { fontFamily: Fonts.extraBold, fontSize: 24 },
  emptyText: { fontFamily: Fonts.medium, fontSize: 16, lineHeight: 23 },
  memoryCard: { gap: Spacing.sm, padding: Spacing.md + 4 },
  question: { fontFamily: Fonts.medium, fontSize: 14 },
  text: { fontFamily: Fonts.bold, fontSize: 19, lineHeight: 26 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontFamily: Fonts.medium, fontSize: 13 },
  remove: { minHeight: 32 },
});
