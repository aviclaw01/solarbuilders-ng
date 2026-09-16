import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { HEADLINE_PACKAGES, LITHIUM_MODULE_KWH, PANEL_WATTS, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { buildQuote, formatNaira, formatRange, type QuoteAppliance } from '@/lib/quote';
import { SIZING_RULES } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Solar Calculator Nigeria: What Size System Do I Need?',
  description: 'How to size a solar system for your Nigerian home: peak kW, kWh per day, lithium battery modules and 550W panels explained, with every figure below computed by the same engine that runs our calculator (September 2026 prices).',
  keywords: ['solar calculator Nigeria', 'solar system size Nigeria', 'how many solar panels Nigeria', 'kVA solar Nigeria'],
  openGraph: {
    title: 'Solar Calculator Nigeria: What Size System Do I Need? | SolarBuilders.ng',
    description: 'How solar system sizing actually works, with a fully worked, computed example.',
    url: `${SITE_URL}/blog/solar-calculator-nigeria`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/solar-calculator-nigeria` },
};

// The worked example this whole page explains. Real QuoteAppliance rows, run
// through the same buildQuote() the calculator uses — every number quoted
// below (peak load, daily kWh, tier sizing, prices) is read off this object,
// not retyped by hand, so the page cannot drift from what the calculator
// itself would produce for the identical list.
const EXAMPLE_APPLIANCES: QuoteAppliance[] = [
  { id: 'ac_1_5hp', name: 'Air Con (1.5HP)', watts: 1200, qty: 1, hoursPerDay: 6 },
  { id: 'refrigerator', name: 'Refrigerator', watts: 200, qty: 1, hoursPerDay: 8 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', watts: 65, qty: 2, hoursPerDay: 12 },
  { id: 'led_bulb', name: 'LED Bulb', watts: 10, qty: 6, hoursPerDay: 6 },
  { id: 'tv_32', name: 'TV (32")', watts: 60, qty: 1, hoursPerDay: 5 },
];

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Solar Calculator Nigeria: What Size System Do I Need?',
  description: 'How solar sizing works in Nigeria, worked through the same engine that powers the calculator.',
  author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
  publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
  datePublished: '2026-09-16',
  dateModified: '2026-09-16',
  url: `${SITE_URL}/blog/solar-calculator-nigeria`,
};

export default function SolarCalculatorNigeriaPage() {
  const quote = buildQuote(EXAMPLE_APPLIANCES);
  const { budget, standard, premium } = quote.tiers;
  const panelLine = standard.bom.find((l) => l.key === 'panels')!;
  const panelUnitLow = panelLine.unitCost.low;
  const panelUnitHigh = panelLine.unitCost.high;
  const lithiumLine = standard.bom.find((l) => l.key === 'battery')!;
  const lithiumUnitLow = lithiumLine.unitCost.low;
  const lithiumUnitHigh = lithiumLine.unitCost.high;

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-4 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'Solar calculator guide' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          System Sizing
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          Solar Calculator: What Size System Do I Need?
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>7 min read</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            The biggest mistake people make when going solar is buying the wrong size system — too small and the
            inverter trips every evening, too large and you pay for batteries you never use. Here is how the sizing
            works, worked through one real example with the exact same engine that runs our calculator — nothing
            below is hand-typed.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 1: List Your Appliances</h2>
          <p className="text-[#64748B] leading-relaxed">
            Start with every appliance you want to run on solar, how many of each, and how many hours a day you use
            it. Don&apos;t worry about the technical numbers yet — the calculator has an appliance picker with
            typical wattages built in. Our worked example for this page is a 1.5HP AC (6h), a fridge (8h), two
            ceiling fans (12h), six LED bulbs (6h) and a 32&quot; TV (5h).
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Note on fridges and freezers: the compressor cycles on and off, so even a fridge plugged in 24 hours only
            draws power for roughly 8 of them. The calculator already uses that duty cycle.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 2: Peak kW and kWh Per Day</h2>
          <p className="text-[#64748B] leading-relaxed">
            Two numbers decide everything. <strong>Peak load</strong> is the wattage of everything that could be on at
            once — this sizes the inverter. <strong>Daily energy</strong> (kWh per day) is wattage × hours, summed
            across appliances — this sizes the battery and the panels.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For the example list above: peak load is {(quote.peakWatts / 1000).toFixed(2)}kW, and daily energy is{' '}
            {quote.dailyKwh}kWh. The AC alone is {(((1200 * 6) / 1000 / quote.dailyKwh) * 100).toFixed(0)}% of that
            daily figure on its own — which is why &quot;can I run AC on solar?&quot; is really a battery question,
            not an inverter question.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            The inverter is sized from the full peak load with {Math.round((SIZING_RULES.inverterHeadroom - 1) * 100)}%
            headroom, rounded up to a standard size: {(quote.peakWatts / 1000).toFixed(2)}kW ×{' '}
            {SIZING_RULES.inverterHeadroom} ≈ {((quote.peakWatts * SIZING_RULES.inverterHeadroom) / 1000).toFixed(2)}
            kW, which lands on a {standard.inverterKva}kVA inverter for the Standard tier. Banks above two lithium
            modules move to a 48V/5kVA-or-larger inverter, which is what installers actually fit.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 3: Battery Capacity (Lithium Modules)</h2>
          <p className="text-[#64748B] leading-relaxed">
            The calculator quotes lithium (LiFePO4) by default, in standard {LITHIUM_MODULE_KWH}kWh modules — the 48V
            100Ah packs sold by Felicity, Growatt and Dyness. Backup energy = average running load (about{' '}
            {Math.round(SIZING_RULES.loadFactor * 100)}% of peak) × the hours of backup you want, divided by{' '}
            {Math.round(SIZING_RULES.lithiumUsableDoD * 100)}% usable depth of discharge, then rounded up to whole
            modules. Budget tier plans for 4 hours of night backup, Standard for {standard.autonomyHours}, Premium for{' '}
            {premium.autonomyHours}.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            For the example above at Standard: {(quote.peakWatts / 1000).toFixed(2)}kW ×{' '}
            {SIZING_RULES.loadFactor} × {standard.autonomyHours}h, divided by {SIZING_RULES.lithiumUsableDoD} usable
            DoD, rounds up to {standard.batteryModules} module{standard.batteryModules > 1 ? 's' : ''} ={' '}
            {standard.batteryKwh}kWh nominal. One {LITHIUM_MODULE_KWH}kWh module costs {formatNaira(lithiumUnitLow)}–
            {formatNaira(lithiumUnitHigh)} as of {PRICES_LAST_UPDATED_LABEL}, which is why battery is usually the
            largest line on the quote. Lithium lasts 10+ years (3,000–6,000 cycles) against 2–4 years for tubular
            batteries, so it is what the calculator quotes by default.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Step 4: Panels ({PANEL_WATTS}W)</h2>
          <p className="text-[#64748B] leading-relaxed">
            Nigeria gets roughly {SIZING_RULES.peakSunHours} peak sun hours a day. Panel watts needed = daily kWh ÷
            ({SIZING_RULES.peakSunHours} × {SIZING_RULES.systemEfficiency} system efficiency). For{' '}
            {quote.dailyKwh}kWh per day that rounds up to {standard.panelCount} × {PANEL_WATTS}W panels (
            {standard.arrayKwp}kWp) at Standard. Premium tier adds 25% extra panel capacity so batteries still
            recharge on cloudy days.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            Tier-1 panels (Jinko, JA Solar, Longi, Trina, Canadian Solar) cost {formatNaira(panelUnitLow)}–
            {formatNaira(panelUnitHigh)} per {PANEL_WATTS}W panel as of {PRICES_LAST_UPDATED_LABEL}. Import duty and
            VAT on panels, inverters and batteries are currently 0%.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">What the Calculator Gives You</h2>
          <p className="text-[#64748B] leading-relaxed">
            All of the maths above is built into our{' '}
            <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">free calculator</Link>.
            You pick appliances and quantities; it shows your peak kW and kWh per day, then three sized systems:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              [budget, '~4h night backup. Runs essentials; heavy loads only while the sun is up.'],
              [standard, '~6h backup. What most Nigerian homes install.'],
              [premium, '~10h backup, 25% extra panels and app monitoring.'],
            ].map(([tier, desc], i) => {
              const t = tier as typeof standard;
              return (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#F59E0B] mt-1">•</span>
                  <span>
                    <strong className="text-[#0A0F1E]">{t.label}:</strong>{' '}
                    {t.inverterBrands.join(' / ')} inverter, {t.batteryBrands.join(' / ')} lithium, {desc as string}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Each tier is an itemised bill of materials: hybrid inverter (brand tier and kVA), lithium modules (count
            and kWh), {PANEL_WATTS}W panels (count), mounting, cables and protection (rails, DC/AC cable, breakers,
            surge protector, combiner, earthing, changeover), and installation labour. Every line has a low / typical
            / high price from Nigerian vendor listings, updated {PRICES_LAST_UPDATED_LABEL}. The quote carries a
            short code (for example <code className="text-sm bg-[#F8FAFC] px-1.5 py-0.5 rounded">{quote.code}</code>)
            that rebuilds the exact same quote later, and you can download it as a PDF or image.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Worked Example</h2>
          <p className="text-[#64748B] leading-relaxed">
            Running the example household above ({(quote.peakWatts / 1000).toFixed(2)}kW peak,{' '}
            {quote.dailyKwh}kWh per day) through the calculator at {PRICES_LAST_UPDATED_LABEL} prices gives:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Tier</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Estimate</th>
                </tr>
              </thead>
              <tbody>
                {[budget, standard, premium].map((t, i) => (
                  <tr key={t.key} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{t.label}</td>
                    <td className="p-4 text-[#64748B]">
                      {t.inverterKva}kVA · {t.batteryModules} × {LITHIUM_MODULE_KWH}kWh · {t.panelCount} × {PANEL_WATTS}W
                    </td>
                    <td className="p-4 font-semibold text-[#F59E0B]">
                      {formatNaira(t.total.best)} ({formatRange(t.total)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            For reference, these are the typical installed ranges the calculator produces for common Nigerian
            household sizes:
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-hidden my-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed ({PRICES_LAST_UPDATED_LABEL})</th>
                </tr>
              </thead>
              <tbody>
                {HEADLINE_PACKAGES.map((p, i) => (
                  <tr key={p.label} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{p.label}</td>
                    <td className="p-4 text-[#64748B]">{p.powers}</td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{formatNaira(p.low)} – {formatNaira(p.high)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">From Quote to Installed System</h2>
          <p className="text-[#64748B] leading-relaxed">
            When the quote looks right, tap <strong>Get this system built</strong>. That sends the quote to us and
            opens WhatsApp. We confirm every line against current vendor stock (the same vendors listed on our{' '}
            <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brands page</Link>), source
            the equipment, and manage an installer we have{' '}
            <Link href="/verified" className="text-[#F59E0B] font-semibold hover:underline">already vetted</Link>{' '}
            through to commissioning. The calculator estimate is the starting point; the confirmed price comes after
            we check stock and your site.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Try the free calculator</h3>
          <p className="text-[#64748B] mb-4">Pick your appliances, get three itemised quotes with a quote code. No signup, no fees.</p>
          <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
            Get an itemised quote →
          </Link>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
