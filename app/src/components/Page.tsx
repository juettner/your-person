/**
 * One page of the journal: white paper, the notch and home bar respected,
 * phone-width on a desktop browser, and, when the page can be turned, a
 * lifted corner at the bottom right.
 *
 * Turning the page: tap the corner, or swipe left anywhere on the page.
 * The swipe uses PanResponder, React Native's low-level touch API. It claims
 * the gesture only once the finger has clearly moved sideways, so taps and
 * vertical scrolling inside the page still work.
 */
import { useMemo, type PropsWithChildren } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Polygon } from 'react-native-svg';
import { Ink, Margin, PageWidth } from '@/constants/theme';

interface PageProps {
  /** When set, the page shows the fold and can be turned. */
  onTurn?: () => void;
  /** Screen-reader name for the fold ("Turn the page", "Three more"). */
  turnLabel?: string;
  /** Swipe right (going back), when the page allows it. */
  onTurnBack?: () => void;
}

export function Page({ onTurn, turnLabel = 'Turn the page', onTurnBack, children }: PropsWithChildren<PageProps>) {
  const insets = useSafeAreaInsets();

  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -60 && onTurn) onTurn();
          else if (g.dx > 60 && onTurnBack) onTurnBack();
        },
      }),
    [onTurn, onTurnBack],
  );

  return (
    <View style={styles.paper}>
      <View
        {...pan.panHandlers}
        style={[
          styles.page,
          { paddingTop: insets.top + Margin.top, paddingBottom: Math.max(insets.bottom, 12) },
        ]}
      >
        {children}
        {onTurn && <Fold onPress={onTurn} label={turnLabel} />}
      </View>
    </View>
  );
}

/** The lifted corner. A diagonal crease with the page underneath showing through, white on white. */
function Fold({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.fold} hitSlop={8}>
      <Svg width={FOLD} height={FOLD} viewBox={`0 0 ${FOLD} ${FOLD}`}>
        <Polygon points={`0,${FOLD} ${FOLD},0 ${FOLD},${FOLD}`} fill={Ink.fold} />
        <Polygon points={`0,${FOLD} ${FOLD},0 ${FOLD - 4},0 0,${FOLD - 4}`} fill={Ink.foldEdge} opacity={0.6} />
        <Line x1={0} y1={FOLD} x2={FOLD} y2={0} stroke={Ink.foldEdge} strokeWidth={2} />
      </Svg>
    </Pressable>
  );
}

const FOLD = 120;

const styles = StyleSheet.create({
  paper: {
    flex: 1,
    backgroundColor: Ink.paper,
    alignItems: 'center',
  },
  page: {
    flex: 1,
    width: '100%',
    maxWidth: PageWidth,
    paddingHorizontal: Margin.side,
    backgroundColor: Ink.paper,
  },
  fold: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: FOLD,
    height: FOLD,
  },
});
