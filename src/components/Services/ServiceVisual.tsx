import type { ServiceVisualKind } from '../../data/services';
import { useMotion } from '../../lib/motion';

/**
 * One small animated illustration per skill. Each idles with slow motion and
 * reacts when its card is hovered (see services.css).
 */
export function ServiceVisual({ kind }: { kind: ServiceVisualKind }) {
  const { reduced } = useMotion();
  return (
    <svg className={`sv sv--${kind}`} viewBox="0 0 200 120" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`sv-orb-${kind}`} cx="35%" cy="30%" r="75%">
          <stop offset="0" stopColor="#F5F1FF" />
          <stop offset="0.35" stopColor="#C7A5FF" />
          <stop offset="0.7" stopColor="#6726C9" />
          <stop offset="1" stopColor="#160B2C" />
        </radialGradient>
        <linearGradient id={`sv-line-${kind}`} x1="0" x2="1">
          <stop offset="0" stopColor="#963CFF" />
          <stop offset="1" stopColor="#F5F1FF" />
        </linearGradient>
      </defs>
      {renderKind(kind, reduced)}
    </svg>
  );
}

/** A small body travelling along an elliptical orbit (SVG motion path). */
function Orbiter({
  r,
  fill,
  dur,
  begin = '0s',
  reverse = false,
  still,
}: {
  r: number;
  fill: string;
  dur: string;
  begin?: string;
  reverse?: boolean;
  still: boolean;
}) {
  const path = reverse
    ? 'M172 60 A72 26 0 1 0 28 60 A72 26 0 1 0 172 60'
    : 'M172 60 A72 26 0 1 1 28 60 A72 26 0 1 1 172 60';
  if (still) return <circle cx={172} cy={60} r={r} fill={fill} />;
  return (
    <circle r={r} fill={fill}>
      <animateMotion dur={dur} begin={begin} repeatCount="indefinite" path={path} />
    </circle>
  );
}

/** Five-point star polygon. */
function star(cx: number, cy: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`);
  }
  return pts.join(' ');
}

const SPARK = 'M0 -9 C 1 -3, 3 -1, 9 0 C 3 1, 1 3, 0 9 C -1 3, -3 1, -9 0 C -3 -1, -1 -3, 0 -9 Z';

function renderKind(kind: ServiceVisualKind, reduced: boolean) {
  const orb = `url(#sv-orb-${kind})`;
  const line = `url(#sv-line-${kind})`;
  switch (kind) {
    case 'identity':
      return (
        <g>
          <circle className="sv-spin" cx="100" cy="60" r="46" strokeDasharray="2 7" />
          <circle className="sv-spin sv-spin--rev" cx="100" cy="60" r="36" strokeDasharray="22 10" />
          <circle className="sv-draw" cx="91" cy="60" r="15" stroke={line} />
          <circle className="sv-draw" cx="109" cy="60" r="15" stroke={line} />
          <path className="sv-star" d={SPARK} transform="translate(100 60)" fill="#F5F1FF" />
          <g className="sv-swatches">
            <circle cx="160" cy="100" r="5" fill="#160B2C" stroke="#C7A5FF" strokeOpacity="0.5" />
            <circle cx="172" cy="100" r="5" fill="#6726C9" />
            <circle cx="184" cy="100" r="5" fill="#963CFF" />
            <circle cx="196" cy="100" r="5" fill="#C7A5FF" />
          </g>
        </g>
      );
    case 'graphic':
      return (
        <g>
          <path className="sv-ghost" d="M44 88 L72 24 M156 88 L128 24" />
          <path className="sv-draw sv-draw--loop" d="M44 88 C 72 24, 128 24, 156 88" stroke={line} />
          <rect x="40" y="84" width="8" height="8" rx="1.5" fill="#963CFF" />
          <rect x="152" y="84" width="8" height="8" rx="1.5" fill="#963CFF" />
          <circle className="sv-knob" cx="72" cy="24" r="3.5" fill="#F5F1FF" />
          <circle className="sv-knob sv-knob--b" cx="128" cy="24" r="3.5" fill="#F5F1FF" />
          <rect className="sv-float" x="88" y="70" width="14" height="14" rx="3" fill="#6726C9" />
          <circle className="sv-float sv-float--b" cx="116" cy="80" r="8" fill={orb} />
          <path className="sv-float sv-float--c" d="M96 52 L104 40 L112 52 Z" fill="#C7A5FF" />
        </g>
      );
    case 'marketing':
      return (
        <g>
          <path className="sv-frame sv-horn" d="M56 50 L86 36 L86 84 L56 70 Z" />
          <rect className="sv-frame" x="46" y="50" width="10" height="20" rx="3" />
          <path className="sv-frame" d="M60 70 L66 88 L74 88 L70 73" />
          <path className="sv-arc" d="M96 48 Q104 60 96 72" />
          <path className="sv-arc sv-arc--2" d="M106 40 Q118 60 106 80" />
          <path className="sv-arc sv-arc--3" d="M116 32 Q132 60 116 88" />
          <circle className="sv-star" cx="152" cy="36" r="3.5" />
          <circle className="sv-star" cx="166" cy="62" r="4.5" style={{ animationDelay: '0.5s' }} />
          <circle className="sv-star" cx="150" cy="88" r="3" style={{ animationDelay: '1s' }} />
        </g>
      );
    case 'social':
      return (
        <g>
          <ellipse className="sv-frame" cx="100" cy="60" rx="72" ry="26" />
          <circle cx="100" cy="60" r="18" fill={orb} />
          <Orbiter r={6} fill="#963CFF" dur="9s" still={reduced} />
          <Orbiter r={4.5} fill="#C7A5FF" dur="13s" begin="-6s" still={reduced} />
          <Orbiter r={3.5} fill="#F5F1FF" dur="6s" begin="-2s" reverse still={reduced} />
          <g className="sv-notify">
            <circle cx="148" cy="26" r="9" fill="#963CFF" />
            <path d="M144.5 26.5 l2.5 2.5 l5 -5.5" stroke="#F5F1FF" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        </g>
      );
    case 'performance':
      return (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              className="sv-col"
              x={46 + i * 24}
              y={96 - (i + 1) * 12}
              width="14"
              height={(i + 1) * 12}
              rx="3"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <path className="sv-draw sv-draw--loop" d="M36 92 C 70 88, 90 70, 112 58 S 150 30, 168 22" stroke={line} />
          <circle className="sv-pulse" cx="168" cy="22" r="5" fill="#F5F1FF" />
          <circle className="sv-pulse-ring" cx="168" cy="22" r="5" />
        </g>
      );
    case 'gmb':
      return (
        <g>
          <ellipse className="sv-shadow" cx="100" cy="88" rx="16" ry="4" fill="#963CFF" />
          <g className="sv-pin">
            <path
              d="M100 16 C 84 16, 74 28, 74 42 C 74 60, 100 82, 100 82 C 100 82, 126 60, 126 42 C 126 28, 116 16, 100 16 Z"
              fill="#6726C9"
              stroke="#C7A5FF"
              strokeOpacity="0.7"
            />
            <circle cx="100" cy="42" r="9" fill={orb} />
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <polygon
              key={i}
              className="sv-rate"
              points={star(72 + i * 14, 106, 5)}
              fill="#C7A5FF"
              style={{ animationDelay: `${i * 0.14}s` }}
            />
          ))}
        </g>
      );
    case 'video':
      return (
        <g>
          <rect className="sv-frame" x="50" y="22" width="76" height="52" rx="9" />
          <path className="sv-frame" d="M126 40 L152 28 L152 68 L126 56 Z" />
          <circle className="sv-rec" cx="64" cy="35" r="4" fill="#963CFF" />
          <circle cx="88" cy="48" r="12" fill={orb} />
          <rect x="36" y="92" width="128" height="10" rx="5" fill="rgb(199 165 255 / 0.1)" />
          <rect x="40" y="94" width="36" height="6" rx="3" fill="#6726C9" />
          <rect x="80" y="94" width="28" height="6" rx="3" fill="#963CFF" />
          <rect x="112" y="94" width="48" height="6" rx="3" fill="#C7A5FF" fillOpacity="0.6" />
          <g className="sv-playhead">
            <rect x="39" y="86" width="2" height="22" rx="1" fill="#F5F1FF" />
          </g>
        </g>
      );
    case 'brochure':
      return (
        <g>
          <g className="sv-fold sv-fold--l">
            <rect x="48" y="26" width="34" height="68" rx="3" />
            <rect x="54" y="36" width="20" height="4" rx="2" fill="#C7A5FF" fillOpacity="0.6" />
            <rect x="54" y="46" width="16" height="3" rx="1.5" fill="#C7A5FF" fillOpacity="0.3" />
          </g>
          <g className="sv-panel">
            <rect x="83" y="26" width="34" height="68" rx="3" />
            <circle cx="100" cy="50" r="10" fill={orb} />
            <rect x="89" y="68" width="22" height="4" rx="2" fill="#F5F1FF" fillOpacity="0.8" />
            <rect x="92" y="76" width="16" height="3" rx="1.5" fill="#C7A5FF" fillOpacity="0.4" />
          </g>
          <g className="sv-fold sv-fold--r">
            <rect x="118" y="26" width="34" height="68" rx="3" />
            <rect x="124" y="36" width="22" height="18" rx="3" fill="#6726C9" />
            <rect x="124" y="60" width="18" height="3" rx="1.5" fill="#C7A5FF" fillOpacity="0.3" />
            <rect x="124" y="67" width="14" height="3" rx="1.5" fill="#C7A5FF" fillOpacity="0.3" />
          </g>
        </g>
      );
    case 'deck':
      return (
        <g>
          <g className="sv-slide sv-slide--3">
            <rect x="56" y="24" width="96" height="60" rx="7" />
          </g>
          <g className="sv-slide sv-slide--2">
            <rect x="52" y="30" width="96" height="60" rx="7" />
          </g>
          <g className="sv-slide sv-slide--1">
            <rect x="48" y="36" width="96" height="60" rx="7" />
            <rect x="58" y="47" width="40" height="6" rx="3" fill="#F5F1FF" />
            <rect x="58" y="57" width="28" height="4" rx="2" fill="#C7A5FF" opacity="0.6" />
            <rect x="58" y="76" width="7" height="12" rx="2" fill="#6726C9" />
            <rect x="68" y="70" width="7" height="18" rx="2" fill="#963CFF" />
            <rect x="78" y="64" width="7" height="24" rx="2" fill="#C7A5FF" />
            <circle cx="122" cy="68" r="12" fill={orb} />
          </g>
        </g>
      );
    case 'label':
      return (
        <g>
          <defs>
            <clipPath id="sv-jar-clip">
              <rect x="72" y="36" width="56" height="68" rx="12" />
            </clipPath>
          </defs>
          <rect className="sv-frame" x="80" y="24" width="40" height="12" rx="3" />
          <rect className="sv-frame" x="72" y="36" width="56" height="68" rx="12" />
          <g clipPath="url(#sv-jar-clip)">
            <rect className="sv-label" x="72" y="54" width="56" height="34" fill="#6726C9" />
            <circle cx="88" cy="71" r="7" fill={orb} />
            <rect x="99" y="64" width="22" height="4" rx="2" fill="#F5F1FF" />
            <rect x="99" y="72" width="16" height="3" rx="1.5" fill="#C7A5FF" fillOpacity="0.7" />
            <rect className="sv-shine" x="60" y="36" width="10" height="68" fill="#F5F1FF" fillOpacity="0.18" />
          </g>
          <path className="sv-star" d={SPARK} transform="translate(146 34) scale(0.7)" fill="#F5F1FF" />
        </g>
      );
    case 'motion':
      return (
        <g>
          <path className="sv-grid" d="M40 96 H160 M40 24 V96" />
          <path className="sv-draw" d="M40 96 C 92 96, 98 24, 160 24" stroke={line} />
          <rect className="sv-key" x="36" y="92" width="8" height="8" rx="1.5" transform="rotate(45 40 96)" />
          <rect className="sv-key" x="156" y="20" width="8" height="8" rx="1.5" transform="rotate(45 160 24)" />
          <circle className="sv-ease" cx="40" cy="108" r="5" fill="#F5F1FF" />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect
              key={i}
              className="sv-wave"
              x={172 + (i % 4) * 6}
              y={i < 4 ? 40 : 70}
              width="3"
              height="16"
              rx="1.5"
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </g>
      );
    case 'web':
      return (
        <g>
          <rect className="sv-frame" x="38" y="18" width="124" height="86" rx="10" />
          <path className="sv-frame" d="M38 32 H162" />
          <circle cx="48" cy="25" r="2.4" fill="#963CFF" />
          <circle cx="56" cy="25" r="2.4" fill="#6726C9" />
          <circle cx="64" cy="25" r="2.4" fill="#C7A5FF" />
          <rect className="sv-bar sv-bar--1" x="50" y="44" width="58" height="7" rx="3.5" />
          <rect className="sv-bar sv-bar--2" x="50" y="56" width="42" height="5" rx="2.5" />
          <rect className="sv-bar sv-bar--3" x="50" y="68" width="30" height="10" rx="5" fill="#963CFF" />
          <circle className="sv-float" cx="134" cy="64" r="14" fill={orb} />
          <rect className="sv-bar sv-bar--4" x="50" y="88" width="100" height="6" rx="3" />
        </g>
      );
    case 'uiux':
      return (
        <g>
          <rect className="sv-frame" x="50" y="16" width="100" height="88" rx="9" />
          <rect x="60" y="27" width="46" height="6" rx="3" fill="#F5F1FF" fillOpacity="0.75" />
          <rect x="60" y="40" width="80" height="26" rx="5" fill="rgb(199 165 255 / 0.1)" stroke="rgb(199 165 255 / 0.25)" strokeDasharray="3 3" />
          <rect className="sv-btn" x="60" y="74" width="38" height="14" rx="7" fill="#963CFF" />
          <rect x="104" y="74" width="36" height="14" rx="7" fill="none" stroke="rgb(199 165 255 / 0.45)" />
          <circle className="sv-click" cx="79" cy="81" r="7" />
          <g className="sv-cursor">
            <path d="M79 81 L79 96 L83 92 L87 100 L90 98.6 L86 91 L91.5 91 Z" fill="#F5F1FF" stroke="#160B2C" strokeWidth="0.8" />
          </g>
        </g>
      );
    case 'app':
      return (
        <g>
          <rect className="sv-frame" x="74" y="10" width="52" height="100" rx="10" />
          <rect x="92" y="14" width="16" height="4" rx="2" fill="rgb(199 165 255 / 0.3)" />
          {Array.from({ length: 9 }, (_, i) => (
            <rect
              key={i}
              className="sv-tile"
              x={82 + (i % 3) * 13}
              y={28 + Math.floor(i / 3) * 13}
              width="10"
              height="10"
              rx="3"
              fill={['#963CFF', '#6726C9', '#C7A5FF'][(i + Math.floor(i / 3)) % 3]}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
          <rect x="82" y="92" width="36" height="10" rx="5" fill="rgb(199 165 255 / 0.14)" />
          <g className="sv-notify">
            <circle cx="124" cy="14" r="6" fill="#963CFF" />
          </g>
          <path className="sv-star" d={SPARK} transform="translate(150 40) scale(0.8)" fill="#F5F1FF" />
          <path className="sv-star" d={SPARK} transform="translate(52 78) scale(0.55)" fill="#C7A5FF" style={{ animationDelay: '1s' }} />
        </g>
      );
    case 'software':
    default:
      return (
        <g>
          <rect className="sv-frame" x="36" y="16" width="128" height="88" rx="9" />
          <path className="sv-frame" d="M36 30 H164" />
          <circle cx="45" cy="23" r="2.2" fill="#963CFF" />
          <circle cx="52" cy="23" r="2.2" fill="#6726C9" />
          <circle cx="59" cy="23" r="2.2" fill="#C7A5FF" />
          {[
            [46, 40, 42, '#963CFF'],
            [56, 50, 56, '#C7A5FF'],
            [56, 60, 34, '#F5F1FF'],
            [66, 70, 48, '#C7A5FF'],
            [56, 80, 26, '#963CFF'],
            [46, 90, 18, '#C7A5FF'],
          ].map(([x, y, w, c], i) => (
            <rect
              key={i}
              className="sv-type"
              x={x as number}
              y={y as number}
              width={w as number}
              height="4"
              rx="2"
              fill={c as string}
              fillOpacity="0.75"
              style={{ animationDelay: `${i * 0.25}s` }}
            />
          ))}
          <rect className="sv-caret" x="70" y="88" width="2" height="8" fill="#F5F1FF" />
          <path className="sv-code" d="M128 62 L118 72 L128 82 M144 62 L154 72 L144 82 M139 58 L133 86" stroke={line} />
        </g>
      );
  }
}
