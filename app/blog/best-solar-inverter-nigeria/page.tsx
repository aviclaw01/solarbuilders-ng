import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { TIER_LABEL, brandsInCategory, unitPriceStats, vendorReach } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'The Best Solar Inverter in Nigeria in 2026, Ranked by What It Costs per kVA',
  description:
    'Not an opinion piece. Every inverter brand we track, ranked on measured ₦ per kVA from real Nigerian listings, with how many Nigerian sellers carry it, the published warranty, and whether the monitoring app exists.',
  keywords: [
    'best solar inverter in nigeria',
    'which inverter brand is best nigeria',
    'is felicity solar good',
    'is deye good',
    'solar inverter price per kva nigeria',
  ],
  openGraph: {
    title: 'The Best Solar Inverter in Nigeria in 2026, Ranked by ₦ per kVA',
    description: 'Ranked on measured price and measured vendor reach, not on who is paying for placement.',
    url: `${SITE_URL}/blog/best-solar-inverter-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/best-solar-inverter-nigeria` },
};

export default function BestInverterPage() {
  // Ranked by the engine, not by us: cheapest measured ₦/kVA first. If a price
  // moves in the catalogue, this table reorders itself.
  const ranked = brandsInCategory('inverter').map((brand) => ({
    brand,
    stats: unitPriceStats(brand, 'inverter')!,
    reach: vendorReach(brand),
  }));

  const cheapest = ranked[0];
  const widest = [...ranked].sort((a, b) => b.reach - a.reach)[0];
  const withWarranty = ranked.filter((r) => r.brand.attributes?.warranty);
  const withApp = ranked.filter((r) => r.brand.attributes?.monitoringApp);

  const faqs = [
    {
      q: 'Which is the best solar inverter brand in Nigeria?',
      a: `The best inverter is the cheapest one per kVA that you can actually get serviced in your city. On measured price, ${cheapest.brand.name} is the cheapest we track at ${formatNaira(cheapest.stats.lowPerUnit)} per kVA at the low end. On availability, ${widest.brand.name} appears at the most Nigerian sellers in our catalogue. Those two questions matter more than any ranking of features.`,
    },
    {
      q: 'Is Felicity Solar good?',
      a: 'Felicity is the volume leader in Nigerian homes and the easiest brand in the country to get replaced quickly, which is a real engineering advantage and not only a price one. The thing to watch is that the same model class sells at very different prices depending on the seller and the model generation, so buying it right matters more with Felicity than with any other brand we track.',
    },
    {
      q: 'Is Deye worth the extra money?',
      a: 'Deye sits at the premium end of our measured ₦/kVA range and publishes app monitoring, generator integration and three-phase options. Worth it if your system will grow, if you have three-phase supply, or if you want to see production on a phone. Not worth it for a small single-phase house that will never change.',
    },
    {
      q: 'How many kVA of inverter do I need?',
      a: 'Enough to carry every load you might run at once, plus headroom for the moment a compressor starts. Our calculator sizes it from your actual appliance list rather than from a guess, and the sizing pages work through the common cases appliance by appliance.',
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Best solar inverter in Nigeria' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Brands
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          The Best Solar Inverter in Nigeria, Ranked by What It Costs per kVA
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
            The best inverter in Nigeria is the cheapest one per kVA that you can get serviced in your city. On measured
            price that is {cheapest.brand.name}, from {formatNaira(cheapest.stats.lowPerUnit)} per kVA. On availability
            it is {widest.brand.name}, which we found at {widest.reach} of the Nigerian sellers we track. Everything else
            is a trade between those two facts.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">How this ranking is made</h2>
            <p className="text-[#64748B] leading-relaxed text-sm">
              Every row below comes from real Nigerian vendor listings we recorded, with the source and the date, last
              checked {PRICES_LAST_UPDATED_LABEL}. The order is computed — cheapest measured ₦ per kVA first — not
              chosen. Nobody pays to appear here. We do earn a procurement margin when we buy equipment for a customer,
              which is exactly why this page ranks on a number you can check rather than on our opinion of who is best.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The ₦ per kVA table</h2>
          <p className="text-[#64748B] leading-relaxed">
            Price per kVA is the only honest way to compare inverters across sizes. A quoted figure for a 5kVA unit
            tells you nothing until you divide it by five and put it next to everyone else{'’'}s. The spread between the
            low and high column is the spread between sellers for the same brand — and that spread is itself
            information, because it tells you how much shopping around is worth. On {cheapest.brand.name} alone it runs
            from {formatNaira(cheapest.stats.lowPerUnit)} to {formatNaira(cheapest.stats.highPerUnit)} per kVA.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Brand</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Class</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">₦ / kVA</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Sizes listed</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Models</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Nigerian sellers</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.brand.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      <Link href={`/brands/${r.brand.slug}`} className="hover:text-[#F59E0B]">{r.brand.name}</Link>
                    </td>
                    <td className="p-4 text-[#64748B]">{r.brand.tier ? TIER_LABEL[r.brand.tier] : '—'}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">
                      {formatNaira(r.stats.lowPerUnit)} – {formatNaira(r.stats.highPerUnit)}
                    </td>
                    <td className="p-4 text-[#64748B]">{r.stats.minSize}–{r.stats.maxSize} kVA</td>
                    <td className="p-4 text-[#64748B]">{r.stats.models}</td>
                    <td className="p-4 text-[#64748B]">{r.reach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            {ranked.length} brands with priced inverter listings in our catalogue. {'“'}Nigerian sellers{'”'} counts the
            vendors in our own catalogue where we found that brand stocked — a floor, not a census.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why vendor reach matters more than the spec sheet</h2>
          <p className="text-[#64748B] leading-relaxed">
            An inverter is the one component in your system that can fail in a way that switches your whole house off.
            When that happens, the only question that matters is how fast you can get that exact unit replaced. A brand
            carried by a dozen sellers in Lagos and Alaba can be swapped in a week. A brand with one distributor in the
            country is a month of darkness and an argument about shipping.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            This is why the cheapest brand per kVA is often genuinely the right buy for a Nigerian home, and why
            {' '}{widest.brand.name}{'’'}s position at {widest.reach} sellers is not a trivia point. It is also why we
            publish the count at all — nobody else in this market does, and it is the closest thing to a serviceability
            metric that exists here.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Warranty, as published — not as promised</h2>
          <p className="text-[#64748B] leading-relaxed">
            Verbal warranties are worth nothing. Below is what each brand{'’'}s own documentation states, taken from the
            manufacturer or its Nigerian store. Where a brand publishes nothing, we have left it blank rather than
            repeating what a seller said on the phone — and a blank is itself a finding.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Brand</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Published warranty</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Service in Nigeria</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.brand.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{r.brand.name}</td>
                    <td className="p-4 text-[#64748B]">{r.brand.attributes?.warranty ?? <span className="text-[#94A3B8]">Not published</span>}</td>
                    <td className="p-4 text-[#64748B]">{r.brand.attributes?.serviceNigeria ?? <span className="text-[#94A3B8]">Not published</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            {withWarranty.length} of {ranked.length} inverter brands we track publish a warranty term we could verify.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Monitoring apps, and whether they matter</h2>
          <p className="text-[#64748B] leading-relaxed">
            {withApp.length} of the {ranked.length} brands here publish a monitoring app or a dongle that provides one.
            It sounds like a luxury and it is not: production data is how you tell dust from a fault, a failing battery
            from a cloudy week, and a genuine warranty claim from an argument. Anyone who has tried to diagnose a solar
            system over WhatsApp without it knows why.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Brand</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Monitoring</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Phases</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((r, i) => (
                  <tr key={r.brand.slug} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{r.brand.name}</td>
                    <td className="p-4 text-[#64748B]">{r.brand.attributes?.monitoringApp ?? <span className="text-[#94A3B8]">Not published</span>}</td>
                    <td className="p-4 text-[#64748B]">{r.brand.attributes?.phases ?? <span className="text-[#94A3B8]">Not published</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The honest verdict, by budget</h2>
          <p className="text-[#64748B] leading-relaxed">
            Where each brand{'’'}s own documentation states what it is built for, and what to watch, we have reproduced
            it below rather than substituting our opinion for it.
          </p>
          <div className="space-y-4">
            {ranked
              .filter((r) => r.brand.attributes?.bestFor || r.brand.attributes?.watchOut)
              .map((r) => (
                <div key={r.brand.slug} className="rounded-2xl border border-[#E2E8F0] p-6">
                  <div className="flex items-baseline justify-between gap-4 mb-2 flex-wrap">
                    <h3 className="font-heading font-bold text-[#0A0F1E] text-base">
                      <Link href={`/brands/${r.brand.slug}`} className="hover:text-[#F59E0B]">{r.brand.name}</Link>
                    </h3>
                    <span className="text-[#F59E0B] font-semibold text-sm">
                      from {formatNaira(r.stats.lowPerUnit)} / kVA
                    </span>
                  </div>
                  {r.brand.attributes?.bestFor && (
                    <p className="text-[#64748B] leading-relaxed text-sm mb-2">
                      <strong className="text-[#0A0F1E]">Best for:</strong> {r.brand.attributes.bestFor}
                    </p>
                  )}
                  {r.brand.attributes?.watchOut && (
                    <p className="text-[#64748B] leading-relaxed text-sm">
                      <strong className="text-[#0A0F1E]">Watch out:</strong> {r.brand.attributes.watchOut}
                    </p>
                  )}
                </div>
              ))}
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What this table cannot tell you</h2>
          <p className="text-[#64748B] leading-relaxed">
            We are not going to publish a list of brands we would not buy, because we do not have failure-rate data for
            the Nigerian market and nobody else does either. Anyone presenting one has substituted their stock list for
            evidence. What we have is price, size range, how many sellers carry it, and what each manufacturer publishes
            — and we would rather give you four things we can prove than a ranking we cannot.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Two further limits worth stating. Our seller count covers the vendors in our own catalogue, so it is a floor
            rather than a full census of the Nigerian market. And an inverter{'’'}s real-world reliability depends
            enormously on how it was installed — earthing, ventilation, cable sizing, surge protection. A premium
            inverter in a hot cupboard with undersized cable will fail before a budget one installed properly.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What to ask before you pay</h2>
          <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
            <li><strong className="text-[#0A0F1E]">The exact model number, on the invoice.</strong> Not the brand — the model. Brands run several lines at very different specifications under the same name, and the cheaper line is what gets substituted at the door.</li>
            <li><strong className="text-[#0A0F1E]">Who honours the warranty, and where.</strong> The manufacturer, the importer, or the man who installed it? Get a name and an address.</li>
            <li><strong className="text-[#0A0F1E]">Whether the monitoring dongle is included.</strong> On several brands it is an extra, and the quote rarely says so.</li>
            <li><strong className="text-[#0A0F1E]">What happens to your quote if that model is out of stock.</strong> Agree the substitute in advance, in writing, or you will be agreeing it under pressure on installation day.</li>
          </ol>
          <p className="text-[#64748B] leading-relaxed">
            The head-to-heads are written up separately if you have narrowed it to two —{' '}
            <Link href="/compare" className="text-[#F59E0B] font-semibold hover:underline">all our comparisons</Link>,
            including{' '}
            <Link href="/compare/deye-vs-felicity" className="text-[#F59E0B] font-semibold hover:underline">Deye vs Felicity</Link>{' '}
            and{' '}
            <Link href="/compare/growatt-vs-luxpower" className="text-[#F59E0B] font-semibold hover:underline">Growatt vs Luxpower</Link>.
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
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Work out the size before you pick the brand</h3>
          <p className="text-[#64748B] mb-4">
            The kVA figure decides most of your budget. Pick your appliances and the calculator sizes it — then choose
            the brand tier and watch the price move.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Size my inverter →
            </Link>
            <Link href="/brands" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              All brands &amp; prices
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
