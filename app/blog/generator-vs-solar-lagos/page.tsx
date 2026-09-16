import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import {
  ENERGY_COSTS_LAST_CHECKED_LABEL,
  GENSET_3KVA_LITRES_PER_HOUR,
  GENSET_HOURS_PER_DAY_ASSUMED,
  PETROL_PER_LITRE,
  generatorCostPerDay,
} from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'The True Cost of Generator vs Solar in Lagos (2026)',
  description:
    'A petrol generator priced at the pump, a solar system priced from our vendor research — both dated, both sourced, no invented monthly fuel figure. See what your own generator hours change.',
  keywords: [
    'generator vs solar Lagos',
    'solar vs generator Nigeria cost',
    'generator fuel cost Nigeria 2026',
    'generator cost Lagos 2026',
  ],
  openGraph: {
    title: 'The True Cost of Generator vs Solar in Lagos',
    description: 'Petrol at the pump against a real, itemised solar build — computed, not guessed.',
    url: `${SITE_URL}/blog/generator-vs-solar-lagos`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/generator-vs-solar-lagos` },
};

/** Whole years, one decimal — a payback quoted to two decimals is pretending. */
function paybackYears(cost: number, annualSpend: number): string {
  return (cost / annualSpend).toFixed(1);
}

// Sensitivity, not a claim about how long any particular Lagos household runs
// its set. We do not hold a published figure for that — see GENSET_HOURS_PER_DAY_ASSUMED
// in lib/energy-costs.ts — so instead of guessing one number we show four and
// let the reader pick the row closest to their own house.
const HOURS_OPTIONS = [
  { hours: 4, label: '4h/day — occasional evenings' },
  { hours: GENSET_HOURS_PER_DAY_ASSUMED, label: `${GENSET_HOURS_PER_DAY_ASSUMED}h/day — our assumed baseline` },
  { hours: 12, label: '12h/day — heavy daily use' },
  { hours: 16, label: '16h/day — near-continuous' },
];

const CUMULATIVE_YEARS = [1, 3, 5, 10];

export default function GeneratorVsSolarPage() {
  // The same 3-bedroom-flat load used as the worked example on the payback and
  // cost pages, so this page cannot quietly disagree with either of them.
  const scenario = getScenario('how-many-solar-panels-for-3-bedroom-flat')!;
  const quote = scenarioQuote(scenario);
  const standard = quote.tiers.standard;

  const assumedGen = generatorCostPerDay();
  const assumedAnnual = { low: assumedGen.low * 365, high: assumedGen.high * 365 };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'The True Cost of Generator vs Solar in Lagos (2026)',
    description:
      'A petrol generator priced at the pump against a solar system priced from Nigerian vendor research, computed at four different generator-hours assumptions.',
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished: '2026-03-01',
    dateModified: '2026-09-16',
    url: `${SITE_URL}/blog/generator-vs-solar-lagos`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Generator vs solar in Lagos' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Cost Analysis
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          The True Cost of Generator vs Solar in Lagos
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>9 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            If your generator runs about {GENSET_HOURS_PER_DAY_ASSUMED} hours a day, a solar system sized for a{' '}
            {scenario.question.toLowerCase()} load pays for itself in roughly{' '}
            {paybackYears(standard.total.best, assumedAnnual.high)}–{paybackYears(standard.total.best, assumedAnnual.low)}{' '}
            years of fuel it no longer buys. Run it more and that number falls; run it less and it rises — the table
            further down works both directions from your own generator&apos;s hours.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">What this page is, and is not</h2>
            <p className="text-[#64748B] leading-relaxed text-sm">
              The fuel price and the litres-per-hour figure below are published ranges with their sources named. The
              solar price is our own vendor research, last checked {PRICES_LAST_UPDATED_LABEL}. What is not here is a
              monthly naira figure for what &ldquo;a Lagos household&rdquo; spends on fuel — nobody publishes that
              number nationally, and typing one in would make this page exactly as unreliable as the guides it is
              meant to replace. Multiply the sourced rate by your own hours instead.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What running the generator actually costs</h2>
          <p className="text-[#64748B] leading-relaxed">
            A 3kVA petrol generator at roughly half load burns {GENSET_3KVA_LITRES_PER_HOUR.low}–
            {GENSET_3KVA_LITRES_PER_HOUR.high} litres an hour (
            <a href={GENSET_3KVA_LITRES_PER_HOUR.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#F59E0B] font-semibold hover:underline">
              {GENSET_3KVA_LITRES_PER_HOUR.source}
            </a>
            ). Petrol is {formatNaira(PETROL_PER_LITRE.low)}–{formatNaira(PETROL_PER_LITRE.high)} a litre nationally (
            <a href={PETROL_PER_LITRE.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#F59E0B] font-semibold hover:underline">
              {PETROL_PER_LITRE.source}
            </a>
            , {ENERGY_COSTS_LAST_CHECKED_LABEL}) — Lagos pump prices move with the national price, not against it, so
            the same range applies. Multiply the two together and the daily fuel bill depends entirely on how many
            hours the set runs:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Hours the gen runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Fuel cost / day</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Fuel cost / year</th>
                </tr>
              </thead>
              <tbody>
                {HOURS_OPTIONS.map((opt, i) => {
                  const cost = generatorCostPerDay(opt.hours);
                  const annual = { low: cost.low * 365, high: cost.high * 365 };
                  return (
                    <tr key={opt.hours} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                      <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{opt.label}</td>
                      <td className="p-4 text-[#64748B]">{formatNaira(cost.low)} – {formatNaira(cost.high)}</td>
                      <td className="p-4 font-semibold text-[#F59E0B]">
                        {formatNairaShort(annual.low)} – {formatNairaShort(annual.high)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Fuel only — no oil, no servicing, no repairs, no cost of the generator itself. Those are real money and we
            explain below why we have left them out rather than guessed at them.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The one number that decides your own answer</h2>
          <p className="text-[#64748B] leading-relaxed">
            {GENSET_HOURS_PER_DAY_ASSUMED} hours a day is our stated assumption, used everywhere on this site a
            generator figure is needed — it is not a measurement of your street, because supply varies too much
            between streets for a national figure to mean anything. If your set runs on the school run and the evening
            only, use the 4h row above. If NEPA barely shows up where you are, use the 16h row. Either way, the
            arithmetic is the same one used for the {formatNaira(standard.total.best)} system below — only the hours
            change.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What solar costs instead</h2>
          <p className="text-[#64748B] leading-relaxed">
            The comparison needs one real system, not a range, so here is the Standard build for a{' '}
            {scenario.question.toLowerCase()} load — {(quote.peakWatts / 1000).toFixed(1)}kW if everything runs at
            once, {quote.dailyKwh}kWh across a normal day.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Line</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Spec</th>
                  <th className="text-right p-4 font-heading font-semibold text-[#0A0F1E]">Cost</th>
                </tr>
              </thead>
              <tbody>
                {standard.bom.map((line, i) => (
                  <tr key={line.key} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      {line.qty > 1 ? `${line.qty}× ` : ''}{line.item}
                    </td>
                    <td className="p-4 text-[#64748B]">{line.spec}</td>
                    <td className="p-4 text-right font-semibold text-[#0A0F1E]">{formatNaira(line.lineCost.best)}</td>
                  </tr>
                ))}
                <tr className="bg-[#0A0F1E] text-white">
                  <td className="p-4 font-heading font-bold" colSpan={2}>Installed total (best estimate)</td>
                  <td className="p-4 text-right font-heading font-bold">{formatNaira(standard.total.best)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Range {formatRange(standard.total)}. Equipment priced from Nigerian vendor listings, last checked{' '}
            {PRICES_LAST_UPDATED_LABEL}. Quote {quote.code}. Full working on the{' '}
            <Link href={`/sizing/${scenario.slug}`} className="text-[#F59E0B] font-semibold hover:underline">
              sizing page for this load
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Payback, at your generator&apos;s real hours</h2>
          <p className="text-[#64748B] leading-relaxed">
            Same {formatNaira(standard.total.best)} system, set against each of the four generator-hours rows above:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Hours the gen runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Fuel spend / year</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Solar pays back in</th>
                </tr>
              </thead>
              <tbody>
                {HOURS_OPTIONS.map((opt, i) => {
                  const cost = generatorCostPerDay(opt.hours);
                  const annual = { low: cost.low * 365, high: cost.high * 365 };
                  return (
                    <tr key={opt.hours} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                      <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{opt.label}</td>
                      <td className="p-4 text-[#64748B]">{formatNairaShort(annual.low)} – {formatNairaShort(annual.high)}</td>
                      <td className="p-4 font-semibold text-[#0A0F1E]">
                        {paybackYears(standard.total.best, annual.high)}–{paybackYears(standard.total.best, annual.low)} years
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The view over years, not months</h2>
          <p className="text-[#64748B] leading-relaxed">
            Fuel is a cost you keep paying. Solar is a cost you pay once. At our {GENSET_HOURS_PER_DAY_ASSUMED}h/day
            assumption, here is what each side has cost by a given year — generator fuel accumulating, solar flat
            because it was paid at installation:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">By year</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Generator fuel, cumulative</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Solar, cumulative</th>
                </tr>
              </thead>
              <tbody>
                {CUMULATIVE_YEARS.map((y, i) => (
                  <tr key={y} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Year {y}</td>
                    <td className="p-4 text-[#F59E0B] font-semibold">
                      {formatNairaShort(assumedAnnual.low * y)} – {formatNairaShort(assumedAnnual.high * y)}
                    </td>
                    <td className="p-4 text-[#64748B]">{formatNaira(standard.total.best)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Generator column is fuel only, held at the {GENSET_HOURS_PER_DAY_ASSUMED}h/day assumption throughout —
            recompute it yourself from the first table if your hours differ. Solar column assumes no battery
            replacement in the window shown; see the caveat below for why that is a reasonable assumption at ten years
            and not beyond it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What this leaves out, on purpose</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              [
                'Oil changes, servicing and repairs',
                'A generator needs all three, and none of them has a reliable national naira figure we could cite — quotes for a service call vary by mechanic and by city far more than fuel does. Add your own from your own receipts; whatever it is, it only widens the gap in this page’s favour.',
              ],
              [
                'The generator itself, and eventually replacing it',
                'Most households keep the set for the week solar and grid both fail. That is sensible, and it means the purchase price is not a saving you can bank — only the fuel it stops burning is.',
              ],
              [
                'Battery replacement',
                `Lithium LiFePO4, which is what the Standard build above uses, is the one battery chemistry where a ten-year assumption is defensible — which is why the cumulative table stops there. The full replacement arithmetic, including the tubular-lead-acid case where it is not defensible, is worked out in `,
                '/blog/lithium-vs-tubular-battery-nigeria',
                'lithium vs tubular batteries',
              ],
              [
                'Panel degradation and harmattan soiling',
                'Both reduce output slightly and are covered on their own pages rather than folded into a payback number here — folding them in would need a cleaning schedule we do not know you will keep.',
              ],
            ].map(([title, body, href, linkText]) => (
              <li key={title as string} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span>
                  <strong className="text-[#0A0F1E]">{title}.</strong> {body}
                  {href && (
                    <Link href={href} className="text-[#F59E0B] font-semibold hover:underline">
                      {linkText}
                    </Link>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What a generator costs you besides naira</h2>
          <p className="text-[#64748B] leading-relaxed">
            Some of the difference does not show up in any table. Solar is silent and has no fumes to stand near while
            it runs; it does not need a fuel queue or a padlocked tank; and it comes on the instant the grid drops
            rather than however long it takes to walk outside and pull the cord. None of that has a naira figure we
            can defend, so we are naming it in prose instead of pretending it belongs in the arithmetic above.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Run it on your own hours</h2>
          <p className="text-[#64748B] leading-relaxed">
            The two inputs that matter are yours, not ours: how many hours your generator actually runs, and what
            appliances you actually want solar to carry. Get the second from the{' '}
            <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">calculator</Link>, then
            apply your own hours to the fuel formula above. For the fuller three-case payback — generator, grid, or
            both, which is what most Nigerian homes actually pay — see{' '}
            <Link href="/blog/is-solar-worth-it-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              is solar worth it in Nigeria
            </Link>. If part of what you are running is a stable grid connection rather than a generator, the tariff
            side of the sum is in{' '}
            <Link href="/blog/band-a-tariff-vs-solar" className="text-[#F59E0B] font-semibold hover:underline">
              your Band A bill versus solar
            </Link>. And if the number above is more than you want to spend at once, see{' '}
            <Link href="/budget" className="text-[#F59E0B] font-semibold hover:underline">
              what smaller budgets actually buy
            </Link>.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Work it out on your own generator hours</h3>
          <p className="text-[#64748B] mb-4">
            Free, five minutes, no signup. Pick your appliances and get three itemised builds with a quote code, priced
            at {PRICES_LAST_UPDATED_LABEL} Nigerian vendor rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Calculate my system →
            </Link>
            <Link href="/sizing" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Browse sizing guides
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
