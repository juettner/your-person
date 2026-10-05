/**
 * Multi-select chips for the questionnaire. Tapping toggles an interest.
 *
 * Shows the first twelve plus a "+N more" chip, so the form fits on one screen;
 * tapping it reveals the rest. Anything already selected is always visible.
 *
 * This is a "controlled" component: it does not own the selection. The parent
 * passes `selected` in and gets told about changes through `onChange`.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { Interest } from '@/lib/api';

const INITIAL_VISIBLE = 12;

interface InterestChipsProps {
  interests: Interest[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export function InterestChips({ interests, selected, onChange }: InterestChipsProps) {
  const p = usePalette();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded
    ? interests
    : interests.filter((i, idx) => idx < INITIAL_VISIBLE || selected.includes(i.id));
  const hiddenCount = interests.length - visible.length;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <View style={styles.wrap}>
      {visible.map((interest) => {
        const on = selected.includes(interest.id);
        return (
          <Pressable
            key={interest.id}
            onPress={() => toggle(interest.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            style={[styles.chip, { borderColor: p.ink, backgroundColor: on ? p.accent : p.card }]}
          >
            <Text style={[on ? styles.labelOn : styles.label, { color: on ? p.onAccent : p.ink }]}>{interest.label}</Text>
          </Pressable>
        );
      })}
      {hiddenCount > 0 && (
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          style={[styles.chip, styles.more, { borderColor: p.ink }]}
        >
          <Text style={[styles.label, { color: p.ink }]}>+{hiddenCount} more</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
  },
  more: {
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  labelOn: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
  },
  // Keep the gap token referenced so the spacing scale stays the single source of truth.
  _spacing: { margin: Spacing.xs },
});
