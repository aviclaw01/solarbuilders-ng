'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  Minus,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import BrandMark from '@/components/ui/BrandMark';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import {
  cartFromQuoteTier,
  cartTotals,
  readCart,
  resolveCart,
  setQty as setLineQty,
  writeCart,
  type CartLine,
} from '@/lib/cart';
import { buildQuote, decodeQuotePayload, formatNaira, parseTierOptions, type TierKey } from '@/lib/quote';
import { track } from '@/lib/track';

/**
 * Order request builder.
 *
 * We take no card payment. This page collects what the customer wants and
 * hands it to us; the price is confirmed with the distributor afterwards. The
 * figures shown are catalogue midpoints and ranges, clearly labelled as such.
 */

const NIGERIAN_STATES = [
  'Lagos', 'FCT (Abuja)', 'Rivers', 'Ogun', 'Oyo', 'Kano', 'Enugu', 'Delta', 'Edo', 'Anambra', 'Kaduna',
  'Abia', 'Adamawa', 'Akwa Ibom', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Ebonyi', 'Ekiti',
  'Gombe', 'Imo', 'Jigawa', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Ondo', 'Osun',
  'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

/** Exactly what /api/order-request returns — the only prices we show after submitting. */
interface OrderLine {
  brandSlug: string;
  brandName: string;
  model: string;
  spec: string;
  qty: number;
  unitLow: number;
  unitHigh: number;
  lineBest: number;
}
interface OrderResult {
  reference: string;
  emailed: boolean;
  stored: boolean;
  totals: { low: number; best: number; high: number; items: number };
  lines: OrderLine[];
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

/**
 * Merge quote lines into whatever is already in the cart by taking the larger
 * quantity rather than adding. Re-opening or refreshing the same quote link
 * must not keep stacking batteries.
 */
function mergeQuoteLines(existing: CartLine[], incoming: CartLine[]): CartLine[] {
  const out = existing.map((l) => ({ ...l }));
  for (const inc of incoming) {
    const i = out.findIndex((l) => l.brandSlug === inc.brandSlug && l.model === inc.model);
    if (i === -1) out.push({ ...inc });
    else out[i].qty = Math.max(out[i].qty, inc.qty);
  }
  return out;
}

function isTierKey(v: string | null): v is TierKey {
  return v === 'budget' || v === 'standard' || v === 'premium';
}

// ─────────────────────────────────────────────────────────

function CartInner({ pricesAsOfLabel }: { pricesAsOfLabel: string }) {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [quoteCode, setQuoteCode] = useState<string | null>(null);
  const [unmatched, setUnmatched] = useState<string[]>([]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [state, setState] = useState('');
  const [area, setArea] = useState('');
  const [note, setNote] = useState('');
  const [needsInstall, setNeedsInstall] = useState(true);

  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<OrderResult | null>(null);

  const filled = useRef(false);

  // Load the cart after mount (localStorage doesn't exist on the server), and
  // fold in a quote from ?q= / ?tier= if we arrived from the calculator.
  useEffect(() => {
    let next = readCart();

    const payload = searchParams.get('q');
    if (payload && !filled.current) {
      filled.current = true;
      const appliances = decodeQuotePayload(payload);
      if (appliances && appliances.length > 0) {
        const tierParam = searchParams.get('tier');
        const tier: TierKey = isTierKey(tierParam) ? tierParam : 'standard';
        const options = parseTierOptions(searchParams.get('inv'), searchParams.get('bat'));
        const quote = buildQuote(appliances, { [tier]: options });
        const match = cartFromQuoteTier(quote.tiers[tier]);
        next = mergeQuoteLines(next, match.lines);
        writeCart(next);
        setQuoteCode(quote.code);
        setUnmatched(match.unmatched);
      }
    }

    setLines(next);
    setMounted(true);

    const sync = () => setLines(readCart());
    window.addEventListener('sb-cart-change', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('sb-cart-change', sync);
      window.removeEventListener('storage', sync);
    };
    // Reading the quote params once on mount is deliberate — re-running would
    // re-apply the quote over edits the customer has since made.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(next: CartLine[]) {
    setLines(next);
    writeCart(next);
  }

  const resolved = resolveCart(lines);
  const totals = cartTotals(resolved);

  const location = [area.trim(), state].filter(Boolean).join(', ');
  const canSubmit =
    resolved.length > 0 &&
    name.trim().length > 1 &&
    phone.trim().replace(/\D/g, '').length >= 10 &&
    !!state &&
    status !== 'submitting';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/order-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          location,
          note: note.trim() || undefined,
          // brandSlug + model + qty only. The server re-prices from the
          // catalogue — we never send a figure it could trust.
          lines: resolved.map((l) => ({ brandSlug: l.brandSlug, model: l.model, qty: l.qty })),
          quoteCode: quoteCode || undefined,
          needsInstall,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || 'Request failed');
      setResult({
        reference: String(data.reference),
        emailed: !!data.emailed,
        stored: !!data.stored,
        totals: data.totals,
        lines: data.lines ?? [],
      });
      writeCart([]); // it's with us now — don't let it be sent twice
      setLines([]);
      track('order_submit', { quoteCode: quoteCode ?? undefined, amount: data.totals?.best });
      setStatus('done');
    } catch {
      // Our server being down must not cost the customer their order —
      // WhatsApp still works, and that is where we actually reply.
      setStatus('error');
    }
  }

  // ── Success / failure ──────────────────────────────────

  if (status === 'done' && result) {
    const waText =
      `Hi SolarBuilders, this is ${name.trim()}${location ? ` from ${location}` : ''}.\n` +
      `I just sent order request ${result.reference} on your website ` +
      `(${result.totals.items} item${result.totals.items === 1 ? '' : 's'}, about ${formatNaira(result.totals.best)} at your listed prices).\n` +
      (needsInstall ? 'I also want installation.\n' : 'Supply only, no installation.\n') +
      `Please confirm today's price and the next step.`;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <h1 className="font-heading font-extrabold text-slate-900 text-3xl md:text-4xl">We have your order request</h1>
        <p className="text-slate-500 mt-3">
          Your reference is{' '}
          <span className="font-mono font-semibold text-slate-900">{result.reference}</span>. Nothing has been charged
          and nothing is owed. We now confirm today&apos;s price with the distributor and come back to you with a final
          figure.
        </p>

        {!result.emailed && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 text-left flex gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              Being straight with you: the email to our team did not go out{result.stored ? ', though your request was saved' : ''}.
              Send it to us on WhatsApp with the button below so nothing gets lost.
            </span>
          </p>
        )}

        <div className="border border-slate-100 rounded-2xl p-5 mt-6 text-left">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-3">What we&apos;re pricing</p>
          <ul className="space-y-2">
            {result.lines.map((l) => (
              <li key={`${l.brandSlug}::${l.model}`} className="flex justify-between gap-4 text-sm">
                <span className="text-slate-700">
                  {l.qty}× {l.brandName} {l.model}
                </span>
                <span className="text-slate-500 whitespace-nowrap">{formatNaira(l.lineBest)}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 mt-4 pt-4 flex justify-between items-baseline">
            <span className="text-sm text-slate-500">Equipment, midpoint</span>
            <span className="font-heading font-extrabold text-slate-900 text-xl">{formatNaira(result.totals.best)}</span>
          </div>
          <p className="text-xs text-slate-500 text-right mt-1">
            {result.totals.low === result.totals.high
              ? 'Every line has one listed price, so this is exact at the prices we checked'
              : `${formatNaira(result.totals.low)} – ${formatNaira(result.totals.high)} across the listings we checked`}
          </p>
        </div>

        <WhatsAppLink
          text={waText}
          placement="cart_success"
          className="mt-6 w-full bg-[#0E7568] hover:bg-[#075E54] text-white py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" /> Continue on WhatsApp
        </WhatsAppLink>

        <Link href="/shop" className="block mt-4 text-sm text-slate-500 hover:text-slate-600">
          Back to equipment prices
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    const waText =
      `Hi SolarBuilders, this is ${name.trim()}${location ? ` from ${location}` : ''}.\n` +
      `Your website couldn't send my order request, so here it is:\n` +
      resolved.map((l) => `• ${l.qty}× ${l.brand.name} ${l.product.model}`).join('\n') +
      (needsInstall ? '\nI also want installation.' : '\nSupply only, no installation.') +
      (note.trim() ? `\n\nNote: ${note.trim()}` : '') +
      `\n\nPlease confirm the price.`;

    return (
      <div className="max-w-2xl mx-auto text-center">
        <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="font-heading font-extrabold text-slate-900 text-3xl">That didn&apos;t send</h1>
        <p className="text-slate-500 mt-3">
          We couldn&apos;t record your request just now — that&apos;s on us, not you. Your list is still here, and
          WhatsApp works. Tap below and it opens with your items already written out.
        </p>
        <WhatsAppLink
          text={waText}
          placement="cart_error"
          className="mt-6 w-full bg-[#0E7568] hover:bg-[#075E54] text-white py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" /> Send it on WhatsApp
        </WhatsAppLink>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-slate-500 hover:text-slate-600"
        >
          Try the form again
        </button>
      </div>
    );
  }

  // ── Loading (pre-mount) ────────────────────────────────

  if (!mounted) {
    return (
      <div className="max-w-2xl">
        <h1 className="font-heading font-extrabold text-slate-900 text-3xl md:text-4xl">Your order request</h1>
        <p className="text-slate-500 mt-3 text-sm">Loading your list…</p>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────

  if (resolved.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-8">
        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h1 className="font-heading font-extrabold text-slate-900 text-3xl">Your order request is empty</h1>
        <p className="text-slate-500 mt-3">
          Add equipment and we&apos;ll source it at the brand&apos;s market price. You pay nothing until we confirm
          today&apos;s price with the distributor.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#0A0F1E] text-white rounded-full px-6 py-3 font-semibold text-sm hover:bg-slate-700 transition-colors"
          >
            <ClipboardList className="w-4 h-4" /> Browse equipment prices
          </Link>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors"
          >
            <Calculator className="w-4 h-4" /> Size my system first
          </Link>
        </div>
      </div>
    );
  }

  // ── The order ──────────────────────────────────────────

  const inputCls =
    'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors text-sm';

  return (
    <div>
      <h1 className="font-heading font-extrabold text-slate-900 text-3xl md:text-4xl">Your order request</h1>
      <p className="text-slate-500 mt-3 max-w-2xl">
        This is a request, not a purchase. Send it and we confirm today&apos;s price with the distributor, then come
        back to you with a final figure. We take no card payment on this site.
      </p>

      {quoteCode && (
        <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Filled from quote <span className="font-mono font-semibold">{quoteCode}</span>. Change any quantity below —
            the quote is a starting point, not a fixed kit.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8 items-start">
        {/* Lines */}
        <div className="space-y-3">
          {resolved.map((l) => (
            <div key={`${l.brandSlug}::${l.model}`} className="border border-slate-100 rounded-2xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <BrandMark brand={{ slug: l.brand.slug, name: l.brand.name, logo: l.brand.logo }} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">{l.brand.name}</p>
                  <p className="font-heading font-bold text-slate-900 leading-tight break-words">{l.product.model}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{l.product.spec}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {l.product.priceLow === l.product.priceHigh
                      ? `${formatNaira(l.product.priceLow)} each`
                      : `${formatNaira(l.product.priceLow)} – ${formatNaira(l.product.priceHigh)} each`}
                  </p>
                  {l.product.excludeFromAutoMatch && (
                    <p className="text-[11px] text-amber-700 mt-2">{l.product.excludeFromAutoMatch}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => update(setLineQty(lines, l.brandSlug, l.model, 0))}
                  aria-label={`Remove ${l.brand.name} ${l.product.model}`}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mt-4">
                <div className="flex items-center border border-slate-200 rounded-full">
                  <button
                    type="button"
                    onClick={() => update(setLineQty(lines, l.brandSlug, l.model, l.qty - 1))}
                    aria-label={`Fewer ${l.product.model}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-slate-900">{l.qty}</span>
                  <button
                    type="button"
                    onClick={() => update(setLineQty(lines, l.brandSlug, l.model, l.qty + 1))}
                    aria-label={`More ${l.product.model}`}
                    className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-heading font-extrabold text-slate-900">{formatNaira(l.lineBest)}</p>
                  {l.lineLow !== l.lineHigh && (
                    <p className="text-[11px] text-slate-500">
                      {formatNaira(l.lineLow)} – {formatNaira(l.lineHigh)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {unmatched.length > 0 && (
            <div className="border border-dashed border-slate-200 rounded-2xl p-5">
              <p className="font-heading font-bold text-slate-900 text-sm">
                Quoted separately, not sold as catalogue items
              </p>
              <p className="text-xs text-slate-500 mt-1">
                These are part of the job but priced per site, so they are not in the totals above. We price them once
                we know your roof, run lengths and location.
              </p>
              <ul className="mt-3 space-y-1.5">
                {unmatched.map((u) => (
                  <li key={u} className="flex items-start gap-2 text-sm text-slate-600">
                    <Wrench className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-1" />
                    <span>{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link href="/shop" className="inline-block text-sm font-semibold text-amber-700 hover:text-amber-800 pt-1">
            ← Add more equipment
          </Link>
        </div>

        {/* Totals + form */}
        <div className="lg:sticky lg:top-6 space-y-4">
          <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/60">
            <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
              Equipment total ({totals.items} item{totals.items === 1 ? '' : 's'})
            </p>
            <p className="font-heading font-extrabold text-slate-900 text-3xl mt-1">{formatNaira(totals.best)}</p>
            <p className="text-sm text-slate-500 mt-1">
              {totals.low === totals.high
                ? 'Every line has one listed price, so this is exact at the prices we checked'
                : `${formatNaira(totals.low)} – ${formatNaira(totals.high)} across the listings we checked`}
            </p>
            <p className="text-[11px] text-slate-500 mt-3">
              Midpoint of real Nigerian listings from {pricesAsOfLabel}. Not a quote, and not a bill — we confirm
              today&apos;s price with the distributor before you pay anyone.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border border-slate-100 rounded-2xl p-5 space-y-3">
            <div>
              <h2 className="font-heading font-extrabold text-slate-900 text-xl">Where do we send the price?</h2>
              <p className="text-xs text-slate-500 mt-1">We reply on WhatsApp. No card details, ever.</p>
            </div>

            <div>
              <label htmlFor="ord-name" className="block text-xs font-semibold text-slate-900 mb-1">
                Your name *
              </label>
              <input id="ord-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tunde Adeyemi" required />
            </div>
            <div>
              <label htmlFor="ord-phone" className="block text-xs font-semibold text-slate-900 mb-1">
                WhatsApp number *
              </label>
              <input id="ord-phone" className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0803 000 0000" required />
            </div>
            <div>
              <label htmlFor="ord-email" className="block text-xs font-semibold text-slate-900 mb-1">
                Email (optional)
              </label>
              <input id="ord-email" className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="ord-state" className="block text-xs font-semibold text-slate-900 mb-1">
                  State *
                </label>
                <select id="ord-state" className={inputCls} value={state} onChange={(e) => setState(e.target.value)} required>
                  <option value="">Select</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ord-area" className="block text-xs font-semibold text-slate-900 mb-1">
                  Area / town
                </label>
                <input id="ord-area" className={inputCls} value={area} onChange={(e) => setArea(e.target.value)} placeholder="Lekki Phase 1" />
              </div>
            </div>
            <div>
              <label htmlFor="ord-note" className="block text-xs font-semibold text-slate-900 mb-1">
                Anything we should know?
              </label>
              <textarea id="ord-note" className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. corrugated roof, need it before December, I already have panels…" />
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={needsInstall}
                onChange={(e) => setNeedsInstall(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-500"
              />
              <span className="text-sm text-slate-700">
                I also want installation
                <span className="block text-xs text-slate-500">
                  Quoted per job once we know the site. Untick for supply only.
                </span>
              </span>
            </label>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full py-4 rounded-full font-heading font-bold text-base transition-colors ${
                canSubmit ? 'bg-[#0A0F1E] text-white hover:bg-slate-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {status === 'submitting' ? 'Sending…' : 'Request this order'}
            </button>
            <p className="text-[11px] text-slate-500 text-center">
              Sending this costs nothing and commits you to nothing. We confirm the price before you pay anyone.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CartClient({ pricesAsOfLabel }: { pricesAsOfLabel: string }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl">
          <h1 className="font-heading font-extrabold text-slate-900 text-3xl md:text-4xl">Your order request</h1>
          <p className="text-slate-400 mt-3 text-sm">Loading your list…</p>
        </div>
      }
    >
      <CartInner pricesAsOfLabel={pricesAsOfLabel} />
    </Suspense>
  );
}
