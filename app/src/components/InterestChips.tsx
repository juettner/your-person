/**
 * Multi-select chips for the questionnaire. Tapping toggles an interest.
 *
 * This is a "controlled" component: it does not own the selection. The parent
 * passes `selected` in and gets told about changes through `onChange`. That is
 * the React norm, and it keeps form state in one place.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Radius, Spacing, usePalette } from '@/constants/theme';
import type { Interest } from '@/lib/api';

interface InterestChipsProps {
  interests: Interest[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function InterestChips({ interests, selected, onChange }: InterestChipsProps) {
  const palette = usePalette();

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <View style={styles.wrap}>
      {interests.map((interest) => {
        const on = selected.includes(interest.id);
        return (
          <Pressable
            key={interest.id} // React needs a stable key for each item in a list
            onPress={() => toggle(interest.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[
              styles.chip,
              { borderColor: on ? palette.accent : palette.border },
              on && { backgroundColor: palette.accent },
            ]}
          >
            <Text style={[styles.label, { color: on ? palette.onAccent : palette.text }]}>
              {interest.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
  },
});
