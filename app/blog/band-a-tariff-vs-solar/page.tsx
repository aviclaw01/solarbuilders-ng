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
  bandAAnnualCost,
} from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

// Even the title comes off the constant, so a tariff review cannot leave a stale
// number in the <title> after the tables have recomputed themselves.
const TARIFF_RANGE = `₦${BAND_A_TARIFF.low}–₦${BAND_A_TARIFF.high}`;
const TITLE = `Your Band A Bill vs Solar: What ₦${BAND_A_TARIFF.high} per kWh Actually Costs You Over Five Years`;

export const metadata: Metadata = {
  title: TITLE,
  description:
    `Band A customers pay ${TARIFF_RANGE} per kWh in 2026. Here is what that adds up to over five years for real Nigerian households, and what the same money buys as a solar system at ${PRICES_LAST_UPDATED_LABEL} prices.`,
  keywords: [
    'band a tariff solar',
    'band a electricity cost 2026',
    'how to reduce electricity bill nigeria',
    'band a vs solar nigeria',
  ],
  openGraph: {
    title: 'Your Band A Bill vs Solar: the Five-Year Arithmetic',
    description: 'What Band A actually costs over five years, against a dated solar price.',
    url: `${SITE_URL}/blog/band-a-tariff-vs-solar`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/band-a-tariff-vs-solar` },
};

const YEARS = 5;

export default function BandAVsSolarPage() {
  const rows = [
    'solar-for-lights-fans-and-tv-only',
    'how-many-solar-panels-for-2-bedroom-flat',
    'how-many-solar-panels-for-3-bedroom-flat',
    'solar-for-4-bedroom-house-with-2-acs',
  ]
    .map((slug) => getScenario(slug))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((scenario) => {
      const quote = scenarioQuote(scenario);
      const annual = bandAAnnualCost(quote.dailyKwh);
      return {
        scenario,
        quote,
        standard: quote.tiers.standard,
        annual,
        fiveYear: { low: annual.low * YEARS, high: annual.high * YEARS },
      };
    });

  const main = rows[2];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: TITLE,
    description:
      'The five-year cost of a Band A electricity bill in Nigeria, set against September 2026 solar system prices.',
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished: '2026-09-16',
    dateModified: '2026-09-16',
    url: `${SITE_URL}/blog/band-a-tariff-vs-solar`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Band A vs solar' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Grid &amp; Tariffs
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Your Band A Bill vs Solar: What {formatNaira(BAND_A_TARIFF.high)} per kWh Costs Over Five Years
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>8 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            A Band A household using {main.quote.dailyKwh}kWh a day spends{' '}
            {formatNairaShort(main.annual.low)}–{formatNairaShort(main.annual.high)} a year on electricity, or{' '}
            {formatNairaShort(main.fiveYear.low)}–{formatNairaShort(main.fiveYear.high)} over five years. A solar system
            that covers that same load is {formatRange(main.standard.total)} installed, once.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What Band A actually charges</h2>
          <p className="text-[#64748B] leading-relaxed">
            Band A customers are paying {formatNaira(BAND_A_TARIFF.low)}–{formatNaira(BAND_A_TARIFF.high)} per kWh in
            2026 (
            <a href={BAND_A_TARIFF.sourceUrl} rel="nofollow noopener" target="_blank" className="text-[#F59E0B] font-semibold hover:underline">
              {BAND_A_TARIFF.source}
            </a>
            , read {ENERGY_COSTS_LAST_CHECKED_LABEL}). Band A is defined by a service promise of at least{' '}
            {BAND_A_PROMISED_HOURS} hours of supply a day — that promise is the entire justification for the higher
            rate.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The gap between the promise and the experience is why this page exists. If you are getting{' '}
            {BAND_A_PROMISED_HOURS} hours, you are buying expensive but functioning electricity. If you are paying Band A
            and still running the gen, you are paying twice for one service, and the arithmetic below understates your
            case considerably.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Five years of bills, by household</h2>
          <p className="text-[#64748B] leading-relaxed">
            Four real loads from our sizing pages. The daily kWh figure is computed from the appliances in each one — the
            same numbers that drive the quotes — so you can open any row and see exactly what is plugged in.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Household</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">kWh/day</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Bill / year</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Bill over {YEARS} years</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Solar, installed once</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.scenario.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      <Link href={`/sizing/${r.scenario.slug}`} className="hover:text-[#F59E0B]">
                        {r.scenario.question}
                      </Link>
                    </td>
                    <td className="p-4 text-[#64748B]">{r.quote.dailyKwh}</td>
                    <td className="p-4 text-[#64748B]">
                      {formatNairaShort(r.annual.low)} – {formatNairaShort(r.annual.high)}
                    </td>
                    <td className="p-4 font-semibold text-[#0A0F1E]">
                      {formatNairaShort(r.fiveYear.low)} – {formatNairaShort(r.fiveYear.high)}
                    </td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{formatRange(r.standard.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Grid cost = daily kWh × tariff × 365, at {formatNaira(BAND_A_TARIFF.low)}–{formatNaira(BAND_A_TARIFF.high)}
            {' '}per kWh. Solar prices from Nigerian vendor listings, last checked {PRICES_LAST_UPDATED_LABEL}. Both
            columns are held flat — no tariff rises, no equipment price changes.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Reading that table honestly</h2>
          <p className="text-[#64748B] leading-relaxed">
            Two things jump out, and only one of them is the one solar companies like to talk about.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The first: for the smaller households, five years of Band A bills and a solar system cost broadly similar
            money, and the solar system is still standing at the end of it. The second, which matters more: for a
            household that is <em>only</em> buying grid units and getting them reliably, solar is not a money-saving
            purchase on a five-year view. It becomes one on a ten-year view, because the panels and the lithium are still
            working while the meter keeps running. We set out that longer sum, including the parts that go against
            solar, in{' '}
            <Link href="/blog/is-solar-worth-it-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              is solar worth it in Nigeria
            </Link>.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            What changes the picture completely is the generator. Petrol is by a distance the most expensive electricity
            in Nigeria — several times the Band A rate per kWh. Any household running a gen for the hours the grid is
            missing is displacing spend at that rate, not at the tariff rate, and that is the case where the arithmetic
            stops being close.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The hybrid case, which is what most people should actually do</h2>
          <p className="text-[#64748B] leading-relaxed">
            Going fully off-grid is a choice to buy a much bigger battery so you never touch the DisCo again. It is
            expensive, and for most Band A customers it is the wrong optimisation. The sensible build is hybrid: the
            inverter runs the house from the panels by day, from the battery through the evening, and lets the grid carry
            the load and top up the battery when it is there.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            That is what our Standard tier is: roughly {main.standard.autonomyHours} hours of backup rather than a full
            night and day of it. The bill does not go to zero — it goes to the hours you could not cover, which for most
            homes is the largest single reduction available for the money. Anyone quoting you a system on the promise
            that your NEPA bill disappears is either selling you a much bigger battery than they have costed, or is going
            to disappoint you in month two.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What happens when tariffs move again</h2>
          <p className="text-[#64748B] leading-relaxed">
            Every figure in the table above is a snapshot. Tariffs in Nigeria have moved repeatedly and in one direction.
            The useful way to think about it is that a solar system converts a variable cost you do not control into a
            fixed cost you have already paid — which is why the case for it strengthens every time the rate is reviewed,
            without anything about the solar changing.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            We are not going to predict the next review, and we would treat anyone who does with suspicion. We will
            update this page with the new rate when it happens, and the table will recompute itself, because the tariff
            is a constant in one file rather than a number typed into an article.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The caveat we will not bury</h2>
          <p className="text-[#64748B] leading-relaxed">
            Solar removes the part of your bill you size for. If you size for lights, fans and a fridge, the AC still
            comes off the meter. That is not a flaw; it is often the correct trade, because the AC is the load that
            doubles the price of the whole system. But it means the honest promise is {'“'}a much smaller bill{'”'} and
            not {'“'}no bill{'”'}, and the difference between those two sentences is the difference between a happy
            customer and a complaint thread.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Work out which of your loads you actually want off the grid before you talk to anybody about price. The{' '}
            <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">calculator</Link> is
            built for exactly that: tick appliances, watch the number move, and see what each one costs you in system
            size. If you are in{' '}
            <Link href="/solar/lagos" className="text-[#F59E0B] font-semibold hover:underline">Lagos</Link> or{' '}
            <Link href="/solar/abuja" className="text-[#F59E0B] font-semibold hover:underline">Abuja</Link>, the local
            pages cover what installation looks like there.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">See what your own load costs on the meter</h3>
          <p className="text-[#64748B] mb-4">
            Pick your appliances, get your daily kWh, and multiply by the tariff. Then compare it with the three
            itemised builds the calculator gives you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Work out my daily kWh →
            </Link>
            <Link href="/blog/is-solar-worth-it-nigeria" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              The full payback sum
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
