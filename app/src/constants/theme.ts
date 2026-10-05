/**
 * Design tokens. React Native styles are plain JavaScript objects, so the
 * "theme" is just constants we import. No CSS files, no class names.
 */
import { useColorScheme } from 'react-native';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** On web, keep the layout phone-shaped instead of stretching across a desktop. */
export const MaxContentWidth = 480;

export const Radius = {
  sm: 8,
  md: 14,
  pill: 999,
} as const;

export interface Palette {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  border: string;
  danger: string;
}

const light: Palette = {
  background: '#FFF8F2',
  card: '#FFFFFF',
  text: '#2B1D16',
  muted: '#8A7A72',
  accent: '#D9654B',
  onAccent: '#FFFFFF',
  border: '#EADFD7',
  danger: '#B3261E',
};

const dark: Palette = {
  background: '#1C1512',
  card: '#2A201B',
  text: '#F6EDE6',
  muted: '#A89A92',
  accent: '#F08A6E',
  onAccent: '#1C1512',
  border: '#3D2F28',
  danger: '#F2B8B5',
};

/**
 * A custom hook. Hooks are functions whose names start with `use` and which
 * may call other hooks; React tracks them per component. This one returns the
 * right palette for the device's light/dark setting.
 */
export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
