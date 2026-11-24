import { useEffect, useRef } from 'react';
import { addTick } from '../../lib/ticker';
import { attachPointer, pointer } from '../../lib/pointer';
import { useMotion } from '../../lib/motion';
import './cursor.css';

const INTERACTIVE = 'a, button, [role="button"], [role="tab"], label, summary, [data-cursor]';
const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]';

/**
 * Custom cursor: a precise dot plus a ring that trails it with a little lag.
 * The ring grows over anything clickable and can show a label
 * (add data-cursor="View" to an element). The native cursor returns over
 * text fields. Mouse and trackpad only - touch devices never see it.
 */
export function InteractiveCursor() {
  const { reduced, finePointer } = useMotion();
  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const enabled = finePointer;

  useEffect(() => {
    if (!enabled) return;
    const rootEl = root.current;
    const ringEl = ring.current;
    const dotEl = dot.current;
    const labelEl = label.current;
    if (!rootEl || !ringEl || !dotEl || !labelEl) return;

    const detach = attachPointer();
    const html = document.documentElement;
    html.classList.add('has-custom-cursor');

    let rx = pointer.x;
    let ry = pointer.y;
    let shown = false;

    const onOver = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const t = e.target instanceof Element ? e.target : null;
      if (!t) return;
      const textEntry = t.closest(TEXT_ENTRY);
      const hit = textEntry ? null : t.closest<HTMLElement>(INTERACTIVE);
      const text = hit?.dataset.cursor ?? '';
      rootEl.dataset.state = textEntry ? 'text' : text ? 'label' : hit ? 'hover' : 'idle';
      labelEl.textContent = text;
    };
    const onDown = () => rootEl.classList.add('is-down');
    const onUp = () => rootEl.classList.remove('is-down');

    const tick = (_now: number, dt: number) => {
      const visible = pointer.active && pointer.type !== 'touch';
      if (visible !== shown) {
        shown = visible;
        rootEl.classList.toggle('is-visible', visible);
        if (visible) {
          rx = pointer.x;
          ry = pointer.y;
        }
      }
      if (!visible) return;
      const k = reduced ? 1 : 1 - Math.pow(1 - 0.2, dt);
      rx += (pointer.x - rx) * k;
      ry += (pointer.y - ry) * k;
      dotEl.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      ringEl.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    };

    document.addEventListener('pointerover', onOver, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    const stop = addTick(tick);

    return () => {
      stop();
      detach();
      html.classList.remove('has-custom-cursor');
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [enabled, reduced]);

  if (!enabled) return null;

  return (
    <div className="cursor" ref={root} data-state="idle" aria-hidden="true">
      <div className="cursor__ring" ref={ring}>
        <div className="cursor__ring-shape">
          <span className="cursor__label" ref={label} />
        </div>
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
