import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  EQUIPMENT_VAT,
  INVERTER_PER_KVA,
  LITHIUM_MODULE_KWH,
  LITHIUM_PER_KWH,
  PANEL_BRANDS,
  PANEL_PER_WP,
  PANEL_WATTS,
  PRICES_LAST_UPDATED_LABEL,
  USD_NGN_RATE,
} from '@/lib/prices';
import { formatNaira } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'How to Tell a Real Solar Panel from a Fake One in Nigeria',
  description:
    'The 60-second checks, plus the one test nobody else can give you: a published price floor. If a 550W panel is quoted below the real ₦/Wp floor for September 2026, it is not a 550W panel.',
  keywords: [
    'fake solar panel nigeria',
    'how to know original solar panel',
    'how to identify fake inverter battery',
    'original solar panel price nigeria',
  ],
  openGraph: {
    title: 'How to Tell a Real Solar Panel from a Fake One in Nigeria',
    description: 'Three checks that take a minute, and the price test only a published price list can give you.',
    url: `${SITE_URL}/blog/fake-solar-panels-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/fake-solar-panels-nigeria` },
};

export default function FakeSolarPanelsPage() {
  // Every floor below is the bottom of a real observed price range — the
  // Alaba/Jiji bulk-wholesale end, not the showroom end. Nothing genuine is
  // sold under it, which is exactly what makes it a usable test.
  const panelFloor = PANEL_PER_WP.low * PANEL_WATTS;
  const panelTypical = PANEL_PER_WP.best * PANEL_WATTS;
  const lithiumModuleFloor = LITHIUM_PER_KWH.budget.low * LITHIUM_MODULE_KWH;
  const lithiumModuleTypical = LITHIUM_PER_KWH.budget.best * LITHIUM_MODULE_KWH;
  const inverter5kvaFloor = INVERTER_PER_KVA.budget.low * 5;
  const inverter5kvaTypical = INVERTER_PER_KVA.budget.best * 5;
  const panelFloorUsd = panelFloor / USD_NGN_RATE;

  const floors = [
    {
      item: `Solar panel, ${PANEL_WATTS}W Tier-1 mono`,
      floor: panelFloor,
      typical: panelTypical,
      unit: `${formatNaira(PANEL_PER_WP.low)}–${formatNaira(PANEL_PER_WP.high)} per watt`,
    },
    {
      item: `Lithium module, ${LITHIUM_MODULE_KWH}kWh 48V LiFePO4`,
      floor: lithiumModuleFloor,
      typical: lithiumModuleTypical,
      unit: `${formatNaira(LITHIUM_PER_KWH.budget.low)}–${formatNaira(LITHIUM_PER_KWH.premium.high)} per kWh`,
    },
    {
      item: 'Hybrid inverter, 5kVA 48V',
      floor: inverter5kvaFloor,
      typical: inverter5kvaTypical,
      unit: `${formatNaira(INVERTER_PER_KVA.budget.low)}–${formatNaira(INVERTER_PER_KVA.premium.high)} per kVA`,
    },
  ];

  const faqs = [
    {
      q: 'How can I tell if a solar panel is original in Nigeria?',
      a: `Three checks. First, price: a genuine ${PANEL_WATTS}W Tier-1 panel does not sell below about ${formatNaira(panelFloor)} anywhere in Nigeria, because that is roughly what it costs to land. Second, the nameplate: the label must carry a model number, a serial and IEC 61215 and IEC 61730 certification, and the seller should be able to produce the test certificate for that model. Third, weight and build: a real ${PANEL_WATTS}W panel is heavy, its junction box is sealed and screwed, and its MC4 leads are branded.`,
    },
    {
      q: 'What is the cheapest a real solar panel can be in Nigeria?',
      a: `Our floor, taken from Nigerian vendor listings last checked ${PRICES_LAST_UPDATED_LABEL}, is ${formatNaira(PANEL_PER_WP.low)} per watt at true Alaba bulk-wholesale, which is ${formatNaira(panelFloor)} for a ${PANEL_WATTS}W panel. A typical retail price is ${formatNaira(panelTypical)}. Below the floor, the honest explanations are a used panel, a lower-wattage panel relabelled, or a mislabelled B-grade unit.`,
    },
    {
      q: 'How do I know if an inverter battery is fake?',
      a: `Weight is the giveaway. A ${LITHIUM_MODULE_KWH}kWh LiFePO4 pack contains a specific mass of cells and cannot be light. Ask for the BMS to be shown on the app or display, ask for the cell brand, and check the price: below about ${formatNaira(lithiumModuleFloor)} for a ${LITHIUM_MODULE_KWH}kWh 48V module, the capacity claim is almost certainly inflated.`,
    },
    {
      q: 'What should I do if I already bought a fake panel?',
      a: 'Stop assuming it is dangerous and start measuring. Have a technician check open-circuit voltage and short-circuit current against the nameplate in full sun — that tells you what you actually own. Keep the panel out of a string with good panels, because a weak module drags the whole string down. Then decide on economics, not anger: if it produces two-thirds of its label and it is already on your roof, replacing it may not be the best use of your next naira.',
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Spotting fake solar panels' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Buyer Guide
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          How to Tell a Real Solar Panel from a Fake One in Nigeria
        </h1>

        <div className="flex items-center gap-4 text-[#64748B] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>8 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            Three checks, sixty seconds. One: is it priced below {formatNaira(panelFloor)} for a {PANEL_WATTS}W panel?
            Nothing genuine is. Two: does the label carry a model number, a serial and IEC 61215 / 61730? Three: is it
            heavy, with a sealed junction box and branded MC4 leads? Fail any of them and walk.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 1 — the price test</h2>
          <p className="text-[#64748B] leading-relaxed">
            This is the check almost nobody can give you, and it is by far the most reliable. Solar panels, inverters and
            lithium cells are imported, dollar-priced commodities. Import duty and VAT on them are{' '}
            {EQUIPMENT_VAT}% under the ECOWAS Common External Tariff, so there is no tax story that explains a bargain,
            and there is a hard floor below which nobody in Nigeria can sell a genuine unit and still eat.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            These are our floors. They come from real Nigerian vendor listings, last checked{' '}
            {PRICES_LAST_UPDATED_LABEL}, and the low column is the true Alaba bulk-wholesale end — not a retail price,
            not a promotion. If you are quoted meaningfully below it, something in the description is wrong.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Item</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Unit price seen</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Floor — below this, ask</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Typical</th>
                </tr>
              </thead>
              <tbody>
                {floors.map((f, i) => (
                  <tr key={f.item} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{f.item}</td>
                    <td className="p-4 text-[#64748B]">{f.unit}</td>
                    <td className="p-4 font-semibold text-[#B45309]">{formatNaira(f.floor)}</td>
                    <td className="p-4 text-[#64748B]">{formatNaira(f.typical)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            At the naira rate we priced against, {formatNaira(panelFloor)} is about ${panelFloorUsd.toFixed(0)} for a{' '}
            {PANEL_WATTS}W module, shipped, cleared and sitting in a Lagos warehouse. That is already a thin number.
            Anyone selling the same panel for half of it is not a better negotiator than the entire import trade.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The three honest explanations for a below-floor price, in order of how often we see them: it is a lower
            wattage than the sticker claims; it is a used or B-grade module; or the price excludes something you assumed
            was included. The dishonest explanation is a relabelled panel, and the price test catches all four.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 2 — the nameplate, and what to ask for</h2>
          <p className="text-[#64748B] leading-relaxed">
            Every genuine module carries a nameplate on the back with: the manufacturer, a model number, a unique serial,
            the electrical ratings at standard test conditions, and certification marks. The two that matter are{' '}
            <strong className="text-[#0A0F1E]">IEC 61215</strong> (does it perform and survive as claimed) and{' '}
            <strong className="text-[#0A0F1E]">IEC 61730</strong> (is it electrically safe).
          </p>
          <p className="text-[#64748B] leading-relaxed">
            A sticker is not a certification. Anyone can print one. What you are entitled to ask for is the certificate
            itself — the test report from the certifying body, naming that exact model. Real distributors of{' '}
            {PANEL_BRANDS.slice(0, 3).join(', ')} and the other Tier-1 lines have these and will send them. A seller who
            cannot produce a document for the model they are selling you has told you everything you need to know, and
            they have told you before you paid.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Second thing to ask for: the serial numbers of the actual panels being delivered, written on your invoice.
            This is the specific defence against the most common betrayal in the Nigerian market, which is not a fake
            panel at all — it is a real panel of a different brand, substituted at the door, with the installer
            explaining that your brand is {'“'}no longer in the market{'”'}. Model numbers on the invoice make that
            conversation short.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Check 3 — physical checks anyone can do</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Weight', `A ${PANEL_WATTS}W module is a two-person lift. Glass, frame and encapsulant have a minimum mass. If one person can carry it comfortably, the cell count or the glass is wrong.`],
              ['Junction box', 'It should be sealed, potted and screwed to the backsheet, not glued on and rattling. Open the lid on nothing — but if it flexes under thumb pressure, be suspicious.'],
              ['Cables and MC4', 'Genuine leads are branded along the insulation, correctly gauged and properly crimped. Thin, unbranded, easily-bent cable is the cheapest corner to cut and the one most likely to start a fire.'],
              ['Frame and corners', 'Anodised aluminium, square corners, no burrs, drainage holes present. A frame you can twist by hand will not survive a Harmattan wind on a Lagos roof.'],
              ['Cells under the glass', 'Look across the surface at an angle in daylight. Cells should be uniform, evenly spaced and free of visible cracks, discolouration or the dark snail-trail lines that show up on aged or mishandled modules.'],
              ['The label under the glass, not just on the back', 'Tier-1 makers print the model and often a laser-etched code inside the laminate. A back-sticker alone, especially one that peels, is a red flag.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#B45309] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The only real proof: measure it</h2>
          <p className="text-[#64748B] leading-relaxed">
            Everything above is a screening test. The actual proof takes a multimeter and five minutes of sunshine.
            Measure open-circuit voltage (Voc) across the leads with nothing connected, and short-circuit current (Isc)
            with the leads briefly bridged through the meter. Both are printed on the nameplate. In bright midday sun a
            genuine panel lands close to its Voc and within a reasonable margin of its Isc; a panel producing well under
            its rated current is not the panel on the label, whatever the label says.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Do this <em>before</em> the panels go on the roof. Once they are mounted and wired, the cost of being right
            goes up enormously. A serious installer will not object to you testing what you are buying; an installer who
            objects has just failed a different test.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Batteries: weight and the BMS</h2>
          <p className="text-[#64748B] leading-relaxed">
            Battery fakery is usually a capacity claim rather than a counterfeit brand — a pack sold as{' '}
            {LITHIUM_MODULE_KWH}kWh that holds considerably less. Weight is again the giveaway, because cells have mass
            and there is no way to fake it. Below roughly {formatNaira(lithiumModuleFloor)} for a{' '}
            {LITHIUM_MODULE_KWH}kWh 48V LiFePO4 module, treat the capacity number as a marketing claim until it is
            proven.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Ask for the BMS to be shown — on the display, on the app, or over the comms port — and ask what cells are
            inside. Then, once it is installed, do the only test that settles it: charge it full, run a known load, and
            time how long it holds. A pack that empties in half the expected time was never the capacity you paid for,
            and you want to discover that inside the warranty window, not in year three.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Where fakes concentrate, honestly</h2>
          <p className="text-[#64748B] leading-relaxed">
            We are not going to publish a list of markets or name sellers. We do not have inspection data to support
            that, and a claim like {'“'}80% of solar in Nigeria is fake{'”'} — which circulates widely on Nigerian
            forums — has no source anyone has ever been able to point at. Repeating it would be the same offence in the
            opposite direction.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            What we can say from our own price research is narrower and more useful: the wider the spread of prices for
            a given model, the more carefully you should check what you are being offered. The clearest example in our
            catalogue is Felicity, where the identical 5kVA inverter class appears at radically different prices
            depending on the seller and the model generation. That spread is not evidence of fakery — it is evidence
            that <em>buying it right matters</em>, and that a price alone tells you nothing without a model number
            attached to it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How we source, and why we take a margin</h2>
          <p className="text-[#64748B] leading-relaxed">
            Plainly, because you should judge this page knowing it: we make our money on procurement margin when we buy
            equipment on a customer{'’'}s behalf. That is the incentive behind this article, and it is also the reason
            the price floors above are real — a floor we inflated would be a floor we had to beat on every order.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            We publish prices by brand and model, dated, on our{' '}
            <Link href="/brands" className="text-[#B45309] font-semibold hover:underline">brands pages</Link> and in the{' '}
            <Link href="/shop" className="text-[#B45309] font-semibold hover:underline">shop</Link>. We do not publish
            our vendors{'’'} contact details, because sourcing is the service we are paid for. What we do publish is
            every price we saw, where the class of seller was, and the date — so you can check any quote, including
            ours, against it.
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

          <p className="text-[#64748B] leading-relaxed">
            The companion piece to this one is about the person selling you the panel rather than the panel itself:{' '}
            <Link href="/blog/check-solar-installer-qualified-nemsa" className="text-[#B45309] font-semibold hover:underline">
              how to check your installer is actually qualified
            </Link>, including NEMSA certification and how deposits should be staged. And if you want to know what our
            own vetting involves, it is written out on{' '}
            <Link href="/verified" className="text-[#B45309] font-semibold hover:underline">how we vet</Link>.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Check a quote you have been given</h3>
          <p className="text-[#64748B] mb-4">
            Build the same system in our calculator and compare it line by line. If a line in your quote is far under
            ours, you now know exactly which question to ask.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Build an itemised quote →
            </Link>
            <Link href="/brands" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              See prices by brand
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
