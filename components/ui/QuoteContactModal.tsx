'use client';

import { useState } from 'react';
import { X, MessageCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { type Quote, type TierKey, formatNaira, formatRange, quoteToText, quoteUrl } from '@/lib/quote';
import { SITE_URL, whatsappLink } from '@/lib/site';

const NIGERIAN_STATES = [
  'Lagos', 'FCT (Abuja)', 'Rivers', 'Ogun', 'Oyo', 'Kano', 'Enugu', 'Delta', 'Edo', 'Anambra', 'Kaduna',
  'Abia', 'Adamawa', 'Akwa Ibom', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Ebonyi', 'Ekiti',
  'Gombe', 'Imo', 'Jigawa', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Ondo', 'Osun',
  'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

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
  const [delivery, setDelivery] = useState<{ emailed: boolean; stored: boolean } | null>(null);

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const url = quoteUrl(quote, tier, SITE_URL);
  const canSubmit = name.trim() && phone.trim().replace(/\D/g, '').length >= 10 && state && status !== 'submitting';

  const waMessage =
    `Hi SolarBuilders, I'm ${name.trim()} from ${location}.\n` +
    `I generated quote ${quote.code} on your website (${t.label} — est. ${formatNaira(t.total.best)}).\n` +
    `Please help me get this system built.` +
    (note.trim() ? `\n\nNote: ${note.trim()}` : '') +
    `\n\n${url}`;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
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
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || 'Request failed');
      setDelivery({ emailed: !!data.emailed, stored: !!data.stored });
      setStatus('done');
    } catch {
      // Even if our server is down, WhatsApp still works — let them continue.
      setDelivery({ emailed: false, stored: false });
      setStatus('error');
    }
  }

  const inputCls =
    'w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors text-sm';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#0A0F1E]" aria-label="Close">
          <X className="w-5 h-5" />
        </button>

        {status === 'done' || status === 'error' ? (
          <div className="text-center py-2">
            {status === 'done' ? (
              <CheckCircle2 className="w-12 h-12 text-[#10B981] mx-auto mb-3" />
            ) : (
              <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            )}
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
              {status === 'done' ? 'Got it — one more tap' : 'Almost there'}
            </h2>
            <p className="text-[#64748B] text-sm mb-1">
              {status === 'done' && delivery?.emailed
                ? `Your quote ${quote.code} has been sent to our team.`
                : `We couldn't email your request automatically, but WhatsApp works — send it to us there.`}
            </p>
            <p className="text-[#64748B] text-sm mb-6">
              Tap below to open WhatsApp with your details already filled in. That&apos;s where we&apos;ll reply.
            </p>
            <a
              href={whatsappLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] hover:bg-[#22c55e] text-white py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" /> Continue on WhatsApp
            </a>
            <button onClick={onClose} className="mt-4 text-[#94A3B8] text-sm hover:text-[#64748B]">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">Get this system built</h2>
              <p className="text-[#64748B] text-sm">
                Quote <span className="font-mono font-semibold text-[#0A0F1E]">{quote.code}</span> · {t.label} ·{' '}
                {formatRange(t.total)}. We&apos;ll confirm current prices, workmanship and anything missing, then
                connect you with the right installer.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">Your name *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tunde Adeyemi" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">WhatsApp number *</label>
                <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">Email (optional)</label>
                <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">State *</label>
                <select className={inputCls} value={state} onChange={(e) => setState(e.target.value)} required>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">Area / town</label>
                <input className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Lekki Phase 1" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0A0F1E] mb-1">Anything we should know?</label>
                <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. I already have panels, roof is corrugated, want it done before December…" />
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 rounded-full font-heading font-bold text-base transition-colors flex items-center justify-center gap-2 ${
                canSubmit ? 'bg-[#25D366] hover:bg-[#22c55e] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <MessageCircle className="w-5 h-5" />
              {status === 'submitting' ? 'Sending…' : 'Send & continue on WhatsApp'}
            </button>
            <p className="text-[11px] text-[#94A3B8] text-center">
              We send your quote to our team and open WhatsApp so you can chat with us directly. No spam.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
