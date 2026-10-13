/**
 * Lays text out on lines and decides when each letter gets written.
 *
 * The output is a flat list of placed glyphs with a start time and a duration.
 * Rendering a frame is then trivial: for each glyph, progress = (elapsed -
 * delay) / duration, clamped to 0..1, and draw that much of its strokes.
 * One clock for the whole text, no per-letter timers. That is what keeps
 * sixty letters cheap to animate.
 *
 * Timing: a letter takes its path length divided by a pen speed in font
 * units per second, clamped so that a dot is not instant and a capital with
 * a flourish does not drag. Longer, loopier letters take longer, which is
 * what makes a script feel written rather than typed. A space is a short
 * pause, a line break a longer one. `speed` scales all of it: 1 is the
 * default pace, 2 is twice as slow.
 */
import { BASELINE_EM, BOX_EM, glyphFor, ScaledGlyph, scaleGlyph, typeface } from './typeface';

export interface PlanOptions {
  /** Available width in pixels. Words wrap when they don't fit. */
  width: number;
  /** Font size: the em, in pixels. */
  size: number;
  /** 1 = the default pace. Bigger is slower. */
  speed: number;
  align: 'left' | 'center';
  /** Distance between baselines. */
  lineHeight: number;
  /** Extra pixels between letters. 0 keeps a connected script joined up. */
  tracking: number;
}

export interface PlannedGlyph {
  id: number;
  character: string;
  /** Pen origin in text pixels: x at the left of the advance box, y on the baseline. */
  x: number;
  y: number;
  /** null when the typeface has no drawing for this character; it is shown in the font instead. */
  glyph: ScaledGlyph | null;
  width: number;
  /** Which word this letter belongs to, counted from 0. Used for the haptic tick at each new word. */
  word: number;
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

const UNITS_PER_SECOND = 18_000;
const MIN_GLYPH_SECONDS = 0.03;
const MAX_GLYPH_SECONDS = 0.3;
const SPACE_SECONDS = 0.06;
const LINE_BREAK_SECONDS = 0.12;

function glyphSeconds(unitLength: number, speed: number): number {
  const unscaled = Math.min(MAX_GLYPH_SECONDS, Math.max(MIN_GLYPH_SECONDS, unitLength / UNITS_PER_SECOND));
  return unscaled * speed;
}

/** Frame rate: 30 fps for a few letters, easing to 15 fps for long text. Nobody can tell, and it saves battery. */
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
  const { width: maxWidth, size, speed, align, lineHeight, tracking } = options;
  // Connected letters start a little left of their origin; give the first one room.
  const inset = size * 0.12;
  const usable = Math.max(1, maxWidth - inset * 2);
  const spaceWidth = (glyphFor(' ')?.adv ?? 378) * (size / typeface.upm);
  const glyphs: PlannedGlyph[] = [];
  let delay = 0;
  let visibleCount = 0;
  let line = 0;
  let x = 0;
  let lineStart = 0;
  let wordCount = 0;

  const measure = (character: string): Measured => {
    const raw = glyphFor(character);
    if (!raw) {
      return { character, glyph: null, width: size * 0.45, duration: glyphSeconds(0, speed) };
    }
    const glyph = scaleGlyph(character, raw, size);
    return { character, glyph, width: glyph.advance + tracking, duration: glyphSeconds(glyph.unitLength, speed) };
  };

  const finishLine = () => {
    const lineWidth = x;
    const shift = inset + (align === 'center' ? Math.max(0, (usable - lineWidth) / 2) : 0);
    for (let i = lineStart; i < glyphs.length; i += 1) glyphs[i].x += shift;
    lineStart = glyphs.length;
    line += 1;
    x = 0;
  };

  const explicitLines = text.split('\n');
  explicitLines.forEach((explicitLine, lineNumber) => {
    const words = explicitLine.trim().length > 0 ? explicitLine.trim().split(/\s+/) : [];
    words.forEach((word, wordNumber) => {
      const measured = Array.from(word).map(measure);
      const wordWidth = measured.reduce((sum, m) => sum + m.width, 0);
      if (x > 0 && x + wordWidth > usable) finishLine();

      measured.forEach((m) => {
        // A single word longer than the line still has to go somewhere: break inside it.
        if (x > 0 && x + m.width > usable) finishLine();
        if (m.glyph) visibleCount += 1;
        glyphs.push({
          id: glyphs.length,
          character: m.character,
          x,
          y: line * lineHeight + size * BASELINE_EM,
          glyph: m.glyph,
          width: m.width,
          word: wordCount,
          delay,
          duration: m.duration,
        });
        delay += m.duration;
        x += m.width;
      });
      wordCount += 1;

      if (wordNumber < words.length - 1) {
        x += spaceWidth;
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
    // `line` is now the number of lines. The last line needs its whole box, not just the pitch.
    height: Math.max(0, line - 1) * lineHeight + size * BOX_EM,
    totalDuration: delay,
    visibleCount,
  };
}

