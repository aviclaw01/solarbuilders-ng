'use client';

import Link from 'next/link';
import { ArrowRight, BatteryCharging, PiggyBank, Sun, TriangleAlert, Wallet, Zap } from 'lucide-react';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import {
  bestBuildWithin,
  nearestBudgetPoint,
  walkBill,
  type BudgetLookupData,
  type LookupBuild,
  type LookupShortfall,
} from '@/lib/budget-lookup';

// Wording mirrors app/budget/[slug]/page.tsx so a visitor who reads both gets the same answer in the same voice.

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

/** "an 8kVA", "a 5kVA" — the engine's standard sizes include 8, 11 and 18. */
function article(kva: number): string {
  return /^(8|11|18)/.test(num(kva)) ? 'an' : 'a';
}

function batteryWord(b: LookupBuild): string {
  return b.battery === 'tubular' ? 'tubular (lead-acid)' : 'lithium';
}

function describe(b: LookupBuild): string {
  return (
    `${article(b.inverterKva)} ${num(b.inverterKva)}kVA inverter, ${num(b.batteryKwh)}kWh of ${batteryWord(b)} battery ` +
    `and ${b.panelCount} × ${b.panelWatts}W panels`
  );
}

function budgetLabel(amount: number): string {
  return amount >= 1000 ? formatNairaShort(amount) : formatNaira(amount);
}

/** What the covered part of the bill honestly amounts to — see shortfallVerdict() on the budget pages. */
function verdict(s: LookupShortfall): string {
  const panels = s.covered.find((l) => l.line.key === 'panels');
  if (!panels || panels.qtyCovered === 0) {
    return (
      'Without a single panel that is not a solar system at all — it is an inverter and a battery that charge off ' +
      'the grid. It makes no electricity of its own.'
    );
  }
  if (panels.fullyCovered) {
    return 'That is the equipment and nothing paid to the person fitting it, which is the one line of a solar bill you cannot do without.';
  }
  return 'One panel is not an array. It charges nothing meaningful on its own, and the rest of the bill is still unpaid.';
}

interface Props {
  data: BudgetLookupData;
  /** Digits only, as typed. Empty until the visitor names an amount. */
  digits: string;
  onDigitsChange: (digits: string) => void;
  onOpenQuote: (build: LookupBuild) => void;
}

export default function BudgetMode({ data, digits, onDigitsChange, onOpenQuote }: Props) {
  const amount = digits ? Number(digits) : 0;
  const build = amount > 0 ? bestBuildWithin(data, amount) : null;
  const shortfall = amount > 0 && !build ? walkBill(data, amount) : null;
  const point = amount > 0 ? nearestBudgetPoint(data, amount) : null;
  const label = budgetLabel(amount);

  return (
    <section aria-labelledby="budget-heading">
      <h2 id="budget-heading" className="font-heading font-bold text-[#0A0F1E] text-xl mb-1">
        What does your budget buy?
      </h2>
      <p className="text-[#64748B] text-sm mb-6 leading-relaxed">
        Name the money. The same engine as the appliance calculator works out the most capable complete system it pays
        for — installed, with panels, wiring and labour — at Nigerian prices checked {PRICES_LAST_UPDATED_LABEL}.
      </p>

      <label htmlFor="budget-amount" className="block font-heading font-semibold text-[#0A0F1E] text-sm mb-2">
        Your budget in naira
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-bold text-2xl text-[#64748B] pointer-events-none"
        >
          ₦
        </span>
        <input
          id="budget-amount"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={digits ? Number(digits).toLocaleString('en-NG') : ''}
          // Strip everything but digits so pasted "₦2,000,000" or "2 000 000" both work.
          onChange={(e) => onDigitsChange(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11))}
          placeholder="Type an amount"
          aria-describedby="budget-amount-hint"
          className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-[#E2E8F0] bg-white font-heading font-bold text-2xl text-[#0A0F1E] placeholder:text-[#64748B] placeholder:font-medium placeholder:text-lg focus:outline-none focus-visible:border-[#F59E0B] focus-visible:ring-4 focus-visible:ring-[#F59E0B]/25"
        />
      </div>
      <p id="budget-amount-hint" className="text-xs text-[#64748B] mt-2">
        The total you can spend, installation included.
      </p>

      <div role="group" aria-label="Common budgets" className="flex flex-wrap gap-2 mt-4">
        {data.points.map((p) => {
          const active = amount === p.amount;
          return (
            <button
              key={p.slug}
              type="button"
              aria-pressed={active}
              onClick={() => onDigitsChange(String(p.amount))}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2 ${
                active
                  ? 'bg-[#0A0F1E] border-[#0A0F1E] text-white'
                  : 'bg-white border-[#E2E8F0] text-[#0A0F1E] hover:border-[#F59E0B]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* One short sentence for screen readers, rather than re-announcing the whole card on every keystroke. */}
      <p className="sr-only" aria-live="polite">
        {build
          ? `${label} buys ${describe(build)}, ${formatNaira(build.price)} installed.`
          : shortfall
            ? `${label} is not a complete solar system yet. It is ${formatNaira(shortfall.shortBy)} short.`
            : ''}
      </p>

      {build && (
        <Affordable
          data={data}
          build={build}
          amount={amount}
          label={label}
          pointSlug={point?.slug}
          pointLabel={point?.label}
          onOpenQuote={onOpenQuote}
        />
      )}
      {shortfall && (
        <Shortfall
          data={data}
          shortfall={shortfall}
          label={label}
          pointSlug={point?.slug}
          pointLabel={point?.label}
          onOpenQuote={onOpenQuote}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────
// The budget buys a complete system
// ─────────────────────────────────────────────────────────

function Affordable({
  data,
  build,
  amount,
  label,
  pointSlug,
  pointLabel,
  onOpenQuote,
}: {
  data: BudgetLookupData;
  build: LookupBuild;
  amount: number;
  label: string;
  pointSlug?: string;
  pointLabel?: string;
  onOpenQuote: (build: LookupBuild) => void;
}) {
  const leftover = amount - build.price;
  const next = data.frontier[data.frontier.indexOf(build) + 1];
  const stats = [
    { icon: Zap, label: 'Inverter', value: `${num(build.inverterKva)}kVA` },
    { icon: BatteryCharging, label: 'Battery', value: `${num(build.batteryKwh)}kWh ${build.battery}` },
    { icon: Sun, label: 'Panels', value: `${build.panelCount} × ${build.panelWatts}W` },
    { icon: Wallet, label: 'Installed', value: formatNaira(build.price) },
  ];

  return (
    <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
      <p className="text-xs uppercase tracking-widest font-semibold text-amber-700 mb-2">What {label} buys</p>
      <h3 className="font-heading font-extrabold text-[#0A0F1E] text-xl leading-snug mb-5">
        {describe(build).replace(/^./, (c) => c.toUpperCase())}
      </h3>

      <dl className="grid grid-cols-2 gap-3">
        {stats.map(({ icon: Icon, label: statLabel, value }) => (
          <div key={statLabel} className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
            <dt className="flex items-center gap-1.5 text-[#64748B] text-xs uppercase tracking-wide mb-1">
              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              {statLabel}
            </dt>
            <dd className="font-heading font-extrabold text-[#0A0F1E] text-lg">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="text-slate-700 text-sm mt-5 leading-relaxed">
        Built to carry {data.rungs[build.rung].summary}, with about {build.autonomyHours} hours of backup after dark.{' '}
        {formatNaira(build.price)} is the realistic middle; across Nigerian suppliers the same build runs{' '}
        {formatRange({ low: build.low, best: build.price, high: build.high })}.
      </p>
      <p className="text-slate-700 text-sm mt-3 leading-relaxed">
        {leftover > 0 ? `That leaves ${formatNaira(leftover)} of your ${label}. ` : ''}
        {next
          ? leftover > 0
            ? `The next step up costs ${formatNaira(next.price)}, so that is change rather than an upgrade.`
            : ''
          : 'This is the largest build our budget table prices. With more to spend, tick your actual appliances instead — the calculator sizes any load.'}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          type="button"
          onClick={() => onOpenQuote(build)}
          className="inline-flex items-center justify-center gap-2 bg-[#0A0F1E] text-white font-heading font-semibold px-6 py-3 rounded-full hover:bg-[#1E293B] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2"
        >
          Get this quote <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        {pointSlug && (
          <Link
            href={`/budget/${pointSlug}`}
            className="inline-flex items-center justify-center gap-2 bg-white border border-[#E2E8F0] text-[#0A0F1E] font-semibold px-6 py-3 rounded-full hover:border-[#F59E0B] transition-colors"
          >
            The full {pointLabel} answer
          </Link>
        )}
      </div>
      <p className="text-xs text-[#64748B] mt-3">
        Opens the itemised bill for this build, where you can change the battery or component class, download it as a
        PDF, share it or send it to us.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// The budget does not buy a complete system
// ─────────────────────────────────────────────────────────

function Shortfall({
  data,
  shortfall: s,
  label,
  pointSlug,
  pointLabel,
  onOpenQuote,
}: {
  data: BudgetLookupData;
  shortfall: LookupShortfall;
  label: string;
  pointSlug?: string;
  pointLabel?: string;
  onOpenQuote: (build: LookupBuild) => void;
}) {
  const cheapest = data.frontier[0];
  const firstViable = data.points.find((p) => p.amount >= cheapest.price);

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <div className="flex items-start gap-2 mb-3">
        <TriangleAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <h3 className="font-heading font-extrabold text-[#0A0F1E] text-xl leading-snug">
          {label} is not a complete solar system yet
        </h3>
      </div>
      <p className="text-slate-700 text-sm leading-relaxed">
        The cheapest complete install we can price is {formatNaira(cheapest.price)}: {describe(cheapest)}, the mounting
        and cabling, and the installer. So {label} is{' '}
        <strong className="font-semibold text-[#0A0F1E]">{formatNaira(s.shortBy)} short</strong>. We would rather tell
        you that than sell you a system that disappoints you.
      </p>

      <h4 className="font-heading font-semibold text-[#0A0F1E] text-sm mt-5 mb-2">Where {label} stops</h4>
      <ul className="bg-white rounded-2xl border border-[#E2E8F0] divide-y divide-[#F1F5F9] text-sm">
        {s.covered.map(({ line, qtyCovered, fullyCovered }) => (
          <li key={line.key} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
            <span className="text-[#0A0F1E]">{line.item}</span>
            <span className={`whitespace-nowrap font-medium ${fullyCovered ? 'text-[#64748B]' : 'text-amber-700'}`}>
              {qtyCovered} of {line.qty} covered
            </span>
          </li>
        ))}
      </ul>
      <p className="text-slate-700 text-sm mt-3 leading-relaxed">
        Spent down that bill in the order an installer buys it, the money runs out at the{' '}
        {s.stoppedAt.item.toLowerCase()} line, {formatNaira(s.spentBefore)} in. {verdict(s)}
      </p>

      <h4 className="font-heading font-semibold text-[#0A0F1E] text-sm mt-6 mb-3">What you can honestly do</h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <PiggyBank className="w-5 h-5 text-amber-700 mb-2" aria-hidden="true" />
          <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-1">Save to the whole bill</p>
          <p className="text-[#64748B] text-xs leading-relaxed">
            {formatNaira(cheapest.price)} is the number to save to.
            {firstViable ? ` ${firstViable.label} is the first budget we price that buys a system worth having.` : ''}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <Zap className="w-5 h-5 text-amber-700 mb-2" aria-hidden="true" />
          <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-1">See the cheapest complete build</p>
          <p className="text-[#64748B] text-xs leading-relaxed mb-3">
            Itemised, with what it carries: {data.rungs[cheapest.rung].summary}.
          </p>
          <button
            type="button"
            onClick={() => onOpenQuote(cheapest)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A0F1E] hover:text-amber-700 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A0F1E] focus-visible:ring-offset-2"
          >
            Open that quote <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4">
          <Wallet className="w-5 h-5 text-amber-700 mb-2" aria-hidden="true" />
          <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-1">Pay small small</p>
          <p className="text-[#64748B] text-xs leading-relaxed mb-3">
            Instalment and lease-to-own schemes exist in Nigeria. We have written up how they work and where the costs
            hide, rather than quote terms we do not set.
          </p>
          <Link
            href="/blog/solar-loans-nigeria"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A0F1E] hover:text-amber-700 transition-colors"
          >
            Read that first <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {pointSlug && (
        <Link
          href={`/budget/${pointSlug}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A0F1E] hover:text-amber-700 mt-5"
        >
          The full answer for {pointLabel}, line by line <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
