/**
 * One question on an index card, tilted a touch like it was dropped on a table.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Prompt } from '@/lib/api';

interface PromptCardProps {
  prompt: Prompt;
  index: number;
  total: number;
}

export function PromptCard({ prompt, index, total }: PromptCardProps) {
  const p = usePalette();
  return (
    <Card style={styles.tilt} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: p.accent }]}>
          <Text style={[styles.tagText, { color: p.onAccent }]}>{(prompt.interest ?? 'Just because').toUpperCase()}</Text>
        </View>
        <Text style={[styles.counter, { color: p.muted }]}>
          {index + 1} / {total}
        </Text>
      </View>
      <Text style={[styles.question, { color: p.ink }]} accessibilityRole="header">
        {prompt.text}
      </Text>
      <View style={[styles.rule, { backgroundColor: p.ink }]} />
      <Text style={[styles.hint, { color: p.muted }]}>Rate it so your deck gets better.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  tilt: {
    transform: [{ rotate: '-1.5deg' }],
  },
  content: {
    gap: Spacing.md + 4,
    paddingTop: Spacing.lg + 4,
    paddingBottom: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
    letterSpacing: 0.8,
  },
  counter: {
    fontFamily: Fonts.bold,
    fontSize: 14,
  },
  question: {
    fontFamily: Fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  rule: {
    height: 2,
    opacity: 0.12,
  },
  hint: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 22,
  },
});
