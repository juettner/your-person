/**
 * Remembers the chosen palette on this device. Same idea as profile-store.ts:
 * one AsyncStorage key, wrapped so a storage failure never crashes the app.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_THEME, THEMES, ThemeId } from '@/constants/theme';

const KEY = 'your-person.themeId';

export async function loadThemeId(): Promise<ThemeId> {
  try {
    const stored = await AsyncStorage.getItem(KEY);
    // Guard against a stale value from an older build that named themes differently.
    return THEMES.some((t) => t.id === stored) ? (stored as ThemeId) : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export async function saveThemeId(id: ThemeId): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, id);
  } catch {
    // Not worth surfacing: the theme still applies for this session.
  }
}
