/**
 * A short list of dates that matter: label, month, day. Controlled like the
 * chips: the parent owns the list. Kept deliberately plain: three inputs and
 * an "Add" button beat a date picker for "Mom's birthday, March 3".
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import type { ImportantDate } from '@/lib/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DatesEditorProps {
  dates: ImportantDate[];
  onChange: (next: ImportantDate[]) => void;
}

export function DatesEditor({ dates, onChange }: DatesEditorProps) {
  const p = usePalette();
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

  const remove = (index: number) => onChange(dates.filter((_, i) => i !== index));

  const inputStyle = [styles.input, { color: p.ink, borderColor: p.ink, backgroundColor: p.card }];

  return (
    <View style={styles.wrap}>
      {dates.map((date, i) => (
        <View key={`${date.label}-${date.month}-${date.day}-${i}`} style={[styles.row, { borderColor: p.ink }]}>
          <Text style={[styles.rowText, { color: p.ink }]}>
            {date.label}
            <Text style={{ color: p.muted }}>{`  ${MONTHS[date.month - 1]} ${date.day}`}</Text>
          </Text>
          <Pressable onPress={() => remove(i)} accessibilityRole="button" accessibilityLabel={`Remove ${date.label}`} hitSlop={8}>
            <Text style={[styles.remove, { color: p.muted }]}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <View style={styles.form}>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Mom's birthday"
          placeholderTextColor={p.muted}
          maxLength={60}
          style={[...inputStyle, styles.labelInput]}
          accessibilityLabel="Date label"
        />
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="MM"
          placeholderTextColor={p.muted}
          keyboardType="number-pad"
          maxLength={2}
          style={[...inputStyle, styles.numInput]}
          accessibilityLabel="Month"
        />
        <TextInput
          value={day}
          onChangeText={setDay}
          placeholder="DD"
          placeholderTextColor={p.muted}
          keyboardType="number-pad"
          maxLength={2}
          style={[...inputStyle, styles.numInput]}
          accessibilityLabel="Day"
        />
      </View>
      <Button title="Add date" variant="outline" onPress={add} disabled={!canAdd} style={styles.addButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: Spacing.sm,
  },
  rowText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    flex: 1,
  },
  remove: {
    fontFamily: Fonts.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  form: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  input: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderRadius: Radius.md,
  },
  labelInput: {
    flex: 1,
  },
  numInput: {
    width: 64,
    textAlign: 'center',
  },
  addButton: {
    minHeight: 44,
  },
});
