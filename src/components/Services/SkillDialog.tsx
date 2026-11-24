import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Service, WorkSample } from '../../data/services';
import { lockScroll } from '../../lib/scroll';
import { asset, cn, isFilled } from '../../lib/utils';
import { Icon } from '../shared/Icon';
import { ServiceVisual } from './ServiceVisual';

interface SkillDialogProps {
  service: Service;
  prev: Service | null;
  next: Service | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
  onContact: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

/** Keeps Tab inside `root` while a dialog is open. */
function trapTab(e: KeyboardEvent, root: HTMLElement | null) {
  if (e.key !== 'Tab' || !root) return;
  const items = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Full-screen gallery for one skill: what it covers, then every creative for it.
 * Images open in a viewer with previous/next; Escape closes the viewer, then the dialog.
 */
export function SkillDialog({ service, prev, next, onClose, onNavigate, onContact }: SkillDialogProps) {
  const dialog = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const [viewer, setViewer] = useState<number | null>(null);
  const titleId = `skill-title-${service.id}`;
  const images = service.samples
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.type === 'image');

  useEffect(() => {
    lockScroll(true);
    return () => lockScroll(false);
  }, []);

  useEffect(() => {
    setViewer(null);
    sheet.current?.scrollTo({ top: 0 });
    closeBtn.current?.focus({ preventScroll: true });
  }, [service.id]);

  const requestClose = (after?: () => void) => {
    setClosing(true);
    window.setTimeout(() => {
      onClose();
      after?.();
    }, 420);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer !== null) return; // the viewer handles its own keys
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      trapTab(e, dialog.current);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // requestClose only uses a state setter and onClose
  }, [onClose, viewer]);

  return (
    <div
      className={cn('sd', closing && 'is-closing')}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={dialog}
    >
      <div className="sd__backdrop" onClick={() => requestClose()} aria-hidden="true" />
      <div className="sd__sheet" ref={sheet} data-native-scroll>
        <div className="sd__bar">
          <span className="sd__crumb">Skills &amp; Services</span>
          <button ref={closeBtn} type="button" className="sd__close" onClick={() => requestClose()}>
            <span className="sr-only">Close</span>
            <Icon name="close" size={20} />
          </button>
        </div>

        <header className="sd__head" key={service.id}>
          <div className="sd__visual" aria-hidden="true">
            <ServiceVisual kind={service.visual} />
          </div>
          <div className="sd__intro">
            <h2 className="sd__title" id={titleId}>
              {service.title}
            </h2>
            <p className="sd__desc">{service.description}</p>
            <ul className="sd__chips" role="list" aria-label="What this includes">
              {service.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </header>

        <section className="sd__work" aria-label={`${service.title} work samples`} key={`w-${service.id}`}>
          {service.samples.length > 0 ? (
            <>
              <p className="sd__count">
                {service.samples.length} {service.samples.length === 1 ? 'piece of work' : 'pieces of work'}
              </p>
              <div className="sd__grid">
                {service.samples.map((s, i) => (
                  <Sample
                    key={`${s.src}-${i}`}
                    sample={s}
                    index={i}
                    onOpen={() => setViewer(images.findIndex((x) => x.i === i))}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="sd__empty">
              <div className="sd__empty-frames" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p className="sd__empty-title">Work samples are on their way</p>
              <p className="sd__empty-text">
                Creatives for {service.title.toLowerCase()} will be added here soon. In the meantime, I&rsquo;m happy to
                share relevant work directly.
              </p>
            </div>
          )}
        </section>

        <div className="sd__cta">
          <p>Want something like this for your brand?</p>
          <button type="button" className="btn btn--primary" onClick={() => requestClose(onContact)}>
            <span className="btn__label">
              Let&rsquo;s talk
              <Icon name="arrow" size={16} className="btn__icon" />
            </span>
          </button>
        </div>

        <nav className="sd__nav" aria-label="More skills">
          {prev ? (
            <button type="button" className="sd__nav-btn" onClick={() => onNavigate(prev.id)}>
              <span className="sd__nav-dir">Previous</span>
              <span className="sd__nav-title">{prev.title}</span>
            </button>
          ) : (
            <span />
          )}
          {next && (
            <button type="button" className="sd__nav-btn sd__nav-btn--next" onClick={() => onNavigate(next.id)}>
              <span className="sd__nav-dir">Next</span>
              <span className="sd__nav-title">{next.title}</span>
            </button>
          )}
        </nav>
      </div>

      {viewer !== null && images[viewer] && (
        <Viewer
          items={images.map((x) => x.s)}
          index={viewer}
          onIndex={setViewer}
          onClose={(returnTo) => {
            setViewer(null);
            window.setTimeout(() => {
              dialog.current
                ?.querySelector<HTMLElement>(`[data-sample="${images[returnTo]?.i ?? 0}"]`)
                ?.focus({ preventScroll: true });
            }, 20);
          }}
        />
      )}
    </div>
  );
}

function Sample({ sample, index, onOpen }: { sample: WorkSample; index: number; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const label = sample.title || sample.alt;

  return (
    <figure className="sd__item" style={{ '--i': index } as CSSProperties}>
      {failed ? (
        <div className="sd__missing">Couldn&rsquo;t load {sample.src}</div>
      ) : sample.type === 'video' ? (
        <video
          className="sd__media"
          controls
          playsInline
          preload="none"
          poster={sample.poster ? asset(sample.poster) : undefined}
          aria-label={sample.alt}
          onError={() => setFailed(true)}
        >
          <source src={asset(sample.src)} />
        </video>
      ) : (
        <button
          type="button"
          className={cn('sd__thumb', loaded && 'is-loaded')}
          onClick={onOpen}
          data-sample={index}
          data-cursor="View"
          aria-label={`View larger: ${label}`}
        >
          <img
            className="sd__media"
            src={asset(sample.src)}
            alt={sample.alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </button>
      )}
      {(sample.title || sample.caption || sample.href) && (
        <figcaption className="sd__caption">
          {sample.title && <span className="sd__caption-title">{sample.title}</span>}
          {sample.caption && <span className="sd__caption-text">{sample.caption}</span>}
          {sample.href && isFilled(sample.href) && (
            <a className="sd__caption-link" href={sample.href} target="_blank" rel="noopener noreferrer">
              View project <Icon name="external" size={13} />
            </a>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function Viewer({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: WorkSample[];
  index: number;
  onIndex: (i: number) => void;
  onClose: (returnTo: number) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const item = items[index];
  const many = items.length > 1;
  const go = (d: number) => onIndex((index + d + items.length) % items.length);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(index);
      } else if (e.key === 'ArrowRight' && many) {
        go(1);
      } else if (e.key === 'ArrowLeft' && many) {
        go(-1);
      } else {
        trapTab(e, root.current);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div className="lightbox" ref={root} role="dialog" aria-modal="true" aria-label={item.title || item.alt}>
      <div className="lightbox__backdrop" onClick={() => onClose(index)} aria-hidden="true" />
      <figure className="lightbox__figure" key={item.src}>
        <img src={asset(item.src)} alt={item.alt} />
        {(item.title || item.caption) && (
          <figcaption>
            {item.title && <strong>{item.title}</strong>}
            {item.caption && <span>{item.caption}</span>}
          </figcaption>
        )}
      </figure>
      <button ref={closeBtn} type="button" className="lightbox__close" onClick={() => onClose(index)}>
        <span className="sr-only">Close image</span>
        <Icon name="close" size={22} />
      </button>
      {many && (
        <>
          <button type="button" className="lightbox__nav lightbox__nav--prev" onClick={() => go(-1)}>
            <span className="sr-only">Previous image</span>
            <Icon name="arrow-up" size={20} />
          </button>
          <button type="button" className="lightbox__nav lightbox__nav--next" onClick={() => go(1)}>
            <span className="sr-only">Next image</span>
            <Icon name="arrow-up" size={20} />
          </button>
          <p className="lightbox__count" aria-live="polite">
            {index + 1} / {items.length}
          </p>
        </>
      )}
    </div>
  );
}
