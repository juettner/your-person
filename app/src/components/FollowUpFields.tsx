/**
 * The follow-up questions for ONE interest, rendered from the taxonomy the
 * API serves: chips for `choice`, an input for `text`. Nothing here knows
 * about sports or music specifically; it only knows the two field kinds.
 */
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ChoiceChips } from '@/components/ChoiceChips';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius } from '@/constants/theme';
import type { Interest } from '@/lib/api';

type Answers = Record<string, string | string[]>;

interface FollowUpFieldsProps {
  interest: Interest;
  answers: Answers;
  onChange: (next: Answers) => void;
}

export function FollowUpFields({ interest, answers, onChange }: FollowUpFieldsProps) {
  const p = usePalette();

  const set = (id: string, value: string | string[]) => onChange({ ...answers, [id]: value });

  return (
    <>
      {interest.followUps.map((f) => (
        <View key={f.id} style={styles.field}>
          <Text style={[styles.label, { color: p.ink }]}>{f.prompt}</Text>
          {f.kind === 'choice' ? (
            <ChoiceChips options={f.options ?? []} value={answers[f.id]} multi={f.multi ?? false} onChange={(v) => set(f.id, v)} />
          ) : (
            <TextInput
              value={typeof answers[f.id] === 'string' ? (answers[f.id] as string) : ''}
              onChangeText={(v) => set(f.id, v)}
              placeholder={f.placeholder}
              placeholderTextColor={p.muted}
              maxLength={120}
              autoCapitalize="sentences"
              style={[styles.input, { color: p.ink, borderColor: p.ink, backgroundColor: p.card }]}
              accessibilityLabel={f.prompt}
            />
          )}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 15,
  },
  input: {
    fontFamily: Fonts.medium,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 2,
    borderRadius: Radius.md,
  },
});
