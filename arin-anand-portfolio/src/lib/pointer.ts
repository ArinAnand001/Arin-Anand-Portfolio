/**
 * One shared pointer state for every canvas and cursor effect.
 * A single passive listener writes here; animation loops read it each frame,
 * so pointer movement never triggers React re-renders.
 */
export interface PointerState {
  x: number;
  y: number;
  /** Normalised -1..1 from the viewport centre (for parallax). */
  nx: number;
  ny: number;
  vx: number;
  vy: number;
  /** Smoothed speed in px per 60fps frame. */
  speed: number;
  active: boolean;
  down: boolean;
  type: 'mouse' | 'pen' | 'touch';
  lastMove: number;
}

export interface Pulse {
  x: number;
  y: number;
  t: number;
  strength: number;
}

export const pointer: PointerState = {
  x: -9999,
  y: -9999,
  nx: 0,
  ny: 0,
  vx: 0,
  vy: 0,
  speed: 0,
  active: false,
  down: false,
  type: 'mouse',
  lastMove: 0,
};

/** Touch taps and clicks create ripples that push stars outward. */
export const pulses: Pulse[] = [];

let refs = 0;
let detach: (() => void) | null = null;
let lastT = 0;

function update(x: number, y: number, type: PointerState['type']) {
  const now = performance.now();
  const dt = Math.max(1, now - lastT);
  const dx = x - pointer.x;
  const dy = y - pointer.y;
  if (pointer.active && dt < 200) {
    const k = 16.67 / dt;
    pointer.vx = pointer.vx * 0.5 + dx * k * 0.5;
    pointer.vy = pointer.vy * 0.5 + dy * k * 0.5;
  } else {
    pointer.vx = 0;
    pointer.vy = 0;
  }
  pointer.speed = Math.hypot(pointer.vx, pointer.vy);
  pointer.x = x;
  pointer.y = y;
  pointer.nx = (x / window.innerWidth) * 2 - 1;
  pointer.ny = (y / window.innerHeight) * 2 - 1;
  pointer.active = true;
  pointer.type = type;
  pointer.lastMove = now;
  lastT = now;
}

export function addPulse(x: number, y: number, strength = 1) {
  pulses.push({ x, y, t: performance.now(), strength });
  if (pulses.length > 6) pulses.shift();
}

export function attachPointer(): () => void {
  refs += 1;
  if (!detach) {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      update(e.clientX, e.clientY, e.pointerType === 'pen' ? 'pen' : 'mouse');
    };
    const onDown = (e: PointerEvent) => {
      pointer.down = true;
      if (e.pointerType !== 'touch') {
        update(e.clientX, e.clientY, 'mouse');
        addPulse(e.clientX, e.clientY, 0.55);
      }
    };
    const onUp = () => {
      pointer.down = false;
    };
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      update(t.clientX, t.clientY, 'touch');
      addPulse(t.clientX, t.clientY, 1);
    };
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) update(t.clientX, t.clientY, 'touch');
    };
    const onTouchEnd = () => {
      pointer.active = false;
      pointer.down = false;
    };
    const onLeave = (e: MouseEvent) => {
      if (!e.relatedTarget) pointer.active = false;
    };
    const onBlur = () => {
      pointer.active = false;
      pointer.down = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    window.addEventListener('pointerup', onUp, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('mouseout', onLeave);
    window.addEventListener('blur', onBlur);

    detach = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('mouseout', onLeave);
      window.removeEventListener('blur', onBlur);
    };
  }
  return () => {
    refs -= 1;
    if (refs <= 0 && detach) {
      detach();
      detach = null;
      refs = 0;
    }
  };
}

/** Speed decays when the pointer stops moving. Call once per frame from a loop. */
let lastDecay = 0;
export function decayPointer(now: number) {
  if (now - lastDecay < 10) return; // several loops share one decay per frame
  lastDecay = now;
  if (now - pointer.lastMove > 60) {
    pointer.vx *= 0.85;
    pointer.vy *= 0.85;
    pointer.speed = Math.hypot(pointer.vx, pointer.vy);
  }
}
