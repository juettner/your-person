/**
 * Root layout. In Expo Router every file in `src/app/` is a screen and this
 * file wraps all of them. `Stack` is a native stack navigator: screens push
 * on top of each other and the back gesture pops them.
 *
 * Before the first screen renders we need the font: Special Elite, the
 * journal's typewriter face. The splash screen stays up until it is ready so
 * nothing flashes in the system font.
 */
import { SpecialElite_400Regular, useFonts } from '@expo-google-fonts/special-elite';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Fonts, Ink } from '@/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or not supported (web): nothing to do.
});

export default function RootLayout() {
  // expo-font downloads nothing at runtime: the font file ships inside the app bundle.
  // The name used here is what `fontFamily: Fonts.type` refers to.
  const [fontsLoaded, fontError] = useFonts({ [Fonts.type]: SpecialElite_400Regular });

  // A font error is not fatal: the system font steps in.
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Ink.paper },
          // A page turn, not a slide: the next page fades in over the last.
          animation: 'fade',
        }}
      />
    </>
  );
}
