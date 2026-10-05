/**
 * Every screen's outer frame: full-height, respects the notch and home
 * indicator, uses the palette background, and on web stays phone-width.
 *
 * `children` is React's name for "whatever JSX you put between the tags".
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaxContentWidth, Spacing, usePalette } from '@/constants/theme';

export function Screen({ children }: PropsWithChildren) {
  const palette = usePalette();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <View style={styles.column}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, // "take all available height"; the flexbox model is the same as CSS
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.md,
  },
});
