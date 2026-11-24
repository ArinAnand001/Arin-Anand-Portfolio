import { useEffect, useRef } from 'react';
import { addTick } from '../../lib/ticker';
import { pointer } from '../../lib/pointer';
import { useMotion } from '../../lib/motion';
import { StarField } from '../StarField/StarField';
import './cosmos.css';

/**
 * The living universe behind the whole page: deep-space gradient, drifting
 * purple nebulae, the Milky Way, interactive stars and a soft light that
 * follows the cursor. Scrolling moves the layers at different speeds, so the
 * page reads as one continuous journey.
 */
export function CosmicBackground() {
  const root = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);
  const { reduced, finePointer } = useMotion();

  useEffect(() => {
    const el = root.current;
    const light = glow.current;
    if (!el) return;
    let lastY = -1;
    let gx = window.innerWidth / 2;
    let gy = window.innerHeight / 2;
    let ga = 0;

    const tick = (now: number, dt: number) => {
      const y = window.scrollY;
      if (y !== lastY) {
        lastY = y;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        el.style.setProperty('--sy', y.toFixed(1));
        el.style.setProperty('--journey', (y / max).toFixed(4));
      }
      if (!light) return;
      const recent = now - pointer.lastMove < (pointer.type === 'touch' ? 900 : 4000);
      const target = pointer.active || (pointer.type === 'touch' && recent) ? 1 : 0;
      if (target && ga < 0.02) {
        // First appearance: start at the pointer instead of flying in from off-screen.
        gx = pointer.x;
        gy = pointer.y;
      }
      ga += (target - ga) * (1 - Math.pow(1 - 0.06, dt));
      if (target) {
        const k = 1 - Math.pow(1 - 0.08, dt);
        gx += (pointer.x - gx) * k;
        gy += (pointer.y - gy) * k;
      }
      light.style.opacity = ga.toFixed(3);
      light.style.transform = `translate3d(${gx.toFixed(1)}px, ${gy.toFixed(1)}px, 0)`;
    };

    if (reduced) {
      tick(0, 1);
      return;
    }
    return addTick(tick);
  }, [reduced]);

  return (
    <div className="cosmos" ref={root} aria-hidden="true">
      <div className="cosmos__base" />
      <div className="cosmos__nebula">
        <div className="neb neb--a" />
        <div className="neb neb--b" />
        <div className="neb neb--c" />
        <div className="neb neb--d" />
      </div>
      <StarField />
      {(finePointer || !reduced) && <div className="cosmos__glow" ref={glow} />}
      <div className="cosmos__vignette" />
    </div>
  );
}
