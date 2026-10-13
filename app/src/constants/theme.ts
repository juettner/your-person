/**
 * Design tokens for the "Letter" look: one soft colour, a script hand, nothing else.
 *
 * There are no cards, borders, shadows, chips or icons. A screen is paper,
 * words on it are ink, and secondary words are a lighter ink. Five papers to
 * choose from; the chosen one is remembered on the device.
 *
 * Typography comes in two flavours that are the same design:
 *   - Allura (Rob Leuschke, SIL Open Font License), a TTF, for everything
 *     static: labels, inputs, actions. Loaded once in app/_layout.tsx.
 *   - EMS Allure, Allura traced as pen strokes, for the words that should be
 *     written in front of you: the question of the moment, the page title.
 *     See src/handwriting.
 *
 * Both are sized by the em, so an engine `size` of 30 and a `fontSize` of 30
 * are the same size. Script faces have a small x-height, so they run a few
 * points bigger than a sans would.
 */

export type ThemeId = 'linen' | 'blush' | 'sage' | 'dusk' | 'wine';

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
  { id: 'linen', name: 'linen', statusBar: 'dark', paper: '#FBF5EE', ink: '#3A2430', muted: '#846A74', rule: '#3A2430' },
  { id: 'blush', name: 'blush', statusBar: 'dark', paper: '#F8E3E2', ink: '#6B2238', muted: '#9A6473', rule: '#6B2238' },
  { id: 'sage', name: 'sage', statusBar: 'dark', paper: '#E7EDE2', ink: '#2E3A30', muted: '#66766A', rule: '#2E3A30' },
  { id: 'dusk', name: 'dusk', statusBar: 'light', paper: '#2C2238', ink: '#F6EAEE', muted: '#B9A4B6', rule: '#F6EAEE' },
  { id: 'wine', name: 'wine', statusBar: 'light', paper: '#4A1C2A', ink: '#FAEDE6', muted: '#CFA8AC', rule: '#FAEDE6' },
];

export const DEFAULT_THEME: ThemeId = 'linen';

export function paletteFor(id: ThemeId): Palette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Font family names as registered by expo-font (see app/_layout.tsx). */
export const Fonts = {
  script: 'Allura_400Regular',
} as const;

/** Font sizes for static text. */
export const Type = {
  title: 42,
  body: 28,
  small: 23,
} as const;

/** Sizes for the writing engine. Same scale as `Type`. */
export const HandSize = {
  hero: 46,
  title: 44,
  body: 30,
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
