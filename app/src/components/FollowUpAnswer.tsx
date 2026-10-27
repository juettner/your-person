/**
 * The answer to ONE follow-up question ("Which sport?", "Which team?"):
 * circled words for a `choice`, a line to write on for `text`. Nothing here
 * knows about sports or music; it only knows the two field kinds the API
 * serves.
 */
import { StyleSheet, View } from 'react-native';
import { Circled } from '@/components/Circled';
import { Line } from '@/components/Line';
import type { FollowUp } from '@/lib/api';

export type Answer = string | string[] | undefined;

interface FollowUpAnswerProps {
  followUp: FollowUp;
  value: Answer;
  onChange: (next: string | string[]) => void;
}

export function FollowUpAnswer({ followUp, value, onChange }: FollowUpAnswerProps) {
  if (followUp.kind === 'text') {
    return (
      <Line
        value={typeof value === 'string' ? value : ''}
        onChangeText={onChange}
        placeholder={followUp.placeholder}
        maxLength={120}
        autoCapitalize="sentences"
        accessibilityLabel={followUp.prompt}
      />
    );
  }

  const multi = followUp.multi ?? false;
  const picked = multi ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? [value] : [];

  const toggle = (option: string) => {
    if (multi) {
      onChange(picked.includes(option) ? picked.filter((s) => s !== option) : [...picked, option]);
    } else {
      onChange(picked[0] === option ? '' : option); // tapping the chosen one again clears it
    }
  };

  return (
    <View style={styles.list}>
      {(followUp.options ?? []).map((option) => (
        <Circled key={option} label={option} on={picked.includes(option)} onPress={() => toggle(option)} role={multi ? 'checkbox' : 'radio'} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 2,
  },
});
