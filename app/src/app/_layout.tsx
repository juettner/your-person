/**
 * Root layout. In Expo Router every file in `src/app/` is a screen and this
 * file wraps all of them. `Stack` is a native stack navigator: screens push
 * on top of each other and the back gesture pops them.
 *
 * Before the first screen renders we need two things: the Bricolage Grotesque
 * font files, and the saved palette. The splash screen stays up until both are
 * ready so nothing flashes in a default font or the wrong colors.
 */
import {
  BricolageGrotesque_500Medium,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
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
  // The names used here are what `fontFamily: Fonts.bold` etc. refer to.
  const [fontsLoaded, fontError] = useFonts({
    [Fonts.medium]: BricolageGrotesque_500Medium,
    [Fonts.bold]: BricolageGrotesque_700Bold,
    [Fonts.extraBold]: BricolageGrotesque_800ExtraBold,
  });
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
          contentStyle: { backgroundColor: p.ground },
        }}
      />
    </>
  );
}
