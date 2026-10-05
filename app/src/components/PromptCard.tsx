/**
 * One question, filling the middle of the screen. Big, calm, nothing else.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Spacing, usePalette } from '@/constants/theme';
import type { Prompt } from '@/lib/api';

export function PromptCard({ prompt }: { prompt: Prompt }) {
  const palette = usePalette();
  return (
    <View style={styles.card}>
      <Text style={[styles.interest, { color: palette.accent }]}>
        {prompt.interest ?? 'Just because'}
      </Text>
      <Text style={[styles.text, { color: palette.text }]} accessibilityRole="header">
        {prompt.text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  interest: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  text: {
    fontSize: 30,
    lineHeight: 40,
    fontWeight: '600',
  },
});
