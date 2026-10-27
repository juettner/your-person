/**
 * The small grey text of the journal: the date line, a count, a hint.
 */
import { StyleSheet, Text, type TextProps } from 'react-native';
import { Fonts, Ink, Type } from '@/constants/theme';

interface SmallProps extends TextProps {
  tone?: 'grey' | 'muted' | 'ink';
}

export function Small({ tone = 'grey', style, ...rest }: SmallProps) {
  const color = tone === 'grey' ? Ink.grey : tone === 'muted' ? Ink.muted : Ink.ink;
  return <Text style={[styles.text, { color }, style]} {...rest} />;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.type,
    fontSize: Type.small,
    lineHeight: Type.small * 1.5,
  },
});
