/**
 * The offset "paper cut-out" shadow behind cards and the main button.
 *
 * Native shadows are soft and blurred, and Android's `elevation` can't do a
 * hard offset at all. So we fake it: a solid rectangle of the shadow color sits
 * behind the content, shifted down and right. Works identically on iOS,
 * Android, and web.
 */
import type { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface HardShadowProps {
  color: string;
  /** How far the shadow is pushed down and to the right, in px. */
  offset?: number;
  radius: number;
  style?: ViewStyle;
}

export function HardShadow({ color, offset = 6, radius, style, children }: PropsWithChildren<HardShadowProps>) {
  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: color, borderRadius: radius, transform: [{ translateX: offset }, { translateY: offset }] },
        ]}
      />
      {children}
    </View>
  );
}
