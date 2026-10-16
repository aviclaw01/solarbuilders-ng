'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BACKUP_HOURS, INVERTER_SIZES, type QuoteAppliance, type TierOptions } from '@/lib/quote';
import { LITHIUM_MODULE_KWH } from '@/lib/prices';
import type { LiteCatalogue, LiteProduct } from '@/lib/catalogue-lite';

/**
 * "I know some specs": the buyer fills in what they already know (an inverter
 * size, how many batteries, how many panels, any brand) and leaves the rest as
 * "Not sure". We build a typical load for that inverter so the engine can fill
 * the gaps, then pin every answer they gave as an override. The result opens
 * in the normal quote view, where all of it stays adjustable.
 */

export interface SpecBuild {
  appliances: QuoteAppliance[];
  options: TierOptions;
  backupHours?: number;
}

/** Average draw of a home as a share of its inverter rating, across the day. */
const TYPICAL_AVERAGE_LOAD = 0.1;

function inverterFor(kva: number | null, batteries: number | null, panels: number | null): number {
  if (kva) return kva;
  // ~2kWh of lithium per kVA, ~1 600W panel per kVA: the pairings installers use.
  if (batteries) return INVERTER_SIZES.find((k) => k >= (batteries * LITHIUM_MODULE_KWH) / 2) ?? 20;
  if (panels) return INVERTER_SIZES.find((k) => k >= panels * 0.6) ?? 20;
  return 5;
}

export function specToBuild(s: {
  kva: number | null;
  batteries: number | null;
  battery: 'lithium' | 'tubular';
  panels: number | null;
  hours: number | null;
  inverterBrand: string;
  batteryBrand: string;
  panelBrand: string;
}): SpecBuild {
  const k = inverterFor(s.kva, s.batteries, s.panels);
  // Peak a k-kVA inverter carries at 80% after the 25% allowance, just under
  // the size so the engine lands on it; part of it runs all day.
  const peak = Math.round(((k * 1000 * 0.8) / 1.25) * 0.98);
  const avg = Math.round(k * 1000 * TYPICAL_AVERAGE_LOAD);
  const appliances: QuoteAppliance[] = [
    { id: 'spec_peak', name: `Peak load for a ${k}kVA system`, watts: peak - avg, qty: 1, hoursPerDay: 0 },
    { id: 'spec_base', name: 'Typical all-day use', watts: avg, qty: 1, hoursPerDay: 24 },
  ];
  const options: TierOptions = { inverterKva: s.kva ?? undefined };
  if (s.battery === 'tubular') options.battery = 'tubular';
  if (s.batteries) options.batteryModules = s.batteries;
  if (s.panels) options.panelCount = s.panels;
  if (s.inverterBrand) options.inverterBrand = s.inverterBrand;
  if (s.batteryBrand && s.battery === 'lithium') options.batteryBrand = s.batteryBrand;
  if (s.panelBrand) options.panelBrand = s.panelBrand;
  return { appliances, options, backupHours: s.hours ?? undefined };
}

const selectCls =
  'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-amber-500';

function brandsOf(list: LiteProduct[]): [string, string][] {
  const m = new Map<string, string>();
  for (const p of list) if (!m.has(p.slug)) m.set(p.slug, p.brand);
  return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
}

export default function SpecMode({ catalogue, onBuild }: { catalogue: LiteCatalogue; onBuild: (b: SpecBuild) => void }) {
  const [kva, setKva] = useState('');
  const [inverterBrand, setInverterBrand] = useState('');
  const [battery, setBattery] = useState<'lithium' | 'tubular'>('lithium');
  const [batteries, setBatteries] = useState('');
  const [batteryBrand, setBatteryBrand] = useState('');
  const [panels, setPanels] = useState('');
  const [panelBrand, setPanelBrand] = useState('');
  const [hours, setHours] = useState('');

  const num = (v: string) => (v ? Number(v) : null);
  const anything = kva || batteries || panels || inverterBrand || batteryBrand || panelBrand;

  const submit = () =>
    onBuild(
      specToBuild({
        kva: num(kva),
        batteries: num(batteries),
        battery,
        panels: num(panels),
        hours: num(hours),
        inverterBrand,
        batteryBrand,
        panelBrand,
      }),
    );

  const groups = [
    {
      title: 'Inverter',
      size: (
        <select value={kva} onChange={(e) => setKva(e.target.value)} className={selectCls} aria-label="Inverter size">
          <option value="">Size: not sure</option>
          {INVERTER_SIZES.map((k) => (
            <option key={k} value={k}>
              {k}kVA
            </option>
          ))}
        </select>
      ),
      brand: inverterBrand,
      setBrand: setInverterBrand,
      brands: brandsOf(catalogue.inverter),
    },
    {
      title: 'Batteries',
      size: (
        <div className="grid grid-cols-2 gap-2">
          <select value={battery} onChange={(e) => setBattery(e.target.value as 'lithium' | 'tubular')} className={selectCls} aria-label="Battery type">
            <option value="lithium">Lithium</option>
            <option value="tubular">Tubular</option>
          </select>
          <select value={batteries} onChange={(e) => setBatteries(e.target.value)} className={selectCls} aria-label="How many batteries">
            <option value="">How many: not sure</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {battery === 'lithium' ? `(${Math.round(n * LITHIUM_MODULE_KWH * 10) / 10}kWh)` : `× 200Ah`}
              </option>
            ))}
          </select>
        </div>
      ),
      brand: batteryBrand,
      setBrand: setBatteryBrand,
      brands: battery === 'lithium' ? brandsOf(catalogue.battery) : [],
    },
    {
      title: 'Solar panels',
      size: (
        <select value={panels} onChange={(e) => setPanels(e.target.value)} className={selectCls} aria-label="How many panels">
          <option value="">How many: not sure</option>
          {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} panel{n > 1 ? 's' : ''}
            </option>
          ))}
        </select>
      ),
      brand: panelBrand,
      setBrand: setPanelBrand,
      brands: brandsOf(catalogue.panel),
    },
  ];

  return (
    <section>
      <p className="text-sm text-slate-600 mb-4">
        Fill in what you know and leave the rest as &ldquo;not sure&rdquo;. We match the rest, then you can change any of it.
      </p>
      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.title} className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-heading font-semibold text-slate-900 mb-2">{g.title}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {g.size}
              {g.brands.length > 0 && (
                <select value={g.brand} onChange={(e) => g.setBrand(e.target.value)} className={selectCls} aria-label={`${g.title} brand`}>
                  <option value="">Brand: any</option>
                  {g.brands.map(([slug, name]) => (
                    <option key={slug} value={slug}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        ))}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <p className="text-sm font-heading font-semibold text-slate-900 mb-2">How long must it run with no grid?</p>
          <select value={hours} onChange={(e) => setHours(e.target.value)} className={selectCls} aria-label="Backup hours">
            <option value="">Not sure</option>
            {BACKUP_HOURS.map((h) => (
              <option key={h} value={h}>
                {h === 24 ? 'All day (24h)' : `${h} hours`}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button onClick={submit} disabled={!anything} className="btn btn-sun btn-lg w-full mt-5 disabled:opacity-50">
        Match the rest of my system <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </button>
      {!anything && <p className="text-xs text-slate-500 text-center mt-2">Pick at least one thing you know.</p>}
    </section>
  );
}
