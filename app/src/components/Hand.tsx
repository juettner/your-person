/**
 * Static handwritten text: the Allura script with the app's sizes baked in.
 * Use this for anything that doesn't need to be written in front of you.
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Type } from '@/constants/theme';

interface HandProps extends Omit<TextProps, 'style'> {
  size?: keyof typeof Type | number;
  tone?: 'ink' | 'muted';
  align?: 'left' | 'center' | 'right';
  style?: TextStyle | TextStyle[];
}

export function Hand({ size = 'body', tone = 'ink', align = 'left', style, children, ...rest }: PropsWithChildren<HandProps>) {
  const p = usePalette();
  const fontSize = typeof size === 'number' ? size : Type[size];
  return (
    <Text
      {...rest}
      style={[
        styles.text,
        {
          fontFamily: Fonts.script,
          fontSize,
          lineHeight: Math.round(fontSize * 1.3),
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
    letterSpacing: 0,
  },
});
