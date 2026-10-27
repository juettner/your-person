/**
 * A line to write on: a text input with nothing but a rule underneath, the
 * way a journal page has lines. Used for a name, a city, what they said.
 */
import { forwardRef } from 'react';
import { Platform, StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { Fonts, Ink, Type } from '@/constants/theme';

interface LineProps extends TextInputProps {
  size?: number;
}

export const Line = forwardRef<TextInput, LineProps>(function Line({ size = Type.body, style, ...rest }, ref) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={Ink.faint}
      selectionColor={Ink.ink}
      cursorColor={Ink.ink}
      style={[styles.input, { fontSize: size }, style]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    fontFamily: Fonts.type,
    color: Ink.ink,
    borderBottomWidth: 1,
    borderBottomColor: Ink.ink,
    paddingVertical: 6,
    paddingHorizontal: 0,
    minHeight: 44,
    // The browser draws a focus box around inputs; the rule underneath is the journal's focus.
    ...Platform.select({ web: { outlineStyle: 'none' } as object }),
  },
});
