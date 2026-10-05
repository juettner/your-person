/**
 * The index card: paper, a 2px ink border, rounded corners, hard ink shadow.
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { HardShadow } from '@/components/HardShadow';
import { usePalette } from '@/components/ThemeProvider';
import { Radius, Spacing } from '@/constants/theme';

interface CardProps {
  style?: ViewStyle;
  /** Style for the inner padded area, e.g. to change padding or add gap. */
  contentStyle?: ViewStyle;
}

export function Card({ style, contentStyle, children }: PropsWithChildren<CardProps>) {
  const p = usePalette();
  return (
    <HardShadow color={p.ink} offset={6} radius={Radius.card} style={style}>
      <View style={[styles.paper, { backgroundColor: p.card, borderColor: p.ink }, contentStyle]}>{children}</View>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderWidth: 2,
    borderRadius: Radius.card,
    padding: Spacing.lg,
  },
});
