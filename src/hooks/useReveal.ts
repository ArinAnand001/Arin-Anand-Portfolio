import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { observeReveal } from '../lib/reveal';
import { trackProgress, type ProgressOptions } from '../lib/scrollProgress';
import { useMotion } from '../lib/motion';

/** Ref callback that adds `is-in` to the element once it scrolls into view. */
export function useReveal<T extends Element>(onReveal?: () => void) {
  const cleanup = useRef<(() => void) | null>(null);
  const cb = useRef(onReveal);
  cb.current = onReveal;
  return useCallback((el: T | null) => {
    cleanup.current?.();
    cleanup.current = null;
    if (el) cleanup.current = observeReveal(el, () => cb.current?.());
  }, []);
}

/** Writes a scroll-linked `--p` (0..1) onto the referenced element. */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  opts: ProgressOptions = {},
  enabled = true,
) {
  const { reduced } = useMotion();
  const optsRef = useRef(opts);
  optsRef.current = opts;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (reduced) {
      el.style.setProperty(optsRef.current.cssVar ?? '--p', '0');
      return;
    }
    return trackProgress(el, {
      ...optsRef.current,
      onUpdate: (p) => optsRef.current.onUpdate?.(p),
    });
  }, [ref, reduced, enabled]);
}
