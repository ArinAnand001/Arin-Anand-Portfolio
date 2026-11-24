import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { experimentEntries, playgroundModes, type PlaygroundMode } from '../../data/experiments';
import { useInView } from '../../hooks/useInView';
import { useReveal } from '../../hooks/useReveal';
import { getDeviceProfile } from '../../lib/device';
import { useMotion } from '../../lib/motion';
import { addTick } from '../../lib/ticker';
import { cn, isFilled } from '../../lib/utils';
import { Icon } from '../shared/Icon';
import { SplitText } from '../shared/SplitText';
import { PlaygroundEngine } from './playgroundEngine';
import './experiments.css';

export function Experiments() {
  const { reduced, finePointer } = useMotion();
  const [mode, setMode] = useState<PlaygroundMode>('gravity');
  const [failed, setFailed] = useState(false);
  const portal = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<PlaygroundEngine | null>(null);
  const inView = useInView(portal, '80px 0px');
  const inViewRef = useRef(inView);
  inViewRef.current = inView;
  const kicker = useReveal<HTMLParagraphElement>();
  const lede = useReveal<HTMLParagraphElement>();
  const portalReveal = useReveal<HTMLDivElement>();
  const listReveal = useReveal<HTMLUListElement>();

  useEffect(() => {
    const el = portal.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const profile = getDeviceProfile();
    let eng: PlaygroundEngine;
    try {
      eng = new PlaygroundEngine(cv, Math.min(profile.dpr, 1.5), profile.tier === 'high' ? 900 : profile.tier === 'mid' ? 600 : 360);
    } catch {
      setFailed(true);
      return;
    }
    engine.current = eng;
    const resize = () => {
      const r = el.getBoundingClientRect();
      eng.resize(r.width, r.height);
      if (reduced) eng.still();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const stop = reduced
      ? () => undefined
      : addTick((_now, dt) => {
          if (inViewRef.current) eng.step(dt);
        });
    return () => {
      stop();
      ro.disconnect();
      engine.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    const eng = engine.current;
    if (!eng) return;
    eng.setMode(mode);
    if (reduced) eng.still();
  }, [mode, reduced]);

  const local = (e: PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top] as const;
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>, down: boolean) => {
    if (e.key !== ' ' && e.key !== 'Enter') return;
    e.preventDefault();
    const eng = engine.current;
    if (!eng) return;
    if (mode === 'warp') {
      eng.hold(down);
    } else if (down && !e.repeat) {
      eng.trigger();
    }
    if (reduced && down) eng.still();
  };

  const info = playgroundModes.find((m) => m.id === mode) ?? playgroundModes[0];

  return (
    <section id="experiments" className="section experiments" aria-labelledby="experiments-title">
      <div className="container">
        <header className="section-head">
          <p className="kicker" data-reveal ref={kicker}>
            Creative experiments
          </p>
          <SplitText as="h2" id="experiments-title" className="heading" text="A small universe to play in" mode="words" />
          <p className="lede" data-reveal ref={lede}>
            Where new ideas get tested before they become client work. Pick an experiment, then move, click or tap
            inside the frame.
          </p>
        </header>

        <div className="lab" data-reveal="scale" ref={portalReveal}>
          <div className="lab__tabs" role="tablist" aria-label="Experiments">
            {playgroundModes.map((m) => (
              <button
                key={m.id}
                type="button"
                role="tab"
                id={`lab-tab-${m.id}`}
                aria-selected={mode === m.id}
                aria-controls="lab-panel"
                className={cn('lab__tab', mode === m.id && 'is-active')}
                onClick={() => setMode(m.id)}
              >
                {m.title}
              </button>
            ))}
          </div>

          <div
            id="lab-panel"
            role="tabpanel"
            aria-labelledby={`lab-tab-${mode}`}
            tabIndex={0}
            className={cn('lab__portal', `lab__portal--${mode}`)}
            ref={portal}
            data-cursor={mode === 'warp' ? 'Hold' : 'Play'}
            onPointerMove={(e) => engine.current?.pointerMove(...local(e))}
            onPointerDown={(e) => {
              engine.current?.pointerDown(...local(e));
              if (reduced) engine.current?.still();
            }}
            onPointerUp={() => engine.current?.pointerUp()}
            onPointerLeave={() => engine.current?.pointerLeave()}
            onPointerCancel={() => engine.current?.pointerLeave()}
            onKeyDown={(e) => onKey(e, true)}
            onKeyUp={(e) => onKey(e, false)}
          >
            <canvas ref={canvas} className="lab__canvas" aria-hidden="true" />
            {failed && <p className="lab__fallback">This experiment needs a browser with canvas support.</p>}
            <div className="lab__hud" aria-hidden="true">
              <span className="lab__hud-mode">{info.title}</span>
              <span className="lab__hud-hint">{finePointer ? info.hint : info.touchHint}</span>
            </div>
            <span className="sr-only" aria-live="polite">
              {info.title}. {finePointer ? info.hint : info.touchHint} With a keyboard, focus this area and press Space.
            </span>
          </div>

          <div className="lab__controls">
            <button type="button" className="lab__reset" onClick={() => engine.current?.reset()}>
              <Icon name="sparkle" size={15} />
              Reset
            </button>
          </div>
        </div>

        <ul className="lab__entries" role="list" ref={listReveal} data-reveal="fade">
          {experimentEntries.map((x, i) => {
            const content = (
              <>
                <span className="lab__entry-kind">{x.kind}</span>
                <span className="lab__entry-title">{x.title}</span>
                <span className="lab__entry-desc">{x.description}</span>
              </>
            );
            return (
              <li key={x.title} className="lab__entry" style={{ '--i': i } as CSSProperties}>
                {isFilled(x.href) ? (
                  <a href={x.href} target="_blank" rel="noopener noreferrer" className="lab__entry-inner">
                    {content}
                  </a>
                ) : (
                  <div className="lab__entry-inner is-soon">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
