import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useMotion } from '../../lib/motion';
import { lockScroll } from '../../lib/scroll';
import './loader.css';

const SEEN_KEY = 'aa-intro-seen';

function introSeen() {
  try {
    return window.sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Opening sequence: the name appears letter by letter while fonts load, then the
 * veil lifts and hands over to the hero entrance. Shorter on repeat visits
 * in the same session; skipped entirely with reduced motion.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const { reduced } = useMotion();
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'gone'>('loading');
  const bar = useRef<HTMLSpanElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (reduced) {
      setPhase('gone');
      done.current();
      return;
    }
    lockScroll(true);
    const quick = introSeen();
    const minTime = quick ? 1600 : 3000;
    const maxTime = 5200;
    const start = performance.now();
    let fontsReady = false;
    let shown = 0;
    let raf = 0;
    let finished = false;
    const timers: number[] = [];

    const fonts = document.fonts?.ready ?? Promise.resolve();
    fonts.then(() => (fontsReady = true)).catch(() => (fontsReady = true));

    const frame = (now: number) => {
      const elapsed = now - start;
      const ready = (fontsReady && elapsed >= minTime) || elapsed >= maxTime;
      const target = ready ? 1 : Math.min(0.92, (elapsed / minTime) * 0.92);
      shown += (target - shown) * (ready ? 0.10 : 0.055);
      if (ready && 1 - shown < 0.004) shown = 1;
      if (bar.current) bar.current.style.transform = `scaleX(${shown.toFixed(4)})`;
      if (count.current) count.current.textContent = String(Math.round(shown * 100)).padStart(3, '0');
      if (shown < 1) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (finished) return;
      finished = true;
      try {
        window.sessionStorage.setItem(SEEN_KEY, '1');
      } catch {
        /* private mode - the full intro simply plays again next time */
      }
      setPhase('leaving');
      timers.push(
        window.setTimeout(() => {
          lockScroll(false);
          done.current();
        }, 480),
      );
      timers.push(window.setTimeout(() => setPhase('gone'), 1800));
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      lockScroll(false);
    };
  }, [reduced]);

  if (phase === 'gone') return null;

  return (
    <div className={`loader loader--${phase}`} role="status" aria-live="polite">
      <span className="sr-only">Loading Arin Anand's portfolio</span>
      <div className="loader__core" aria-hidden="true">
        <div className="loader__halo" />
        <p className="loader__name">
          {Array.from('Arin Anand').map((ch, i) => (
            <span key={i} style={{ '--i': i } as CSSProperties}>
              {ch === ' ' ? '\u00a0' : ch}
            </span>
          ))}
        </p>
        <p className="loader__role">Brain of a Businessman, Courage of a Warrior</p>
        <div className="loader__meter">
          <span className="loader__bar" ref={bar} />
        </div>
        <span className="loader__count" ref={count}>
          000
        </span>
      </div>
      <div className="loader__ring" aria-hidden="true" />
    </div>
  );
}
