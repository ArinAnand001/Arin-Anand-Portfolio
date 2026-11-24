import { useRef, useState, type CSSProperties } from 'react';
import { site, telHref } from '../../data/site';
import { visibleSocials } from '../../data/social';
import { useReveal, useScrollProgress } from '../../hooks/useReveal';
import { isFilled } from '../../lib/utils';
import { Icon } from '../shared/Icon';
import { SplitText } from '../shared/SplitText';
import { ContactForm } from './ContactForm';
import './contact.css';

export function Contact() {
  const section = useRef<HTMLElement>(null);
  useScrollProgress(section, { from: 1, to: 1 });
  const details = useReveal<HTMLDivElement>();
  const form = useReveal<HTMLDivElement>();
  const lede = useReveal<HTMLParagraphElement>();
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);
  const { email, phone, location, availability } = site.contact;

  const copy = async (what: 'email' | 'phone', value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2200);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section id="contact" ref={section} className="section contact" aria-labelledby="contact-title">
      <div className="contact__sky" aria-hidden="true">
        <div className="contact__galaxy" />
        <div className="contact__core" />
        <div className="contact__horizon">
          <div className="contact__planet" />
          <div className="contact__atmo" />
        </div>
        <span className="contact__comet" />
      </div>

      <div className="container contact__inner">
        <header className="contact__head">
          <SplitText
            as="h2"
            id="contact-title"
            className="contact__title"
            text={"Have an idea?\nLet's create something extraordinary."}
            mode="chars"
            stagger={18}
            gradient
          />
          <p className="lede contact__lede" data-reveal ref={lede} style={{ '--d': '0.4s' } as CSSProperties}>
            Tell me what you&rsquo;re working on - a brand, a website, a campaign or something new. I&rsquo;ll reply
            with honest thoughts and next steps.
          </p>
        </header>

        <div className="contact__grid">
          <div className="contact__details" data-reveal ref={details}>
            {isFilled(availability) && (
              <p className="contact__status">
                <span className="contact__pulse" aria-hidden="true" />
                {availability}
              </p>
            )}

            {isFilled(email) && (
              <div className="contact__line">
                <span className="contact__label">Email</span>
                <a href={`mailto:${email}`} className="contact__big-link">
                  {email}
                </a>
                <button type="button" className="contact__copy" onClick={() => copy('email', email)}>
                  {copied === 'email' ? 'Copied' : 'Copy email'}
                </button>
              </div>
            )}

            {isFilled(phone) && (
              <div className="contact__line">
                <span className="contact__label">Phone</span>
                <a href={telHref(phone)} className="contact__big-link">
                  {phone}
                </a>
                <button type="button" className="contact__copy" onClick={() => copy('phone', phone)}>
                  {copied === 'phone' ? 'Copied' : 'Copy number'}
                </button>
              </div>
            )}

            {isFilled(location) && (
              <div>
                <span className="contact__label">Based in</span>
                <p>{location}</p>
              </div>
            )}

            {visibleSocials.length > 0 && (
              <div>
                <span className="contact__label">Find me on</span>
                <ul className="contact__social" role="list">
                  {visibleSocials.map((s) => {
                    const inner = (
                      <>
                        <Icon name={s.icon} size={18} />
                        <span className="contact__social-name">{s.label}</span>
                        {s.handle && <span className="contact__handle">{s.handle}</span>}
                      </>
                    );
                    return (
                      <li key={s.label}>
                        {isFilled(s.href) ? (
                          <a href={s.href} target="_blank" rel="noopener noreferrer" className="contact__social-link">
                            {inner}
                            <Icon name="arrow" size={14} className="contact__social-arrow" />
                          </a>
                        ) : (
                          <span className="contact__social-link">{inner}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <div data-reveal ref={form} style={{ '--d': '0.15s' } as CSSProperties}>
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}
