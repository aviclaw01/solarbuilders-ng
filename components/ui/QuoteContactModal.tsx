'use client';

import { useState } from 'react';
import { MessageCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { type Quote, type TierKey, formatNaira, formatRange, quoteToText, quoteUrl } from '@/lib/quote';
import { SITE_URL, whatsappLink } from '@/lib/site';
import { track, withCampaign } from '@/lib/track';
import { NIGERIAN_STATES, isEmail, isPhone, type FieldErrors } from '@/lib/validation';

interface Props {
  quote: Quote;
  tier: TierKey;
  onClose: () => void;
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function QuoteContactModal({ quote, tier, onClose }: Props) {
  const t = quote.tiers[tier];
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [delivery, setDelivery] = useState<{ emailed: boolean; stored: boolean; reference: string | null } | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [hp, setHp] = useState('');

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const url = quoteUrl(quote, tier, SITE_URL);
  const waUrl = withCampaign(url, 'quote_handoff');
  const canSubmit = name.trim() && phone.trim().replace(/\D/g, '').length >= 10 && state && status !== 'submitting';

  const waMessage =
    `Hi SolarBuilders, I'm ${name.trim()} from ${location}.\n` +
    `I generated quote ${quote.code} on your website (${t.label} — est. ${formatNaira(t.total.best)}).\n` +
    `Please help me get this system built.` +
    (note.trim() ? `\n\nNote: ${note.trim()}` : '') +
    `\n\n${waUrl}`;

  function clearError(field: string) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  /** Client twin of the server's per-field rules (lib/validation). */
  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const n = name.trim();
    const p = phone.trim();
    const em = email.trim();
    if (n.length < 2) next.name = n ? 'Name must be at least 2 characters.' : 'Your name is required.';
    if (!p) next.phone = 'WhatsApp number is required.';
    else if (!isPhone(p)) next.phone = 'That number looks short — e.g. 0803 000 0000.';
    if (em && !isEmail(em)) next.email = "That email doesn't look right — check for typos.";
    if (!state) next.state = 'Pick your state.';
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'submitting') return;
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/quote-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          location,
          note: note.trim() || undefined,
          quoteCode: quote.code,
          quoteUrl: url,
          tier: t.label,
          totalBest: t.total.best,
          totalLow: t.total.low,
          totalHigh: t.total.high,
          summary: quoteToText(quote, tier, SITE_URL),
          hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        // A 400 with per-field messages keeps the form open (#22) — the visitor
        // edits in place instead of dead-ending at the terminal screen. Only a
        // server/network failure (500, 429, no JSON) ends the session there.
        if (res.status === 400 && data?.fields) {
          setErrors(data.fields as FieldErrors);
          setServerError(typeof data.error === 'string' ? data.error : '');
          setStatus('idle');
          return;
        }
        setServerError(typeof data?.error === 'string' ? data.error : '');
        // Even if our server is down, WhatsApp still works — let them continue.
        setDelivery({ emailed: false, stored: false, reference: null });
        setStatus('error');
        return;
      }
      setDelivery({ emailed: !!data.emailed, stored: !!data.stored, reference: typeof data.reference === 'string' ? data.reference : null });
      track('quote_form_submit', { quoteCode: quote.code, tier: t.label, amount: t.total.best });
      setStatus('done');
    } catch {
      setServerError('');
      setDelivery({ emailed: false, stored: false, reference: null });
      setStatus('error');
    }
  }

  const inputCls =
    'w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors text-sm';

  return (
    <Modal
      labelledBy="quote-modal-title"
      onClose={onClose}
      canClose={status !== 'submitting'}
      align="bottom"
      panelClassName="rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto"
    >

        {status === 'done' || status === 'error' ? (
          <div className="text-center py-2">
            {status === 'done' ? (
              <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            )}
            <h2 id="quote-modal-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
              {status === 'done' ? 'Got it — one more tap' : 'Almost there'}
            </h2>
            {status === 'done' && delivery?.reference && (
              <p className="text-[#64748B] text-sm mb-1">
                Your reference is{' '}
                <span className="font-mono font-semibold text-[#0A0F1E]">{delivery.reference}</span> — quote it if you
                write to us, so we can find your request instantly.
              </p>
            )}
            <p className="text-[#64748B] text-sm mb-1">
              {status === 'done' && delivery?.emailed
                ? `Your quote ${quote.code} has been sent to our team.`
                : status === 'error' && delivery?.stored
                  ? `Your quote ${quote.code} was saved on our side, but the email to the team didn't go out. WhatsApp still works — send it to us there.`
                  : serverError || `We couldn't record your request just now — that's on us, not you. WhatsApp still works, and that's where we reply.`}
            </p>
            <p className="text-[#64748B] text-sm mb-6">
              Tap below to open WhatsApp with your details already filled in. That&apos;s where we&apos;ll reply.
            </p>
            <a
              href={whatsappLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('whatsapp_click', { placement: 'quote_handoff', quoteCode: quote.code, tier: t.label })}
              className="w-full bg-[#0E7568] hover:bg-[#075E54] text-white py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> Continue on WhatsApp
            </a>
            <button onClick={onClose} className="mt-4 text-[#64748B] text-sm hover:text-[#64748B]">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <h2 id="quote-modal-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">Get this system built</h2>
              <p className="text-[#64748B] text-sm">
                Quote <span className="font-mono font-semibold text-[#0A0F1E]">{quote.code}</span> · {t.label} ·{' '}
                {formatRange(t.total)}. We&apos;ll confirm current prices, workmanship and anything missing, then
                connect you with the right installer.
              </p>
            </div>

            {/* Honeypot — hidden from humans, bait for scripts. */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="qc-name" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Your name *</label>
                <input
                  id="qc-name"
                  className={`${inputCls} ${errors.name ? 'border-rose-400' : ''}`}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError('name'); }}
                  placeholder="Tunde Adeyemi"
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-rose-600 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="qc-phone" className="block text-xs font-semibold text-[#0A0F1E] mb-1">WhatsApp number *</label>
                <input
                  id="qc-phone"
                  className={`${inputCls} ${errors.phone ? 'border-rose-400' : ''}`}
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); clearError('phone'); }}
                  placeholder="0803 000 0000"
                  aria-invalid={!!errors.phone}
                />
                {errors.phone && <p className="text-rose-600 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="qc-email" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Email (optional)</label>
                <input
                  id="qc-email"
                  className={`${inputCls} ${errors.email ? 'border-rose-400' : ''}`}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                  placeholder="you@example.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-rose-600 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label htmlFor="qc-state" className="block text-xs font-semibold text-[#0A0F1E] mb-1">State *</label>
                <select
                  id="qc-state"
                  className={`${inputCls} ${errors.state ? 'border-rose-400' : ''}`}
                  value={state}
                  onChange={(e) => { setState(e.target.value); clearError('state'); }}
                  aria-invalid={!!errors.state}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {errors.state && <p className="text-rose-600 text-xs mt-1">{errors.state}</p>}
              </div>
              <div>
                <label htmlFor="qc-area" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Area / town</label>
                <input id="qc-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Lekki Phase 1" maxLength={80} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="qc-note" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Anything we should know?</label>
                <textarea id="qc-note" className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} placeholder="e.g. I already have panels, roof is corrugated, want it done before December…" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 rounded-full font-heading font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                canSubmit ? 'bg-[#0E7568] hover:bg-[#075E54] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              {status === 'submitting' ? 'Sending…' : 'Send & continue on WhatsApp'}
            </button>
            <p className="text-[11px] text-[#64748B] text-center">
              We send your quote to our team and open WhatsApp so you can chat with us directly. No spam.
            </p>
          </form>
        )}
    </Modal>
  );
}
