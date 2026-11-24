import { useRef, useState, type CSSProperties } from 'react';
import { about, type AboutPhoto } from '../../data/about';
import { useReveal, useScrollProgress } from '../../hooks/useReveal';
import { useTilt } from '../../hooks/useTilt';
import { asset, cn } from '../../lib/utils';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { GalaxyCanvas } from './GalaxyCanvas';
import './about.css';

export function About() {
  const statementRef = useRef<HTMLHeadingElement>(null);
  useScrollProgress(statementRef, { from: 0.92, to: 0.5 });
  const visualRef = useRef<HTMLDivElement>(null);
  useScrollProgress(visualRef, {}, true);
  const kicker = useReveal<HTMLParagraphElement>();
  const intro = useReveal<HTMLParagraphElement>();
  const visual = useReveal<HTMLDivElement>();
  const words = about.statement.split(' ');

  return (
    <section id="about" className="section about" aria-labelledby="about-title">
      <div className="container">
        <p className="kicker" data-reveal ref={kicker}>
          About Arin Anand
        </p>
        <h2
          id="about-title"
          ref={statementRef}
          className="about__statement"
          style={{ '--n': words.length } as CSSProperties}
        >
          <span className="sr-only">{about.statement}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span key={i} className="about__word" style={{ '--i': i } as CSSProperties}>
                {w}{' '}
              </span>
            ))}
          </span>
        </h2>

        <div className="about__grid">
          <div
            className="about__visual"
            ref={(el) => {
              visualRef.current = el;
              visual(el);
            }}
          >
            <div className="about__halo" aria-hidden="true">
              <ErrorBoundary label="galaxy">
                <GalaxyCanvas />
              </ErrorBoundary>
            </div>
            <div className="about__orbit about__orbit--1" aria-hidden="true" />
            <div className="about__orbit about__orbit--2" aria-hidden="true" />
            <Photo photo={about.photos.main} className="about__photo--main" />
            <svg className="about__spark" viewBox="-10 -10 20 20" aria-hidden="true">
              <path d="M0 -9 C 1 -3, 3 -1, 9 0 C 3 1, 1 3, 0 9 C -1 3, -3 1, -9 0 C -3 -1, -1 -3, 0 -9 Z" />
            </svg>
          </div>

          <div className="about__body">
            <p className="about__intro" data-reveal ref={intro}>
              {about.intro}
            </p>
            <Pillars />
          </div>
        </div>
      </div>

      <div className="about__roles" aria-label="Roles">
        <div className="about__marquee">
          {[0, 1].map((copy) => (
            <ul key={copy} className="about__track" role="list" aria-hidden={copy === 1 || undefined}>
              {about.roles.map((role) => (
                <li key={role}>
                  <span className="about__role">{role}</span>
                  <svg className="about__star" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2c.7 5.5 2.9 7.7 8.4 8.4v.2c-5.5.7-7.7 2.9-8.4 8.4h-.2c-.7-5.5-2.9-7.7-8.4-8.4v-.2C9 9.7 11.2 7.5 11.9 2h.2Z" />
                  </svg>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

function Photo({ photo, className }: { photo: AboutPhoto; className: string }) {
  const ref = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  useTilt(ref, 6);
  // Loaded eagerly: the reveal starts fully masked, and browsers never lazy-load an image with
  // no visible area. Both photos together are about 65 KB.
  return (
    <figure ref={ref} className={cn('about__photo', className, loaded && 'is-loaded')}>
      <img
        src={asset(photo.src)}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading="eager"
        fetchPriority="low"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
      <span className="about__photo-sheen" aria-hidden="true" />
    </figure>
  );
}

function Pillars() {
  const ref = useReveal<HTMLUListElement>();
  return (
    <ul className="about__pillars" role="list" ref={ref} data-reveal="fade">
      {about.pillars.map((p, i) => (
        <li key={p.title} className="about__pillar" style={{ '--i': i } as CSSProperties}>
          <span className="about__pillar-orb" aria-hidden="true" />
          <h3 className="about__pillar-title">{p.title}</h3>
          <p className="about__pillar-text">{p.text}</p>
        </li>
      ))}
    </ul>
  );
}
