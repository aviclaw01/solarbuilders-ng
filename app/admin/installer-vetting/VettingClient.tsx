'use client';

import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';

/** Weight × score(0-5) / 5. Weights sum to 100. */
const CRITERIA = [
  { key: 'reg', label: 'CAC / business registration', weight: 10, ask: '0 none · 3 registered, no paperwork shown · 5 CAC certificate seen and name matches the person' },
  { key: 'installs', label: '3 verifiable completed installs', weight: 20, ask: 'Call each client. 0 none · 2 one confirmed · 4 two confirmed · 5 three confirmed, and they would hire again' },
  { key: 'site', label: 'Site-visit result', weight: 20, ask: 'Send them to a real site to survey. 0 no-show · 3 turned up, vague · 5 correct load list, cable/earthing plan, sensible questions' },
  { key: 'cert', label: 'Brand certification / distributor backing', weight: 15, ask: 'Deye, Felicity or Growatt distributor will vouch. 0 none · 3 trained once · 5 listed certified installer, distributor confirms by phone' },
  { key: 'tools', label: 'Tools and safety gear', weight: 10, ask: 'Multimeter, clamp meter, crimper, torque screwdriver, harness, gloves, insulated tools. 0 none · 5 all seen' },
  { key: 'warranty', label: 'Warranty and after-sales promise', weight: 10, ask: 'Written workmanship warranty and call-out time. 0 none · 3 verbal only · 5 written, 12 months or more' },
  { key: 'price', label: 'Price transparency', weight: 10, ask: 'Itemised labour that matches our material list. 0 one lump sum · 5 itemised, no surprises' },
  { key: 'response', label: 'Response time', weight: 5, ask: 'Time to first reply on WhatsApp. 0 over 2 days · 3 same day · 5 under 1 hour' },
] as const;

const PASS = 75;
const TRIAL = 55;

const TRIAL_STEPS = [
  'Pilot scope: Lagos only, 3 jobs, one installer at a time. No second installer until job 1 passes.',
  'Hire one senior engineer on a day rate. They inspect every job: before (survey), during (wiring done, before power-up), after (commissioning).',
  'Pay terms agreed in writing before the job: equipment is bought and paid by us; the installer is paid labour only.',
  'Labour is paid in two parts: 50% when the equipment is on site and work starts, 50% only after the engineer signs off the photo checklist below.',
  'Any failed checklist item is fixed at the installer’s cost and re-photographed before the second payment.',
  'Customer signs off after a load test, and gets the installer’s warranty in writing.',
  'After each job, score it: checklist pass rate, days late, customer rating, rework needed. Three clean jobs = approved. One serious fault (no earthing, undersized cable, wrong breaker) = stop.',
];

const CHECKLIST = [
  { group: 'Earthing', items: ['Earth rod and clamp photographed, depth visible', 'Earth cable (16mm²) from rod to inverter and array frame', 'Earth resistance reading, if a tester is available'] },
  { group: 'Breakers', items: ['DC battery breaker/fuse size matches the plate (photo of rating)', 'AC input and output breakers labelled and rated', 'PV DC breaker per string, in the combiner box'] },
  { group: 'Surge protection', items: ['DC SPD in the PV box', 'AC SPD at the DB', 'SPD earth leads short and straight'] },
  { group: 'Cables', items: ['PV cable is solar-rated 4–6mm², not house wire', 'Battery cable size matches the inverter (photo of cable print)', 'Lugs crimped, no bare copper, torqued', 'Runs clipped or in conduit, no sharp bends, no cables on the floor'] },
  { group: 'Battery', items: ['Batteries fixed on a rack or shelf, level, not on bare floor', 'Ventilated, away from direct sun and water', 'Fire extinguisher mounted beside the bank', 'Tubular: terminals greased, equal cable lengths'] },
  { group: 'Labels and polarity', items: ['+/− polarity checked with a meter before connecting (photo)', 'Every breaker and isolator labelled', 'Panel strings labelled'] },
  { group: 'Panels', items: ['Frames earthed and rails bolted to the roof structure', 'Tilt and direction sensible, no shading', 'MC4 connectors fully seated'] },
  { group: 'Inverter settings', items: ['Screenshot or photo of battery type, charge and discharge limits', 'Grid/generator input and output priority set as agreed', 'Date and time set, wifi dongle connected if fitted'] },
  { group: 'Load test', items: ['Run the customer’s main loads together for 15 minutes, photo of the inverter load reading', 'Pull the grid: it switches over with no restart', 'Customer shown how to turn everything off safely'] },
] as const;

const OUTSIDE = [
  'Sell delivered equipment: we source, price and ship the kit to the state. No installer risk on our side.',
  'Send the install brief with it: the no-price material list, the wiring/breaker sizing sheet from the quote, and the photo checklist above.',
  'The buyer’s own local electrician installs. If they have none, ask the nearest brand distributor for a certified installer in that state.',
  'Remote commissioning: the installer sends the photo checklist on WhatsApp, we check it against the quote, and we say pass or fix before they power up.',
  'Warranty note: equipment warranty is the brand’s; workmanship is the installer’s. Say so in the order confirmation.',
  'Optional: charge a small fee for remote sign-off so it is a service, not a favour.',
];

export default function VettingClient() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [name, setName] = useState('');
  const [ticks, setTicks] = useState<Record<string, boolean>>({});

  const total = useMemo(
    () => Math.round(CRITERIA.reduce((s, c) => s + ((scores[c.key] ?? 0) / 5) * c.weight, 0)),
    [scores],
  );
  const scored = CRITERIA.filter((c) => scores[c.key] !== undefined).length;
  const hardStop = scores.installs === 0 || scores.site === 0;
  const verdict = hardStop || total < TRIAL ? 'reject' : total >= PASS ? 'pass' : 'trial';
  const verdictCopy = {
    pass: ['PASS', 'Approved for the Lagos pilot jobs, still under the paid-trial rules.', 'bg-emerald-50 border-emerald-300 text-emerald-900'],
    trial: ['TRIAL', 'One supervised paid trial job only. Decide after it.', 'bg-amber-50 border-amber-300 text-amber-900'],
    reject: ['REJECT', 'Do not send work. Re-score only if something real changes.', 'bg-red-50 border-red-300 text-red-900'],
  }[verdict];

  const checklistTotal = CHECKLIST.reduce((n, g) => n + g.items.length, 0);
  const done = Object.values(ticks).filter(Boolean).length;

  return (
    <div className="space-y-10 print:space-y-6">
      <style>{`@media print { aside, nav, .no-print { display: none !important; } main { max-width: none !important; padding: 0 !important; } body { background: #fff !important; } section { break-inside: avoid; } }`}</style>

      <div className="no-print">
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 hover:border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900">
          <Printer className="w-4 h-4" aria-hidden="true" /> Print this page
        </button>
      </div>

      {/* (a) Scorecard */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-heading font-bold text-slate-900 text-lg mb-1">1. Installer scorecard</h2>
        <p className="text-sm text-slate-600 mb-4">
          Score each line 0 to 5. Total out of 100. {PASS}+ pass, {TRIAL}–{PASS - 1} paid trial only, under {TRIAL} reject.
        </p>
        <label className="block mb-4">
          <span className="text-xs font-semibold text-slate-700">Installer / company</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full max-w-md border border-slate-200 rounded-xl px-3 py-2 text-sm" placeholder="Name, phone, area" />
        </label>
        <div className="space-y-3">
          {CRITERIA.map((c) => (
            <div key={c.key} className="border border-slate-100 rounded-xl p-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold text-slate-900 text-sm">{c.label} <span className="text-slate-500 font-normal">({c.weight} pts)</span></p>
                <div className="flex gap-1" role="radiogroup" aria-label={c.label}>
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={scores[c.key] === n}
                      onClick={() => setScores((p) => ({ ...p, [c.key]: n }))}
                      className={`w-9 h-9 rounded-lg border text-sm font-semibold ${scores[c.key] === n ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-800 border-slate-200 hover:border-amber-400'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-slate-500 mt-1.5 leading-snug">{c.ask}</p>
            </div>
          ))}
        </div>
        <div className={`mt-4 rounded-xl border p-4 ${verdictCopy[2]}`}>
          <p className="font-heading font-extrabold text-2xl">{total}/100 · {scored < CRITERIA.length ? 'incomplete' : verdictCopy[0]}</p>
          <p className="text-sm mt-1">
            {scored < CRITERIA.length ? `${CRITERIA.length - scored} criteria still unscored. Unscored counts as 0.` : verdictCopy[1]}
            {hardStop && ' A score of 0 on completed installs or site visit is an automatic reject, whatever the total.'}
          </p>
        </div>
      </section>

      {/* (b) Trial protocol */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-heading font-bold text-slate-900 text-lg mb-3">2. Paid trial jobs: Lagos pilot</h2>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-800 leading-relaxed">
          {TRIAL_STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <table className="mt-4 w-full text-sm border border-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs text-slate-600">
              <th className="p-2">Job</th><th className="p-2">Site / client</th><th className="p-2">Engineer sign-off</th><th className="p-2">Labour 2 paid</th><th className="p-2">Customer rating</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((n) => (
              <tr key={n} className="border-t border-slate-200 h-10"><td className="p-2 font-semibold">{n}</td><td /><td /><td /><td /></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* (c) Checklist */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
          <h2 className="font-heading font-bold text-slate-900 text-lg">3. Photo commissioning checklist</h2>
          <p className="text-sm font-semibold text-slate-700">{done}/{checklistTotal} ticked</p>
        </div>
        <p className="text-sm text-slate-600 mb-4">Every item needs a photo sent to us before the second labour payment. Tick when the photo is seen and correct.</p>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
          {CHECKLIST.map((g) => (
            <div key={g.group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1.5">{g.group}</p>
              <ul className="space-y-1.5">
                {g.items.map((it) => {
                  const id = `${g.group}:${it}`;
                  return (
                    <li key={id}>
                      <label className="flex items-start gap-2 text-sm text-slate-800 cursor-pointer">
                        <input type="checkbox" checked={!!ticks[id]} onChange={(e) => setTicks((p) => ({ ...p, [id]: e.target.checked }))} className="mt-0.5 w-4 h-4 accent-slate-900 flex-shrink-0" />
                        <span>{it}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
          <p className="border-b border-slate-400 pb-1">Engineer: </p>
          <p className="border-b border-slate-400 pb-1">Date / quote code: </p>
        </div>
      </section>

      {/* (d) Outside Lagos */}
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-heading font-bold text-slate-900 text-lg mb-3">4. Outside Lagos</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800 leading-relaxed">
          {OUTSIDE.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
