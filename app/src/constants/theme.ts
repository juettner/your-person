/**
 * Design tokens for the "Hand" look: one flat colour, handwritten type, nothing else.
 *
 * There are no cards, borders, shadows, chips or icons. A screen is paper,
 * words on it are ink, and secondary words are a lighter ink. Five papers to
 * choose from; the chosen one is remembered on the device.
 *
 * Typography comes in two flavours that share one set of drawings:
 *   - The Grug Hand TTF fonts (assets/fonts) for everything static: labels,
 *     inputs, actions. Loaded once in app/_layout.tsx.
 *   - The stroke engine (src/handwriting) for the words that should be
 *     written in front of you: the question of the moment, the screen title.
 *
 * Sizes: the engine's `size` is the glyph box height, and its x-height is 40%
 * of that. The TTF's x-height is 50% of its font size. So an engine size of 30
 * matches a font size of 24. `Type` below gives the TTF sizes; `HandSize`
 * gives the engine sizes that line up with them.
 */

export type ThemeId = 'paper' | 'night' | 'mint' | 'moss' | 'clay';

export interface Palette {
  id: ThemeId;
  name: string;
  statusBar: 'dark' | 'light';
  /** The screen. */
  paper: string;
  /** Words. */
  ink: string;
  /** Secondary words: hints, dates, placeholders. Passes 4.5:1 on `paper`. */
  muted: string;
  /** Rules under inputs. */
  rule: string;
}

export const THEMES: readonly Palette[] = [
  { id: 'paper', name: 'paper', statusBar: 'dark', paper: '#FFFFFF', ink: '#000000', muted: '#6B6B6B', rule: '#000000' },
  { id: 'night', name: 'night', statusBar: 'light', paper: '#000000', ink: '#FFFFFF', muted: '#A3A3A3', rule: '#FFFFFF' },
  { id: 'mint', name: 'mint', statusBar: 'dark', paper: '#D9F0DC', ink: '#0B2E22', muted: '#4B6B5E', rule: '#0B2E22' },
  { id: 'moss', name: 'moss', statusBar: 'light', paper: '#143F32', ink: '#EAF6EC', muted: '#A9C8B6', rule: '#EAF6EC' },
  { id: 'clay', name: 'clay', statusBar: 'dark', paper: '#F3E6D6', ink: '#3A2414', muted: '#7B6450', rule: '#3A2414' },
];

export const DEFAULT_THEME: ThemeId = 'paper';

export function paletteFor(id: ThemeId): Palette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * Font family names as registered by expo-font (see app/_layout.tsx).
 * Pick a face by NAME, never with `fontWeight`: on native that would select
 * the wrong file.
 */
export const Fonts = {
  hand: 'GrugHand',
  handMedium: 'GrugHand-Medium',
} as const;

/** TTF font sizes. */
export const Type = {
  title: 30,
  body: 22,
  small: 18,
} as const;

/** Engine sizes that line up with `Type` (engine size = font size / 0.8). */
export const HandSize = {
  hero: 38,
  title: 36,
  body: 27,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** On web, keep the layout phone-shaped instead of stretching across a desktop. */
export const MaxContentWidth = 440;
