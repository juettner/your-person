/**
 * Static handwritten text: the Grug Hand font with the app's sizes baked in.
 * Use this for anything that doesn't need to be written in front of you.
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Type } from '@/constants/theme';

interface HandProps extends Omit<TextProps, 'style'> {
  size?: keyof typeof Type | number;
  tone?: 'ink' | 'muted';
  weight?: 'regular' | 'medium';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle | TextStyle[];
}

export function Hand({ size = 'body', tone = 'ink', weight = 'regular', align = 'left', style, children, ...rest }: PropsWithChildren<HandProps>) {
  const p = usePalette();
  const fontSize = typeof size === 'number' ? size : Type[size];
  return (
    <Text
      {...rest}
      style={[
        styles.text,
        {
          fontFamily: weight === 'medium' ? Fonts.handMedium : Fonts.hand,
          fontSize,
          lineHeight: Math.round(fontSize * 1.35),
          color: tone === 'muted' ? p.muted : p.ink,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    // Grug Hand draws lowercase for everything; keep the metal out of it.
    letterSpacing: 0.2,
  },
});
