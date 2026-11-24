/**
 * Scroll-triggered reveals. Elements are observed once; when they enter the
 * viewport they receive the `is-in` class and CSS does the animation.
 */
let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver() {
  if (!observer) {
    observer = new IntersectionObserver(
      (items) => {
        for (const item of items) {
          if (!item.isIntersecting) continue;
          item.target.classList.add('is-in');
          callbacks.get(item.target)?.();
          observer?.unobserve(item.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
  }
  return observer;
}

export function observeReveal(el: Element, onReveal?: () => void): () => void {
  if (onReveal) callbacks.set(el, onReveal);
  const obs = getObserver();
  obs.observe(el);
  return () => obs.unobserve(el);
}

/** Reveal everything at once (reduced motion, or when observers are unavailable). */
export function revealAll(root: ParentNode = document) {
  root.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-in'));
}
