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

export type ThemeId =
  | 'sky'
  | 'lavender'
  | 'blush'
  | 'butter'
  | 'terracotta'
  | 'mint'
  | 'sand'
  | 'ocean'
  | 'charcoal'
  | 'cocoa';

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
  {
    id: 'mint',
    name: 'Mint',
    statusBar: 'dark',
    ground: '#D6F2E3',
    onGround: '#0E4D3A',
    card: '#FFFFFF',
    ink: '#0E4D3A',
    muted: '#3F6B5B',
    accent: '#FF7B54',
    onAccent: '#0E4D3A',
    onInk: '#FFFFFF',
    outlineBorder: '#0E4D3A',
    outlineText: '#0E4D3A',
    outlineBg: '#FFFFFF',
    danger: '#A32626',
  },
  {
    id: 'sand',
    name: 'Sand',
    statusBar: 'dark',
    ground: '#F3E7D3',
    onGround: '#4A2E14',
    card: '#FFFCF7',
    ink: '#4A2E14',
    muted: '#7A5B3C',
    accent: '#2F80ED',
    onAccent: '#FFFFFF',
    onInk: '#FFFCF7',
    outlineBorder: '#4A2E14',
    outlineText: '#4A2E14',
    outlineBg: '#FFFCF7',
    danger: '#A32626',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    statusBar: 'light',
    ground: '#0F2F4C',
    onGround: '#FFFFFF',
    card: '#FFFFFF',
    ink: '#0F2F4C',
    muted: '#4A607A',
    accent: '#4FD1C5',
    onAccent: '#0F2F4C',
    onInk: '#FFFFFF',
    outlineBorder: '#FFFFFF',
    outlineText: '#FFFFFF',
    outlineBg: 'transparent',
    danger: '#FFD6D1',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    statusBar: 'light',
    ground: '#2A2A2E',
    onGround: '#F7F5EE',
    card: '#F7F5EE',
    ink: '#1A1A1A',
    muted: '#5C5C5C',
    accent: '#F4E04D',
    onAccent: '#1A1A1A',
    onInk: '#F7F5EE',
    outlineBorder: '#F7F5EE',
    outlineText: '#F7F5EE',
    outlineBg: 'transparent',
    danger: '#FFD6D1',
  },
  {
    id: 'cocoa',
    name: 'Cocoa',
    statusBar: 'light',
    ground: '#5B3A29',
    onGround: '#FFF6EC',
    card: '#FFF6EC',
    ink: '#3A2416',
    muted: '#7A5A47',
    accent: '#F2B88A',
    onAccent: '#3A2416',
    onInk: '#FFF6EC',
    outlineBorder: '#FFF6EC',
    outlineText: '#FFF6EC',
    outlineBg: 'transparent',
    danger: '#FFD6D1',
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
