/**
 * A short list of dates that matter: label, month, day. Controlled like the
 * word choices: the parent owns the list. Kept deliberately plain: three
 * lines to write on and an "add" word beat a date picker for "mom's birthday, march 3".
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Hand } from '@/components/Hand';
import { HandInput } from '@/components/HandInput';
import { Word } from '@/components/Word';
import { Spacing } from '@/constants/theme';
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

  const remove = (index: number) => onChange(dates.filter((_, i) => i !== index));

  return (
    <View style={styles.wrap}>
      {dates.map((date, i) => (
        <View key={`${date.label}-${date.month}-${date.day}-${i}`} style={styles.row}>
          <Hand style={styles.rowText}>
            {date.label}
            <Hand tone="muted">{`  ${MONTHS[date.month - 1]} ${date.day}`}</Hand>
          </Hand>
          <Word title="Remove" variant="quiet" size="small" onPress={() => remove(i)} accessibilityLabel={`Remove ${date.label}`} />
        </View>
      ))}

      <View style={styles.form}>
        <HandInput
          value={label}
          onChangeText={setLabel}
          placeholder="Mom's birthday"
          maxLength={60}
          autoCapitalize="sentences"
          style={styles.labelInput}
          accessibilityLabel="Date label"
        />
        <HandInput value={month} onChangeText={setMonth} placeholder="MM" keyboardType="number-pad" maxLength={2} style={styles.numInput} accessibilityLabel="Month" />
        <HandInput value={day} onChangeText={setDay} placeholder="DD" keyboardType="number-pad" maxLength={2} style={styles.numInput} accessibilityLabel="Day" />
      </View>
      <Word title="Add date" size="small" onPress={add} disabled={!canAdd} />
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
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
  },
  form: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-end',
  },
  labelInput: {
    flex: 1,
  },
  numInput: {
    width: 48,
  },
});
