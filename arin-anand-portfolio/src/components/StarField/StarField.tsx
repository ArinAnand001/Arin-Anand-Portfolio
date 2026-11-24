import { useEffect, useRef } from 'react';
import { attachPointer } from '../../lib/pointer';
import { getDeviceProfile } from '../../lib/device';
import { useMotion } from '../../lib/motion';
import { StarFieldEngine } from './starfieldEngine';

/**
 * The interactive starfield and the painted Milky Way behind every section.
 * Star count and pixel ratio scale with the device; the loop pauses in hidden tabs.
 */
export function StarField() {
  const starsRef = useRef<HTMLCanvasElement>(null);
  const milkyRef = useRef<HTMLCanvasElement>(null);
  const { reduced } = useMotion();

  useEffect(() => {
    const canvas = starsRef.current;
    if (!canvas) return;
    const detach = attachPointer();
    const profile = getDeviceProfile();
    let engine: StarFieldEngine | null = null;
    try {
      engine = new StarFieldEngine(canvas, milkyRef.current, {
        count: profile.stars,
        dpr: profile.dpr,
        reduced,
        coarse: profile.coarse,
        tier: profile.tier,
      });
      engine.start();
    } catch (err) {
      console.warn('[starfield] canvas unavailable, showing the static background only.', err);
    }
    return () => {
      engine?.destroy();
      detach();
    };
  }, [reduced]);

  return (
    <>
      <canvas ref={milkyRef} className="cosmos__milky" aria-hidden="true" />
      <canvas ref={starsRef} className="cosmos__stars" aria-hidden="true" />
    </>
  );
}
