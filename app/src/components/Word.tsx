/**
 * A word you can tap. This replaces every button in the app.
 *
 *   action   underlined, like a link in a letter ("Next", "Save", "Profile")
 *   option   muted; circled in ink when selected (a chosen interest, "Day" / "Evening")
 *   toggle   ink; circled when selected ("Nope" / "Good one", where neither is the quiet choice)
 *   quiet    plain, muted; for the least important thing on the screen ("Not now")
 */
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Hand } from '@/components/Hand';
import { Scribbled } from '@/components/Scribbled';
import { usePalette } from '@/components/ThemeProvider';
import type { Type } from '@/constants/theme';

interface WordProps {
  title: string;
  onPress: () => void;
  variant?: 'action' | 'option' | 'toggle' | 'quiet';
  selected?: boolean;
  disabled?: boolean;
  /** Dims and disables while something is in flight. */
  busy?: boolean;
  size?: keyof typeof Type | number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'checkbox';
}

export function Word({
  title,
  onPress,
  variant = 'action',
  selected = false,
  disabled = false,
  busy = false,
  size = 'body',
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}: WordProps) {
  const p = usePalette();
  const inactive = disabled || busy;
  const circled = (variant === 'option' || variant === 'toggle') && selected;
  const decoration = variant === 'action' ? 'underline' : circled ? 'circle' : 'none';
  const tone = variant === 'quiet' || (variant === 'option' && !selected) ? 'muted' : 'ink';

  return (
    <Pressable
      onPress={() => {
        // A soft click under the finger, like a pen tapping the page. Nothing on web.
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      disabled={inactive}
      hitSlop={8}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, selected, checked: accessibilityRole === 'button' ? undefined : selected }}
      style={({ pressed }) => [styles.word, style, inactive && styles.inactive, pressed && styles.pressed]}
    >
      <Scribbled kind={decoration} color={p.ink} seed={title}>
        <Hand size={size} tone={tone}>
          {title}
        </Hand>
      </Scribbled>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  word: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 2,
  },
  inactive: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
