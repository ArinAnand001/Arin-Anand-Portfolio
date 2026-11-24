import { addTick } from './ticker';
import { clamp } from './utils';

/**
 * Inertial smooth scrolling for mouse wheels and trackpads.
 * The page still scrolls natively - this only eases wheel input - so the
 * scrollbar, keyboard, find-in-page and touch scrolling all keep working.
 */
let enabled = false;
let locked = false;
let animating = false;
let target = 0;
let current = 0;
let removeTick: (() => void) | null = null;

interface Tween {
  from: number;
  to: number;
  start: number;
  duration: number;
  onDone?: () => void;
}
let tween: Tween | null = null;

const listeners = new Set<(y: number) => void>();

const easeInOut = (t: number) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2);

function maxScroll() {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
}

/** True when the wheel event should scroll an inner element instead of the page. */
function innerCanScroll(start: EventTarget | null, dy: number): boolean {
  let el = start instanceof Element ? start : null;
  while (el && el !== document.body && el !== document.documentElement) {
    if (el.hasAttribute('data-native-scroll')) return true;
    if (el instanceof HTMLElement && el.scrollHeight > el.clientHeight + 1) {
      const oy = getComputedStyle(el).overflowY;
      if (oy === 'auto' || oy === 'scroll') {
        if (dy < 0 && el.scrollTop > 0) return true;
        if (dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

function onWheel(e: WheelEvent) {
  if (!enabled || locked || e.ctrlKey || e.defaultPrevented) return;
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  if (innerCanScroll(e.target, e.deltaY)) return;
  e.preventDefault();
  let dy = e.deltaY;
  if (e.deltaMode === 1) dy *= 36;
  else if (e.deltaMode === 2) dy *= window.innerHeight;
  if (!animating) {
    current = window.scrollY;
    target = current;
  }
  tween = null;
  target = clamp(target + dy, 0, maxScroll());
  animating = true;
}

function onNativeScroll() {
  if (!animating && !tween) {
    current = window.scrollY;
    target = current;
  }
  listeners.forEach((fn) => fn(window.scrollY));
}

function tick(now: number, dt: number) {
  if (tween) {
    const k = clamp((now - tween.start) / tween.duration, 0, 1);
    current = tween.from + (tween.to - tween.from) * easeInOut(k);
    window.scrollTo(0, current);
    if (k >= 1) {
      const done = tween.onDone;
      tween = null;
      target = current;
      done?.();
    }
    return;
  }
  if (!animating) return;
  const ease = 1 - Math.pow(1 - 0.11, dt);
  current += (target - current) * ease;
  if (Math.abs(target - current) < 0.5) {
    current = target;
    animating = false;
  }
  window.scrollTo(0, current);
}

export function startSmoothScroll(): () => void {
  if (enabled) return stopSmoothScroll;
  enabled = true;
  current = target = window.scrollY;
  document.documentElement.classList.add('has-smooth-scroll');
  window.addEventListener('wheel', onWheel, { passive: false });
  removeTick = addTick(tick);
  return stopSmoothScroll;
}

export function stopSmoothScroll() {
  if (!enabled) return;
  enabled = false;
  animating = false;
  tween = null;
  document.documentElement.classList.remove('has-smooth-scroll');
  window.removeEventListener('wheel', onWheel);
  removeTick?.();
  removeTick = null;
}

window.addEventListener('scroll', onNativeScroll, { passive: true });

/** Subscribe to page scroll position. */
export function onScroll(fn: (y: number) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Pause page scrolling (menus, dialogs) without losing the scroll position. */
export function lockScroll(lock: boolean) {
  if (lock === locked) return;
  locked = lock;
  const html = document.documentElement;
  if (lock) {
    const gap = window.innerWidth - html.clientWidth;
    animating = false;
    tween = null;
    html.style.setProperty('--scrollbar-gap', `${gap}px`);
    html.classList.add('is-scroll-locked');
  } else {
    html.classList.remove('is-scroll-locked');
    html.style.removeProperty('--scrollbar-gap');
    current = target = window.scrollY;
  }
}

function navOffset() {
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'));
  return Number.isFinite(v) ? v : 72;
}

/**
 * Scroll to a section and move keyboard focus to it, so keyboard and
 * screen-reader users land where sighted users do.
 */
export function scrollToTarget(
  dest: string | HTMLElement | number,
  opts: { reduced?: boolean; focus?: boolean; onDone?: () => void } = {},
) {
  let y: number;
  let el: HTMLElement | null = null;
  if (typeof dest === 'number') {
    y = dest;
  } else {
    el = typeof dest === 'string' ? document.querySelector<HTMLElement>(dest) : dest;
    if (!el) return;
    y = el.id === 'home' ? 0 : el.getBoundingClientRect().top + window.scrollY - navOffset() + 1;
  }
  y = clamp(y, 0, maxScroll());

  const finish = () => {
    if (el && opts.focus !== false) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
    opts.onDone?.();
  };

  if (opts.reduced) {
    window.scrollTo({ top: y, behavior: 'auto' });
    current = target = y;
    finish();
    return;
  }

  const from = window.scrollY;
  const distance = Math.abs(y - from);
  const duration = clamp(500 + distance * 0.22, 700, 1700);
  animating = false;
  if (!removeTick) {
    // Smooth scrolling is off (touch devices): use the browser's own smooth scroll.
    window.scrollTo({ top: y, behavior: 'smooth' });
    window.setTimeout(finish, Math.min(900, duration));
    return;
  }
  tween = { from, to: y, start: performance.now(), duration, onDone: finish };
}
