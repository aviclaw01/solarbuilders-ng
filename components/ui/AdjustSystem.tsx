'use client';

import { Minus, Plus, RotateCcw } from 'lucide-react';
import { INVERTER_SIZES, type TierOptions, type TierQuote } from '@/lib/quote';
import type { LiteCatalogue, LiteProduct } from '@/lib/catalogue-lite';

/**
 * The buyer's own sizes and brands on the quote card: inverter rating, number
 * of battery modules, number of panels, and a brand for each. Every change goes
 * back through the quote engine, so breakers, cables, mounting, the sizing
 * sheet and the total re-size to match.
 */
export default function AdjustSystem({
  t,
  catalogue,
  onChange,
  onReset,
}: {
  t: TierQuote;
  catalogue?: LiteCatalogue;
  onChange: (patch: TierOptions) => void;
  onReset?: () => void;
}) {
  const brands = (list: LiteProduct[] | undefined) => {
    const seen = new Map<string, string>();
    for (const p of list ?? []) if (!seen.has(p.slug)) seen.set(p.slug, p.brand);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  };

  // With a brand chosen, step through that brand's own sizes.
  const invSizes = t.options.inverterBrand
    ? [...new Set((catalogue?.inverter ?? []).filter((p) => p.slug === t.options.inverterBrand).map((p) => p.size))].sort((a, b) => a - b)
    : [...INVERTER_SIZES];
  const stepKva = (dir: 1 | -1) => {
    const next = dir > 0 ? invSizes.find((k) => k > t.inverterKva) : [...invSizes].reverse().find((k) => k < t.inverterKva);
    if (next) onChange({ inverterKva: next });
  };
  const tubular = t.batteryType === 'tubular';
  const batStep = tubular ? (t.inverterKva >= 5 ? 4 : 2) : 1;

  const rows = [
    {
      label: 'Inverter',
      value: `${t.inverterKva}kVA`,
      dec: () => stepKva(-1),
      inc: () => stepKva(1),
      brand: t.options.inverterBrand ?? '',
      options: brands(catalogue?.inverter),
      setBrand: (slug: string) => onChange({ inverterBrand: slug || undefined, inverterKva: undefined }),
    },
    {
      label: tubular ? 'Batteries' : 'Battery modules',
      value: `${t.batteryModules} · ${t.batteryKwh}kWh`,
      dec: () => t.batteryModules - batStep >= 1 && onChange({ batteryModules: t.batteryModules - batStep }),
      inc: () => onChange({ batteryModules: Math.min(40, t.batteryModules + batStep) }),
      brand: t.options.batteryBrand ?? '',
      options: tubular ? [] : brands(catalogue?.battery),
      setBrand: (slug: string) => onChange({ batteryBrand: slug || undefined, batteryModules: undefined }),
    },
    {
      label: 'Solar panels',
      value: `${t.panelCount} × ${t.panelWatts}W`,
      dec: () => t.panelCount > 1 && onChange({ panelCount: t.panelCount - 1 }),
      inc: () => onChange({ panelCount: Math.min(100, t.panelCount + 1) }),
      brand: t.options.panelBrand ?? '',
      options: brands(catalogue?.panel),
      setBrand: (slug: string) => onChange({ panelBrand: slug || undefined, panelCount: undefined }),
    },
  ];

  return (
    <section className="mb-5 bg-white border border-slate-200 rounded-2xl p-4" aria-labelledby="adjust-title" data-track="adjust">
      <div className="flex items-center justify-between mb-3">
        <h2 id="adjust-title" className="text-sm font-heading font-semibold text-slate-900">
          Adjust this system
        </h2>
        {onReset && (
          <button onClick={onReset} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900">
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" /> Back to recommended
          </button>
        )}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[1fr_auto] sm:grid-cols-[120px_auto_1fr] items-center gap-x-3 gap-y-1.5">
            <p className="text-sm text-slate-600">{r.label}</p>
            <div className="flex items-center gap-2 justify-self-end sm:justify-self-start">
              <button
                onClick={r.dec}
                aria-label={`Less ${r.label.toLowerCase()}`}
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="min-w-[96px] text-center text-sm font-semibold text-slate-900 tabular-nums">{r.value}</span>
              <button
                onClick={r.inc}
                aria-label={`More ${r.label.toLowerCase()}`}
                className="w-9 h-9 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {r.options.length > 0 && (
              <select
                value={r.brand}
                onChange={(e) => r.setBrand(e.target.value)}
                aria-label={`${r.label} brand`}
                className="col-span-2 sm:col-span-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="">Any brand (market price)</option>
                {r.options.map(([slug, name]) => (
                  <option key={slug} value={slug}>
                    {name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-3 leading-snug">
        Change a size or brand and the breakers, cables, mounting and total re-size to match. A chosen brand is priced
        from its own seller listings.
      </p>
    </section>
  );
}
