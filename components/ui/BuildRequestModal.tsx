'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import { type Quote, type TierKey, formatNaira, quoteToText, quoteUrl } from '@/lib/quote';
import { SITE_URL, whatsappLink } from '@/lib/site';
import { track, withCampaign } from '@/lib/track';
import { NIGERIAN_STATES } from '@/lib/validation';

interface Props {
  quote: Quote;
  tier: TierKey;
  brand: { slug: string; name: string };
  onClose: () => void;
}

/**
 * "Get my system built" for a quote that started on a brand page.
 *
 * Asks only where and roughly how much, files the request (api/build-request)
 * to get a request code, then hands the visitor a WhatsApp message carrying the
 * code, the brand, the appliance list, location and budget — so the chat that
 * arrives says what they want to power, not just "I'm interested in <brand>".
 * If filing fails, WhatsApp still works with the quote code alone.
 */
export default function BuildRequestModal({ quote, tier, brand, onClose }: Props) {
  const t = quote.tiers[tier];
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [budget, setBudget] = useState('');
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [filed, setFiled] = useState(false);
  const [copied, setCopied] = useState(false);

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const budgetNaira = Number(budget.replace(/\D/g, '')) || 0;
  const url = quoteUrl(quote, tier, SITE_URL);

  const message = [
    `Hi SolarBuilders, I want a system built with ${brand.name}.`,
    `Request code: ${code ?? quote.code}`,
    `Location: ${location}`,
    budgetNaira ? `Budget: ${formatNaira(budgetNaira)}` : '',
    '',
    'I want to power:',
    ...quote.appliances.map((a) => `• ${a.qty}× ${a.name}`),
    '',
    `Sized: ${t.inverterKva}kVA inverter, ${t.batteryKwh}kWh battery, ${t.panelCount}× ${t.panelWatts}W panels`,
    `Estimate: ${formatNaira(t.total.best)} equipment & materials, before installation`,
    withCampaign(url, 'brand_build'),
  ]
    .filter((l, i, all) => l !== '' || all[i - 1] !== '')
    .join('\n');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!state || busy) return;
    setBusy(true);
    let ref: string | null = null;
    try {
      const res = await fetch('/api/build-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand.slug,
          location,
          budget: budgetNaira || undefined,
          quoteCode: quote.code,
          quoteUrl: url,
          tier: t.label,
          totalBest: t.total.best,
          totalLow: t.total.low,
          totalHigh: t.total.high,
          appliances: quote.appliances.map((a) => `${a.qty}× ${a.name}`).join(', '),
          summary: quoteToText(quote, tier, SITE_URL),
          hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.reference === 'string') {
        ref = data.reference;
        setFiled(!!data.stored);
      }
    } catch {
      /* WhatsApp below still carries the quote code */
    }
    track('quote_form_submit', { quoteCode: quote.code, tier: t.label, amount: t.total.best, placement: `brand_build:${brand.slug}` });
    setCode(ref ?? quote.code);
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      /* clipboard blocked — the text is on screen to select by hand */
    }
  }

  const inputCls =
    'w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors text-sm';

  return (
    <Modal
      labelledBy="build-modal-title"
      onClose={onClose}
      canClose={!busy}
      align="bottom"
      panelClassName="rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto"
    >
      {code ? (
        <div>
          <CheckCircle2 className="w-10 h-10 text-[#10B981] mb-2" />
          <h2 id="build-modal-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
            Your code: <span className="font-mono">{code}</span>
          </h2>
          <p className="text-[#64748B] text-sm mb-3">
            {filed ? 'Saved on our side. ' : ''}Send this to us on WhatsApp — the code tells us exactly what you want built.
          </p>
          <pre className="whitespace-pre-wrap break-all text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mb-4 max-h-56 overflow-y-auto">{message}</pre>
          <a
            href={whatsappLink(message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track('whatsapp_click', { placement: `brand_build:${brand.slug}`, quoteCode: quote.code, tier: t.label })}
            className="w-full bg-[#0E7568] hover:bg-[#075E54] text-white py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-5 h-5" /> Send on WhatsApp
          </a>
          <button
            type="button"
            onClick={copy}
            className="mt-3 w-full border border-slate-300 hover:border-slate-900 text-slate-900 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy details'}
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div>
            <h2 id="build-modal-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
              Get my {brand.name} system built
            </h2>
            <p className="text-[#64748B] text-sm">
              {t.inverterKva}kVA · est. {formatNaira(t.total.best)} before installation. Two quick questions and you get a code.
            </p>
          </div>

          <ul className="flex flex-wrap gap-1.5" aria-label="What you want to power">
            {quote.appliances.map((a) => (
              <li key={a.id} className="text-xs rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-slate-700">
                {a.qty}× {a.name}
              </li>
            ))}
          </ul>

          <input type="text" name="hp" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="br-state" className="block text-xs font-semibold text-[#0A0F1E] mb-1">State *</label>
              <select id="br-state" className={inputCls} value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select state</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="br-area" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Area / town</label>
              <input id="br-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Lekki Phase 1" maxLength={80} />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="br-budget" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Budget in mind (optional)</label>
              <input
                id="br-budget"
                className={inputCls}
                inputMode="numeric"
                value={budgetNaira ? budgetNaira.toLocaleString('en-NG') : ''}
                onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="₦ e.g. 3,000,000"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!state || busy}
            className={`w-full py-4 rounded-full font-heading font-bold text-base transition-colors flex items-center justify-center gap-2 ${
              state && !busy ? 'bg-[#0E7568] hover:bg-[#075E54] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
            }`}
          >
            {busy ? 'Getting your code…' : 'Get my code'}
          </button>
        </form>
      )}
    </Modal>
  );
}
