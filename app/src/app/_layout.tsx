/**
 * Root layout. In Expo Router every file in `src/app/` is a screen and this
 * file wraps all of them. `Stack` is a native stack navigator: screens push
 * on top of each other and the back gesture pops them.
 *
 * Before the first screen renders we need two things: the Allura font
 * file, and the saved paper. The splash screen stays up until both are
 * ready so nothing flashes in a default font or the wrong colour.
 *
 * The stroke typeface used by `src/handwriting` is plain JSON and needs no
 * loading step: it is part of the JavaScript bundle.
 */
import { Allura_400Regular, useFonts } from '@expo-google-fonts/allura';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ThemeProvider, usePalette } from '@/components/ThemeProvider';
import { Fonts, ThemeId } from '@/constants/theme';
import { loadThemeId } from '@/lib/theme-store';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or not supported (web): nothing to do.
});

export default function RootLayout() {
  // expo-font downloads nothing at runtime: the font files ship inside the app bundle.
  // The name used here is what `fontFamily: Fonts.script` refers to.
  const [fontsLoaded, fontError] = useFonts({ [Fonts.script]: Allura_400Regular });
  const [themeId, setThemeId] = useState<ThemeId | null>(null);

  useEffect(() => {
    loadThemeId().then(setThemeId);
  }, []);

  // A font error is not fatal: the system font steps in. Only a missing theme blocks.
  const ready = (fontsLoaded || fontError !== null) && themeId !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready || themeId === null) return null;

  return (
    <ThemeProvider initial={themeId}>
      <Shell />
    </ThemeProvider>
  );
}

/** Split out so it can read the palette from the provider above it. */
function Shell() {
  const p = usePalette();
  return (
    <>
      <StatusBar style={p.statusBar} />
      <Stack
        screenOptions={{
          headerShown: false,
          // A plain fade between screens: nothing slides in from the side, the words just change.
          animation: 'fade',
          contentStyle: { backgroundColor: p.paper },
        }}
      />
    </>
  );
}
