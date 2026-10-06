/**
 * One card, tilted a touch like it was dropped on a table.
 *
 * The chip at the top says what to do with it. A question card shows its
 * interest; the other kinds say "say it out loud", "today", "go deeper", or
 * "listen", so the asker never has to guess whether to ask or to act.
 */
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/Card';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Prompt, PromptKind } from '@/lib/api';

interface PromptCardProps {
  prompt: Prompt;
  index: number;
  total: number;
  /** Your person's name, for the "made for Sam" note on AI-written questions. */
  askName: string;
}

const KIND_CHIP: Record<Exclude<PromptKind, 'question'>, string> = {
  appreciation: 'Say it out loud',
  bid: 'Today',
  dream: 'Go deeper',
  stress: 'Just listen',
};

function hintFor(prompt: Prompt, askName: string): string {
  switch (prompt.kind) {
    case 'appreciation':
      return `Not a question. Tell ${askName}, in your own words.`;
    case 'bid':
      return 'One small thing. Thumbs up if it landed.';
    case 'dream':
      return 'A bigger one. No rush, and no fixing.';
    case 'stress':
      return "Listen, take their side, don't solve it.";
    default:
      return prompt.source === 'ai' ? `Written for ${askName}. Rate it to teach the deck.` : 'Rate it so your deck gets better.';
  }
}

export function PromptCard({ prompt, index, total, askName }: PromptCardProps) {
  const p = usePalette();
  const chip = prompt.kind === 'question' ? (prompt.interest ?? 'Just because') : KIND_CHIP[prompt.kind];
  // Non-question cards flip the chip colors so they read as a different kind of card at a glance.
  const special = prompt.kind !== 'question';

  return (
    <Card style={styles.tilt} contentStyle={styles.content}>
      <View style={styles.topRow}>
        <View style={[styles.tag, { backgroundColor: special ? p.ink : p.accent }]}>
          <Text style={[styles.tagText, { color: special ? p.onInk : p.onAccent }]}>{chip.toUpperCase()}</Text>
        </View>
        <Text style={[styles.counter, { color: p.muted }]}>
          {index + 1} / {total}
        </Text>
      </View>
      <Text style={[styles.question, { color: p.ink }]} accessibilityRole="header">
        {prompt.text}
      </Text>
      <View style={[styles.rule, { backgroundColor: p.ink }]} />
      <Text style={[styles.hint, { color: p.muted }]}>{hintFor(prompt, askName)}</Text>
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
    fontSize: 30,
    lineHeight: 36,
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
