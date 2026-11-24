import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { process as steps } from '../../data/process';
import { useReveal } from '../../hooks/useReveal';
import { useMedia, useMotion } from '../../lib/motion';
import { trackProgress } from '../../lib/scrollProgress';
import { cn } from '../../lib/utils';
import { SplitText } from '../shared/SplitText';
import './process.css';

const STEP_W = 380;
const WAVE = [0, -46, 22, -36, 30, -20, 12, -30];

/** Smooth curve through the node centres (Catmull-Rom converted to cubic Béziers). */
function pathThrough(points: Array<[number, number]>) {
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export function Process() {
  const { reduced } = useMotion();
  const wide = useMedia('(min-width: 900px)');
  const pinned = wide && !reduced;
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(pinned ? -1 : steps.length - 1);
  const [height, setHeight] = useState<number | null>(null);
  const kicker = useReveal<HTMLParagraphElement>();
  const lede = useReveal<HTMLParagraphElement>();

  const width = STEP_W * steps.length + 200;
  const points = steps.map((_, i) => [100 + STEP_W * i + STEP_W / 2, 120 + WAVE[i % WAVE.length]] as [number, number]);
  const startPoint: [number, number] = [0, 150];
  const endPoint: [number, number] = [width, 110];
  const d = pathThrough([startPoint, ...points, endPoint]);

  // Pinned horizontal journey: the section is as tall as the track is wide.
  useEffect(() => {
    const el = section.current;
    const tr = track.current;
    if (!el || !tr) return;
    if (!pinned) {
      setHeight(null);
      tr.style.transform = '';
      return;
    }
    let overflow = 0;
    const size = () => {
      overflow = Math.max(0, width - window.innerWidth + 160);
      setHeight(window.innerHeight + overflow);
    };
    size();
    window.addEventListener('resize', size);
    const stop = trackProgress(el, {
      from: 0,
      to: 1,
      onUpdate: (p) => {
        tr.style.transform = `translate3d(${(-p * overflow).toFixed(1)}px, 0, 0)`;
        // The path is "drawn" up to the middle of the screen.
        const drawn = p * overflow + window.innerWidth * 0.55 - 80;
        el.style.setProperty('--draw', Math.min(1, Math.max(0, drawn / width)).toFixed(4));
        let idx = -1;
        points.forEach(([x], i) => {
          if (x <= drawn) idx = i;
        });
        setActive(idx);
      },
    });
    return () => {
      stop();
      window.removeEventListener('resize', size);
    };
    // `points` derive from constants, so `width` captures every change.
  }, [pinned, width]);

  // Stacked layout: light each step as it scrolls into view.
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = list.current;
    if (!el || pinned) return;
    if (reduced) {
      el.style.setProperty('--draw', '1');
      return;
    }
    return trackProgress(el, {
      from: 0.75,
      to: 0.6,
      onUpdate: (p) => {
        el.style.setProperty('--draw', p.toFixed(4));
        setActive(Math.min(steps.length - 1, Math.floor(p * steps.length * 1.05) - 0));
      },
    });
  }, [pinned, reduced]);

  return (
    <section
      id="process"
      ref={section}
      className={cn('process', pinned ? 'process--pinned' : 'process--stacked')}
      style={height ? ({ height: `${height}px` } as CSSProperties) : undefined}
      aria-labelledby="process-title"
    >
      <div className="process__sticky">
        <div className="container process__head">
          <p className="kicker" data-reveal ref={kicker}>
            How I work
          </p>
          <SplitText as="h2" id="process-title" className="heading" text="From first question to final result" mode="words" />
          <p className="lede" data-reveal ref={lede}>
            Six stages, one connected path. Each step feeds the next, and the last one loops back to the first.
          </p>
        </div>

        <div className="process__viewport" ref={list}>
          <div
            ref={track}
            className="process__track"
            style={{ '--track-w': `${width}px`, '--steps': steps.length } as CSSProperties}
          >
            <svg className="process__path" viewBox={`0 0 ${width} 240`} width={width} height={240} aria-hidden="true">
              <defs>
                <linearGradient id="process-grad" x1="0" x2="1">
                  <stop offset="0" stopColor="#6726C9" />
                  <stop offset="0.5" stopColor="#963CFF" />
                  <stop offset="1" stopColor="#C7A5FF" />
                </linearGradient>
              </defs>
              <path d={d} className="process__path-base" />
              <path d={d} className="process__path-glow" pathLength={1} />
              <path d={d} className="process__path-line" pathLength={1} />
            </svg>
            <ol className="process__steps" role="list">
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={cn('process__step', i <= active && 'is-active', i === active && 'is-current')}
                style={{ '--x': `${points[i][0]}px`, '--y': `${points[i][1]}px`, '--i': i } as CSSProperties}
              >
                <span className="process__node" aria-hidden="true">
                  <span className="process__node-core" />
                  <span className="process__node-ring" />
                </span>
                <div className="process__card">
                  <span className="process__num">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="process__title">{step.title}</h3>
                  <p className="process__desc">{step.description}</p>
                </div>
              </li>
            ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
