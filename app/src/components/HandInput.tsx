/**
 * A line to write on. Handwritten font, a single rule underneath, no box.
 */
import { forwardRef } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Type } from '@/constants/theme';

interface HandInputProps extends Omit<TextInputProps, 'style'> {
  style?: ViewStyle;
  size?: keyof typeof Type;
}

export const HandInput = forwardRef<TextInput, HandInputProps>(function HandInput({ style, size = 'body', multiline, ...rest }, ref) {
  const p = usePalette();
  const fontSize = Type[size];
  return (
    <View style={[styles.wrap, { borderBottomColor: p.rule }, style]}>
      <TextInput
        ref={ref}
        {...rest}
        multiline={multiline}
        placeholderTextColor={p.muted}
        selectionColor={p.ink}
        cursorColor={p.ink}
        style={[
          styles.input,
          { color: p.ink, fontSize, lineHeight: Math.round(fontSize * 1.35) },
          multiline && styles.multiline,
        ]}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    paddingBottom: 2,
  },
  input: {
    fontFamily: Fonts.hand,
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 44,
    // Web draws a focus box around inputs. The rule underneath is our focus cue.
    outlineWidth: 0,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top', // Android: start typing at the top, not vertically centred
  },
});
