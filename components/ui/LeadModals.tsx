'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ListChecks, MessageCircle, ArrowRight, X } from 'lucide-react';
import Modal from './Modal';
import { whatsappLink } from '@/lib/site';
import { track } from '@/lib/track';
import { NIGERIAN_STATES, isPhone, type FieldErrors } from '@/lib/validation';

/**
 * The two ways in, reachable from any button on the site:
 *
 *  - "Get a quote" → chooser: pick a package (/find) or enter your load (/calculator).
 *  - "Contact us now" → name, WhatsApp number, state → WhatsApp opens with the
 *    message written, and the details are stored so we can message them first
 *    if they never press send.
 *
 * Buttons open these with openChooser() / openContact(); one instance of
 * <LeadModals /> in the layout listens. A gentle prompt offering both appears
 * once per visit on content pages after the visitor has read for a while.
 */

type Kind = 'chooser' | 'contact';
const EVENT = 'sb:lead-modal';

export function openChooser(placement: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind: 'chooser', placement } }));
}
export function openContact(placement: string) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind: 'contact', placement } }));
}

/** Pages where a prompt would interrupt work already under way. */
const NO_PROMPT = ['/find', '/calculator', '/cart', '/admin', '/partner', '/checkout', '/privacy', '/terms'];
const PROMPT_AFTER_MS = 25_000;
const PROMPT_KEY = 'sb_prompted';

export default function LeadModals() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState<{ kind: Kind; placement: string } | null>(null);
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<{ kind: Kind; placement: string }>).detail;
      setPrompt(false);
      setOpen(d);
      track(d.kind === 'chooser' ? 'chooser_open' : 'contact_open', { placement: d.placement });
    };
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  // Once per visit, after 25s of reading or 60% down the page.
  useEffect(() => {
    if (NO_PROMPT.some((p) => pathname.startsWith(p))) return;
    try {
      if (sessionStorage.getItem(PROMPT_KEY)) return;
    } catch {
      return;
    }
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      try {
        sessionStorage.setItem(PROMPT_KEY, '1');
      } catch {
        /* ignore */
      }
      setPrompt(true);
      track('prompt_shown', { placement: pathname.slice(0, 60) });
    };
    const timer = window.setTimeout(show, PROMPT_AFTER_MS);
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max > 400 && window.scrollY / max > 0.6) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname]);

  // A route change closes the chooser (its links navigate away).
  useEffect(() => {
    setOpen((o) => (o?.kind === 'chooser' ? null : o));
  }, [pathname]);

  return (
    <>
      {prompt && !open && (
        <div
          role="dialog"
          aria-labelledby="sb-prompt-title"
          className="fixed z-[60] bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-24 sm:w-[360px] rounded-2xl bg-white shadow-2xl border border-slate-200 p-4"
          data-track="prompt"
        >
          <button
            onClick={() => setPrompt(false)}
            aria-label="Close"
            className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
          <p id="sb-prompt-title" className="font-heading font-bold text-slate-900 pr-8">
            Setting up solar?
          </p>
          <p className="text-sm text-slate-600 mt-1">Tell us where you are and what you need. We reply on WhatsApp.</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => openContact('prompt')} className="btn btn-sun !min-h-[44px] text-sm">
              Contact us now
            </button>
            <button
              onClick={() => openChooser('prompt')}
              className="min-h-[44px] rounded-full border border-slate-300 text-sm font-semibold text-slate-900 hover:border-slate-500"
            >
              Get a quote
            </button>
          </div>
        </div>
      )}

      {open?.kind === 'chooser' && <Chooser placement={open.placement} onClose={() => setOpen(null)} />}
      {open?.kind === 'contact' && <ContactForm placement={open.placement} onClose={() => setOpen(null)} />}
    </>
  );
}

function Chooser({ placement, onClose }: { placement: string; onClose: () => void }) {
  const options = [
    {
      href: '/find',
      icon: Package,
      title: 'Pick a package',
      body: 'Choose your kind of home and how long the power goes off. See a ready kit and its price.',
    },
    {
      href: '/calculator',
      icon: ListChecks,
      title: 'Enter your load',
      body: 'List the appliances you run. Get the inverter, battery, panels and breakers sized and priced.',
    },
  ];
  return (
    <Modal labelledBy="sb-chooser-title" onClose={onClose} align="bottom" panelClassName="max-w-lg">
      <div className="p-5 sm:p-6" data-track={`chooser:${placement}`}>
        <h2 id="sb-chooser-title" className="font-heading font-extrabold text-xl text-slate-900">
          How do you want to start?
        </h2>
        <div className="mt-4 space-y-3">
          {options.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4 hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <Icon className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="flex-1">
                <span className="block font-heading font-bold text-slate-900">{title}</span>
                <span className="block text-sm text-slate-600 mt-0.5">{body}</span>
              </span>
              <ArrowRight className="w-5 h-5 text-slate-400 mt-0.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <button
          onClick={() => openContact(`chooser:${placement}`)}
          className="mt-4 w-full text-sm font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" /> Not sure? Contact us now
        </button>
      </div>
    </Modal>
  );
}

const inputCls =
  'w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors text-sm';

function ContactForm({ placement, onClose }: { placement: string; onClose: () => void }) {
  const pathname = usePathname() ?? '/';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [need, setNeed] = useState('');
  const [hp, setHp] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const message =
    `Hi SolarBuilders, I'm ${name.trim()} from ${location}. I want to set up solar.` +
    (need.trim() ? `\n\n${need.trim()}` : '') +
    `\n\nMy WhatsApp: ${phone.trim()}`;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = 'Tell us your name.';
    if (!isPhone(phone.trim())) next.phone = 'Enter a Nigerian number, e.g. 0803 000 0000.';
    if (!state) next.state = 'Pick your state.';
    setErrors(next);
    if (Object.keys(next).length) return;

    // Open WhatsApp inside the click, before any await, or browsers block it.
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
    track('contact_submit', { placement });
    void fetch('/api/contact-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, state, area, need, page: pathname, placement, hp }),
      keepalive: true,
    }).catch(() => {});
    setSent(true);
  };

  return (
    <Modal labelledBy="sb-contact-title" onClose={onClose} align="bottom" panelClassName="max-w-lg">
      <div className="p-5 sm:p-6" data-track={`contact:${placement}`}>
        <h2 id="sb-contact-title" className="font-heading font-extrabold text-xl text-slate-900">
          {sent ? 'WhatsApp is open' : 'Contact us now'}
        </h2>
        {sent ? (
          <div className="mt-3 space-y-3 text-sm text-slate-600">
            <p>Press send in WhatsApp and we will reply there. If you don&apos;t, we have your details and will message you first.</p>
            <a
              href={whatsappLink(message)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sun w-full"
            >
              Open WhatsApp again
            </a>
            <button onClick={onClose} className="w-full min-h-[44px] text-slate-700 font-semibold">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-4 space-y-3">
            <p className="text-sm text-slate-600 -mt-2">We&apos;ll start the chat on WhatsApp with your details filled in.</p>
            <input
              type="text"
              name="website"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <Field id="cn-name" label="Your name" error={errors.name}>
              <input
                id="cn-name"
                className={inputCls}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                aria-invalid={!!errors.name}
              />
            </Field>
            <Field id="cn-phone" label="WhatsApp number" error={errors.phone}>
              <input
                id="cn-phone"
                className={inputCls}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-invalid={!!errors.phone}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field id="cn-state" label="State" error={errors.state}>
                <select
                  id="cn-state"
                  className={inputCls}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  aria-invalid={!!errors.state}
                >
                  <option value="">Select</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="cn-area" label="Area (optional)">
                <input id="cn-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki" />
              </Field>
            </div>
            <Field id="cn-need" label="What do you need? (optional)">
              <textarea
                id="cn-need"
                rows={2}
                maxLength={300}
                className={inputCls}
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                placeholder="e.g. 5kVA for a 3-bedroom flat, run fridge and AC at night"
              />
            </Field>
            <button type="submit" className="btn btn-sun w-full">
              <MessageCircle className="w-5 h-5" aria-hidden="true" /> Continue on WhatsApp
            </button>
          </form>
        )}
      </div>
    </Modal>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#0A0F1E] mb-1">
        {label}
      </label>
      {children}
      {error && <p className="text-rose-600 text-xs mt-1">{error}</p>}
    </div>
  );
}
