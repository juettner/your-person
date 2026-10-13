/**
 * The loading state: a short line that writes itself, pauses, and writes
 * itself again. Quieter than a spinner and it matches the rest of the page.
 */
import { useEffect, useRef, useState } from 'react';
import { usePalette } from '@/components/ThemeProvider';
import { HandSize } from '@/constants/theme';
import { Handwriting } from '@/handwriting/Handwriting';

export function Thinking({ text = 'one moment.' }: { text?: string }) {
  const p = usePalette();
  const [replayKey, setReplayKey] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <Handwriting
      text={text}
      color={p.muted}
      size={HandSize.body}
      speed={6}
      replayKey={replayKey}
      onDone={() => {
        timer.current = setTimeout(() => setReplayKey((k) => k + 1), 900);
      }}
    />
  );
}
