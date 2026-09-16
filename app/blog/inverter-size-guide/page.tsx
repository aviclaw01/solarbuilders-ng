import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { INVERTER_BRANDS, LITHIUM_MODULE_KWH, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { buildQuote, formatNaira, type QuoteAppliance } from '@/lib/quote';
import { getScenario, presetWatts, scenarioQuote, SIZING_RULES } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'What Size Inverter Do I Need? A Nigerian Guide',
  description: 'How to choose the right inverter size for your Nigerian home: kVA ratings, load calculations, and the same appliance wattages and per-kVA prices our calculator uses, at September 2026 rates.',
  keywords: ['inverter size Nigeria', 'what size inverter do I need Nigeria', 'solar inverter guide Nigeria', 'kVA calculator Nigeria'],
  openGraph: {
    title: 'What Size Inverter Do I Need? A Nigerian Guide | SolarBuilders.ng',
    description: 'Step-by-step guide to choosing the right inverter size for your Nigerian home.',
    url: `${SITE_URL}/blog/inverter-size-guide`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/inverter-size-guide` },
};

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'What Size Inverter Do I Need? A Nigerian Guide',
  description: 'Step-by-step guide to choosing the right inverter size for your Nigerian home, priced from the same engine as the calculator.',
  author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
  publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
  datePublished: '2026-02-15',
  dateModified: '2026-09-16',
  url: `${SITE_URL}/blog/inverter-size-guide`,
};

// Appliance ids from lib/sizing.ts APPLIANCE_PRESETS — the exact wattages the
// calculator itself uses, so this table cannot drift from what a reader gets
// when they actually run the calculator.
const WATTAGE_TABLE_IDS = [
  'ac_1_5hp', 'ac_2hp', 'refrigerator', 'deep_freezer', 'washing_machine', 'water_pump',
  'tv_32', 'tv_55', 'led_bulb', 'ceiling_fan', 'standing_fan', 'laptop', 'wifi_router', 'decoder',
] as const;
const WATTAGE_TABLE_LABELS: Record<(typeof WATTAGE_TABLE_IDS)[number], string> = {
  ac_1_5hp: 'Air conditioner (1.5HP)',
  ac_2hp: 'Air conditioner (2HP)',
  refrigerator: 'Refrigerator',
  deep_freezer: 'Deep freezer',
  washing_machine: 'Washing machine',
  water_pump: 'Water pump',
  tv_32: 'Television (32")',
  tv_55: 'Television (55"+)',
  led_bulb: 'LED bulb',
  ceiling_fan: 'Ceiling fan',
  standing_fan: 'Standing fan',
  laptop: 'Laptop',
  wifi_router: 'WiFi router',
  decoder: 'DSTV/decoder',
};

// The worked example below — same appliances, same wattages the calculator
// would use for this exact list, run through buildQuote() rather than
// hand-rounded, so the inverter size this page recommends cannot disagree
// with what the calculator itself would recommend.
const EXAMPLE_APPLIANCES: QuoteAppliance[] = [
  { id: 'ac_1_5hp', name: 'Air Con (1.5HP)', watts: presetWatts('ac_1_5hp'), qty: 1, hoursPerDay: 4 },
  { id: 'refrigerator', name: 'Refrigerator', watts: presetWatts('refrigerator'), qty: 1, hoursPerDay: 8 },
  { id: 'deep_freezer', name: 'Deep Freezer', watts: presetWatts('deep_freezer'), qty: 1, hoursPerDay: 8 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', watts: presetWatts('ceiling_fan'), qty: 2, hoursPerDay: 8 },
  { id: 'tv_32', name: 'TV (32")', watts: presetWatts('tv_32'), qty: 2, hoursPerDay: 6 },
  { id: 'led_bulb', name: 'LED Bulb', watts: presetWatts('led_bulb'), qty: 8, hoursPerDay: 8 },
];

// The four capacity pages under /sizing, each answering "what can an XkVA
// inverter run" — reused here so the price-by-size table links straight to
// the page that shows the full bill of materials behind each number.
const CAPACITY_SLUGS = [
  'what-can-a-2-5kva-inverter-run',
  'what-can-a-3-5kva-inverter-run',
  'what-can-a-5kva-inverter-run',
  'what-can-a-10kva-inverter-run',
];

export default function InverterSizeGuidePage() {
  const example = buildQuote(EXAMPLE_APPLIANCES);
  const exampleStandard = example.tiers.standard;
  const requiredKw = (example.peakWatts * SIZING_RULES.inverterHeadroom) / 1000;

  const capacityRows = CAPACITY_SLUGS.map((slug) => {
    const scenario = getScenario(slug)!;
    const standard = scenarioQuote(scenario).tiers.standard;
    const inverterLine = standard.bom.find((l) => l.key === 'inverter')!;
    return { scenario, standard, inverterLine };
  });

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>
      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Inverter size guide' }]} className="mb-8" />

        <div className="mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">System Sizing</span>
        </div>
        <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight mb-4">
          What Size Inverter Do I Need? A Nigerian Guide
        </h1>
        <div className="flex items-center gap-4 text-slate-500 text-sm mb-12 pb-8 border-b border-slate-100">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Choosing the wrong inverter size is one of the most expensive mistakes Nigerian solar buyers make. Too
            small, and your system struggles or shuts off unexpectedly. Too large, and you&apos;ve spent
            unnecessarily on capacity you&apos;ll never use. This guide uses the same appliance wattages and sizing
            formula as our calculator, so the number you land on here is the number the calculator would give you too.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What is kVA and why does it matter?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Inverter capacity is measured in kVA (kilovolt-amperes). Think of it as the &quot;engine size&quot; of
            your solar system — it determines how much load (appliances) the system can handle at once.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            A common mistake is confusing kVA with kW (kilowatts). Our calculator, and installers generally, add a{' '}
            {Math.round((SIZING_RULES.inverterHeadroom - 1) * 100)}% headroom on top of your kW load before rounding
            up to a standard inverter size — the working is below.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 1: List everything you want to power</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Be honest with yourself here. Write down every appliance you want to run simultaneously during a power
            outage. This is your <em>peak load</em>.
          </p>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-6">
            <p className="font-heading font-semibold text-slate-900 mb-4">
              Appliance wattages, straight from the calculator&apos;s own appliance list:
            </p>
            <div className="space-y-2 text-sm">
              {WATTAGE_TABLE_IDS.map((id) => (
                <div key={id} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600">{WATTAGE_TABLE_LABELS[id]}</span>
                  <span className="font-semibold text-slate-900">{presetWatts(id)}W</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 2: Add up your total load</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Example: a typical 3-bedroom Lagos home running 1 AC (1.5HP), 1 fridge, 1 freezer, 2 ceiling fans, 2 TVs
            (32&quot;) and 8 LED lights — the same appliance list our calculator would size:
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
            <div className="space-y-2 text-sm mb-4">
              {EXAMPLE_APPLIANCES.map((a) => (
                <div key={a.id} className="flex justify-between">
                  <span className="text-slate-600">{a.qty} × {a.name}</span>
                  <span className="text-slate-700">{a.watts * a.qty}W</span>
                </div>
              ))}
            </div>
            <div className="border-t border-amber-200 pt-3 flex justify-between font-heading font-bold text-slate-900">
              <span>Total peak load</span>
              <span className="text-amber-700">{example.peakWatts}W</span>
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Step 3: Add a safety buffer</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Inverters should never run at 100% capacity for extended periods — it damages them and shortens their
            lifespan. The calculator adds {Math.round((SIZING_RULES.inverterHeadroom - 1) * 100)}% headroom to the
            full peak load: {example.peakWatts}W × {SIZING_RULES.inverterHeadroom} = {Math.round(requiredKw * 1000)}W
            ({requiredKw.toFixed(2)}kW), which (after also checking the AC&apos;s motor-starting surge) rounds up to
            a <strong>{exampleStandard.inverterKva}kVA inverter</strong> for this exact load.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Price by size: what a real load on that inverter costs</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Rather than a generic price band, here is the inverter-only price for four real loads from our{' '}
            <Link href="/sizing" className="text-amber-700 font-semibold hover:underline">sizing guides</Link> — each
            one a representative appliance list that actually lands on that inverter size, priced from Nigerian
            vendor listings as of {PRICES_LAST_UPDATED_LABEL}.
          </p>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Scenario</th>
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Inverter size</th>
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Inverter only ({PRICES_LAST_UPDATED_LABEL})</th>
                </tr>
              </thead>
              <tbody>
                {capacityRows.map(({ scenario, standard, inverterLine }) => (
                  <tr key={scenario.slug} className="border-t border-slate-100">
                    <td className="p-4 text-slate-600">
                      <Link href={`/sizing/${scenario.slug}`} className="hover:text-amber-600 font-medium text-slate-900">
                        {scenario.question}
                      </Link>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">{standard.inverterKva}kVA</td>
                    <td className="p-4 text-amber-700 font-semibold">
                      {formatNaira(inverterLine.unitCost.low)}–{formatNaira(inverterLine.unitCost.high)} ({standard.inverterBrands.join(' / ')})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-sm mb-6">
            Prices are for the inverter alone, at the Standard-tier brand for each size — see each sizing page for
            the full itemised build including battery, panels and labour.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Should I go hybrid or off-grid?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            <strong>Hybrid inverters</strong> work with both solar panels and the grid (NEPA). When NEPA is
            available, it charges your batteries. When it&apos;s out, solar takes over. This is the most popular
            choice in Lagos and Abuja where NEPA is unreliable but present, and it is what our calculator quotes by
            default.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            <strong>Off-grid inverters</strong> work entirely from solar and batteries — no grid connection at all.
            This is better for remote locations where NEPA doesn&apos;t reach, or for customers who want total energy
            independence.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Brands by tier</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            The brands our calculator actually quotes, grouped by the same budget / mid / premium tiers used in the
            price table above:
          </p>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li><strong>Budget —</strong> {INVERTER_BRANDS.budget.join(', ')}</li>
            <li><strong>Mid —</strong> {INVERTER_BRANDS.mid.join(', ')}</li>
            <li><strong>Premium —</strong> {INVERTER_BRANDS.premium.join(', ')}</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mb-6">
            Current vendor prices for each brand are on our <Link href="/brands" className="text-amber-700 font-semibold hover:underline">brands page</Link>.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What about batteries?</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Your inverter capacity must match your battery bank. Our calculator quotes lithium (LiFePO4) in standard{' '}
            {LITHIUM_MODULE_KWH}kWh modules by default — lithium lasts 10+ years against 2–4 years for lead-acid
            tubular, and can be discharged much deeper, so it is what we recommend unless you already have a tubular
            bank and are only replacing part of it. How many modules a given inverter size needs depends on how many
            hours of backup you want — worked out on each of the sizing pages linked above.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Not sure what size you need?
          </h3>
          <p className="text-slate-400 mb-6">Use our free calculator — it does the math for you in 5 minutes.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
          >
            Calculate My System →
          </Link>
        </div>
      </article>
      </main>
      <Footer />
    </div>
  );
}
