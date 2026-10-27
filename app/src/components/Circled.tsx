/**
 * A word with a circle drawn around it in ink when it is picked.
 *
 * The circle is one pen stroke: it starts low on the left, sweeps over the
 * top, comes down the right, runs back along the bottom, and overlaps its
 * own start before stopping, the way a hand closes a loop. It is drawn over
 * ~0.7s by revealing the stroke a little at a time (a dash as long as the
 * whole path, with its offset shrinking to zero). Unpicking removes it at
 * once: nobody un-draws a circle.
 *
 * The path is defined in a 100x40 box and stretched to the word's measured
 * size, so a long word gets a wider loop with the same hand-drawn shape.
 */
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Fonts, Ink, Type } from '@/constants/theme';

interface CircledProps {
  label: string;
  on: boolean;
  onPress: () => void;
  size?: number;
}

/** One loop with a run-up and an overlap, in a 100 x 40 box. */
const LOOP = 'M14,29 C6,24 6,10 30,5 C52,1 80,2 94,11 C102,17 98,30 80,35 C62,40 30,41 14,36 C4,33 2,24 10,17 C16,12 26,9 36,8';
/** Its length in those units, measured once by walking the curves. */
const LOOP_LENGTH = measure(LOOP);

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Circled({ label, on, onPress, size = Type.body }: CircledProps) {
  const [box, setBox] = useState({ width: 0, height: 0 });
  // 0 = nothing drawn, 1 = the whole loop. An Animated.Value changes without re-rendering React.
  // Created once with useState's initializer; a word that starts picked (the profile page) shows its circle without redrawing it.
  const [progress] = useState(() => new Animated.Value(on ? 1 : 0));
  const previous = useRef(on);

  useEffect(() => {
    if (previous.current === on) return;
    previous.current = on;
    if (on) {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration: 700, easing: Easing.bezier(0.3, 0, 0.2, 1), useNativeDriver: false }).start();
    } else {
      progress.setValue(0);
    }
  }, [on, progress]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox({ width, height });
  };

  const offset = progress.interpolate({ inputRange: [0, 1], outputRange: [LOOP_LENGTH, 0] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      aria-checked={on}
      accessibilityLabel={label}
      style={styles.row}
    >
      <View onLayout={onLayout} style={styles.wordBox}>
        <Text style={[styles.word, { fontSize: size, lineHeight: size * 1.5 }]}>{label}</Text>
        {on && box.width > 0 && (
          <View pointerEvents="none" style={[styles.ring, { left: -PAD_X, top: -PAD_Y, width: box.width + PAD_X * 2, height: box.height + PAD_Y * 2 }]}>
            <Svg width="100%" height="100%" viewBox="0 0 100 40" preserveAspectRatio="none">
              <AnimatedPath
                d={LOOP}
                fill="none"
                stroke={Ink.ink}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={[LOOP_LENGTH, LOOP_LENGTH]}
                strokeDashoffset={offset}
              />
            </Svg>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const PAD_X = 16;
const PAD_Y = 8;

/** Length of an SVG path made of M and C commands, by sampling each cubic. */
function measure(d: string): number {
  const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  let [x, y] = [nums[0], nums[1]];
  let length = 0;
  for (let i = 2; i < nums.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = nums.slice(i, i + 6);
    let [px, py] = [x, y];
    for (let s = 1; s <= 24; s++) {
      const t = s / 24;
      const u = 1 - t;
      const bx = u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
      const by = u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
      length += Math.hypot(bx - px, by - py);
      [px, py] = [bx, by];
    }
    [x, y] = [x3, y3];
  }
  return length;
}

const styles = StyleSheet.create({
  row: {
    minHeight: 42,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  wordBox: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
  word: {
    fontFamily: Fonts.type,
    color: Ink.ink,
  },
  ring: {
    position: 'absolute',
  },
});
