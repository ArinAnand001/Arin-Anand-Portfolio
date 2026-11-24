import { useEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';
import { observeReveal } from '../../lib/reveal';
import { cn } from '../../lib/utils';

interface SplitTextProps {
  text: string;
  as?: ElementType;
  /** Animate letter by letter or word by word. */
  mode?: 'chars' | 'words';
  className?: string;
  id?: string;
  /** Seconds before the first piece moves. */
  delay?: number;
  /** Milliseconds between pieces. */
  stagger?: number;
  /** Soft blur-in instead of rising out of a mask. */
  fade?: boolean;
  /** Animated light passing through the text once it has settled. */
  gradient?: boolean;
  /**
   * 'view' animates when scrolled into view. Pass `active` instead to control it
   * (used by the hero, which waits for the intro to finish).
   */
  active?: boolean;
}

/**
 * Splits text into words or letters for staggered reveals.
 * Screen readers get the plain sentence; the animated pieces are hidden from them.
 * A "\n" in the text forces a line break.
 */
export function SplitText({
  text,
  as: Tag = 'span',
  mode = 'chars',
  className,
  id,
  delay = 0,
  stagger,
  fade = false,
  gradient = false,
  active,
}: SplitTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [settled, setSettled] = useState(false);
  const controlled = active !== undefined;

  const lines = text.split('\n');
  let index = 0;
  const pieces = lines.map((line) => line.split(' ').filter(Boolean));
  const total = pieces.reduce((n, words) => n + (mode === 'chars' ? words.join('').length : words.length), 0);
  const step = stagger ?? (mode === 'chars' ? 22 : 60);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const settle = () => {
      if (!gradient) return;
      const ms = delay * 1000 + total * step + 1300;
      window.setTimeout(() => setSettled(true), ms);
    };
    if (controlled) {
      if (active) {
        el.classList.add('is-in');
        settle();
      }
      return;
    }
    return observeReveal(el, settle);
  }, [active, controlled, delay, gradient, step, total]);

  const style = { '--d': `${delay}s`, '--stagger': `${step}ms` } as CSSProperties;

  return (
    <Tag
      ref={ref}
      id={id}
      className={cn(
        'split',
        mode === 'chars' ? 'split--chars' : 'split--words',
        fade && 'split--fade',
        gradient && 'split--gradient',
        settled && 'is-settled',
        className,
      )}
      style={style}
    >
      <span className="sr-only">{text.replace(/\n/g, ' ')}</span>
      <span aria-hidden="true">
        {settled
          ? // Once the letters have landed, plain text lines take over so the gradient can
            // clip to them. Kerning is off in both states, so nothing shifts.
            pieces.map((words, li) => (
              <span className="split__line" key={li}>
                {words.join(' ')}
              </span>
            ))
          : pieces.map((words, li) => (
          <span className="split__line" key={li}>
            {words.map((word, wi) => {
              const space = wi < words.length - 1 ? ' ' : '';
              if (mode === 'words') {
                const i = index++;
                return (
                  <span key={wi}>
                    <span className="split__mask">
                      <span className="split__inner" style={{ '--i': i } as CSSProperties}>
                        {word}
                      </span>
                    </span>
                    {space}
                  </span>
                );
              }
              return (
                <span key={wi}>
                  <span className="split__word">
                    {Array.from(word).map((ch, ci) => (
                      <span className="split__char" key={ci} style={{ '--i': index++ } as CSSProperties}>
                        {ch}
                      </span>
                    ))}
                  </span>
                  {space}
                </span>
              );
            })}
          </span>
        ))}
      </span>
    </Tag>
  );
}
