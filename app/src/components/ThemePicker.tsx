/**
 * Five swatches, one per palette. Each is a circle of the ground color with a
 * dot of the accent, so you can tell them apart before picking. Behaves like a
 * radio group for screen readers.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/components/ThemeProvider';
import { Fonts, Radius, Spacing, THEMES } from '@/constants/theme';

export function ThemePicker() {
  const { palette: current, themeId, setThemeId } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {THEMES.map((t) => {
        const on = t.id === themeId;
        return (
          <Pressable
            key={t.id}
            onPress={() => setThemeId(t.id)}
            accessibilityRole="radio"
            accessibilityLabel={t.name}
            accessibilityState={{ checked: on }}
            aria-checked={on}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: t.ground, borderColor: on ? current.onGround : t.ink, borderWidth: on ? 3 : 2 },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: t.accent }]} />
            </View>
            <Text style={[on ? styles.nameOn : styles.name, { color: current.onGround }]}>{t.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap', // ten swatches: two rows of five on a phone
    gap: Spacing.sm,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.xs,
    width: '18%',
    minHeight: 44,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: Radius.pill,
  },
  name: {
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  nameOn: {
    fontFamily: Fonts.extraBold,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});
