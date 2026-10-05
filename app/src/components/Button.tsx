/**
 * The app's one button. Three looks: primary (filled), secondary (outlined),
 * ghost (text only). Big touch targets on purpose; this is used with thumbs.
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { Radius, Spacing, usePalette } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  /** Shows a spinner instead of the title and disables presses. */
  busy?: boolean;
  style?: ViewStyle;
  /** Accessibility label for screen readers, when the title alone is not descriptive. */
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  busy = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const palette = usePalette();
  const inactive = disabled || busy;

  const container: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: palette.accent }
      : variant === 'secondary'
        ? { borderWidth: 2, borderColor: palette.accent }
        : {};
  const textColor = variant === 'primary' ? palette.onAccent : palette.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      // A function style lets us react to the press state (like :active in CSS).
      style={({ pressed }) => [
        styles.base,
        container,
        style,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
