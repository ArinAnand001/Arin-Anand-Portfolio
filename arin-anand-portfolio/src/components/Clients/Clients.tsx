import { useRef, useState, type CSSProperties } from 'react';
import { clients, companiesCount, companiesLabel, type ClientLogo } from '../../data/clients';
import { useReveal } from '../../hooks/useReveal';
import { useMotion } from '../../lib/motion';
import { asset, cn, isFilled } from '../../lib/utils';
import { SplitText } from '../shared/SplitText';
import './clients.css';

/** Counts up to `to` once the number scrolls into view. */
function Counter({ to }: { to: number }) {
  const { reduced } = useMotion();
  const [value, setValue] = useState(reduced ? to : 0);
  const started = useRef(false);
  const ref = useReveal<HTMLSpanElement>(() => {
    if (started.current || reduced) return;
    started.current = true;
    const start = performance.now();
    const duration = 1800;
    const frame = (now: number) => {
      const k = Math.min(1, (now - start) / duration);
      setValue(Math.round(to * (1 - Math.pow(1 - k, 4))));
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  return (
    <span ref={ref} className="clients__number" aria-hidden="true">
      {value}
    </span>
  );
}

function Logo({ client }: { client: ClientLogo }) {
  const [failed, setFailed] = useState(false);
  const inner =
    client.logo && !failed ? (
      <img
        src={asset(client.logo)}
        alt={client.name}
        loading="lazy"
        decoding="async"
        className={cn('clients__img', client.keepColors && 'is-color')}
        onError={() => setFailed(true)}
      />
    ) : (
      <span className="clients__wordmark">{client.name}</span>
    );
  return client.href && isFilled(client.href) ? (
    <a className="clients__tile" href={client.href} target="_blank" rel="noopener noreferrer" title={client.name}>
      {inner}
    </a>
  ) : (
    <div className="clients__tile" title={client.name}>
      {inner}
    </div>
  );
}

export function Clients() {
  const kicker = useReveal<HTMLParagraphElement>();
  const stat = useReveal<HTMLDivElement>();
  const wall = useReveal<HTMLDivElement>();
  const total = companiesCount > 0 ? companiesCount : clients.length;
  const plus = companiesCount > 0 && companiesCount > clients.length;
  const marquee = clients.length >= 6;
  const rows = marquee ? [clients.filter((_, i) => i % 2 === 0), clients.filter((_, i) => i % 2 === 1)] : [clients];

  return (
    <section id="clients" className="section clients" aria-labelledby="clients-title">
      <div className="container">
        <div className="clients__head">
          <div className="section-head">
            <p className="kicker" data-reveal ref={kicker}>
              Clients
            </p>
            <SplitText as="h2" id="clients-title" className="heading" text="Companies I've worked with" mode="words" />
          </div>

          <div className="clients__stat" data-reveal ref={stat}>
            {total > 0 ? (
              <>
                <p className="sr-only">
                  {total}
                  {plus ? '+' : ''} {companiesLabel}
                </p>
                {/* Kept separate from the screen-reader text: a gradient clipped to text would paint that too */}
                <p className="clients__count" aria-hidden="true">
                  <Counter to={total} />
                  {plus && <span className="clients__plus">+</span>}
                </p>
                <p className="clients__label" aria-hidden="true">
                  {companiesLabel}
                </p>
              </>
            ) : (
              <p className="clients__label">Company logos are being added.</p>
            )}
          </div>
        </div>
      </div>

      <div className="clients__wall" data-reveal="fade" ref={wall}>
        {clients.length === 0 ? (
          <div className="container clients__grid clients__grid--empty" aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="clients__tile clients__tile--empty" style={{ '--i': i } as CSSProperties}>
                <span className="clients__orbit" />
                <span className="clients__empty-label">Logo</span>
              </div>
            ))}
          </div>
        ) : marquee ? (
          rows.map((row, r) => (
            <div key={r} className={cn('clients__marquee', r === 1 && 'clients__marquee--rev')}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="clients__track" role="list" aria-hidden={copy === 1 || undefined}>
                  {row.map((c) => (
                    <li key={c.name}>
                      <Logo client={c} />
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          ))
        ) : (
          <ul className="container clients__grid" role="list">
            {clients.map((c, i) => (
              <li key={c.name} style={{ '--i': i } as CSSProperties}>
                <Logo client={c} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
