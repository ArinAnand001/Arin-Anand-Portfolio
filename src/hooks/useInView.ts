import { useEffect, useState, type RefObject } from 'react';

/** True while the element is on (or near) the screen. Used to pause canvases. */
export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  rootMargin = '120px 0px',
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return inView;
}
