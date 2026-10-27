/**
 * A word you can tap. The journal has no buttons: actions are words on the
 * page. "keep", "not for us", "back", "what they said".
 *
 *   tone    ink (an action), grey (a quiet link), faint (the option you did not pick)
 *   marked  underlines the word in ink, for the choice you made
 */
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { Fonts, Ink, Type } from '@/constants/theme';

interface WordProps {
  label: string;
  onPress: () => void;
  tone?: 'ink' | 'grey' | 'faint';
  marked?: boolean;
  disabled?: boolean;
  size?: number;
  /** For screen readers, when the word alone is not descriptive. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Word({ label, onPress, tone = 'ink', marked = false, disabled = false, size = Type.word, accessibilityLabel, style }: WordProps) {
  const color = tone === 'ink' ? Ink.ink : tone === 'grey' ? Ink.muted : Ink.faint;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: marked, disabled }}
      hitSlop={6}
      style={({ pressed }) => [styles.word, style, pressed && styles.pressed]}
    >
      <Text style={[styles.text, { color, fontSize: size }, marked && styles.marked]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  word: {
    minHeight: 44,
    justifyContent: 'center',
  },
  text: {
    fontFamily: Fonts.type,
  },
  marked: {
    textDecorationLine: 'underline',
    textDecorationColor: Ink.ink,
  },
  pressed: {
    opacity: 0.6,
  },
});
