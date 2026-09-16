import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { LITHIUM_MODULE_KWH, LITHIUM_PER_KWH, OPTIONAL_ITEMS, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { buildQuote, formatNaira, formatRange, type QuoteAppliance } from '@/lib/quote';
import { NET_BILLING_MIN_KWP } from '@/lib/energy-costs';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'What It Costs to Solar-Power a Cold Room in Nigeria',
  description:
    'A costed, itemised answer for a small cold room: the inverter, the battery bank, the array and the installed price at September 2026 Nigerian prices — plus the three things that make cold storage the hardest solar load in the country.',
  keywords: [
    'solar cold room nigeria cost',
    'solar for frozen food business',
    'solar for poultry farm nigeria',
    'cold room inverter size nigeria',
  ],
  openGraph: {
    title: 'What It Costs to Solar-Power a Cold Room in Nigeria',
    description: 'The power side of a cold room, costed independently of anyone selling you the room.',
    url: `${SITE_URL}/blog/solar-cold-room-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/solar-cold-room-nigeria` },
};

/**
 * The modelled load. These are stated assumptions about a small cold room, not
 * measurements of anybody's installation — the article says so plainly, and
 * every reader is told to check their own nameplate. Custom ids (not calculator
 * presets) so the ?q= link restores these exact wattages rather than a preset's.
 */
const COLD_ROOM_LOAD: QuoteAppliance[] = [
  { id: 'coldroom_condensing_unit', name: 'Condensing unit (≈3HP compressor)', watts: 2600, qty: 1, hoursPerDay: 12 },
  { id: 'coldroom_evaporator_fans', name: 'Evaporator fans', watts: 400, qty: 1, hoursPerDay: 18 },
  { id: 'coldroom_lighting', name: 'Room lighting & controls', watts: 80, qty: 1, hoursPerDay: 4 },
];

export default function SolarColdRoomPage() {
  const quote = buildQuote(COLD_ROOM_LOAD);
  const standard = quote.tiers.standard;
  const premium = quote.tiers.premium;

  // The trade every cold-store operator is actually making: one more battery
  // module against the cost of one lost night. We can price the module.
  const extraModuleCost = LITHIUM_PER_KWH.mid.best * LITHIUM_MODULE_KWH;

  const faqs = [
    {
      q: 'What size solar system does a cold room need in Nigeria?',
      a: `For the small cold room modelled here — a roughly 3HP condensing unit, evaporator fans and lighting, drawing ${(quote.peakWatts / 1000).toFixed(1)}kW at once and ${quote.dailyKwh}kWh a day — the computed build is a ${standard.inverterKva}kVA inverter, ${standard.batteryKwh}kWh of lithium and ${standard.panelCount} × ${standard.panelWatts}W panels, ${formatRange(standard.total)} installed at ${PRICES_LAST_UPDATED_LABEL} prices. Your own compressor rating will move all of those numbers, so check the nameplate before using this as a budget.`,
    },
    {
      q: 'Can solar run a cold room 24 hours a day?',
      a: 'Yes, but it is the most expensive load in residential-scale solar to cover, because a cold room draws power all night when the panels make none. That is a battery problem, and the battery is the largest line on the quote. Most operators run hybrid — solar and grid together, with the generator kept as the last line of defence — rather than paying for enough battery to be genuinely independent.',
    },
    {
      q: 'Why is a cold room harder to size than a house?',
      a: 'Three reasons. The load is continuous rather than peaky, so there is no quiet period for the battery to recover. The compressor draws several times its running current at the instant it starts, which sets the inverter size. And unlike a house, a dead battery is not an inconvenience — it is spoiled stock.',
    },
    {
      q: 'Should I keep the grid connection?',
      a: 'Yes. For a revenue-critical load, the grid is a second source of energy you have already paid to be connected to, and giving it up to save on a monthly charge is a false economy. The right architecture is solar first, grid second, generator third, with a properly rated changeover between them.',
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
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Solar for a cold room' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Commercial
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          What It Costs to Solar-Power a Cold Room
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>10 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            A small cold room with a roughly 3HP condensing unit needs about a {standard.inverterKva}kVA inverter,{' '}
            {standard.batteryKwh}kWh of lithium and {standard.panelCount} × {standard.panelWatts}W panels —{' '}
            {formatRange(standard.total)} installed at {PRICES_LAST_UPDATED_LABEL} prices. The battery, not the panels,
            is what makes it expensive.
          </p>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">Read the assumptions before the price</h2>
            <p className="text-[#64748B] leading-relaxed text-sm">
              Cold rooms are not a standard product. Insulation thickness, door discipline, ambient temperature, how
              often you load warm stock and whether you are chilling or freezing all change the duty cycle by more than
              any equipment choice will. The load below is a stated model, not a measurement of anyone{'’'}s
              installation, and the naira figures follow from it. Take your condensing unit{'’'}s nameplate rating to
              the calculator and rebuild this with your own numbers before you budget anything.
            </p>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The load we are costing</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Load</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Watts</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Hours/day</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">kWh/day</th>
                </tr>
              </thead>
              <tbody>
                {COLD_ROOM_LOAD.map((l, i) => (
                  <tr key={l.id} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{l.name}</td>
                    <td className="p-4 text-[#64748B]">{l.watts.toLocaleString('en-NG')}W</td>
                    <td className="p-4 text-[#64748B]">{l.hoursPerDay}</td>
                    <td className="p-4 text-[#64748B]">{((l.watts * l.qty * l.hoursPerDay) / 1000).toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="bg-[#0A0F1E] text-white">
                  <td className="p-4 font-heading font-bold">Total</td>
                  <td className="p-4 font-heading font-bold">{(quote.peakWatts / 1000).toFixed(1)}kW peak</td>
                  <td className="p-4"> </td>
                  <td className="p-4 font-heading font-bold">{quote.dailyKwh}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Note the shape of this load compared to a house. The hours are long, the draw is steady, and roughly
            three-quarters of the daily energy is consumed by one motor that does not care whether the sun is up.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Why cold storage is the hardest solar load in Nigeria</h2>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['It runs at night', 'A house empties its battery over an evening and refills it the next morning. A cold room draws through the night at close to its daytime rate, which is why the battery bank on this quote is the dominant line and why halving it is not an available saving.'],
              ['Compressors surge on start', 'A compressor pulls several times its running current for the first second or two. Size the inverter on running watts alone and it will trip every time the unit cycles — which, for a cold room, is many times a day.'],
              ['There is no tolerance for a flat battery', 'A house with a dead battery is a dark house. A cold room with a dead battery is a claim. The design has to fail safe, which means the grid and the generator stay in the picture.'],
              ['Ambient heat works against you', 'The hotter the day, the harder the compressor works and the longer it runs — so the load peaks in exactly the season when everything else in the system is also under thermal stress.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The computed system</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
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
            {PRICES_LAST_UPDATED_LABEL}. Quote {quote.code}.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The Premium build for the same load — {premium.inverterKva}kVA, {premium.batteryKwh}kWh and{' '}
            {premium.panelCount} panels, {formatRange(premium.total)} — buys roughly{' '}
            {premium.autonomyHours} hours of autonomy against the Standard build{'’'}s {standard.autonomyHours}, plus
            panel headroom for cloudy weeks. For a revenue-critical load that difference is not a luxury tier; it is the
            difference between riding out a bad week and losing stock.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The one thing this quote does not include</h2>
          <p className="text-[#64748B] leading-relaxed">
            Compressor inrush. Our engine sizes for the start of a domestic compressor, and a cold-room condensing unit
            is a larger machine than anything in a house. Two consequences, and both belong in your specification before
            anyone quotes you:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Specify a soft starter, or size up', 'A soft starter on the condensing unit is far cheaper than the next inverter size, and it also stops you hammering the compressor windings. If the unit will not take one, budget for the next standard inverter size above the computed figure.'],
              ['Get the LRA from the nameplate', 'Locked-rotor amps is the number that actually determines whether your inverter survives the start. It is printed on the unit. Give it to whoever sizes your system, and if they do not ask for it, that tells you something.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Hybrid, not off-grid — and why</h2>
          <p className="text-[#64748B] leading-relaxed">
            Keep the grid connection and keep the generator. This is the opposite of the advice a homeowner gets, and
            the reason is that for a cold room the objective is not independence, it is uptime. Three sources of energy
            with an automatic changeover between them is a more reliable room than one source and a much bigger battery
            for the same money.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The changeover is worth specifying properly rather than treating as an accessory —{' '}
            {formatNaira(OPTIONAL_ITEMS.changeover_63a.low)}–{formatNaira(OPTIONAL_ITEMS.changeover_63a.high)} depending
            on rating and brand, and it is the part that decides whether your room notices a grid failure at 3am. We
            have seen a transfer switch burn out on the return of grid power after a month of outage; in a house that is
            an evening{'’'}s inconvenience, and in a cold room it is the whole loss.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">The trade to actually make: one more battery module</h2>
          <p className="text-[#64748B] leading-relaxed">
            We are not going to put a naira figure on a day of spoiled stock. That number depends entirely on what is in
            your room and we do not have it. You do — and it is the only number you need for this decision.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Here is what we can price: one additional {LITHIUM_MODULE_KWH}kWh lithium module is about{' '}
            {formatNaira(extraModuleCost)}, which adds roughly{' '}
            {(LITHIUM_MODULE_KWH * 0.9).toFixed(1)}kWh of usable storage — on this load, a meaningful extension to how
            long the room holds without sun or grid. Set that number against your own cost of one lost night. For most
            cold-store operators the arithmetic is not close, and the mistake is almost always undersizing the bank to
            hit a headline price.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Payback: what we can and cannot tell you</h2>
          <p className="text-[#64748B] leading-relaxed">
            A cold room in Nigeria is usually backed by a diesel generator, and we do not hold a dated diesel price the
            way we hold equipment prices. Rather than publish a payback figure built on a fuel price we cannot source
            and date, we will give you the method and let you put your own number in.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Your generator{'’'}s litres per hour × your diesel price × the hours it runs = your displaced annual spend.
            Divide {formatNaira(standard.total.best)} by that figure and you have the payback in years. The full worked
            method, applied to a household with petrol, is in{' '}
            <Link href="/blog/is-solar-worth-it-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              is solar worth it in Nigeria
            </Link>{' '}
            — the arithmetic is identical, only the fuel changes.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            One thing worth saying about commercial payback that does not apply to homes: for a cold room, the saving is
            not only fuel. It is the stock you stop losing, and the customers you stop losing with it. That belongs in
            your calculation even though it will never appear in ours.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">If your site is much larger</h2>
          <p className="text-[#64748B] leading-relaxed">
            Above roughly {NET_BILLING_MIN_KWP} kWp of array, a different regime opens up: the NERC Net Billing
            Regulations 2026 allow qualifying prosumers to export surplus to the DisCo for credit. That threshold is far
            beyond a single small cold room but well within reach of a processing plant, a poultry operation at scale or
            an industrial cold store. We have written up{' '}
            <Link href="/blog/sell-solar-power-to-nepa-net-billing" className="text-[#F59E0B] font-semibold hover:underline">
              who net billing actually covers
            </Link>{' '}
            and what the process involves.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">How we would procure and install it</h2>
          <p className="text-[#64748B] leading-relaxed">
            Commercial jobs go wrong in procurement more often than in engineering. Our process is the same one we use
            for homes, with the bill of materials fixed before money moves: you get an itemised quote with model classes,
            we confirm each line against current stock with Nigerian vendors, and we manage an installer we have{' '}
            <Link href="/verified" className="text-[#F59E0B] font-semibold hover:underline">already vetted</Link>{' '}
            through to commissioning. We take a procurement margin — that is how we are paid, and you should know it
            before you read our price as neutral.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For anything at site scale, start at{' '}
            <Link href="/for-builders" className="text-[#F59E0B] font-semibold hover:underline">for builders and developers</Link>{' '}
            or just <Link href="/contact" className="text-[#F59E0B] font-semibold hover:underline">send us the nameplate photo</Link>.
            The nameplate is genuinely the fastest way to get a real answer.
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
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Rebuild this with your own compressor</h3>
          <p className="text-[#64748B] mb-4">
            Put your condensing unit{'’'}s actual watts and running hours into the calculator and it recomputes the whole
            bill of materials at {PRICES_LAST_UPDATED_LABEL} prices.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Size my cold room →
            </Link>
            <Link href="/sizing/solar-for-a-shop-in-nigeria" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Solar for a shop
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
