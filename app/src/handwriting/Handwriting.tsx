/**
 * Text that writes itself, stroke by stroke, like ink appearing on paper.
 *
 * This is the port of grug's HandDrawnText. The pieces:
 *
 *   1. Measure the available width (`onLayout`). Nothing can be laid out
 *      before we know where the lines wrap.
 *   2. Build a plan (`plan.ts`): every letter gets a position, a start time
 *      and a duration. The plan is memoised; it only changes when the text,
 *      the width or the size does.
 *   3. Run one clock. A `requestAnimationFrame` loop stores "seconds since
 *      start" in state, throttled to grug's 15-30 fps. Every re-render
 *      derives each letter's progress from that one number.
 *   4. Draw. One <Svg> holds every stroke as a <Path>. A stroke that hasn't
 *      started is skipped, a finished one is drawn plain, and the one being
 *      written right now uses the SVG dash trick: dasharray = its length,
 *      dashoffset = the part not yet drawn. The browser and the native SVG
 *      renderer both do that on the GPU, so the frame work is small.
 *   5. When the clock passes the plan's total duration the loop stops and the
 *      component renders static paths from then on.
 *
 * Characters the typeface has no drawing for (accents, emoji, "&") are shown
 * in the Grug Hand font at the same spot, so nothing silently disappears.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Fonts } from '@/constants/theme';
import { framesPerSecond, PlannedGlyph, planText, TextPlan } from './plan';
import { useReduceMotion } from './useReduceMotion';

export interface HandwritingProps {
  text: string;
  color: string;
  /** Glyph box height. 28 reads like body text; 40 is a headline. */
  size?: number;
  /** false renders the finished text immediately. */
  animate?: boolean;
  /** 1 is grug's quick scribble, 4 its relaxed pace. */
  speed?: number;
  /** Seconds to wait before the pen starts. */
  delay?: number;
  /** Bump this to write the same text again. */
  replayKey?: number;
  /** Same seed, same letter variations. Defaults to a hash of the text. */
  seed?: number;
  align?: 'left' | 'center';
  lineHeight?: number;
  lineWidth?: number;
  style?: ViewStyle;
  onDone?: () => void;
}

export function Handwriting({
  text,
  color,
  size = 28,
  animate = true,
  speed = 4,
  delay = 0,
  replayKey = 0,
  seed,
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
      seed: seed ?? hashText(text),
      align,
      lineHeight: lineHeight ?? size * 1.2,
      characterSpacing: size * 0.1,
      wordSpacing: size * 0.36,
    });
  }, [text, width, size, speed, seed, align, lineHeight]);

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
    let lastFrame = -Infinity;
    let frame = 0;
    let finished = false;

    const tick = (now: number) => {
      const seconds = (now - startedAt) / 1000;
      if (seconds >= total) {
        finished = true;
        setClock({ plan, replayKey, elapsed: Infinity });
        onDoneRef.current?.();
        return;
      }
      if (now - lastFrame >= interval) {
        lastFrame = now;
        setClock({ plan, replayKey, elapsed: seconds });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      if (!finished) cancelAnimationFrame(frame);
    };
  }, [plan, shouldAnimate, delay, replayKey]);

  const strokeWidth = lineWidth ?? Math.max(1.25, size * 0.05);
  const minHeight = size * 1.2;

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
                    top: g.y,
                    width: g.width,
                    height: minHeight,
                    lineHeight: minHeight,
                    fontSize: size * 0.8,
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
        strokeLinecap="butt"
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

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0;
  }
  return hash;
}

const styles = StyleSheet.create({
  block: {
    width: '100%',
    position: 'relative',
  },
  fallback: {
    position: 'absolute',
    fontFamily: Fonts.hand,
    textAlign: 'center',
  },
});
