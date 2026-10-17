'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus, Zap } from 'lucide-react';
import { STEP1_APPLIANCES, STEP2_APPLIANCES, STEP3_APPLIANCES, presetsPayload } from '@/lib/appliances';
import { track } from '@/lib/track';

interface Props {
  brandSlug: string;
  brandName: string;
  /** ib= / bb= / pb= — which of the quote's lines this brand can price */
  brandParams: string;
}

const GROUPS = [
  { title: 'Big loads', items: STEP1_APPLIANCES },
  { title: 'Everyday', items: STEP2_APPLIANCES },
  { title: 'Small loads', items: STEP3_APPLIANCES },
];

/**
 * "What do you want to power?" on a brand page. Most brand-page enquiries
 * used to arrive as "I'm interested in <brand>" with nothing else; this hands
 * the calculator the load and the brand, so the WhatsApp message that comes
 * back carries a request code, the appliance list, the location and a budget.
 */
export default function BrandQuoteBuilder({ brandSlug, brandName, brandParams }: Props) {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, number>>({});
  const picked = Object.values(qty).filter((n) => n > 0).length;

  const bump = (id: string, d: number) =>
    setQty((prev) => ({ ...prev, [id]: Math.max(0, Math.min(20, (prev[id] ?? 0) + d)) }));

  function sizeIt() {
    if (!picked) return;
    track('cta_click', { placement: `brand_builder:${brandSlug}` });
    const extra = brandParams ? `&${brandParams}` : '';
    router.push(`/calculator?q=${presetsPayload(qty)}&tier=standard${extra}&brand=${brandSlug}`);
  }

  return (
    <section id="build" className="scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/40 p-5">
      <h2 className="font-heading font-bold text-slate-900 text-xl mb-1">What do you want to power?</h2>
      <p className="text-slate-600 text-sm mb-4">
        Tap what you&apos;ll run on solar. We size a {brandName} system for it and give you a code to send us.
      </p>

      <div className="space-y-4">
        {GROUPS.map((g) => (
          <div key={g.title}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{g.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {g.items.map((a) => {
                const n = qty[a.id] ?? 0;
                return (
                  <div
                    key={a.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 ${n ? 'border-amber-400' : 'border-slate-200'}`}
                  >
                    <button type="button" onClick={() => bump(a.id, n ? -n : 1)} className="flex-1 text-left text-sm text-slate-800 min-h-9">
                      <span aria-hidden="true">{a.emoji}</span> {a.name}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => bump(a.id, -1)}
                        disabled={!n}
                        aria-label={`One less ${a.name}`}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center disabled:opacity-30"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold tabular-nums" aria-live="polite">{n}</span>
                      <button
                        type="button"
                        onClick={() => bump(a.id, 1)}
                        aria-label={`One more ${a.name}`}
                        className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={sizeIt}
        disabled={!picked}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 px-6 py-3.5 font-heading font-bold text-base transition-colors"
      >
        <Zap className="w-4 h-4" /> {picked ? 'Size my quote' : 'Pick at least one appliance'}
      </button>
    </section>
  );
}
