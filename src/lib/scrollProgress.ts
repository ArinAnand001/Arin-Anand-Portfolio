import { addTick } from './ticker';
import { clamp } from './utils';

/**
 * Scroll-linked progress, the lightweight equivalent of a scrubbed ScrollTrigger.
 *
 * progress = 0 when the element's top reaches `from` (a fraction of the viewport
 * height, 1 = bottom edge) and 1 when the element's bottom reaches `to`.
 * Defaults (from 1, to 0) run from "entering at the bottom" to "leaving at the top".
 * For a pinned section use from 0, to 1.
 *
 * Each element gets a `--p` CSS variable, and an optional callback runs on change.
 * Layout is measured on resize only, never during scroll.
 */
export interface ProgressOptions {
  from?: number;
  to?: number;
  /** CSS variable name; default --p */
  cssVar?: string;
  onUpdate?: (p: number) => void;
}

interface Entry {
  el: HTMLElement;
  from: number;
  to: number;
  cssVar: string;
  onUpdate?: (p: number) => void;
  top: number;
  height: number;
  last: number;
}

const entries = new Set<Entry>();
let removeTick: (() => void) | null = null;
let lastY = -1;
let vh = 0;
let dirty = true;
let resizeObserver: ResizeObserver | null = null;

function measure() {
  vh = window.innerHeight;
  const sy = window.scrollY;
  entries.forEach((e) => {
    const r = e.el.getBoundingClientRect();
    e.top = r.top + sy;
    e.height = r.height;
  });
  dirty = false;
  lastY = -1;
}

function update(entry: Entry, y: number) {
  const startY = entry.top - vh * entry.from;
  const endY = entry.top + entry.height - vh * entry.to;
  const span = endY - startY || 1;
  const p = clamp((y - startY) / span, 0, 1);
  if (Math.abs(p - entry.last) < 0.0004) return;
  entry.last = p;
  entry.el.style.setProperty(entry.cssVar, p.toFixed(4));
  entry.onUpdate?.(p);
}

function tick() {
  if (dirty) measure();
  const y = window.scrollY;
  if (y === lastY) return;
  lastY = y;
  entries.forEach((e) => update(e, y));
}

function invalidate() {
  dirty = true;
}

export function refreshProgress() {
  dirty = true;
}

export function trackProgress(el: HTMLElement, opts: ProgressOptions = {}): () => void {
  const entry: Entry = {
    el,
    from: opts.from ?? 1,
    to: opts.to ?? 0,
    cssVar: opts.cssVar ?? '--p',
    onUpdate: opts.onUpdate,
    top: 0,
    height: 0,
    last: -1,
  };
  entries.add(entry);
  dirty = true;
  if (!removeTick) {
    removeTick = addTick(tick);
    window.addEventListener('resize', invalidate, { passive: true });
    window.addEventListener('load', invalidate);
    document.fonts?.ready.then(invalidate).catch(() => undefined);
    resizeObserver = new ResizeObserver(invalidate);
    resizeObserver.observe(document.body);
  }
  return () => {
    entries.delete(entry);
    if (entries.size === 0 && removeTick) {
      removeTick();
      removeTick = null;
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('load', invalidate);
      resizeObserver?.disconnect();
      resizeObserver = null;
    }
  };
}
