/**
 * The app's buttons.
 *
 *  primary  ink-filled pill with an accent hard shadow ("Next card", "Deal me in")
 *  outline  bordered pill that sits on the ground ("Nope", "Good one")
 *  link     plain underlined text ("Profile", "Back")
 *
 * `icon` renders to the left of the title. `selected` (outline only) fills the
 * pill with the accent so a chosen thumb stays visibly chosen.
 */
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { HardShadow } from '@/components/HardShadow';
import { usePalette } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'link';
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** Shows a spinner instead of the title and disables presses. */
  busy?: boolean;
  style?: ViewStyle;
  /** For screen readers, when the title alone is not descriptive. */
  accessibilityLabel?: string;
  /** Link variant only: where it sits. Links on the card use ink; links on the ground use onGround. */
  tone?: 'ground' | 'card';
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  selected = false,
  disabled = false,
  busy = false,
  style,
  accessibilityLabel,
  tone = 'ground',
}: ButtonProps) {
  const p = usePalette();
  const inactive = disabled || busy;

  if (variant === 'link') {
    const linkColor = tone === 'card' ? p.ink : p.onGround;
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={({ pressed }) => [styles.link, style, inactive && styles.inactive, pressed && styles.pressed]}
      >
        <Text style={[styles.linkText, { color: linkColor }]}>{title}</Text>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    const bg = selected ? p.accent : p.outlineBg;
    const fg = selected ? p.onAccent : p.outlineText;
    const border = selected ? p.accent : p.outlineBorder;
    return (
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ selected, disabled: inactive }}
        style={({ pressed }) => [
          styles.pill,
          styles.outline,
          { backgroundColor: bg, borderColor: border },
          style,
          inactive && styles.inactive,
          pressed && styles.pressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={fg} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.outlineText, { color: fg }]}>{title}</Text>
          </View>
        )}
      </Pressable>
    );
  }

  // primary
  return (
    <HardShadow color={p.accent} offset={4} radius={Radius.pill} style={style}>
      <Pressable
        onPress={onPress}
        disabled={inactive}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        accessibilityState={{ disabled: inactive }}
        style={({ pressed }) => [
          styles.pill,
          styles.primary,
          { backgroundColor: p.ink, borderColor: p.ink },
          inactive && styles.inactive,
          pressed && styles.pressed,
        ]}
      >
        {busy ? (
          <ActivityIndicator color={p.onInk} />
        ) : (
          <View style={styles.row}>
            {icon}
            <Text style={[styles.primaryText, { color: p.onInk }]}>{title}</Text>
          </View>
        )}
      </Pressable>
    </HardShadow>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  primary: {
    minHeight: 60,
  },
  outline: {
    minHeight: 56,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryText: {
    fontFamily: Fonts.extraBold,
    fontSize: 18,
  },
  outlineText: {
    fontFamily: Fonts.bold,
    fontSize: 16,
  },
  link: {
    minHeight: 44,
    justifyContent: 'center',
  },
  linkText: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
