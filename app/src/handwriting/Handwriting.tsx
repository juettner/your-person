/**
 * Text that writes itself, stroke by stroke, like ink appearing on paper.
 *
 * The pieces:
 *
 *   1. Measure the available width (`onLayout`). Nothing can be laid out
 *      before we know where the lines wrap.
 *   2. Build a plan (`plan.ts`): every letter gets a position, a start time
 *      and a duration. The plan is memoised; it only changes when the text,
 *      the width or the size does.
 *   3. Run one clock. A `requestAnimationFrame` loop stores "seconds since
 *      start" in state, throttled to 15-30 fps. Every re-render derives each
 *      letter's progress from that one number.
 *   4. Draw. One <Svg> holds every stroke as a <Path>. A stroke that hasn't
 *      started is skipped, a finished one is drawn plain, and the one being
 *      written right now uses the SVG dash trick: dasharray = its length,
 *      dashoffset = the part not yet drawn. The browser and the native SVG
 *      renderer both do that on the GPU, so the frame work is small.
 *   5. When the clock passes the plan's total duration the loop stops and the
 *      component renders static paths from then on.
 *
 * Feel: with `haptics` on, the phone ticks softly as the pen starts each
 * word and gives one light tap when the line is finished, so you feel the
 * writing as well as see it. Nothing happens on web.
 *
 * Characters the typeface has no drawing for (emoji, odd symbols) are shown
 * in the Allura font at the same spot, so nothing silently disappears.
 */
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Fonts } from '@/constants/theme';
import { framesPerSecond, PlannedGlyph, planText, TextPlan } from './plan';
import { BASELINE_EM, BOX_EM } from './typeface';
import { useReduceMotion } from './useReduceMotion';

export interface HandwritingProps {
  text: string;
  color: string;
  /** Font size in pixels. 30 reads like body text; 46 is a headline. */
  size?: number;
  /** false renders the finished text immediately. */
  animate?: boolean;
  /** 1 is the default pace. 2 is twice as slow. */
  speed?: number;
  /** Seconds to wait before the pen starts. */
  delay?: number;
  /** Bump this to write the same text again. */
  replayKey?: number;
  /** Tick as each word starts, tap when done. Native only. */
  haptics?: boolean;
  align?: 'left' | 'center';
  lineHeight?: number;
  lineWidth?: number;
  style?: ViewStyle;
  onDone?: () => void;
}

export function Handwriting({
  text,
  color,
  size = 30,
  animate = true,
  speed = 1,
  delay = 0,
  replayKey = 0,
  haptics = false,
  align = 'left',
  lineHeight,
  lineWidth,
  style,
  onDone,
}: HandwritingProps) {
  const reduceMotion = useReduceMotion();
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    setWidth((w) => (w === next ? w : next));
  }, []);

  const plan: TextPlan | null = useMemo(() => {
    if (width <= 0) return null;
    return planText(text, {
      width,
      size,
      speed,
      align,
      lineHeight: lineHeight ?? size * 1.3,
      tracking: 0,
    });
  }, [text, width, size, speed, align, lineHeight]);

  const shouldAnimate = animate && !reduceMotion;
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  // One clock for the whole text. The state remembers which plan and replay
  // it belongs to, so a new plan starts from zero without an extra render;
  // Infinity means "show everything".
  const [clock, setClock] = useState<{ plan: TextPlan | null; replayKey: number; elapsed: number }>({
    plan: null,
    replayKey: 0,
    elapsed: 0,
  });
  const elapsed = !shouldAnimate ? Infinity : clock.plan === plan && clock.replayKey === replayKey ? clock.elapsed : 0;

  useEffect(() => {
    if (!plan) return;
    if (!shouldAnimate) {
      onDoneRef.current?.();
      return;
    }
    const total = delay + plan.totalDuration;
    const interval = 1000 / framesPerSecond(plan.visibleCount);
    const startedAt = performance.now();
    const tick = haptics && Platform.OS !== 'web';
    let lastFrame = -Infinity;
    let lastWord = -1;
    let frame = 0;
    let finished = false;

    const loop = (now: number) => {
      const seconds = (now - startedAt) / 1000;
      if (seconds >= total) {
        finished = true;
        setClock({ plan, replayKey, elapsed: Infinity });
        if (tick) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onDoneRef.current?.();
        return;
      }
      if (tick) {
        // The word the pen is on right now. A new one means a soft tick.
        const word = currentWord(plan, seconds - delay);
        if (word > lastWord) {
          lastWord = word;
          Haptics.selectionAsync().catch(() => {});
        }
      }
      if (now - lastFrame >= interval) {
        lastFrame = now;
        setClock({ plan, replayKey, elapsed: seconds });
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      if (!finished) cancelAnimationFrame(frame);
    };
  }, [plan, shouldAnimate, delay, replayKey, haptics]);

  const strokeWidth = lineWidth ?? Math.max(1.1, size * 0.028);
  const minHeight = size * BOX_EM;

  return (
    <View
      onLayout={onLayout}
      style={[styles.block, { minHeight }, style, plan ? { height: plan.height } : null]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={text}
    >
      {plan && (
        <>
          <Svg width={plan.width} height={plan.height} aria-hidden>
            {plan.glyphs.map((g) => (g.glyph ? renderGlyph(g, elapsed - delay, color, strokeWidth) : null))}
          </Svg>
          {plan.glyphs.map((g) =>
            g.glyph ? null : (
              <Text
                key={g.id}
                aria-hidden
                style={[
                  styles.fallback,
                  {
                    left: g.x,
                    top: g.y - size * BASELINE_EM,
                    width: g.width,
                    height: size * BOX_EM,
                    lineHeight: size * BASELINE_EM * 1.45,
                    fontSize: size,
                    color,
                    opacity: elapsed - delay > g.delay ? 1 : 0,
                  },
                ]}
              >
                {g.character}
              </Text>
            ),
          )}
        </>
      )}
    </View>
  );
}

/** Index of the word the pen is writing at `seconds`, or -1 before the first. */
function currentWord(plan: TextPlan, seconds: number): number {
  let word = -1;
  for (const g of plan.glyphs) {
    if (g.delay > seconds) break;
    word = g.word;
  }
  return word;
}

/**
 * Draws one letter's strokes for the current moment. The pen moves through
 * the strokes in order, so earlier strokes finish before later ones start:
 * exactly like the letter was written.
 */
function renderGlyph(g: PlannedGlyph, elapsed: number, color: string, strokeWidth: number) {
  const glyph = g.glyph!;
  const progress = Math.min(1, Math.max(0, (elapsed - g.delay) / Math.max(0.001, g.duration)));
  if (progress <= 0 || glyph.totalLength <= 0) return null;
  const inkSoFar = glyph.totalLength * progress;

  let accumulated = 0;
  const paths = [];
  for (let i = 0; i < glyph.strokes.length; i += 1) {
    const stroke = glyph.strokes[i];
    if (stroke.length <= 0) continue;
    if (inkSoFar <= accumulated) break;
    const strokeEnd = accumulated + stroke.length;
    const strokeProgress = inkSoFar >= strokeEnd ? 1 : (inkSoFar - accumulated) / stroke.length;
    accumulated = strokeEnd;

    paths.push(
      <Path
        key={`${g.id}-${i}`}
        d={pathData(stroke.points, g.x, g.y)}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={strokeProgress < 1 ? `${stroke.length} ${stroke.length}` : undefined}
        strokeDashoffset={strokeProgress < 1 ? stroke.length * (1 - strokeProgress) : undefined}
      />,
    );
  }
  return paths;
}

function pathData(points: number[], dx: number, dy: number): string {
  let d = `M${(points[0] + dx).toFixed(1)} ${(points[1] + dy).toFixed(1)}`;
  for (let i = 2; i < points.length; i += 2) {
    d += `L${(points[i] + dx).toFixed(1)} ${(points[i + 1] + dy).toFixed(1)}`;
  }
  return d;
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    position: 'relative',
  },
  fallback: {
    position: 'absolute',
    fontFamily: Fonts.script,
    textAlign: 'center',
  },
});
