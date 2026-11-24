import { useEffect, useRef, useState } from 'react';
import { addTick } from '../../lib/ticker';
import { pointer } from '../../lib/pointer';
import { getDeviceProfile, hasWebGL } from '../../lib/device';
import { useMotion } from '../../lib/motion';
import { useInView } from '../../hooks/useInView';
import { PlanetRenderer, type PlanetLayout } from './planetRenderer';

interface PlanetCanvasProps {
  /** Start the entrance animation. */
  ready: boolean;
  layout: (width: number, height: number) => PlanetLayout;
}

/**
 * Hosts the WebGL planet. Falls back to a CSS planet when WebGL is missing,
 * fails to start, or the GPU drops the context. Rendering pauses whenever the
 * hero is off-screen or the tab is hidden.
 */
export function PlanetCanvas({ ready, layout }: PlanetCanvasProps) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();
  const inView = useInView(wrap, '0px');
  const inViewRef = useRef(inView);
  inViewRef.current = inView;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  const [failed, setFailed] = useState(() => typeof window !== 'undefined' && !hasWebGL());
  const [fallbackLayout, setFallbackLayout] = useState<PlanetLayout | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  useEffect(() => {
    const el = wrap.current;
    const cv = canvas.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      return { w: Math.max(1, r.width), h: Math.max(1, r.height) };
    };

    if (failed || !cv) {
      const apply = () => {
        const { w, h } = measure();
        setFallbackLayout(layoutRef.current(w, h));
      };
      apply();
      const ro = new ResizeObserver(apply);
      ro.observe(el);
      return () => ro.disconnect();
    }

    let renderer: PlanetRenderer;
    try {
      const profile = getDeviceProfile();
      renderer = new PlanetRenderer(cv, Math.min(profile.dpr, profile.tier === 'low' ? 1 : 1.5));
    } catch (err) {
      console.warn('[planet] WebGL failed to start, using the CSS planet instead.', err);
      setFailed(true);
      return;
    }

    const t0 = performance.now();
    let introStart = 0;
    let px = 0;
    let py = 0;
    let needsStatic = true;

    const resize = () => {
      const { w, h } = measure();
      renderer.resize(w, h, layoutRef.current(w, h));
      needsStatic = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const tick = (now: number, dt: number) => {
      if (renderer.lost) {
        setFailed(true);
        return;
      }
      if (reduced) {
        if (needsStatic) {
          renderer.render(12, 1, 0, 0);
          needsStatic = false;
        }
        return;
      }
      if (!inViewRef.current) return;
      // Nothing is visible before the entrance starts, so don't spend GPU time on it.
      if (!readyRef.current) return;
      if (!introStart) introStart = now;
      const intro = introStart ? Math.min(1, (now - introStart) / 2800) : 0;
      if (pointer.active && pointer.type !== 'touch') {
        const k = 1 - Math.pow(1 - 0.03, dt);
        px += (pointer.nx - px) * k;
        py += (pointer.ny - py) * k;
      }
      renderer.render((now - t0) / 1000 + 20, intro, px, py);
    };
    const stop = addTick(tick);

    return () => {
      stop();
      ro.disconnect();
      renderer.destroy();
    };
  }, [failed, reduced]);

  return (
    <div className="planet" ref={wrap} aria-hidden="true">
      {!failed && <canvas ref={canvas} className="planet__canvas" />}
      {failed && fallbackLayout && (
        <div
          className="planet__fallback"
          style={{
            left: fallbackLayout.cx,
            top: fallbackLayout.cy,
            width: fallbackLayout.radius * 2,
            height: fallbackLayout.radius * 2,
          }}
        >
          <span className="planet__fallback-ring planet__fallback-ring--back" />
          <span className="planet__fallback-body" />
          <span className="planet__fallback-ring planet__fallback-ring--front" />
        </div>
      )}
    </div>
  );
}
