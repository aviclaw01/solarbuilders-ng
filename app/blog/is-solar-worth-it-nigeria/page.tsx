import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import {
  BAND_A_PROMISED_HOURS,
  BAND_A_TARIFF,
  ENERGY_COSTS_LAST_CHECKED_LABEL,
  GENSET_3KVA_LITRES_PER_HOUR,
  GENSET_HOURS_PER_DAY_ASSUMED,
  PETROL_PER_LITRE,
  bandAAnnualCost,
  generatorCostPerDay,
} from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Is Solar Worth It in Nigeria? The Payback Period, Calculated Properly',
  description:
    'Published payback claims for Nigerian solar run from one year to five. We show the arithmetic instead: September 2026 installed prices against petrol at the pump and Band A at the current published tariff, with every assumption named.',
  keywords: [
    'is solar worth it in nigeria',
    'solar payback period nigeria',
    'how long to recover solar cost',
    'solar roi nigeria 2026',
  ],
  openGraph: {
    title: 'Is Solar Worth It in Nigeria? The Payback Period, Calculated Properly',
    description: 'The payback arithmetic, shown line by line, against dated Nigerian prices.',
    url: `${SITE_URL}/blog/is-solar-worth-it-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/is-solar-worth-it-nigeria` },
};

/** Whole years, one decimal — a payback quoted to two decimals is pretending. */
function years(cost: number, annualSaving: number): string {
  return `${(cost / annualSaving).toFixed(1)} years`;
}

export default function IsSolarWorthItPage() {
  // Every figure below is computed. The loads are the same ones behind our
  // /sizing pages, so a reader can open any row in the calculator and get the
  // identical bill of materials.
  const cases = [
    'solar-for-lights-fans-and-tv-only',
    'how-many-solar-panels-for-2-bedroom-flat',
    'how-many-solar-panels-for-3-bedroom-flat',
    'solar-for-4-bedroom-house-with-2-acs',
  ]
    .map((slug) => getScenario(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((scenario) => {
      const quote = scenarioQuote(scenario);
      const standard = quote.tiers.standard;
      const grid = bandAAnnualCost(quote.dailyKwh);
      return { scenario, quote, standard, grid };
    });

  // The worked example everything else is measured against.
  const main = cases[2];
  const gen = generatorCostPerDay();
  const genAnnual = { low: gen.low * 365, high: gen.high * 365 };
  const bothAnnualLow = genAnnual.low + main.grid.low;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'Is Solar Worth It in Nigeria? The Payback Period, Calculated Properly',
    description:
      'The solar payback period in Nigeria, computed from September 2026 installed prices against generator fuel and Band A tariffs.',
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished: '2026-09-16',
    dateModified: '2026-09-16',
    url: `${SITE_URL}/blog/is-solar-worth-it-nigeria`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Is solar worth it in Nigeria?' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Cost Analysis
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Is Solar Worth It in Nigeria? The Payback Period, Calculated Properly
        </h1>

        <div className="flex items-center gap-4 text-[#64748B] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>10 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          {/* The answer, in the first 40 words. */}
          <p className="text-xl text-[#64748B] leading-relaxed">
            If you are replacing a generator that runs about {GENSET_HOURS_PER_DAY_ASSUMED} hours a day, solar pays for
            itself in roughly {years(main.standard.total.best, genAnnual.high)} to{' '}
            {years(main.standard.total.best, genAnnual.low)}. If you are only replacing a Band A grid bill, it takes far
            longer. Most Nigerian homes are replacing both — and that case is below, with the arithmetic shown.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">What this page is, and is not</h2>
            <p className="text-[#64748B] leading-relaxed text-sm">
              Every naira in this article is computed — the system prices come from our own vendor price research, last
              checked {PRICES_LAST_UPDATED_LABEL}, and the fuel and tariff figures are published ranges with their
              sources named. We have not modelled anyone{'’'}s actual bill, because we do not have anyone{'’'}s
              actual bill. What we have is a priced system and a published fuel price, and those are enough to do the
              division honestly.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The honest answer: it depends what you are replacing</h2>
          <p className="text-[#64748B] leading-relaxed">
            Payback claims for Nigerian solar circulate between roughly one year and five, and none of the pages making
            them shows its working. The reason the spread is so wide is not that anyone is lying. It is that
            {' '}&ldquo;payback&rdquo; means three completely different sums depending on what the solar is switching
            off:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              'Case 1 — you are replacing generator fuel. This is where solar looks spectacular, because petrol is the most expensive electricity in Nigeria by a distance.',
              'Case 2 — you are replacing grid units you were happily buying. This is where solar looks slow, because even Band A is far cheaper per kWh than a generator.',
              'Case 3 — you are replacing a bit of both, which is what almost every Nigerian home actually does.',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The system we are costing</h2>
          <p className="text-[#64748B] leading-relaxed">
            The worked example is our {main.scenario.question.toLowerCase()} load — {main.quote.appliances.length}{' '}
            appliance lines, {(main.quote.peakWatts / 1000).toFixed(1)}kW if everything runs at once,{' '}
            {main.quote.dailyKwh}kWh across a normal day. The Standard build for it is a{' '}
            {main.standard.inverterKva}kVA hybrid inverter, {main.standard.batteryKwh}kWh of lithium and{' '}
            {main.standard.panelCount} × {main.standard.panelWatts}W panels, installed for{' '}
            {formatRange(main.standard.total)} — best single estimate {formatNaira(main.standard.total.best)}.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Line</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">What it is</th>
                  <th className="text-right p-4 font-heading font-semibold text-[#0A0F1E]">Cost</th>
                </tr>
              </thead>
              <tbody>
                {main.standard.bom.map((line, i) => (
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
                  <td className="p-4 text-right font-heading font-bold">{formatNaira(main.standard.total.best)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Equipment priced from Nigerian vendor listings, last checked {PRICES_LAST_UPDATED_LABEL}. Quote{' '}
            {main.quote.code}.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Case 1 — replacing the gen</h2>
          <p className="text-[#64748B] leading-relaxed">
            A 3kVA petrol generator at about half load burns {GENSET_3KVA_LITRES_PER_HOUR.low}–
            {GENSET_3KVA_LITRES_PER_HOUR.high} litres an hour (
            <a href={GENSET_3KVA_LITRES_PER_HOUR.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#B45309] font-semibold hover:underline">
              {GENSET_3KVA_LITRES_PER_HOUR.source}
            </a>
            ). Petrol is {formatNaira(PETROL_PER_LITRE.low)}–{formatNaira(PETROL_PER_LITRE.high)} a litre (
            <a href={PETROL_PER_LITRE.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#B45309] font-semibold hover:underline">
              {PETROL_PER_LITRE.source}
            </a>
            , {ENERGY_COSTS_LAST_CHECKED_LABEL}). Run it {GENSET_HOURS_PER_DAY_ASSUMED} hours a day and the fuel alone
            is {formatNaira(gen.low)}–{formatNaira(gen.high)} a day, or{' '}
            {formatNairaShort(genAnnual.low)}–{formatNairaShort(genAnnual.high)} a year.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Against an installed cost of {formatNaira(main.standard.total.best)}, that is a payback of{' '}
            <strong className="text-[#0A0F1E]">{years(main.standard.total.best, genAnnual.high)} at the high fuel
            price and {years(main.standard.total.best, genAnnual.low)} at the low one</strong> — before you count a
            single naira of oil changes, servicing, carburettor work or the generator you eventually do not have to
            replace. Those are real costs and we have deliberately left them out, because we cannot source a credible
            national figure for them and a payback built on invented maintenance numbers is worth nothing.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The number that moves this answer most is not the price of solar. It is{' '}
            <strong className="text-[#0A0F1E]">how many hours a day your gen actually runs</strong>. Eight hours is our
            stated assumption, not a measurement. If yours runs four, double every payback figure on this page. If it
            runs from 6pm until morning, halve them.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Case 2 — replacing Band A grid units</h2>
          <p className="text-[#64748B] leading-relaxed">
            Band A customers pay {formatNaira(BAND_A_TARIFF.low)}–{formatNaira(BAND_A_TARIFF.high)} per kWh in 2026 (
            <a href={BAND_A_TARIFF.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#B45309] font-semibold hover:underline">
              {BAND_A_TARIFF.source}
            </a>
            ) in exchange for a promised {BAND_A_PROMISED_HOURS} hours of supply a day. At {main.quote.dailyKwh}kWh a
            day, that is {formatNairaShort(main.grid.low)}–{formatNairaShort(main.grid.high)} a year on the meter.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Payback against the grid alone is therefore{' '}
            <strong className="text-[#0A0F1E]">{years(main.standard.total.best, main.grid.high)} to{' '}
            {years(main.standard.total.best, main.grid.low)}</strong> — comfortably longer than the warranty on most of
            the kit. Anyone telling you solar pays back in a year against a grid bill is quoting Case 1 and describing
            Case 2. If your supply is genuinely {BAND_A_PROMISED_HOURS} hours a day and stable, solar is a resilience
            purchase and a hedge against the next tariff review, not an investment.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Case 3 — replacing both, which is the real Nigerian case</h2>
          <p className="text-[#64748B] leading-relaxed">
            Nobody runs a generator twenty-four hours a day, and nobody on Band A gets twenty hours. The honest Nigerian
            household is paying the DisCo for the hours the grid shows up and paying the filling station for the hours it
            does not. Add the low end of both — {formatNairaShort(genAnnual.low)} of fuel plus{' '}
            {formatNairaShort(main.grid.low)} of grid — and the displaced spend is around{' '}
            {formatNairaShort(bothAnnualLow)} a year, which pays the system back in{' '}
            <strong className="text-[#0A0F1E]">{years(main.standard.total.best, bothAnnualLow)}</strong>.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            One caveat we will not paper over: a hybrid system does not delete your bill. It shifts your consumption to
            the hours the sun is up and the battery is full. Unless you size for full off-grid — which means more
            battery, more panels and a bigger number at the top of the quote — you will still buy some grid units, and
            the honest way to read Case 3 is as a big reduction, not a zero.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Payback by system size</h2>
          <p className="text-[#64748B] leading-relaxed">
            Four real loads from our sizing pages, each priced by the same engine, each measured against the same
            generator-plus-grid spend. Click any of them to see the full bill of materials.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Load</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Grid cost / yr</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Payback vs gen + grid</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, i) => (
                  <tr key={c.scenario.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      <Link href={`/sizing/${c.scenario.slug}`} className="hover:text-[#F59E0B]">
                        {c.scenario.question}
                      </Link>
                    </td>
                    <td className="p-4 text-[#64748B]">
                      {c.standard.inverterKva}kVA · {c.standard.batteryKwh}kWh · {c.standard.panelCount} panels
                    </td>
                    <td className="p-4 font-semibold text-[#B45309]">{formatRange(c.standard.total)}</td>
                    <td className="p-4 text-[#64748B]">
                      {formatNairaShort(c.grid.low)} – {formatNairaShort(c.grid.high)}
                    </td>
                    <td className="p-4 font-semibold text-[#0A0F1E]">
                      {years(c.standard.total.best, genAnnual.low + c.grid.low)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Generator spend is held constant across the rows at {formatNairaShort(genAnnual.low)} a year, because a
            household with a bigger load does not necessarily burn more petrol — it simply goes without more. That makes
            the larger systems look slower to pay back than they probably are. We would rather understate it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What the optimistic guides leave out</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Battery replacement', 'The single largest line in the bill has a finite life. Lithium LiFePO4 is the one component where a ten-year assumption is reasonable; tubular lead-acid is not, and a payback computed on tubular pricing without a replacement schedule is fiction. We work that arithmetic out in full in the lithium-versus-tubular guide.'],
              ['Panel degradation', 'Panels produce slightly less each year. Manufacturers publish a performance warranty saying how much — we list what each brand actually publishes rather than assuming an industry average.'],
              ['Cleaning', 'Harmattan dust is a real, measured output loss, and a system that is never cleaned quietly loses part of the saving this whole calculation depends on.'],
              ['Mid-life inverter failure', 'Inverters do fail. What matters for your money is not whether it happens but whether you can get that exact unit replaced in your city — which is why we track how many Nigerian vendors carry each brand.'],
              ['The gen does not disappear', 'Most people keep it for the worst week of the rainy season. That is sensible; it also means the generator purchase is not a saving, only the fuel is.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">When solar is not worth it</h2>
          <p className="text-[#64748B] leading-relaxed">
            We take a margin on what we procure, so read this section knowing that. Solar is a poor purchase if you are
            moving out of a rented flat within a year and cannot take the system with you; if your supply is genuinely
            stable and you are only trying to save money on units; if the only way you can fund it is a loan whose
            interest exceeds the fuel it displaces; or if you are about to buy a system sized for a load you have not
            measured, which is the most expensive mistake in this market.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            It is a good purchase when the generator is running most nights, when you are losing working hours to the
            grid, or when the noise and the queue at the filling station have simply become intolerable. That last one is
            not on any spreadsheet and it is the reason most of our customers actually buy.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Run it on your own numbers</h2>
          <p className="text-[#64748B] leading-relaxed">
            The one input you should not take from us is the load. Pick your own appliances in the{' '}
            <Link href="/calculator" className="text-[#B45309] font-semibold hover:underline">calculator</Link>, get the
            three itemised builds and the daily kWh, then divide your own installed price by your own displaced spend.
            If you want the generator side of the sum in more detail, we costed it for Lagos in{' '}
            <Link href="/blog/generator-vs-solar-lagos" className="text-[#B45309] font-semibold hover:underline">generator versus solar</Link>,
            and the tariff side in{' '}
            <Link href="/blog/band-a-tariff-vs-solar" className="text-[#B45309] font-semibold hover:underline">your Band A bill versus solar</Link>.
            If the barrier is cash rather than arithmetic, the{' '}
            <Link href="/blog/solar-loans-nigeria" className="text-[#B45309] font-semibold hover:underline">pay small small options</Link>{' '}
            are set out separately.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Do the sum on your own load</h3>
          <p className="text-[#64748B] mb-4">
            Free, five minutes, no signup. You get three itemised builds with a quote code, priced at{' '}
            {PRICES_LAST_UPDATED_LABEL} Nigerian vendor rates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Calculate my payback →
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
