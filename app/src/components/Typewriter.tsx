/**
 * Text that types itself out, one character at a time, with an underscore
 * cursor after the last character.
 *
 * The cursor has three states, matching what the page is doing:
 *   steady   while the line is still being typed
 *   blinking once the line is done and the page is waiting on you
 *   gone     once you have answered (`answered` is true)
 *
 * Tapping the text finishes it instantly, for anyone who has read it before.
 *
 * How it works, for the Java reader: `useState` holds how many characters are
 * shown. `useEffect` starts a timer when the text changes and clears it when
 * the component unmounts or the text changes again (the function it returns is
 * the cleanup, like a try/finally). Each tick bumps the count by one.
 */
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { Fonts, Ink, Type, TypingSpeed } from '@/constants/theme';

interface TypewriterProps {
  text: string;
  /** Hides the cursor: the page has what it asked for. */
  answered?: boolean;
  /** Characters per second. The default is a brisk human typist. */
  speed?: number;
  /** Called once the whole line is on the page (typed or tapped through). */
  onDone?: () => void;
  size?: number;
  style?: StyleProp<TextStyle>;
  /** Marks the line as the page's heading for screen readers. */
  heading?: boolean;
}

export function Typewriter(props: TypewriterProps) {
  // `key` makes React throw the old instance away when the text changes, so a
  // new question starts typing from zero with no reset logic of its own.
  return <TypingLine key={props.text} {...props} />;
}

function TypingLine({ text, answered = false, speed = TypingSpeed, onDone, size = Type.question, style, heading = true }: TypewriterProps) {
  const [shown, setShown] = useState(0);
  const done = shown >= text.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= text.length) clearInterval(timer);
        return Math.min(n + 1, text.length);
      });
    }, 1000 / speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  useEffect(() => {
    if (done) onDone?.();
    // onDone is a callback prop; re-running on its identity would re-fire it on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  return (
    <Pressable onPress={() => setShown(text.length)} accessibilityRole={heading ? 'header' : 'text'} accessibilityLabel={text}>
      <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.5 }, style]}>
        {text.slice(0, shown)}
        <Cursor state={answered ? 'gone' : done ? 'blink' : 'steady'} />
      </Text>
    </Pressable>
  );
}

/** The underscore. Blinks by toggling its own opacity on a timer. */
function Cursor({ state }: { state: 'steady' | 'blink' | 'gone' }) {
  const [on, setOn] = useState(true);

  useEffect(() => {
    if (state !== 'blink') return;
    const timer = setInterval(() => setOn((v) => !v), 500);
    return () => clearInterval(timer);
  }, [state]);

  // A non-breaking space keeps the cursor glued to the last word, so it never wraps alone onto a new line.
  // When the cursor is gone it is still laid out (transparent) so the line does not shift.
  const visible = state === 'steady' || (state === 'blink' && on);
  const color = visible ? Ink.ink : 'transparent';
  return (
    <Text style={{ color }} accessible={false}>
      {'\u00A0_'}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.type,
    color: Ink.ink,
  },
});
