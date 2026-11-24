import { useEffect, type RefObject } from 'react';
import { addTick } from '../lib/ticker';
import { useMotion } from '../lib/motion';

/**
 * Subtle 3D tilt toward the pointer plus a light that follows it.
 * Writes --rx / --ry (degrees) and --mx / --my (percent) on the element;
 * CSS decides what to do with them.
 */
export function useTilt<T extends HTMLElement>(ref: RefObject<T | null>, max = 7) {
  const { reduced, finePointer } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer) return;
    let rect = el.getBoundingClientRect();
    let tx = 0;
    let ty = 0;
    let rx = 0;
    let ry = 0;
    let hovering = false;
    let stopTick: (() => void) | null = null;

    const tick = (_n: number, dt: number) => {
      const k = 1 - Math.pow(1 - 0.12, dt);
      rx += (tx - rx) * k;
      ry += (ty - ry) * k;
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
      if (!hovering && Math.abs(rx) < 0.02 && Math.abs(ry) < 0.02) {
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        stopTick?.();
        stopTick = null;
      }
    };

    const onEnter = () => {
      rect = el.getBoundingClientRect();
      hovering = true;
      if (!reduced && !stopTick) stopTick = addTick(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!hovering) onEnter();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      if (!reduced) {
        ty = (px - 0.5) * max * 2;
        tx = -(py - 0.5) * max * 2;
      }
    };
    const onLeave = () => {
      hovering = false;
      tx = 0;
      ty = 0;
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      stopTick?.();
    };
  }, [ref, max, reduced, finePointer]);
}
