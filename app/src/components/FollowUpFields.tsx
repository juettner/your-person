/**
 * The follow-up questions for ONE interest, rendered from the taxonomy the
 * API serves: words to pick for `choice`, a line to write on for `text`.
 * Nothing here knows about sports or music specifically; it only knows the
 * two field kinds.
 */
import { StyleSheet, View } from 'react-native';
import { Hand } from '@/components/Hand';
import { HandInput } from '@/components/HandInput';
import { WordChoice } from '@/components/WordChoice';
import { Spacing } from '@/constants/theme';
import type { Interest } from '@/lib/api';

type Answers = Record<string, string | string[]>;

interface FollowUpFieldsProps {
  interest: Interest;
  answers: Answers;
  onChange: (next: Answers) => void;
}

export function FollowUpFields({ interest, answers, onChange }: FollowUpFieldsProps) {
  const set = (id: string, value: string | string[]) => onChange({ ...answers, [id]: value });

  return (
    <>
      {interest.followUps.map((f) => {
        const value = answers[f.id];
        return (
          <View key={f.id} style={styles.field}>
            <Hand size="small" tone="muted">
              {f.prompt}
            </Hand>
            {f.kind === 'choice' ? (
              <WordChoice
                options={(f.options ?? []).map((o) => ({ id: o, label: o }))}
                selected={Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []}
                multi={f.multi ?? false}
                onChange={(ids) => set(f.id, f.multi ? ids : (ids[0] ?? ''))}
              />
            ) : (
              <HandInput
                value={typeof value === 'string' ? value : ''}
                onChangeText={(v) => set(f.id, v)}
                placeholder={f.placeholder}
                maxLength={120}
                autoCapitalize="sentences"
                accessibilityLabel={f.prompt}
              />
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.xs,
  },
});
