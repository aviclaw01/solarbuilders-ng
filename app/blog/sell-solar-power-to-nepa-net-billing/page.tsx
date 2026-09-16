import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { PANEL_WATTS, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import {
  NET_BILLING_MAX_KWP,
  NET_BILLING_MIN_KWP,
  NET_BILLING_SOURCE_URL,
} from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'No, You Cannot Sell Solar Power to NEPA Yet — Who Net Billing 2026 Actually Covers',
  description:
    'NERC’s Net Billing Regulations 2026 let prosumers export surplus solar for credit — but only systems from 50 kWp to 1.5 MWp, several times the array on a large Nigerian home. Here is who qualifies, and what homeowners should do instead.',
  keywords: [
    'net billing nigeria',
    'sell solar power to disco',
    'can i sell electricity back to the grid nigeria',
    'nerc net billing regulations 2026',
  ],
  openGraph: {
    title: 'No, You Cannot Sell Solar Power to NEPA Yet',
    description: 'What the NERC Net Billing Regulations 2026 actually cover, and who they exclude.',
    url: `${SITE_URL}/blog/sell-solar-power-to-nepa-net-billing`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/sell-solar-power-to-nepa-net-billing` },
};

export default function NetBillingPage() {
  // The comparison that makes the eligibility floor concrete: our largest
  // authored residential load, built at the Premium tier, is still an order of
  // magnitude under the threshold.
  const scenario = getScenario('solar-for-4-bedroom-house-with-2-acs')!;
  const quote = scenarioQuote(scenario);
  const premium = quote.tiers.premium;
  const multiple = NET_BILLING_MIN_KWP / premium.arrayKwp;
  const panelsNeeded = Math.ceil((NET_BILLING_MIN_KWP * 1000) / PANEL_WATTS);

  const faqs = [
    {
      q: 'Can I sell solar power back to NEPA in Nigeria?',
      a: `Not as a homeowner, no. The NERC Net Billing Regulations 2026 create a route for "prosumers" to export surplus solar and receive credit against their bill, but eligibility starts at ${NET_BILLING_MIN_KWP} kWp and stops at ${NET_BILLING_MAX_KWP / 1000} MWp. A large Nigerian home system is roughly ${premium.arrayKwp} kWp, so residential systems fall far below the floor.`,
    },
    {
      q: 'How big is 50 kWp in panels?',
      a: `About ${panelsNeeded} panels of ${PANEL_WATTS}W each, plus the roof or ground area to mount them. That is a factory, a school, a mall or an estate-scale installation — not a house.`,
    },
    {
      q: 'What do the headlines mean when they say FG will pay Nigerians for excess solar?',
      a: 'They are describing the same regulation, accurately in outline and misleadingly in effect. The scheme is real. It is simply not aimed at households, and no homeowner should factor an export credit into whether a home system is affordable.',
    },
    {
      q: 'What should a homeowner do instead?',
      a: 'Size for self-consumption. Every kWh you generate and use yourself is worth the full retail tariff you did not pay, which is a better deal than any export credit would be anyway. The mistake is oversizing an array in the hope of selling the surplus — that surplus currently has nowhere to go and is simply money spent on panels that idle.',
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Net billing 2026' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Policy
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          No, You Cannot Sell Solar Power to NEPA Yet
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>7 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Net billing in Nigeria is real, and it starts at {NET_BILLING_MIN_KWP} kWp — around{' '}
            {multiple.toFixed(0)}× the array on a large family home. If you live in a house, you cannot sell power to
            your DisCo under the 2026 regulations, and you should not let any installer price a system on the promise
            that you can.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why everyone thinks otherwise</h2>
          <p className="text-[#64748B] leading-relaxed">
            In June 2026 NERC announced the Net Billing Regulations 2026, allowing {'“'}prosumers{'”'} to export surplus
            solar to the grid and receive credit against their bill. The regulation was reported widely, and the
            headlines it produced —{' '}
            <em>FG to pay Nigerians for excess solar power</em> and variations on it — are a fair summary of the policy
            and a poor description of who it reaches.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Pulse put the limitation plainly: the scheme is {'“'}mainly for commercial, industrial, and institutional
            electricity users, not small residential solar installations{'”'} (
            <a href={NET_BILLING_SOURCE_URL} rel="nofollow noopener" target="_blank" className="text-[#F59E0B] font-semibold hover:underline">
              Pulse Nigeria
            </a>
            ). That sentence is the whole article you are reading, and it did not travel nearly as far as the headline
            did.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What {NET_BILLING_MIN_KWP} kWp actually looks like</h2>
          <p className="text-[#64748B] leading-relaxed">
            Take the largest residential load we publish a sizing page for — a four-bedroom house running two air
            conditioners — and build it at our Premium tier, the one with extra panels for cloudy-day recharge. That is{' '}
            {premium.panelCount} × {premium.panelWatts}W panels, an array of{' '}
            <strong className="text-[#0A0F1E]">{premium.arrayKwp} kWp</strong>, costing{' '}
            {formatRange(premium.total)} installed at {PRICES_LAST_UPDATED_LABEL} prices.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Array size</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Panels</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Net billing?</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E8F0] bg-white">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Large family home, Premium build</td>
                  <td className="p-4 text-[#64748B]">{premium.arrayKwp} kWp</td>
                  <td className="p-4 text-[#64748B]">{premium.panelCount} × {premium.panelWatts}W</td>
                  <td className="p-4 font-semibold text-[#0A0F1E]">No — far below the floor</td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Net billing minimum</td>
                  <td className="p-4 text-[#64748B]">{NET_BILLING_MIN_KWP} kWp</td>
                  <td className="p-4 text-[#64748B]">~{panelsNeeded} × {PANEL_WATTS}W</td>
                  <td className="p-4 font-semibold text-[#F59E0B]">Entry point</td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Net billing maximum</td>
                  <td className="p-4 text-[#64748B]">{NET_BILLING_MAX_KWP / 1000} MWp</td>
                  <td className="p-4 text-[#64748B]">Utility-scale</td>
                  <td className="p-4 font-semibold text-[#0A0F1E]">Ceiling</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Roughly {panelsNeeded} panels. Not a roof — a car park, a factory shed, a school block, a warehouse. The
            floor is not an accident or an oversight to be lobbied away; it is there because connecting a generator to a
            distribution network involves protection, metering and a commercial agreement, and NERC has set the bar
            where that overhead is worth carrying.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What the process involves if you do qualify</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['DisCo approval', 'You apply to the distribution company whose network you are connected to. They assess whether your feeder can absorb the export. This is a technical assessment, not a formality.'],
              ['A Net Billing Agreement', 'A commercial contract between you and the DisCo setting out how exported energy is valued and credited. Credit against your bill — not a cash payment.'],
              ['NERC registration', 'The prosumer installation is registered with the regulator.'],
              ['A bidirectional meter', 'A meter that measures energy in both directions. Your existing prepaid meter does not do this, and the cost of the new one sits with the project.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Read that list as a project plan rather than a form. It is months of work with a utility, and it only makes
            sense attached to a site whose electricity bill is large enough to justify the effort.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Who this is genuinely for</h2>
          <p className="text-[#64748B] leading-relaxed">
            Estates with a common connection, factories and processing plants, schools and universities, hospitals,
            shopping malls, hotels, large cold-storage operations, and office buildings with a real daytime load. The
            pattern that makes net billing worth pursuing is a site that consumes heavily during the day and has roof or
            ground area to spare — because the export credit is only the tail end of the benefit. The main benefit is
            still offsetting your own daytime consumption at retail rates.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            If that describes a site you are responsible for, the power side of it is worth costing independently of
            whoever is selling you the equipment. Our{' '}
            <Link href="/for-builders" className="text-[#F59E0B] font-semibold hover:underline">for builders and developers</Link>{' '}
            page covers how we work on larger projects, and{' '}
            <Link href="/blog/solar-cold-room-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              what it costs to solar-power a cold room
            </Link>{' '}
            works through one commercial load end to end.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why {'“'}get a home to 50 kWp{'”'} is the wrong goal</h2>
          <p className="text-[#64748B] leading-relaxed">
            It would cost many times what your house needs, to produce energy you cannot use, in order to earn a credit
            against a bill you were trying to eliminate. Every step of that is backwards.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The economics of home solar in Nigeria are about <em>self-consumption</em>: a kWh you generate and use is
            worth the full retail tariff you did not pay, plus — for most households — the generator fuel you did not
            buy, which is worth considerably more again. No export tariff anywhere in the world pays better than not
            buying electricity. The correct home strategy is to size the array to your own daily consumption and the
            battery to your evening, which is exactly what our quote engine does.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What to watch for next</h2>
          <p className="text-[#64748B] leading-relaxed">
            Two things would change this page. A lowered eligibility floor, which would have to come from NERC and has
            not been announced. And DisCo-level pilots or state-level schemes, which have a habit of arriving before the
            national rules catch up. We will update here if either happens — and we will say plainly that it happened,
            rather than quietly editing the page, because the whole point of this article is that you can trust what it
            said last month.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Until then, the practical answer for a homeowner is unchanged: size for what you use, get the bill down as
            far as the battery will take it, and treat any installer who mentions selling power back to the grid as
            someone who has not read the regulation.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Common questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-[#E2E8F0] p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] text-base mb-2">{f.q}</h3>
                <p className="text-[#64748B] leading-relaxed text-sm">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Size for what you actually use</h3>
          <p className="text-[#64748B] mb-4">
            Self-consumption is where the money is. The calculator sizes the array to your daily kWh and the battery to
            your evening, and shows you the bill of materials for all three tiers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Size my system →
            </Link>
            <Link href="/blog/band-a-tariff-vs-solar" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Band A vs solar
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
