'use client';

import { useState } from 'react';
import { CheckCircle2, Copy, MessageCircle, ClipboardList } from 'lucide-react';
import Modal from './Modal';
import { whatsappLink } from '@/lib/site';
import { track } from '@/lib/track';
import { NIGERIAN_STATES } from '@/lib/validation';

const POWER_SOURCES = [
  { key: 'solar-only', label: 'Solar / inverter only', hint: 'No grid or generator to fall back on' },
  { key: 'has-grid', label: 'I have NEPA (grid)', hint: 'Light comes some hours a day' },
  { key: 'has-generator', label: 'I have a generator', hint: 'Can top up when needed' },
] as const;

interface Props {
  /** where the button sits, for tracking */
  placement: string;
  /** set on a brand page so the request carries the brand */
  brand?: { slug: string; name: string };
  className?: string;
  children?: React.ReactNode;
}

/**
 * "Don't want to use the calculator? Let us quote for you."
 *
 * Asks the five things we would otherwise ask over chat — where, what to power,
 * grid or generator or solar only, budget — files them (api/build-request) for a
 * request code, then hands over a WhatsApp message carrying all of it, so the
 * first message we receive already says what they need.
 */
export default function HelpQuote({ placement, brand, className, children }: Props) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [needs, setNeeds] = useState('');
  const [power, setPower] = useState<(typeof POWER_SOURCES)[number]['key'] | ''>('');
  const [budget, setBudget] = useState('');
  const [hp, setHp] = useState('');
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const budgetNaira = Number(budget.replace(/\D/g, '')) || 0;
  const powerLabel = POWER_SOURCES.find((p) => p.key === power)?.label;
  const ready = !!state && needs.trim().length >= 3 && !!power;

  const message = [
    brand ? `Hi SolarBuilders, I'd like a quote for a ${brand.name} setup.` : `Hi SolarBuilders, please help me get a solar quote.`,
    code ? `Request code: ${code}` : '',
    `Location: ${location}`,
    `Main things to power: ${needs.trim()}`,
    `Power situation: ${powerLabel ?? ''}`,
    budgetNaira ? `Budget: ₦${budgetNaira.toLocaleString('en-NG')}` : 'Budget: not sure yet',
  ]
    .filter(Boolean)
    .join('\n');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    let ref: string | null = null;
    try {
      const res = await fetch('/api/build-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brand?.slug,
          location,
          budget: budgetNaira || undefined,
          needs: needs.trim(),
          powerSource: power,
          appliances: needs.trim(),
          tier: 'help-me-quote',
          hp,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data?.reference === 'string') ref = data.reference;
    } catch {
      /* WhatsApp below still carries every answer */
    }
    track('quote_form_submit', { placement: `help_quote:${placement}` });
    setCode(ref);
    setBusy(false);
    if (!ref) setCode('');
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      /* text is on screen to select */
    }
  }

  const inputCls =
    'w-full bg-white border border-[#E2E8F0] rounded-xl px-4 py-3 text-[#0A0F1E] placeholder-[#94A3B8] focus:outline-none focus:border-[#F59E0B] transition-colors text-sm';
  const done = code !== null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          track('cta_click', { placement: `help_quote:${placement}` });
          setOpen(true);
        }}
        className={
          className ??
          'inline-flex items-center gap-2 border border-slate-300 hover:border-slate-900 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors'
        }
      >
        {children ?? (
          <>
            <ClipboardList className="w-4 h-4" aria-hidden="true" /> Let us put the quote together
          </>
        )}
      </button>

      {open && (
        <Modal
          labelledBy="help-quote-title"
          onClose={() => setOpen(false)}
          canClose={!busy}
          align="bottom"
          panelClassName="rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-6 max-h-[92vh] overflow-y-auto"
        >
          {done ? (
            <div>
              <CheckCircle2 className="w-10 h-10 text-[#10B981] mb-2" />
              <h2 id="help-quote-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
                {code ? (
                  <>
                    Your code: <span className="font-mono">{code}</span>
                  </>
                ) : (
                  'Almost done'
                )}
              </h2>
              <p className="text-[#64748B] text-sm mb-3">Send this on WhatsApp. It tells us what you need, so we can reply with a quote instead of questions.</p>
              <pre className="whitespace-pre-wrap break-words text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 mb-4 max-h-56 overflow-y-auto">{message}</pre>
              <a
                href={whatsappLink(message)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('whatsapp_click', { placement: `help_quote:${placement}` })}
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
                <h2 id="help-quote-title" className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-1">
                  {brand ? `Get a ${brand.name} quote` : 'Let us quote for you'}
                </h2>
                <p className="text-[#64748B] text-sm">Four quick answers. Free, nothing to pay now, and you get a code to send us.</p>
              </div>

              <input type="text" name="hp" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="hq-state" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Where are you based? *</label>
                  <select id="hq-state" className={inputCls} value={state} onChange={(e) => setState(e.target.value)}>
                    <option value="">Select state</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="hq-area" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Area / town</label>
                  <input id="hq-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Lekki Phase 1" maxLength={80} />
                </div>
              </div>

              <div>
                <label htmlFor="hq-needs" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Main things you want to power *</label>
                <textarea
                  id="hq-needs"
                  className={`${inputCls} min-h-[84px]`}
                  value={needs}
                  onChange={(e) => setNeeds(e.target.value.slice(0, 600))}
                  placeholder="e.g. fridge, deep freezer, 4 lights, 2 fans, TV, charge phones"
                />
              </div>

              <fieldset>
                <legend className="block text-xs font-semibold text-[#0A0F1E] mb-1">Will you have another source of light? *</legend>
                <div className="grid gap-2">
                  {POWER_SOURCES.map((p) => (
                    <label
                      key={p.key}
                      className={`cursor-pointer rounded-xl border px-3 py-2.5 text-sm flex flex-col has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-900 ${
                        power === p.key ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-900 hover:border-amber-400'
                      }`}
                    >
                      <input type="radio" name="hq-power" value={p.key} checked={power === p.key} onChange={() => setPower(p.key)} className="sr-only" />
                      <span className="font-semibold">{p.label}</span>
                      <span className={`text-[11px] ${power === p.key ? 'text-slate-300' : 'text-slate-500'}`}>{p.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="hq-budget" className="block text-xs font-semibold text-[#0A0F1E] mb-1">Budget in mind (optional)</label>
                <input
                  id="hq-budget"
                  className={inputCls}
                  inputMode="numeric"
                  value={budgetNaira ? budgetNaira.toLocaleString('en-NG') : ''}
                  onChange={(e) => setBudget(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="₦ e.g. 1,500,000"
                />
              </div>

              <button
                type="submit"
                disabled={!ready || busy}
                className={`w-full py-4 rounded-full font-heading font-bold text-base transition-colors ${
                  ready && !busy ? 'bg-[#0E7568] hover:bg-[#075E54] text-white' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                }`}
              >
                {busy ? 'Getting your code…' : 'Get my code'}
              </button>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
