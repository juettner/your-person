/**
 * The dates that matter: label, month, day. Written as a short list with a
 * line to add one more. Controlled like the rest: the parent owns the list.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Line } from '@/components/Line';
import { Small } from '@/components/Small';
import { Word } from '@/components/Word';
import { Fonts, Ink, Spacing, Type } from '@/constants/theme';
import type { ImportantDate } from '@/lib/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DatesEditorProps {
  dates: ImportantDate[];
  onChange: (next: ImportantDate[]) => void;
}

export function DatesEditor({ dates, onChange }: DatesEditorProps) {
  const [label, setLabel] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');

  const m = Number(month);
  const d = Number(day);
  const canAdd = label.trim().length > 0 && m >= 1 && m <= 12 && d >= 1 && d <= 31;

  const add = () => {
    if (!canAdd) return;
    onChange([...dates, { label: label.trim(), month: m, day: d }]);
    setLabel('');
    setMonth('');
    setDay('');
  };

  return (
    <View style={styles.wrap}>
      {dates.map((date, i) => (
        <View key={`${date.label}-${date.month}-${date.day}-${i}`} style={styles.row}>
          <Text style={styles.rowText}>
            {date.label}
            <Small>{`  ${MONTHS[date.month - 1]} ${date.day}`}</Small>
          </Text>
          <Word label="remove" tone="grey" size={Type.small} onPress={() => onChange(dates.filter((_, j) => j !== i))} accessibilityLabel={`Remove ${date.label}`} />
        </View>
      ))}

      <View style={styles.form}>
        <Line value={label} onChangeText={setLabel} placeholder="Mom's birthday" maxLength={60} style={styles.labelInput} accessibilityLabel="Date label" />
        <Line value={month} onChangeText={setMonth} placeholder="MM" keyboardType="number-pad" maxLength={2} style={styles.numInput} accessibilityLabel="Month" />
        <Line value={day} onChangeText={setDay} placeholder="DD" keyboardType="number-pad" maxLength={2} style={styles.numInput} accessibilityLabel="Day" />
      </View>
      <Word label="add" tone={canAdd ? 'ink' : 'faint'} onPress={add} disabled={!canAdd} accessibilityLabel="Add date" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rowText: {
    fontFamily: Fonts.type,
    fontSize: Type.body,
    color: Ink.ink,
    flex: 1,
  },
  form: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  labelInput: {
    flex: 1,
    minWidth: 0, // let it shrink on web, where inputs have an intrinsic width
  },
  numInput: {
    width: 56,
    textAlign: 'center',
  },
});
