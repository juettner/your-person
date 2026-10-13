/**
 * Pick words from a list. Chosen ones get circled.
 *
 * Single-select behaves like radio buttons, multi-select like checkboxes.
 * Controlled: the parent owns the value. `limit` shows only the first N words
 * plus anything already chosen, with a "+n more" word to reveal the rest, so
 * a long list (the interests) fits on one screen.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Word } from '@/components/Word';

export interface Choice {
  id: string;
  label: string;
}

interface WordChoiceProps {
  options: Choice[];
  selected: string[];
  multi: boolean;
  onChange: (next: string[]) => void;
  limit?: number;
  size?: 'body' | 'small';
}

export function WordChoice({ options, selected, multi, onChange, limit, size = 'body' }: WordChoiceProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded || !limit ? options : options.filter((o, i) => i < limit || selected.includes(o.id));
  const hidden = options.length - visible.length;

  const toggle = (id: string) => {
    if (multi) {
      onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
    } else {
      // Tapping the chosen word again clears it, so nothing is ever stuck.
      onChange(selected[0] === id ? [] : [id]);
    }
  };

  return (
    <View style={styles.wrap} accessibilityRole={multi ? undefined : 'radiogroup'}>
      {visible.map((o) => (
        <Word
          key={o.id}
          title={o.label}
          variant="option"
          size={size}
          selected={selected.includes(o.id)}
          onPress={() => toggle(o.id)}
          accessibilityRole={multi ? 'checkbox' : 'radio'}
          style={styles.item}
        />
      ))}
      {hidden > 0 && <Word title={`+${hidden} more`} variant="quiet" size={size} onPress={() => setExpanded(true)} style={styles.item} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 18,
    rowGap: 2,
  },
  item: {
    minHeight: 40,
  },
});
