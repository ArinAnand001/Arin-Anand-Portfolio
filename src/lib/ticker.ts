/**
 * One requestAnimationFrame loop for the whole site.
 * Every animated system subscribes here instead of running its own loop,
 * and the loop stops completely while the tab is hidden.
 */
export type TickFn = (now: number, dt: number) => void;

const subscribers = new Set<TickFn>();
let raf = 0;
let running = false;
let last = 0;

function loop(now: number) {
  raf = requestAnimationFrame(loop);
  // dt is measured in 60 fps frames and capped so a dropped frame never makes things jump
  const dt = last ? Math.min(3, (now - last) / 16.667) : 1;
  last = now;
  subscribers.forEach((fn) => fn(now, dt));
}

function start() {
  if (running || document.hidden || subscribers.size === 0) return;
  running = true;
  last = 0;
  raf = requestAnimationFrame(loop);
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else start();
  });
}

/** Subscribe to the shared frame loop. Returns an unsubscribe function. */
export function addTick(fn: TickFn): () => void {
  subscribers.add(fn);
  start();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0) stop();
  };
}
