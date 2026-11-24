import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { nav, site, telHref } from '../../data/site';
import { visibleSocials } from '../../data/social';
import { useMotion } from '../../lib/motion';
import { onScroll, scrollToTarget } from '../../lib/scroll';
import { Icon } from '../shared/Icon';
import { SplitText } from '../shared/SplitText';
import { useReveal } from '../../hooks/useReveal';
import { useTilt } from '../../hooks/useTilt';
import { asset, cn, isFilled } from '../../lib/utils';
import './footer.css';

const RING = 2 * Math.PI * 27;

export function Footer() {
  const { reduced, setChoice } = useMotion();
  const ring = useRef<SVGCircleElement>(null);
  const year = new Date().getFullYear();

  // The back-to-top button doubles as a scroll progress ring.
  useEffect(() => {
    const update = (y: number) => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      ring.current?.style.setProperty('stroke-dashoffset', String(RING * (1 - y / max)));
    };
    update(window.scrollY);
    return onScroll(update);
  }, []);

  const go = (id: string) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    scrollToTarget(`#${id}`, { reduced });
  };

  return (
    <footer className="footer">
      <div className="container">
        <a href="#home" className="footer__word" onClick={go('home')} aria-label={`${site.name}, back to top`}>
          <span aria-hidden="true">{site.name}</span>
        </a>

        <FooterFeature />

        <div className="footer__grid">
          <div className="footer__about">
            <p>{site.shortBio}</p>
          </div>

          <nav className="footer__col" aria-label="Footer">
            <h2 className="footer__heading">Navigate</h2>
            <ul role="list">
              {nav.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.id}`} onClick={go(item.id)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="footer__col">
            <h2 className="footer__heading">Connect</h2>
            <ul role="list">
              {isFilled(site.contact.email) && (
                <li>
                  <a href={`mailto:${site.contact.email}`}>
                    <Icon name="mail" size={16} /> {site.contact.email}
                  </a>
                </li>
              )}
              {isFilled(site.contact.phone) && (
                <li>
                  <a href={telHref(site.contact.phone)}>
                    <Icon name="phone" size={16} /> {site.contact.phone}
                  </a>
                </li>
              )}
              {visibleSocials.map((s) => (
                <li key={s.label}>
                  {isFilled(s.href) ? (
                    <a href={s.href} target="_blank" rel="noopener noreferrer">
                      <Icon name={s.icon} size={16} /> {s.handle ? `${s.label} - ${s.handle}` : s.label}
                    </a>
                  ) : (
                    <span>
                      <Icon name={s.icon} size={16} /> {s.label} - {s.handle}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__top">
            <button type="button" className="footer__totop" onClick={go('home')}>
              <svg viewBox="0 0 60 60" className="footer__ring-svg" aria-hidden="true">
                <circle cx="30" cy="30" r="27" className="footer__ring-base" />
                <circle
                  ref={ring}
                  cx="30"
                  cy="30"
                  r="27"
                  className="footer__ring"
                  strokeDasharray={RING}
                  strokeDashoffset={RING}
                />
              </svg>
              <Icon name="arrow-up" size={18} className="footer__totop-icon" />
              <span className="sr-only">Back to top</span>
            </button>
            <span className="footer__totop-label" aria-hidden="true">
              Back to top
            </span>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <button
            type="button"
            className="footer__motion"
            aria-pressed={reduced}
            onClick={() => setChoice(reduced ? 'full' : 'reduced')}
          >
            <span className="footer__motion-dot" aria-hidden="true" />
            {reduced ? 'Reduced motion is on' : 'Reduce motion'}
          </button>
        </div>
      </div>
    </footer>
  );
}

function FooterFeature() {
  const { photo, tagline } = site.footer;
  const figure = useRef<HTMLElement>(null);
  const reveal = useReveal<HTMLDivElement>();
  const [loaded, setLoaded] = useState(false);
  useTilt(figure, 6);
  return (
    <div className="footer__feature" ref={reveal}>
      <div className="footer__photo-wrap">
        <span className="footer__photo-ring" aria-hidden="true" />
        <figure ref={figure} className={cn('footer__photo', loaded && 'is-loaded')}>
          <img
            src={asset(photo.src)}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        </figure>
      </div>
      <SplitText as="p" className="footer__tagline" text={tagline} mode="words" stagger={70} gradient />
    </div>
  );
}
