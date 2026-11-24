import { useEffect, type RefObject } from 'react';
import { addTick } from '../lib/ticker';
import { useMotion } from '../lib/motion';

/**
 * Magnetic pull: the element drifts toward the pointer while it is nearby and
 * springs back when it leaves. Inner `[data-magnetic-inner]` moves a little more
 * for depth. Mouse and trackpad only; touch and reduced motion are left alone.
 */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, strength = 0.32) {
  const { reduced, finePointer } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !finePointer) return;
    const inner = el.querySelector<HTMLElement>('[data-magnetic-inner]');
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let rect = el.getBoundingClientRect();
    let hovering = false;
    let stopTick: (() => void) | null = null;

    const tick = (_now: number, dt: number) => {
      const k = 1 - Math.pow(1 - 0.16, dt);
      x += (tx - x) * k;
      y += (ty - y) * k;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (inner) inner.style.transform = `translate3d(${(x * 0.35).toFixed(2)}px, ${(y * 0.35).toFixed(2)}px, 0)`;
      if (!hovering && Math.abs(x) < 0.05 && Math.abs(y) < 0.05) {
        el.style.transform = '';
        if (inner) inner.style.transform = '';
        stopTick?.();
        stopTick = null;
      }
    };

    const onEnter = () => {
      rect = el.getBoundingClientRect();
      hovering = true;
      if (!stopTick) stopTick = addTick(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (!hovering) onEnter();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tx = (e.clientX - cx) * strength;
      ty = (e.clientY - cy) * strength;
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
      el.style.transform = '';
      if (inner) inner.style.transform = '';
    };
  }, [ref, strength, reduced, finePointer]);
}
