/**
 * Lays text out on lines and decides when each letter gets written.
 *
 * The output is a flat list of placed glyphs with a start time and a duration.
 * Rendering a frame is then trivial: for each glyph, progress = (elapsed -
 * delay) / duration, clamped to 0..1, and draw that much of its strokes.
 * One clock for the whole text, no per-letter timers. That's the grug approach
 * and it is what keeps 60 letters cheap to animate.
 *
 * Timing, copied from the HandDrawnFont package: a letter takes its path
 * length / 12,000 canvas units per second, clamped to 8..18 ms, times a speed
 * multiplier. A space adds 8 ms, a line break 12 ms. At speed 1 that is the
 * "quick scribble"; grug's site uses speed 4, which is where the slow flow
 * you noticed comes from.
 */
import { pickVariation, scaleGlyph, ScaledGlyph, variationsFor } from './typeface';

export interface PlanOptions {
  /** Available width in pixels. Words wrap when they don't fit. */
  width: number;
  /** Glyph box height. The x-height is 40% of this. */
  size: number;
  /** 1 = grug's quick scribble, 4 = the relaxed pace. */
  speed: number;
  /** Stable variation choices. Same seed, same letters. */
  seed: number;
  align: 'left' | 'center';
  /** Distance between baselines. */
  lineHeight: number;
  characterSpacing: number;
  wordSpacing: number;
}

export interface PlannedGlyph {
  id: number;
  character: string;
  /** Top-left of the glyph box in text pixels. */
  x: number;
  y: number;
  /** null when the typeface has no drawing for this character; it is shown in the font instead. */
  glyph: ScaledGlyph | null;
  width: number;
  /** Seconds after the start of the animation when the pen reaches this letter. */
  delay: number;
  /** Seconds the pen spends on it. */
  duration: number;
}

export interface TextPlan {
  glyphs: PlannedGlyph[];
  width: number;
  height: number;
  /** Seconds until the last stroke is finished. */
  totalDuration: number;
  visibleCount: number;
}

const MIN_GLYPH_SECONDS = 0.008;
const MAX_GLYPH_SECONDS = 0.018;
const CANVAS_UNITS_PER_SECOND = 12_000;
const SPACE_SECONDS = 0.008;
const LINE_BREAK_SECONDS = 0.012;

function glyphSeconds(canvasLength: number, speed: number): number {
  const unscaled = Math.min(MAX_GLYPH_SECONDS, Math.max(MIN_GLYPH_SECONDS, canvasLength / CANVAS_UNITS_PER_SECOND));
  return unscaled * speed;
}

/** Frame rate grug uses: 30 fps for a few letters, easing to 15 fps for long text. Nobody can tell, and it saves battery. */
export function framesPerSecond(visibleCount: number): number {
  if (visibleCount <= 5) return 30;
  if (visibleCount >= 40) return 15;
  return 30 - ((visibleCount - 5) / 35) * 15;
}

interface Measured {
  character: string;
  glyph: ScaledGlyph | null;
  width: number;
  duration: number;
}

export function planText(text: string, options: PlanOptions): TextPlan {
  const { width: maxWidth, size, speed, seed, align, lineHeight, characterSpacing, wordSpacing } = options;
  const glyphs: PlannedGlyph[] = [];
  let delay = 0;
  let visibleCount = 0;
  let characterIndex = 0;
  let line = 0;
  let x = 0;
  /** Glyphs on the current line, so we can centre the line once we know its width. */
  let lineStart = 0;

  const measure = (character: string): Measured => {
    const variations = variationsFor(character);
    if (variations.length === 0) {
      return { character, glyph: null, width: size * 0.5, duration: glyphSeconds(0, speed) };
    }
    const glyph = scaleGlyph(pickVariation(variations, characterIndex, seed), size);
    return { character, glyph, width: glyph.width, duration: glyphSeconds(glyph.canvasLength, speed) };
  };

  const finishLine = () => {
    if (align === 'center') {
      const lineWidth = x - (x > 0 ? wordSpacing : 0);
      const shift = Math.max(0, (maxWidth - lineWidth) / 2);
      for (let i = lineStart; i < glyphs.length; i += 1) glyphs[i].x += shift;
    }
    lineStart = glyphs.length;
    line += 1;
    x = 0;
  };

  const explicitLines = text.split('\n');
  explicitLines.forEach((explicitLine, lineNumber) => {
    const words = explicitLine.trim().length > 0 ? explicitLine.trim().split(/\s+/) : [];
    words.forEach((word, wordNumber) => {
      const measured: Measured[] = [];
      for (const character of Array.from(word)) {
        measured.push(measure(character));
        characterIndex += 1;
      }
      const wordWidth = measured.reduce((sum, m) => sum + m.width, 0) + characterSpacing * (measured.length - 1);
      if (x > 0 && x + wordWidth > maxWidth) finishLine();

      measured.forEach((m, i) => {
        // A single word longer than the line still has to go somewhere: break inside it.
        if (x > 0 && x + m.width > maxWidth) finishLine();
        if (m.glyph) visibleCount += 1;
        glyphs.push({
          id: glyphs.length,
          character: m.character,
          x,
          y: line * lineHeight,
          glyph: m.glyph,
          width: m.width,
          delay,
          duration: m.duration,
        });
        delay += m.duration;
        x += m.width + (i < measured.length - 1 ? characterSpacing : 0);
      });

      if (wordNumber < words.length - 1) {
        x += wordSpacing;
        delay += SPACE_SECONDS * speed;
      }
    });
    if (lineNumber < explicitLines.length - 1) {
      finishLine();
      delay += LINE_BREAK_SECONDS * speed;
    }
  });
  finishLine();

  return {
    glyphs,
    width: maxWidth,
    // `line` is now the number of lines. The last line needs its full box (1.2 x size), not just the pitch.
    height: Math.max(0, line - 1) * lineHeight + size * 1.2,
    totalDuration: delay,
    visibleCount,
  };
}
