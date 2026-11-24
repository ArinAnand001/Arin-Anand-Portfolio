import { useCallback, useEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { services, type Service } from '../../data/services';
import { useReveal } from '../../hooks/useReveal';
import { useTilt } from '../../hooks/useTilt';
import { useMotion } from '../../lib/motion';
import { scrollToTarget } from '../../lib/scroll';
import { Icon } from '../shared/Icon';
import { SplitText } from '../shared/SplitText';
import { ServiceVisual } from './ServiceVisual';
import { SkillDialog } from './SkillDialog';
import './services.css';
import './skill-dialog.css';

const PREFIX = '#skill-';

function idFromHash() {
  const h = window.location.hash;
  if (!h.startsWith(PREFIX)) return null;
  const id = decodeURIComponent(h.slice(PREFIX.length));
  return services.some((s) => s.id === id) ? id : null;
}

export function Services() {
  const { reduced } = useMotion();
  const lede = useReveal<HTMLParagraphElement>();
  const kicker = useReveal<HTMLParagraphElement>();
  const [openId, setOpenId] = useState<string | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pushed = useRef(false);

  const active = services.find((s) => s.id === openId) ?? null;
  const index = active ? services.indexOf(active) : -1;

  // Shareable links (#skill-<id>) and the browser back button
  useEffect(() => {
    const sync = () => {
      const id = idFromHash();
      setOpenId(id);
      if (!id) pushed.current = false;
    };
    const initial = idFromHash();
    if (initial) {
      setOpenId(initial);
      window.setTimeout(() => scrollToTarget('#services', { reduced: true, focus: false }), 50);
    }
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  const open = useCallback((id: string, trigger?: HTMLElement) => {
    if (trigger) triggerRef.current = trigger;
    try {
      if (!pushed.current) {
        window.history.pushState({ skill: id }, '', `${PREFIX}${id}`);
        pushed.current = true;
      } else {
        window.history.replaceState({ skill: id }, '', `${PREFIX}${id}`);
      }
    } catch {
      /* history unavailable in some embedded viewers - the dialog still opens */
    }
    setOpenId(id);
  }, []);

  const close = useCallback(() => {
    setOpenId(null);
    try {
      if (pushed.current) {
        pushed.current = false;
        window.history.back();
      } else if (idFromHash()) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } catch {
      /* ignore */
    }
    const t = triggerRef.current;
    window.setTimeout(() => t?.focus({ preventScroll: true }), 30);
  }, []);

  return (
    <section id="services" className="section services" aria-labelledby="services-title">
      <div className="container">
        <header className="section-head">
          <p className="kicker" data-reveal ref={kicker}>
            Skills &amp; Services
          </p>
          <SplitText as="h2" id="services-title" className="heading" text="What I can help you build" mode="words" />
          <p className="lede" data-reveal ref={lede} style={{ '--d': '0.2s' } as CSSProperties}>
            Sixteen ways I can help, from the first logo to the last line of code. Open any skill to see the work
            behind it.
          </p>
        </header>
        <ul className="services__grid" role="list">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} onOpen={open} />
          ))}
        </ul>
      </div>

      {active && (
        <SkillDialog
          service={active}
          prev={index > 0 ? services[index - 1] : null}
          next={index < services.length - 1 ? services[index + 1] : null}
          onClose={close}
          onNavigate={(id) => open(id)}
          onContact={() => window.setTimeout(() => scrollToTarget('#contact', { reduced }), 80)}
        />
      )}
    </section>
  );
}

function ServiceCard({
  service,
  index,
  onOpen,
}: {
  service: Service;
  index: number;
  onOpen: (id: string, trigger: HTMLElement) => void;
}) {
  const card = useRef<HTMLLIElement>(null);
  useTilt(card, 6);
  const reveal = useReveal<HTMLDivElement>();
  const count = service.samples.length;

  const link = useRef<HTMLAnchorElement>(null);

  const click = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    onOpen(service.id, e.currentTarget);
  };

  // Clicking anywhere on the card opens the gallery, not only the title.
  const cardClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || window.getSelection()?.toString()) return;
    if (link.current) onOpen(service.id, link.current);
  };

  return (
    <li className="svc" ref={card}>
      <div
        className="svc__inner lit-border"
        data-reveal
        ref={reveal}
        style={{ '--i': index % 4 } as CSSProperties}
        onClick={cardClick}
      >
        <span className="svc__glow" aria-hidden="true" />
        <div className="svc__visual">
          <ServiceVisual kind={service.visual} />
        </div>
        <h3 className="svc__title">
          {/* The link's hit area stretches over the whole card (see .svc__link::after) */}
          <a ref={link} className="svc__link" href={`#skill-${service.id}`} onClick={click} data-cursor="View work">
            {service.title}
          </a>
        </h3>
        <p className="svc__desc">{service.description}</p>
        <ul className="svc__list" role="list" aria-label={`${service.title} includes`}>
          {service.deliverables.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <span className="svc__cta" aria-hidden="true">
          {count > 0 ? `View ${count} ${count === 1 ? 'sample' : 'samples'}` : 'View work'}
          <Icon name="arrow" size={14} />
        </span>
      </div>
    </li>
  );
}
