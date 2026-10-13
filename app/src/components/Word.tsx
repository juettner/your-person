/**
 * A word you can tap. This replaces every button in the app.
 *
 *   action   underlined, like a link in a letter ("next", "save", "profile")
 *   option   muted; circled in ink when selected (a chosen interest, "day" / "evening")
 *   toggle   ink; circled when selected ("nope" / "good one", where neither is the quiet choice)
 *   quiet    plain, muted; for the least important thing on the screen ("not now")
 */
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
  weight?: 'regular' | 'medium';
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
  weight = 'regular',
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
      onPress={onPress}
      disabled={inactive}
      hitSlop={8}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: inactive, selected, checked: accessibilityRole === 'button' ? undefined : selected }}
      style={({ pressed }) => [styles.word, style, inactive && styles.inactive, pressed && styles.pressed]}
    >
      <Scribbled kind={decoration} color={p.ink} seed={title}>
        <Hand size={size} tone={tone} weight={weight}>
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
