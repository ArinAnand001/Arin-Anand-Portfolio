import { useEffect, useState } from 'react';

/**
 * Which page section is under the middle of the viewport.
 * Used for the navigation indicator.
 */
export function useActiveSection(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? '');
  const key = ids.join('|');

  useEffect(() => {
    const list = key.split('|');
    const els = list.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const visible = new Map<string, number>();
    const io = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (item.isIntersecting) visible.set(item.target.id, item.boundingClientRect.top);
          else visible.delete(item.target.id);
        }
        // The last section (in page order) that crosses the middle band wins.
        let next = '';
        for (const id of list) if (visible.has(id)) next = id;
        if (next) setActive(next);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);

  return active;
}
