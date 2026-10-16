'use client';

import { useState } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { GROWTH_ALLOWANCE, type Quote, type TierQuote } from '@/lib/quote';
import { DEFAULT_RUNS, electricalSheet, type CableRun, type RunLengths } from '@/lib/electrical';

/**
 * The engineer's working for the chosen tier: load → overload allowance →
 * inverter, battery, panels → charge controller → breakers and cables with the
 * voltage drop for each run. Figures come from lib/electrical.ts; nothing here
 * is priced, so it shows on the installer brief too.
 */
export default function SizingSheet({ quote, t }: { quote: Quote; t: TierQuote }) {
  const [runs, setRuns] = useState<Required<RunLengths>>(DEFAULT_RUNS);
  const e = electricalSheet(t, quote, runs);
  const inv = e.inverter;
  const kw = (w: number) => `${(w / 1000).toFixed(2)}kW`;
  const carries = inv.continuousW >= inv.designPeakW;
  const starts = inv.surgeW >= inv.startW;

  const setRun = (k: keyof RunLengths, v: string) => {
    const n = Math.round(Number(v));
    if (Number.isFinite(n) && n >= 1 && n <= 100) setRuns((r) => ({ ...r, [k]: n }));
  };

  const steps: { title: string; lines: React.ReactNode[] }[] = [
    {
      title: '1. Your load',
      lines: [
        `Everything on at once: ${kw(quote.peakWatts)} · ${quote.dailyKwh}kWh a day`,
        `+${Math.round((GROWTH_ALLOWANCE - 1) * 100)}% overload allowance (what you forgot, what you add later): designed for ${kw(inv.designPeakW)}`,
        quote.surgeWatts > 0
          ? `Largest motor starting (AC, pump or fridge) adds ${kw(quote.surgeWatts)} for a second: ${kw(inv.startW)} at the start`
          : 'No motor loads, so no starting surge to allow for',
        quote.backupHours
          ? `Must run ${quote.backupHours}h with no grid`
          : `No backup hours chosen — sized for a home with some grid`,
      ],
    },
    {
      title: `2. Inverter: ${t.inverterKva}kVA, ${e.systemVolts}V`,
      lines: [
        <Ok key="c" ok={carries}>
          Run at most 80% continuously: carries {kw(inv.continuousW)} against your {kw(inv.designPeakW)} ({inv.loadingPct}% loaded)
        </Ok>,
        <Ok key="s" ok={starts}>
          Surge about 2× rating: {kw(inv.surgeW)} against {kw(inv.startW)} at a motor start
        </Ok>,
      ],
    },
    {
      title: `3. Battery: ${t.batteryKwh}kWh`,
      lines: [
        `${t.batteryModules} × ${t.batteryType === 'tubular' ? '200Ah 12V tubular' : `${(t.batteryKwh / t.batteryModules).toFixed(2)}kWh lithium`} on a ${e.systemVolts}V bank`,
        `Runs your list for about ${t.autonomyHours}h with no grid or sun`,
      ],
    },
    {
      title: `4. Panels: ${t.panelCount} × ${t.panelWatts}W (${t.arrayKwp}kWp)`,
      lines: [
        `${e.pv.strings} string${e.pv.strings > 1 ? 's' : ''} of ${e.pv.panelsPerString} panels · up to ${e.pv.stringVoc}V open-circuit, ~${e.pv.stringVmp}V working`,
      ],
    },
    {
      title: '5. Charge controller',
      lines: [
        `Built into the hybrid inverter (MPPT). It must accept ${kw(e.pv.arrayW)} of panels, ${e.pv.stringVoc}V per string, and charge at ${e.pv.mpptChargeAmps}A or more`,
        `Not a hybrid? Buy a ${e.systemVolts}V MPPT controller rated ${e.pv.mpptChargeAmps}A+ and ${e.pv.stringVoc}V+ PV input`,
      ],
    },
  ];

  const cables: { label: string; key: keyof RunLengths; breaker: string; c: CableRun }[] = [
    { label: 'Battery → inverter', key: 'batteryM', breaker: `${e.battery.breakerA}A DC breaker + fuse`, c: e.battery.cable },
    {
      label: `Panels → inverter${e.pv.strings > 1 ? ' (each string)' : ''}`,
      key: 'pvM',
      breaker: `${e.pv.breakerA}A DC breaker + DC surge protector`,
      c: e.pv.cable,
    },
    { label: 'Inverter → house DB', key: 'acM', breaker: `${e.ac.breakerA}A 2-pole AC breaker + AC surge protector`, c: e.ac.cable },
  ];

  return (
    <section className="mt-6" aria-labelledby="sizing-sheet">
      <p id="sizing-sheet" className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-3">
        How this system is sized
      </p>
      <div className="space-y-3">
        {steps.map((s) => (
          <div key={s.title}>
            <p className="text-sm font-semibold text-slate-900">{s.title}</p>
            <ul className="mt-1 space-y-0.5">
              {s.lines.map((l, i) => (
                <li key={i} className="text-sm text-slate-600 leading-snug">
                  {l}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-sm font-semibold text-slate-900 mt-4">6. Breakers, cables and voltage drop</p>
      <div className="overflow-x-auto -mx-1 mt-1">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <th className="text-left font-semibold py-1.5 px-1">Run</th>
              <th className="text-right font-semibold py-1.5 px-1">Length (m)</th>
              <th className="text-right font-semibold py-1.5 px-1">Current</th>
              <th className="text-left font-semibold py-1.5 px-1">Protection</th>
              <th className="text-right font-semibold py-1.5 px-1">Cable</th>
              <th className="text-right font-semibold py-1.5 px-1">Voltage drop</th>
            </tr>
          </thead>
          <tbody>
            {cables.map(({ label, key, breaker, c }) => (
              <tr key={key} className="border-b border-slate-100 align-top">
                <td className="py-1.5 px-1 text-slate-900">{label}</td>
                <td className="py-1.5 px-1 text-right">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={runs[key]}
                    onChange={(ev) => setRun(key, ev.target.value)}
                    aria-label={`${label} cable length in metres`}
                    className="w-14 px-1.5 py-0.5 rounded-md border border-slate-200 text-right text-sm focus:outline-none focus:border-amber-500"
                  />
                </td>
                <td className="py-1.5 px-1 text-right whitespace-nowrap">
                  {c.amps}A @ {c.volts}V
                </td>
                <td className="py-1.5 px-1 text-slate-600">{breaker}</td>
                <td className="py-1.5 px-1 text-right whitespace-nowrap font-semibold">{c.mm2}mm²</td>
                <td className={`py-1.5 px-1 text-right whitespace-nowrap ${c.dropPct > c.limitPct ? 'text-rose-600' : ''}`}>
                  {c.dropVolts}V · {c.dropPct}% <span className="text-slate-500 text-xs">(max {c.limitPct}%)</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500 mt-2 leading-snug">
        Copper cable, one-way length; change a length and the cable re-sizes. Breakers are 125% of the full-load current,
        and each cable is rated at least as high as its breaker. Your installer confirms the runs on site.
      </p>
    </section>
  );
}

function Ok({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  const Icon = ok ? Check : AlertTriangle;
  return (
    <span className="inline-flex items-start gap-1.5">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ok ? 'text-emerald-600' : 'text-rose-600'}`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
}
