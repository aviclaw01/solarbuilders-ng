import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { LITHIUM_MODULE_KWH, LITHIUM_PER_KWH, PRICES_LAST_UPDATED_LABEL, TUBULAR_200AH } from '@/lib/prices';
import { buildQuote, formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { getScenario } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Lithium vs Tubular Batteries in Nigeria: the 10-Year Cost (September 2026 Prices)',
  description:
    'Lithium costs more on day one and less over ten years. Here is the arithmetic, using September 2026 Nigerian prices: cost per usable kWh, depth of discharge, replacement schedule, and the three cases where tubular still wins.',
  keywords: [
    'lithium vs tubular battery nigeria',
    'which battery is best for solar in nigeria',
    'lifepo4 vs lead acid nigeria',
    'inverter battery lifespan nigeria',
  ],
  openGraph: {
    title: 'Lithium vs Tubular Batteries in Nigeria: the 10-Year Cost',
    description: 'The ten-year battery arithmetic, computed from dated Nigerian prices.',
    url: `${SITE_URL}/blog/lithium-vs-tubular-battery-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/lithium-vs-tubular-battery-nigeria` },
};

// These mirror the life expectancy printed on the bill of materials in
// lib/quote.ts ("10+ yr life" / "2–4 yr life"). They are years, not prices.
const LITHIUM_LIFE_YEARS = 10;
const TUBULAR_LIFE_YEARS = { low: 2, high: 4 };
const HORIZON_YEARS = 10;

// Usable fractions, same as the quote engine: LITHIUM_USABLE and TUBULAR_USABLE.
const LITHIUM_USABLE = 0.9;
const TUBULAR_USABLE = 0.5;
const TUBULAR_NOMINAL_KWH = 2.4; // 12V × 200Ah

export default function LithiumVsTubularPage() {
  // Same load, same engine, one option changed — which is the only fair way to
  // compare two battery chemistries.
  const scenario = getScenario('how-many-solar-panels-for-3-bedroom-flat')!;
  const lithiumQuote = buildQuote(scenario.appliances);
  const tubularQuote = buildQuote(scenario.appliances, { standard: { battery: 'tubular' } });
  const li = lithiumQuote.tiers.standard;
  const tub = tubularQuote.tiers.standard;

  const liBatteryLine = li.bom.find((l) => l.key === 'battery')!;
  const tubBatteryLine = tub.bom.find((l) => l.key === 'battery')!;

  // ₦ per kWh you can actually take out of the battery, not per label kWh.
  const liPerUsableKwh = LITHIUM_PER_KWH.mid.best / LITHIUM_USABLE;
  const tubPerUsableKwh = TUBULAR_200AH.best / (TUBULAR_NOMINAL_KWH * TUBULAR_USABLE);

  // Replacements over the horizon. Lithium: one purchase. Tubular: however many
  // times you buy the bank again before year ten.
  const tubBuysLow = Math.ceil(HORIZON_YEARS / TUBULAR_LIFE_YEARS.high);
  const tubBuysHigh = Math.ceil(HORIZON_YEARS / TUBULAR_LIFE_YEARS.low);
  const tubTenYear = {
    low: tubBatteryLine.lineCost.best * tubBuysLow,
    high: tubBatteryLine.lineCost.best * tubBuysHigh,
  };
  const liTenYear = liBatteryLine.lineCost.best;

  const faqs = [
    {
      q: 'Is lithium or tubular cheaper for solar in Nigeria?',
      a: `Tubular is cheaper on the day you buy it and more expensive by year ten. For the same load, a lithium bank costs ${formatNaira(liBatteryLine.lineCost.best)} once, while the tubular bank costs ${formatNaira(tubBatteryLine.lineCost.best)} but has to be bought roughly ${tubBuysLow}–${tubBuysHigh} times over ten years, totalling ${formatNairaShort(tubTenYear.low)}–${formatNairaShort(tubTenYear.high)}. Prices as of ${PRICES_LAST_UPDATED_LABEL}.`,
    },
    {
      q: 'How long does an inverter battery last in Nigeria?',
      a: `A tubular lead-acid battery typically lasts ${TUBULAR_LIFE_YEARS.low}–${TUBULAR_LIFE_YEARS.high} years in Nigerian conditions, and less if it is regularly discharged past half. LiFePO4 lithium is specified for ten years or more and is warranted for five by most brands sold here. The two-year figure people repeat is real, but it describes lead-acid, not lithium.`,
    },
    {
      q: 'Why do I need more tubular batteries than lithium batteries?',
      a: `Because you can only use about half of a lead-acid battery before you start destroying it, against about 90% of a LiFePO4. A 200Ah 12V tubular is labelled ${TUBULAR_NOMINAL_KWH}kWh but gives you roughly ${(TUBULAR_NOMINAL_KWH * TUBULAR_USABLE).toFixed(1)}kWh in practice, so the same backup needs roughly twice the label capacity.`,
    },
    {
      q: 'Does Nigerian heat affect lithium batteries?',
      a: 'Heat shortens the life of every battery chemistry. Lead-acid also loses water to evaporation and needs ventilation and, for flooded types, topping up. A LiFePO4 pack is sealed and its BMS will throttle or cut charging when it gets too hot, which protects the cells but means a battery cupboard with no airflow costs you capacity on the hottest afternoons. Neither chemistry belongs in a sealed metal box under a zinc roof.',
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Lithium vs tubular batteries' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Batteries
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Lithium vs Tubular Batteries in Nigeria: the 10-Year Cost
        </h1>

        <div className="flex items-center gap-4 text-[#64748B] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>9 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Lithium costs more on day one and less by year ten. For the same house, the lithium bank is{' '}
            {formatNaira(liBatteryLine.lineCost.best)} once; the tubular bank is{' '}
            {formatNaira(tubBatteryLine.lineCost.best)} but you buy it about {tubBuysLow}–{tubBuysHigh} times in ten
            years — {formatNairaShort(tubTenYear.low)}–{formatNairaShort(tubTenYear.high)}. Here is the working.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The same house, two chemistries</h2>
          <p className="text-[#64748B] leading-relaxed">
            Both columns below are the Standard build for the same {scenario.question.toLowerCase()} load —{' '}
            {(lithiumQuote.peakWatts / 1000).toFixed(1)}kW peak, {lithiumQuote.dailyKwh}kWh a day. Nothing changed
            between them except the battery type, which is a setting in our calculator. The engine then re-sizes
            everything that depends on it: the number of cells, the system voltage, and the panel array, because
            lead-acid takes charge less efficiently and needs a little more sun to fill.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]"> </th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Lithium (LiFePO4)</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Tubular (lead-acid)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['What you install', `${li.batteryModules} × ${LITHIUM_MODULE_KWH}kWh module${li.batteryModules > 1 ? 's' : ''}`, `${tub.batteryModules} × 200Ah 12V batteries`],
                  ['Label capacity', `${li.batteryKwh}kWh`, `${tub.batteryKwh}kWh`],
                  ['Usable capacity', `${(li.batteryKwh * LITHIUM_USABLE).toFixed(1)}kWh (${LITHIUM_USABLE * 100}%)`, `${(tub.batteryKwh * TUBULAR_USABLE).toFixed(1)}kWh (${TUBULAR_USABLE * 100}%)`],
                  ['Battery cost today', formatNaira(liBatteryLine.lineCost.best), formatNaira(tubBatteryLine.lineCost.best)],
                  ['Panels needed', `${li.panelCount} × ${li.panelWatts}W`, `${tub.panelCount} × ${tub.panelWatts}W`],
                  ['Whole system installed', formatRange(li.total), formatRange(tub.total)],
                  ['Expected life', `${LITHIUM_LIFE_YEARS}+ years`, `${TUBULAR_LIFE_YEARS.low}–${TUBULAR_LIFE_YEARS.high} years`],
                ].map(([label, a, b], i) => (
                  <tr key={label} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{label}</td>
                    <td className="p-4 text-[#64748B]">{a}</td>
                    <td className="p-4 text-[#64748B]">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Priced from Nigerian vendor listings, last checked {PRICES_LAST_UPDATED_LABEL}. Quotes {lithiumQuote.code}{' '}
            and {tubularQuote.code}.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Depth of discharge: why the label lies to you</h2>
          <p className="text-[#64748B] leading-relaxed">
            This is the part that catches most buyers, and it is the reason a tubular quote can look half the price and
            still not be cheaper. A battery{'’'}s printed capacity is not the capacity you get to use.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            A 200Ah 12V tubular is {TUBULAR_NOMINAL_KWH}kWh on paper. Take it below about half and you shorten its life
            sharply, so the working figure is roughly {(TUBULAR_NOMINAL_KWH * TUBULAR_USABLE).toFixed(1)}kWh. A LiFePO4
            module is happy at {LITHIUM_USABLE * 100}% depth of discharge, so a {LITHIUM_MODULE_KWH}kWh module really
            does give you about {(LITHIUM_MODULE_KWH * LITHIUM_USABLE).toFixed(1)}kWh. Convert both to the only unit
            that matters — naira per kWh you can actually take out:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Chemistry</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">₦ per label kWh</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">₦ per usable kWh</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E8F0] bg-white">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Lithium LiFePO4 (mid tier)</td>
                  <td className="p-4 text-[#64748B]">{formatNaira(LITHIUM_PER_KWH.mid.best)}</td>
                  <td className="p-4 font-semibold text-[#B45309]">{formatNaira(liPerUsableKwh)}</td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Tubular 200Ah 12V</td>
                  <td className="p-4 text-[#64748B]">{formatNaira(TUBULAR_200AH.best / TUBULAR_NOMINAL_KWH)}</td>
                  <td className="p-4 font-semibold text-[#B45309]">{formatNaira(tubPerUsableKwh)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Read on the label, tubular looks like the bargain. Read per usable kWh — before a single replacement — the
            gap narrows to almost nothing. Everything after this point is decided by how long each one lasts.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The ten-year table</h2>
          <p className="text-[#64748B] leading-relaxed">
            Lithium in this market is warranted for five years by most brands and specified for ten or more. Tubular
            lead-acid, run the way Nigerian homes run it, gives {TUBULAR_LIFE_YEARS.low}–{TUBULAR_LIFE_YEARS.high}{' '}
            years. So over a ten-year horizon you buy the lithium bank once and the tubular bank{' '}
            {tubBuysLow}–{tubBuysHigh} times.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Over {HORIZON_YEARS} years</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Lithium</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Tubular</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E2E8F0] bg-white">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Times you buy the bank</td>
                  <td className="p-4 text-[#64748B]">1</td>
                  <td className="p-4 text-[#64748B]">{tubBuysLow} – {tubBuysHigh}</td>
                </tr>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Total spent on batteries</td>
                  <td className="p-4 font-semibold text-[#B45309]">{formatNaira(liTenYear)}</td>
                  <td className="p-4 font-semibold text-[#B45309]">
                    {formatNaira(tubTenYear.low)} – {formatNaira(tubTenYear.high)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="p-4 font-heading font-semibold text-[#0A0F1E]">Difference</td>
                  <td className="p-4 text-[#64748B]" colSpan={2}>
                    Lithium is {tubTenYear.low > liTenYear ? 'cheaper' : 'dearer'} by{' '}
                    {formatNairaShort(Math.abs(tubTenYear.low - liTenYear))} in the tubular best case and{' '}
                    {formatNairaShort(Math.abs(tubTenYear.high - liTenYear))} in the worst
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] text-sm">
            Deliberately conservative: this holds today{'’'}s prices flat for ten years. In reality each replacement is
            bought at a future naira price, which makes the tubular column worse, not better. We have not tried to
            forecast that, because we cannot.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Cycle life, in plain language</h2>
          <p className="text-[#64748B] leading-relaxed">
            A cycle is one discharge and one recharge. Your battery does roughly one a day — sun charges it, evening
            empties it. That is why the arithmetic above is really about cycles rather than calendar years: a bank in a
            house with eighteen hours of grid supply will outlive the same bank in a house with four, because it is
            cycled less.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            It is also why depth of discharge and lifespan are the same argument. The fastest way to turn a
            {' '}{TUBULAR_LIFE_YEARS.high}-year tubular bank into a {TUBULAR_LIFE_YEARS.low}-year one is to keep pulling
            it down past half — which is exactly what happens when it was sized on label capacity instead of usable
            capacity. Undersizing lead-acid is self-fulfilling.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The three cases where tubular still wins</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              [`You genuinely cannot raise the lithium figure today`, `A working ${formatNairaShort(tubBatteryLine.lineCost.best)} system now beats a ${formatNairaShort(liBatteryLine.lineCost.best)} system you never buy. Lead-acid as a deliberate, informed bridge is a reasonable decision. Lead-acid because someone told you it was "more durable" is not.`],
              ['You are cycling it very lightly', 'A backup bank for a shop that only loses power occasionally may never see enough cycles for the replacement schedule above to bite.'],
              ['You need it replaceable in any town, today', 'Tubular batteries are sold everywhere in Nigeria and every technician can swap one. Lithium service depends on the brand, which is why we track how many Nigerian vendors carry each one.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Notice what is not on that list: durability. The reason installers sometimes push tubular is that it is
            cheaper to quote and therefore easier to sell, not that it lasts longer.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What we would actually put in your house</h2>
          <p className="text-[#64748B] leading-relaxed">
            Lithium, in almost every case, and a {LITHIUM_MODULE_KWH}kWh 48V module is the unit the whole Nigerian market
            is built around — it is what our quotes default to. Which brand depends on budget and on whether you can get
            it serviced where you live: budget packs from{' '}
            <Link href="/brands/blue-carbon" className="text-[#B45309] font-semibold hover:underline">Blue Carbon</Link>{' '}
            and{' '}
            <Link href="/brands/itel-energy" className="text-[#B45309] font-semibold hover:underline">ITEL</Link>,
            the volume choice from{' '}
            <Link href="/brands/felicity" className="text-[#B45309] font-semibold hover:underline">Felicity</Link>, and
            the premium end from{' '}
            <Link href="/brands/deye" className="text-[#B45309] font-semibold hover:underline">Deye</Link> and{' '}
            <Link href="/brands/pylontech" className="text-[#B45309] font-semibold hover:underline">Pylontech</Link>.
            We have the head-to-heads written up at{' '}
            <Link href="/compare/blue-carbon-vs-felicity" className="text-[#B45309] font-semibold hover:underline">Blue Carbon vs Felicity</Link>{' '}
            and{' '}
            <Link href="/compare/deye-vs-pylontech" className="text-[#B45309] font-semibold hover:underline">Deye vs Pylontech</Link>.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            One buying rule that matters more than the brand: get the model number on the invoice before you pay. The
            most common complaint in Nigerian solar is not a bad battery, it is a different battery from the one that was
            quoted. An itemised bill of materials is the whole defence, which is why every quote our calculator produces
            is itemised by model class rather than sold as a lump sum.
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
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Price both batteries for your own load</h3>
          <p className="text-[#64748B] mb-4">
            The calculator has a battery-type switch. Pick your appliances, then flip between lithium and tubular and
            watch the whole bill of materials change.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Compare both in the calculator →
            </Link>
            <Link href="/brands" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Battery brands &amp; prices
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
