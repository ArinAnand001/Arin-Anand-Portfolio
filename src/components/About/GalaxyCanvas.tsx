import { useEffect, useRef } from 'react';
import { addTick } from '../../lib/ticker';
import { pointer } from '../../lib/pointer';
import { getDeviceProfile } from '../../lib/device';
import { useMotion } from '../../lib/motion';
import { useInView } from '../../hooks/useInView';
import { GalaxyEngine } from './galaxyEngine';

/** The About section's galaxy. Only animates while it is on screen. */
export function GalaxyCanvas() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  const inView = useInView(wrap);
  const inViewRef = useRef(inView);
  inViewRef.current = inView;

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const profile = getDeviceProfile();
    let engine: GalaxyEngine;
    try {
      engine = new GalaxyEngine(cv, {
        count: profile.tier === 'high' ? 2600 : profile.tier === 'mid' ? 1500 : 800,
        dpr: Math.min(profile.dpr, 1.5),
      });
    } catch {
      return;
    }
    let rect = el.getBoundingClientRect();
    const resize = () => {
      rect = el.getBoundingClientRect();
      engine.resize(rect.width);
      if (reduced) engine.draw(30, 0, 0, 0.5);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    if (reduced) return () => ro.disconnect();

    const onScroll = () => (rect = el.getBoundingClientRect());
    window.addEventListener('scroll', onScroll, { passive: true });
    const t0 = performance.now();
    let energy = 0;
    const stop = addTick((now) => {
      if (!inViewRef.current) return;
      let px = 0;
      let py = 0;
      let near = 0;
      if (pointer.active) {
        px = Math.max(-1, Math.min(1, ((pointer.x - rect.left) / rect.width) * 2 - 1));
        py = Math.max(-1, Math.min(1, ((pointer.y - rect.top) / rect.height) * 2 - 1));
        near = Math.abs(px) < 1 && Math.abs(py) < 1 ? 1 : 0;
      }
      energy += (near - energy) * 0.05;
      engine.draw((now - t0) / 1000 + 40, px * near, py * near, energy);
    });
    return () => {
      stop();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [reduced]);

  return (
    <div className="galaxy" ref={wrap} aria-hidden="true">
      <canvas ref={canvas} className="galaxy__canvas" />
    </div>
  );
}
