/**
 * The list of things they're into, one word per line, each circled in ink
 * when picked. Used on the onboarding page and on their page.
 *
 * Controlled: the parent owns the selection and hears about changes through
 * `onChange`, the React norm for form state.
 */
import { StyleSheet, View } from 'react-native';
import { Circled } from '@/components/Circled';
import type { Interest } from '@/lib/api';

interface InterestsProps {
  interests: Interest[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function Interests({ interests, selected, onChange }: InterestsProps) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  return (
    <View style={styles.list}>
      {interests.map((interest) => (
        <Circled key={interest.id} label={interest.label.toLowerCase()} on={selected.includes(interest.id)} onPress={() => toggle(interest.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 4,
  },
});
