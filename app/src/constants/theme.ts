/**
 * Design tokens for the "Journal" look.
 *
 * One look, no palettes: white paper, black ink, one typewriter face. Every
 * screen is a page in a journal. The question is the only loud thing on it;
 * everything else is small, grey, and out of the way.
 *
 * Vocabulary:
 *   paper   the page. Pure white, on purpose (not cream, not off-white).
 *   ink     the typed text, the drawn circles, the underline under "keep".
 *   grey    the quiet things: the date line, "and 18 more", a hint.
 *   faint   the de-selected word next to the one you picked.
 *   fold    the lifted corner at the bottom right that turns the page.
 */
export const Ink = {
  paper: '#FFFFFF',
  ink: '#1E1A17',
  grey: '#9A9088',
  muted: '#6B625A',
  faint: '#C4BCB2',
  fold: '#F1EEE9',
  foldEdge: '#E6E1DA',
} as const;

/**
 * The one font family, as registered by expo-font (see app/_layout.tsx).
 * Special Elite is a single-weight typewriter face: there is no bold, so
 * emphasis comes from size, a drawn circle, or an underline, never weight.
 */
export const Fonts = {
  type: 'SpecialElite_400Regular',
} as const;

/** Type sizes. The question is the headline on every page; the rest stays small. */
export const Type = {
  question: 30,
  heading: 28,
  body: 19,
  word: 15,
  small: 13,
} as const;

/** How fast the typewriter types, in characters per second. */
export const TypingSpeed = 26;

/** Width of the page on a desktop browser. Phones use the full width. */
export const PageWidth = 430;

/** Page margins: the inset from the edge of the paper. */
export const Margin = {
  side: 36,
  top: 24,
  /** Room kept clear for the fold at the bottom right. */
  bottom: 120,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;
