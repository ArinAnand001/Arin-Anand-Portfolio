import { useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { site } from '../../data/site';
import { services } from '../../data/services';
import { cn, isFilled } from '../../lib/utils';
import { Button } from '../shared/Button';

type Field = 'name' | 'email' | 'topic' | 'message';
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;
type Status = 'idle' | 'sending' | 'sent' | 'mailto' | 'error' | 'unconfigured';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'That email address doesn’t look right. Please check it.';
  if (v.message.trim().length < 20) e.message = 'Tell me a little more (at least 20 characters).';
  return e;
}

/**
 * Contact form with inline validation.
 * Sends to `site.contact.formEndpoint` when set (JSON POST), otherwise opens the
 * visitor's email app addressed to `site.contact.email`.
 */
export function ContactForm() {
  const uid = useId();
  const id = (f: string) => `${uid}-${f}`;
  const [values, setValues] = useState<Values>({ name: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const summary = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { email, formEndpoint } = site.contact;

  const update = (field: Field) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (touched[field]) setErrors(validate(next));
    if (status !== 'idle' && status !== 'sending') setStatus('idle');
  };
  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate(values));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched({ name: true, email: true, topic: true, message: true });
    const firstBad = (Object.keys(found) as Field[])[0];
    if (firstBad) {
      formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(firstBad))}`)?.focus();
      return;
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      topic: values.topic || 'General enquiry',
      message: values.message.trim(),
    };

    if (isFilled(formEndpoint)) {
      setStatus('sending');
      setServerError('');
      try {
        const res = await fetch(formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`The server answered ${res.status}.`);
        setStatus('sent');
        setValues({ name: '', email: '', topic: '', message: '' });
        setTouched({});
      } catch (err) {
        setServerError(err instanceof Error ? err.message : 'Network error.');
        setStatus('error');
      }
      window.setTimeout(() => summary.current?.focus(), 30);
      return;
    }

    if (isFilled(email)) {
      const subject = `${payload.topic} - from ${payload.name}`;
      const body = `${payload.message}\n\n${payload.name}\n${payload.email}`;
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setStatus('mailto');
    } else {
      setStatus('unconfigured');
    }
    window.setTimeout(() => summary.current?.focus(), 30);
  };

  const err = (f: Field) => (touched[f] ? errors[f] : undefined);

  return (
    <form ref={formRef} className="cform panel" onSubmit={submit} noValidate aria-describedby={id('status')}>
      <div className="cform__row">
        <div className={cn('cfield', err('name') && 'has-error')}>
          <label htmlFor={id('name')}>Your name</label>
          <div className="cfield__control">
          <input
            id={id('name')}
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={update('name')}
            onBlur={blur('name')}
            aria-invalid={!!err('name')}
            aria-describedby={err('name') ? id('name-err') : undefined}
            required
          />
          <span className="cfield__line" aria-hidden="true" />
          </div>
          {err('name') && (
            <p className="cfield__error" id={id('name-err')}>
              {err('name')}
            </p>
          )}
        </div>
        <div className={cn('cfield', err('email') && 'has-error')}>
          <label htmlFor={id('email')}>Email address</label>
          <div className="cfield__control">
          <input
            id={id('email')}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={values.email}
            onChange={update('email')}
            onBlur={blur('email')}
            aria-invalid={!!err('email')}
            aria-describedby={err('email') ? id('email-err') : undefined}
            required
          />
          <span className="cfield__line" aria-hidden="true" />
          </div>
          {err('email') && (
            <p className="cfield__error" id={id('email-err')}>
              {err('email')}
            </p>
          )}
        </div>
      </div>

      <div className="cfield">
        <label htmlFor={id('topic')}>What can I help with? (optional)</label>
        <div className="cfield__control">
        <select id={id('topic')} name="topic" value={values.topic} onChange={update('topic')}>
          <option value="">Choose a service</option>
          {services.map((s) => (
            <option key={s.id} value={s.title}>
              {s.title}
            </option>
          ))}
          <option value="Something else">Something else</option>
        </select>
        <span className="cfield__line" aria-hidden="true" />
          </div>
      </div>

      <div className={cn('cfield', err('message') && 'has-error')}>
        <label htmlFor={id('message')}>Tell me about your idea</label>
        <div className="cfield__control">
        <textarea
          id={id('message')}
          name="message"
          rows={5}
          value={values.message}
          onChange={update('message')}
          onBlur={blur('message')}
          aria-invalid={!!err('message')}
          aria-describedby={err('message') ? id('message-err') : undefined}
          required
        />
        <span className="cfield__line" aria-hidden="true" />
          </div>
        {err('message') && (
          <p className="cfield__error" id={id('message-err')}>
            {err('message')}
          </p>
        )}
      </div>

      <div className="cform__actions">
        <Button type="submit" icon={status === 'sending' ? undefined : 'arrow'} disabled={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <span className="spinner" aria-hidden="true" /> Sending…
            </>
          ) : (
            'Send message'
          )}
        </Button>
        <div
          ref={summary}
          id={id('status')}
          tabIndex={-1}
          className={cn('cform__status', `is-${status}`)}
          role="status"
          aria-live="polite"
        >
          {status === 'sent' && 'Message sent. Thank you, I’ll get back to you soon.'}
          {status === 'mailto' && (
            <>
              Your email app should open with the message ready to send. If it doesn&rsquo;t, write to{' '}
              <a href={`mailto:${email}`}>{email}</a>.
            </>
          )}
          {status === 'error' && <>Message not sent. {serverError} Please try again in a moment.</>}
          {status === 'unconfigured' && (
            <>
              This form isn&rsquo;t connected to an inbox yet. Site owner: add an email address or form endpoint in{' '}
              <code>src/data/site.ts</code>.
            </>
          )}
        </div>
      </div>
    </form>
  );
}
