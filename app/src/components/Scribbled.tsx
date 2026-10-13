/**
 * Hand-drawn decoration around a word: a wobbly underline, or a loop
 * around it like you'd circle something on a list.
 *
 * It measures its child with `onLayout`, then lays an <Svg> over it. The
 * wobble is deterministic (seeded by the word) so it doesn't jitter on
 * re-render. Two to three pixels of wander is enough to read as a pen.
 */
import type { PropsWithChildren } from 'react';
import { useCallback, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ScribbledProps {
  kind: 'underline' | 'circle' | 'none';
  color: string;
  seed: string;
  strokeWidth?: number;
}

export function Scribbled({ kind, color, seed, strokeWidth = 1.5, children }: PropsWithChildren<ScribbledProps>) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox((b) => (b && b.w === width && b.h === height ? b : { w: width, h: height }));
  }, []);

  const pad = kind === 'circle' ? 10 : 0;
  return (
    <View style={styles.wrap}>
      <View onLayout={onLayout}>{children}</View>
      {kind !== 'none' && box && (
        <Svg
          pointerEvents="none"
          aria-hidden
          style={[styles.overlay, { left: -pad, top: -pad }]}
          width={box.w + pad * 2}
          height={box.h + pad * 2}
        >
          <Path
            d={kind === 'underline' ? underline(box.w, box.h, pad, seed) : loop(box.w, box.h, pad, seed)}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      )}
    </View>
  );
}

/** A tiny seeded random so the wobble is the same every render. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) h = Math.imul(h ^ seed.charCodeAt(i), 16777619) >>> 0;
  return () => {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    return h / 4294967296;
  };
}

function underline(w: number, h: number, pad: number, seed: string): string {
  const r = rng(seed);
  const y = h + pad - 3;
  const steps = Math.max(3, Math.round(w / 24));
  let d = `M${pad} ${(y + r() * 2 - 1).toFixed(1)}`;
  for (let i = 1; i <= steps; i += 1) {
    const x = pad + (w * i) / steps;
    d += ` L${x.toFixed(1)} ${(y + r() * 3 - 1.5).toFixed(1)}`;
  }
  return d;
}

function loop(w: number, h: number, pad: number, seed: string): string {
  const r = rng(seed);
  const cx = w / 2 + pad;
  const cy = h / 2 + pad;
  const rx = w / 2 + pad - 2;
  const ry = h / 2 + pad - 3;
  const steps = 56;
  // Start on the left, go round once, and overshoot a little so the ends cross like a real loop.
  const start = Math.PI * 0.9;
  let d = '';
  let wobble = 1;
  for (let i = 0; i <= steps + 6; i += 1) {
    const t = start + (i / steps) * Math.PI * 2;
    // Drift the wobble instead of re-rolling it, so the line wanders rather than shivers.
    wobble += (r() - 0.5) * 0.03;
    wobble = Math.min(1.05, Math.max(0.95, wobble));
    const x = cx + Math.cos(t) * rx * wobble;
    const y = cy + Math.sin(t) * ry * wobble;
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'flex-start' },
  overlay: { position: 'absolute' },
});
