import { useEffect, useRef } from 'react';
import { addTick } from '../../lib/ticker';
import { pointer } from '../../lib/pointer';
import { useMotion } from '../../lib/motion';

/**
 * Flowing light ribbons: layered translucent strokes (no blur filters, so they
 * stay cheap) with a bright comet of light travelling along each one.
 * The whole layer drifts gently with the pointer for parallax.
 */
const RIBBONS = [
  'M-120 760 C 220 640, 520 700, 820 560 S 1300 260, 1620 300',
  'M-160 860 C 260 760, 640 820, 940 650 S 1340 420, 1640 470',
  'M-100 640 C 300 520, 560 600, 860 470 S 1240 180, 1600 140',
];

export function Ribbons() {
  const ref = useRef<SVGSVGElement>(null);
  const { reduced, finePointer } = useMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || !finePointer) return;
    let x = 0;
    let y = 0;
    return addTick((_n, dt) => {
      const k = 1 - Math.pow(1 - 0.04, dt);
      x += ((pointer.active ? pointer.nx : 0) * -18 - x) * k;
      y += ((pointer.active ? pointer.ny : 0) * -12 - y) * k;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  }, [reduced, finePointer]);

  return (
    <svg
      ref={ref}
      className="ribbons"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ribbon-a" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6726C9" stopOpacity="0" />
          <stop offset="0.35" stopColor="#963CFF" stopOpacity="1" />
          <stop offset="0.7" stopColor="#C7A5FF" stopOpacity="1" />
          <stop offset="1" stopColor="#C7A5FF" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ribbon-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C7A5FF" stopOpacity="0" />
          <stop offset="0.5" stopColor="#F5F1FF" stopOpacity="1" />
          <stop offset="1" stopColor="#963CFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      {RIBBONS.map((d, i) => (
        <g key={i} className={`ribbon ribbon--${i}`}>
          <path d={d} className="ribbon__haze" stroke="url(#ribbon-a)" strokeWidth={70} />
          <path d={d} className="ribbon__band" stroke="url(#ribbon-a)" strokeWidth={24} />
          <path d={d} className="ribbon__edge" stroke="url(#ribbon-b)" strokeWidth={1.2} />
          <path d={d} className="ribbon__spark" stroke="#F5F1FF" strokeWidth={2} pathLength={1000} />
        </g>
      ))}
    </svg>
  );
}
