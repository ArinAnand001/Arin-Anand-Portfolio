import { useState, type CSSProperties } from 'react';
import { clients, type ClientLogo } from '../../data/clients';
import { useReveal } from '../../hooks/useReveal';
import { asset, cn, isFilled } from '../../lib/utils';
import { SplitText } from '../shared/SplitText';
import './clients.css';

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
  const wall = useReveal<HTMLDivElement>();
  const marquee = clients.length >= 6;

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
          <div className="clients__marquee">
            {[0, 1].map((copy) => (
              <ul key={copy} className="clients__track" role="list" aria-hidden={copy === 1 || undefined}>
                {clients.map((client) => (
                  <li key={client.name}>
                    <Logo client={client} />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        ) : (
          <ul className="container clients__grid" role="list">
            {clients.map((client, i) => (
              <li key={client.name} style={{ '--i': i } as CSSProperties}>
                <Logo client={client} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
