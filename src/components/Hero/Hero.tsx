import { useRef, type MouseEvent } from 'react';
import { SplitText } from '../shared/SplitText';
import { Button } from '../shared/Button';
import { useScrollProgress } from '../../hooks/useReveal';
import { useMotion } from '../../lib/motion';
import { scrollToTarget } from '../../lib/scroll';
import { cn } from '../../lib/utils';
import './hero.css';

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
