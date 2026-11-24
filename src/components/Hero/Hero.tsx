import { useRef, type MouseEvent } from 'react';
import { SplitText } from '../shared/SplitText';
import { Button } from '../shared/Button';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useScrollProgress } from '../../hooks/useReveal';
import { useMotion } from '../../lib/motion';
import { scrollToTarget } from '../../lib/scroll';
import { cn } from '../../lib/utils';
import { PlanetCanvas } from './PlanetCanvas';
import { Ribbons } from './Ribbons';
import type { PlanetLayout } from './planetRenderer';
import './hero.css';

/** Where the planet sits for a given hero size (CSS pixels). */
function planetLayout(w: number, h: number): PlanetLayout {
  if (w < 760) return { cx: w * 0.68, cy: h * 0.24, radius: Math.min(w * 0.25, h * 0.15) };
  if (w < 1100) return { cx: w * 0.76, cy: h * 0.36, radius: Math.min(w * 0.19, h * 0.24) };
  return { cx: w * 0.75, cy: h * 0.46, radius: Math.min(w * 0.17, h * 0.29) };
}

export function Hero({ ready }: { ready: boolean }) {
  const { reduced } = useMotion();
  const section = useRef<HTMLElement>(null);
  useScrollProgress(section, { from: 0, to: 0 });

  const go = (id: string) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    scrollToTarget(`#${id}`, { reduced });
  };

  const live = ready || reduced;

  return (
    <section id="home" ref={section} className={cn('hero', live && 'is-live')} aria-labelledby="hero-title">
      <div className="hero__scene" aria-hidden="true">
        <Ribbons />
        <ErrorBoundary label="planet">
          <PlanetCanvas ready={live} layout={planetLayout} />
        </ErrorBoundary>
      </div>
      <div className="hero__scrim" aria-hidden="true" />

      <div className="hero__content container">
        <SplitText
          as="h1"
          id="hero-title"
          className="hero__title"
          text={'Turning ideas into\nextraordinary digital\nexperiences.'}
          mode="chars"
          stagger={24}
          delay={0.35}
          gradient
          active={live}
        />
        <SplitText
          as="p"
          className="hero__lede"
          text="I'm Arin Anand - a creative thinker, designer and performance marketer combining creativity, strategy and technology to build meaningful brands and digital experiences."
          mode="words"
          stagger={22}
          delay={1.25}
          fade
          active={live}
        />
        <div className="hero__ctas">
          <Button href="#services" icon="arrow" onClick={go('services')}>
            Explore My Work
          </Button>
          <Button href="#contact" variant="ghost" onClick={go('contact')}>
            Let's Talk
          </Button>
        </div>
      </div>

      <a className="hero__cue" href="#about" onClick={go('about')}>
        <span className="hero__cue-line" aria-hidden="true" />
        Scroll to explore
      </a>
    </section>
  );
}
