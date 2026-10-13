/**
 * What they said. The list of memories written down after questions, newest first.
 */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Hand } from '@/components/Hand';
import { Screen } from '@/components/Screen';
import { usePalette } from '@/components/ThemeProvider';
import { Thinking } from '@/components/Thinking';
import { Word } from '@/components/Word';
import { HandSize, Spacing } from '@/constants/theme';
import { Handwriting } from '@/handwriting/Handwriting';
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
        <Word title="back" size="small" onPress={() => router.back()} />
        <Handwriting text="what they said." color={p.ink} size={HandSize.title} />
      </View>

      {error && <Hand tone="muted">{error}</Hand>}

      {memories === null ? (
        <View style={styles.spaced}>
          <Thinking />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.empty}>
          <Hand>nothing yet.</Hand>
          <Hand tone="muted">after you ask a question, jot down what they said. it shows up here, and it makes the next questions better.</Hand>
        </View>
      ) : (
        <FlatList
          data={memories}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={[styles.rule, { backgroundColor: p.muted }]} />}
          renderItem={({ item }) => (
            <View style={styles.memory}>
              {item.questionText ? (
                <Hand size="small" tone="muted">
                  {item.questionText.toLowerCase()}
                </Hand>
              ) : null}
              <Hand>{item.text}</Hand>
              <View style={styles.footer}>
                <Hand size="small" tone="muted">
                  {new Date(item.createdAt).toLocaleDateString().toLowerCase()}
                </Hand>
                <Word title="remove" variant="quiet" size="small" onPress={() => remove(item)} />
              </View>
            </View>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.sm, paddingBottom: Spacing.lg },
  spaced: { marginTop: Spacing.xl },
  empty: { gap: Spacing.sm },
  list: { paddingBottom: Spacing.xl },
  memory: { gap: Spacing.xs, paddingVertical: Spacing.md },
  rule: { height: 1, opacity: 0.3 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
