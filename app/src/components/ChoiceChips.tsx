/**
 * Chips for a follow-up with fixed options. Single-select behaves like radio
 * buttons; multi-select like checkboxes. Controlled: the parent owns the value.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius } from '@/constants/theme';

interface ChoiceChipsProps {
  options: string[];
  /** A string for single-select, an array for multi-select. */
  value: string | string[] | undefined;
  multi: boolean;
  onChange: (next: string | string[]) => void;
}

export function ChoiceChips({ options, value, multi, onChange }: ChoiceChipsProps) {
  const p = usePalette();
  const selected = multi ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? [value] : [];

  const toggle = (option: string) => {
    if (multi) {
      onChange(selected.includes(option) ? selected.filter((s) => s !== option) : [...selected, option]);
    } else {
      // Tapping the chosen option again clears it, so nothing is ever stuck.
      onChange(selected[0] === option ? '' : option);
    }
  };

  return (
    <View style={styles.wrap}>
      {options.map((option) => {
        const on = selected.includes(option);
        return (
          <Pressable
            key={option}
            onPress={() => toggle(option)}
            accessibilityRole={multi ? 'checkbox' : 'radio'}
            accessibilityState={{ checked: on }}
            aria-checked={on}
            style={[styles.chip, { borderColor: p.ink, backgroundColor: on ? p.accent : p.card }]}
          >
            <Text style={[on ? styles.labelOn : styles.label, { color: on ? p.onAccent : p.ink }]}>{option}</Text>
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
    gap: 6,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 2,
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bold,
    fontSize: 13,
  },
  labelOn: {
    fontFamily: Fonts.extraBold,
    fontSize: 13,
  },
});
