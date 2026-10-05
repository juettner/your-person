/**
 * Makes the current palette available to every component without passing it
 * down by hand.
 *
 * This is React Context: a Provider at the top of the tree holds a value, and
 * any descendant can read it with `useContext`. Spring analogy: a request-scoped
 * bean that any component can have injected. `usePalette()` is the injection.
 */
import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react';
import { Palette, paletteFor, ThemeId } from '@/constants/theme';
import { saveThemeId } from '@/lib/theme-store';

interface ThemeContextValue {
  palette: Palette;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  /** The id loaded from storage before the app rendered (see app/_layout.tsx). */
  initial: ThemeId;
}

export function ThemeProvider({ initial, children }: PropsWithChildren<ThemeProviderProps>) {
  const [themeId, setThemeIdState] = useState<ThemeId>(initial);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id); // re-render with the new palette immediately
    void saveThemeId(id); // persist in the background
  }, []);

  // useMemo keeps the same object between renders unless themeId changed, so
  // consumers don't re-render needlessly.
  const value = useMemo(
    () => ({ palette: paletteFor(themeId), themeId, setThemeId }),
    [themeId, setThemeId],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}

/** Shorthand for the common case: just the colors. */
export function usePalette(): Palette {
  return useTheme().palette;
}
