'use client';

import { useState } from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { NIGERIAN_STATES, isPhone, isState, type FieldErrors } from '@/lib/validation';
import { whatsappLink } from '@/lib/site';
import { track } from '@/lib/track';

/**
 * "Tell us what you need" — free-text capture that ends in WhatsApp.
 *
 * Order matters on submit: the wa.me link is built and opened synchronously
 * inside the click, before any await, or mobile browsers treat it as a popup
 * and block it. The POST to /api/need then goes out with keepalive so it
 * survives the tab losing focus to the WhatsApp app.
 */

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;
const CHIPS = ['Power my flat', 'Run my AC', 'Borehole pump', 'Shop / POS'];
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

interface Props {
  /** where this box lives, e.g. "home", "brand:deye" — goes to tracking and the lead row */
  placement: string;
  /** adds a "Price a {brand}" chip */
  brand?: string;
  /** heading id, so the wrapping section can aria-labelledby it */
  headingId?: string;
}

function fieldErrors(message: string, phone: string, state: string): FieldErrors {
  const errors: FieldErrors = {};
  const m = message.trim();
  if (!m) errors.message = 'Tell us what you need.';
  else if (m.length < MESSAGE_MIN) errors.message = 'A few more words — what do you want to power?';
  const p = phone.trim();
  if (!p) errors.phone = 'Your WhatsApp number, so we can reply.';
  else if (!isPhone(p)) errors.phone = 'That number looks short — e.g. 0803 000 0000.';
  if (state && !isState(state)) errors.state = 'Pick a state from the list.';
  return errors;
}

function utmFromUrl(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of UTM_KEYS) {
      const v = p.get(k);
      if (v) out[k] = v.slice(0, 64);
    }
  } catch {
    /* ignore */
  }
  return out;
}

const fieldBase =
  'w-full bg-white border rounded-control px-4 py-3 text-ink placeholder:text-muted/70 focus:outline-none focus:border-sun-deep focus:ring-2 focus:ring-sun/40 transition-colors duration-150';

export default function NeedBox({ placement, brand, headingId = 'need-box-title' }: Props) {
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sentLink, setSentLink] = useState<string | null>(null);

  const chips = brand ? [...CHIPS, `Price a ${brand}`] : CHIPS;

  function addChip(label: string) {
    setMessage((prev) => {
      const t = prev.trim();
      if (!t) return `${label}: `;
      if (t.toLowerCase().includes(label.toLowerCase())) return prev;
      return `${t.replace(/[,.:;]$/, '')}, ${label.toLowerCase()} `.slice(0, MESSAGE_MAX);
    });
    clearError('message');
  }

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = fieldErrors(message, phone, state);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const text = [
      'Hi SolarBuilders, this is what I need:',
      message.trim(),
      state ? `State: ${state}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    const href = whatsappLink(text);

    // Synchronous, inside the user gesture — before anything async.
    window.open(href, '_blank', 'noopener,noreferrer');
    track('need_submit', { placement });
    setSentLink(href);

    try {
      void fetch('/api/need', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          message: message.trim(),
          phone: phone.trim(),
          state,
          hp,
          placement,
          page: window.location.pathname.slice(0, 200),
          utm: utmFromUrl(),
        }),
      }).catch(() => {
        /* the WhatsApp message is the primary channel; the row is the backup */
      });
    } catch {
      /* same */
    }
  }

  if (sentLink) {
    return (
      <div className="bg-white rounded-card p-6 sm:p-8 text-center" role="status">
        <CheckCircle2 className="w-10 h-10 text-leaf mx-auto" aria-hidden="true" />
        <p className="font-heading font-extrabold text-ink text-2xl mt-3">Sent.</p>
        <p className="text-muted mt-2">
          If WhatsApp did not open,{' '}
          <a
            href={sentLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { placement: `need_retry:${placement}` })}
            className="font-semibold text-ink underline underline-offset-4 hover:text-sun-ink"
          >
            tap here
          </a>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            setSentLink(null);
            setMessage('');
          }}
          className="mt-6 text-sm font-semibold text-muted hover:text-ink"
        >
          Send something else
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="bg-white rounded-card p-5 sm:p-7 text-left" aria-labelledby={headingId}>
      {/* Honeypot: hidden from people, filled by scripts. */}
      <input
        type="text"
        name="hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <label htmlFor={`${headingId}-message`} className="block font-heading font-bold text-ink mb-2">
        What do you want to power?
      </label>
      <textarea
        id={`${headingId}-message`}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value.slice(0, MESSAGE_MAX));
          clearError('message');
        }}
        rows={4}
        maxLength={MESSAGE_MAX}
        placeholder="e.g. 3-bed flat in Lekki, fridge, TV, 2 ACs, NEPA 6 hours a day"
        aria-invalid={Boolean(errors.message)}
        aria-describedby={errors.message ? `${headingId}-message-err` : undefined}
        className={`${fieldBase} resize-y min-h-28 ${errors.message ? 'border-rose-400' : 'border-line'}`}
      />
      {errors.message && (
        <p id={`${headingId}-message-err`} className="text-rose-600 text-sm mt-1">
          {errors.message}
        </p>
      )}

      <ul className="flex flex-wrap gap-2 mt-3" aria-label="Quick starts">
        {chips.map((c) => (
          <li key={c}>
            <button
              type="button"
              onClick={() => addChip(c)}
              className="min-h-10 px-4 rounded-full border border-line bg-canvas text-sm font-semibold text-ink hover:border-ink-soft transition-colors duration-150 focus-ring"
            >
              {c}
            </button>
          </li>
        ))}
      </ul>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div>
          <label htmlFor={`${headingId}-phone`} className="block text-sm font-semibold text-ink mb-1">
            Your WhatsApp number
          </label>
          <input
            id={`${headingId}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearError('phone');
            }}
            placeholder="0803 000 0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? `${headingId}-phone-err` : undefined}
            className={`${fieldBase} ${errors.phone ? 'border-rose-400' : 'border-line'}`}
          />
          {errors.phone && (
            <p id={`${headingId}-phone-err`} className="text-rose-600 text-sm mt-1">
              {errors.phone}
            </p>
          )}
        </div>
        <div>
          <label htmlFor={`${headingId}-state`} className="block text-sm font-semibold text-ink mb-1">
            State <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            id={`${headingId}-state`}
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              clearError('state');
            }}
            className={`${fieldBase} ${errors.state ? 'border-rose-400' : 'border-line'}`}
          >
            <option value="">Choose…</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errors.state && <p className="text-rose-600 text-sm mt-1">{errors.state}</p>}
        </div>
      </div>

      <button type="submit" className="btn btn-sun btn-lg w-full mt-6">
        <MessageCircle className="w-5 h-5" aria-hidden="true" />
        Send on WhatsApp
      </button>
    </form>
  );
}
