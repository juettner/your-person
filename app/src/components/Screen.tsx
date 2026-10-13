/**
 * Every screen's outer frame: the paper. Full height, respects the notch and
 * home indicator, and on web stays phone-width in the middle of the window.
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePalette } from '@/components/ThemeProvider';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export function Screen({ children }: PropsWithChildren) {
  const p = usePalette();
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.paper }]}>
      <View style={styles.column}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: 'center',
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
});
