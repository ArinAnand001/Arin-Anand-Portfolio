import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { nav, sectionToNav, site, telHref } from '../../data/site';
import { visibleSocials } from '../../data/social';
import { useActiveSection } from '../../hooks/useActiveSection';
import { useMotion } from '../../lib/motion';
import { lockScroll, onScroll, scrollToTarget } from '../../lib/scroll';
import { cn, isFilled } from '../../lib/utils';
import { Button } from '../shared/Button';
import { Icon } from '../shared/Icon';
import './navbar.css';

const SECTION_IDS = Object.keys(sectionToNav);

export function Navbar({ ready }: { ready: boolean }) {
  const { reduced } = useMotion();
  const activeSection = useActiveSection(SECTION_IDS);
  const active = sectionToNav[activeSection] ?? 'home';
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const linksRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Glass background once scrolled; tuck away while scrolling down, return on scroll up.
  useEffect(() => {
    let last = window.scrollY;
    const update = (y: number) => {
      setScrolled(y > 24);
      const delta = y - last;
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > window.innerHeight * 0.9);
        last = y;
      }
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressRef.current?.style.setProperty('transform', `scaleX(${(y / max).toFixed(4)})`);
    };
    update(window.scrollY);
    return onScroll(update);
  }, []);

  // Slide the indicator under the active link.
  const measure = useCallback(() => {
    const list = linksRef.current;
    const link = list?.querySelector<HTMLElement>(`[data-nav="${active}"]`);
    if (!list || !link) return;
    const l = list.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    if (!l.width) return;
    setPill({ x: r.left - l.left, w: r.width });
  }, [active]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    document.fonts?.ready.then(measure).catch(() => undefined);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Mobile menu: lock scroll, close on Escape, keep focus inside.
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    const panel = menuRef.current;
    const focusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    window.setTimeout(() => focusables()[0]?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        menuBtn.current?.focus();
      }
      if (e.key === 'Tab') {
        const items = [menuBtn.current, ...focusables()].filter(Boolean) as HTMLElement[];
        const first = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lockScroll(false);
    };
  }, [open]);

  useEffect(() => {
    const close = () => window.innerWidth > 980 && setOpen(false);
    window.addEventListener('resize', close);
    return () => window.removeEventListener('resize', close);
  }, []);

  const go = (id: string) => (e: MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const wasOpen = open;
    setOpen(false);
    window.setTimeout(() => scrollToTarget(`#${id}`, { reduced }), wasOpen ? 320 : 0);
  };

  return (
    <>
    <header className={cn('nav', scrolled && 'nav--scrolled', hidden && !open && 'nav--hidden', ready && 'is-ready', open && 'nav--open')}>
      <div className="nav__bar container">
        <a href="#home" className="nav__brand" onClick={go('home')} aria-label={`${site.name}, back to top`}>
          <span className="nav__wordmark">{site.name}</span>
        </a>

        <nav className="nav__primary" aria-label="Main">
          <ul className="nav__links" ref={linksRef} role="list">
            {pill && (
              <li
                className="nav__pill"
                aria-hidden="true"
                style={{ '--x': `${pill.x}px`, '--w': `${pill.w}px` } as CSSProperties}
              />
            )}
            {nav.map((item, i) => (
              <li key={item.id} style={{ '--i': i } as CSSProperties}>
                <a
                  href={`#${item.id}`}
                  data-nav={item.id}
                  className={cn('nav__link', active === item.id && 'is-active')}
                  aria-current={active === item.id ? 'location' : undefined}
                  onClick={go(item.id)}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav__actions">
          <Button href="#services" variant="ghost" size="sm" className="nav__explore" onClick={go('services')}>
            Explore My Work
          </Button>
          <Button href="#contact" size="sm" onClick={go('contact')}>
            Let's Talk
          </Button>
          <button
            ref={menuBtn}
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <span className="nav__toggle-lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
      <span className="nav__progress" ref={progressRef} aria-hidden="true" />
    </header>

      <div
        id="mobile-menu"
        ref={menuRef}
        className="menu"
        hidden={!open}
        aria-label="Menu"
        role="dialog"
        aria-modal="true"
      >
        <div className="menu__orbit" aria-hidden="true" />
        <nav aria-label="Mobile">
          <ul className="menu__links" role="list">
            {nav.map((item, i) => (
              <li key={item.id} style={{ '--i': i } as CSSProperties}>
                <a
                  href={`#${item.id}`}
                  className={cn('menu__link', active === item.id && 'is-active')}
                  onClick={go(item.id)}
                >
                  <span className="menu__index" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="menu__footer">
          <div className="menu__ctas">
            <Button href="#services" variant="ghost" onClick={go('services')} magnetic={false}>
              Explore My Work
            </Button>
            <Button href="#contact" onClick={go('contact')} magnetic={false}>
              Let's Talk
            </Button>
          </div>
          <ul className="menu__social" role="list">
            {isFilled(site.contact.email) && (
              <li>
                <a href={`mailto:${site.contact.email}`}>
                  <Icon name="mail" size={18} /> {site.contact.email}
                </a>
              </li>
            )}
            {isFilled(site.contact.phone) && (
              <li>
                <a href={telHref(site.contact.phone)}>
                  <Icon name="phone" size={18} /> {site.contact.phone}
                </a>
              </li>
            )}
            {visibleSocials.map((s) => (
              <li key={s.label}>
                {isFilled(s.href) ? (
                  <a href={s.href} target="_blank" rel="noopener noreferrer">
                    <Icon name={s.icon} size={18} /> {s.handle ?? s.label}
                  </a>
                ) : (
                  <span>
                    <Icon name={s.icon} size={18} /> {s.handle ?? s.label}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
