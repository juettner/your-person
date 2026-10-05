/**
 * Design tokens for the "Index Card" look.
 *
 * The app has one layout and five palettes. A palette is a flat object of
 * named colors; every component reads colors from the palette it gets via
 * `usePalette()` (see components/ThemeProvider.tsx) and never hard-codes a hex.
 *
 * Vocabulary:
 *   ground   the screen background. In most palettes it is pale; in Terracotta it is the loud one.
 *   onGround text that sits directly on the ground (the "Ask Sam" header, links)
 *   card     the index card's paper
 *   ink      text and 2px borders on the card, and the fill of the main button
 *   accent   the highlight chip behind the interest label, and the button's offset shadow
 */

export type ThemeId = 'sky' | 'lavender' | 'blush' | 'butter' | 'terracotta';

export interface Palette {
  id: ThemeId;
  name: string;
  /** Status bar icons: dark icons on pale grounds, light icons on the terracotta ground. */
  statusBar: 'dark' | 'light';
  ground: string;
  onGround: string;
  card: string;
  ink: string;
  /** Secondary text on the card: counters, hints. Picked to pass 4.5:1 on `card`. */
  muted: string;
  accent: string;
  onAccent: string;
  /** Text on an ink-filled button. */
  onInk: string;
  /** Outlined buttons sit on the ground, so their border/text follow `onGround`. */
  outlineBorder: string;
  outlineText: string;
  outlineBg: string;
  danger: string;
}

export const THEMES: readonly Palette[] = [
  {
    id: 'sky',
    name: 'Sky',
    statusBar: 'dark',
    ground: '#CFE3F7',
    onGround: '#12355B',
    card: '#FFFFFF',
    ink: '#12355B',
    muted: '#4A607A',
    accent: '#FF8C42',
    onAccent: '#12355B',
    onInk: '#FFFFFF',
    outlineBorder: '#12355B',
    outlineText: '#12355B',
    outlineBg: '#FFFFFF',
    danger: '#A32626',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    statusBar: 'dark',
    ground: '#E6DFF5',
    onGround: '#2B2353',
    card: '#FFFFFF',
    ink: '#2B2353',
    muted: '#5A5478',
    accent: '#C8F045',
    onAccent: '#2B2353',
    onInk: '#FFFFFF',
    outlineBorder: '#2B2353',
    outlineText: '#2B2353',
    outlineBg: '#FFFFFF',
    danger: '#A32626',
  },
  {
    id: 'blush',
    name: 'Blush',
    statusBar: 'dark',
    ground: '#F6DCE1',
    onGround: '#5E1D35',
    card: '#FFFBF8',
    ink: '#5E1D35',
    muted: '#7A4A5A',
    accent: '#FFC46B',
    onAccent: '#5E1D35',
    onInk: '#FFFFFF',
    outlineBorder: '#5E1D35',
    outlineText: '#5E1D35',
    outlineBg: '#FFFBF8',
    danger: '#A32626',
  },
  {
    id: 'butter',
    name: 'Butter',
    statusBar: 'dark',
    ground: '#FFF0B3',
    onGround: '#1E3FAE',
    card: '#FFFFFF',
    ink: '#1E3FAE',
    muted: '#4C5A8A',
    accent: '#E04545',
    onAccent: '#FFFFFF',
    onInk: '#FFFFFF',
    outlineBorder: '#1E3FAE',
    outlineText: '#1E3FAE',
    outlineBg: '#FFFFFF',
    danger: '#A32626',
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    statusBar: 'light',
    ground: '#C9573F',
    onGround: '#FFFFFF',
    card: '#FFF4E6',
    ink: '#3A1F14',
    muted: '#7A4F3F',
    accent: '#F6C453',
    onAccent: '#3A1F14',
    onInk: '#FFF4E6',
    outlineBorder: '#FFFFFF',
    outlineText: '#FFFFFF',
    outlineBg: 'transparent',
    danger: '#FFE1DB',
  },
];

export const DEFAULT_THEME: ThemeId = 'sky';

export function paletteFor(id: ThemeId): Palette {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * Font family names as registered by expo-font (see app/_layout.tsx).
 * On native, a custom font family must be selected by NAME per weight;
 * combining `fontFamily` with `fontWeight` picks the wrong face. So styles use
 * `fontFamily: Fonts.bold`, never `fontWeight: '700'`.
 */
export const Fonts = {
  medium: 'BricolageGrotesque_500Medium',
  bold: 'BricolageGrotesque_700Bold',
  extraBold: 'BricolageGrotesque_800ExtraBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  sm: 6,
  md: 12,
  card: 20,
  pill: 999,
} as const;

/** On web, keep the layout phone-shaped instead of stretching across a desktop. */
export const MaxContentWidth = 480;
