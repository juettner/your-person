/**
 * Root layout. In Expo Router every file in `src/app/` is a screen and this
 * file wraps all of them. `Stack` is a native stack navigator: screens push
 * on top of each other and the back gesture pops them.
 *
 * Screens: index (Today), onboarding, profile. Headers are hidden because
 * each screen draws its own minimal top row.
 */
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { usePalette } from '@/constants/theme';

export default function RootLayout() {
  const palette = usePalette();
  return (
    <>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.background },
        }}
      />
    </>
  );
}
