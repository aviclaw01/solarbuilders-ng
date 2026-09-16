import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import {
  BOS_FRACTION,
  EQUIPMENT_VAT,
  HEADLINE_PACKAGES,
  INVERTER_BRANDS,
  INVERTER_PER_KVA,
  LABOUR_FLOOR,
  LABOUR_PER_KVA,
  LITHIUM_BRANDS,
  LITHIUM_MODULE_KWH,
  LITHIUM_PER_KWH,
  OPTIONAL_ITEMS,
  PANEL_BRANDS,
  PANEL_PER_WP,
  PANEL_WATTS,
  PRICES_LAST_UPDATED,
  PRICES_LAST_UPDATED_LABEL,
  TUBULAR_200AH,
  USD_NGN_RATE,
  type InverterTier,
} from '@/lib/prices';
import { INVERTER_TIER_LABEL, formatNaira, formatRange } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { brandSlugByName } from '@/lib/brands';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'What a Nigerian Solar System Actually Costs — Every Component, Every Price',
  description:
    'Dated, itemised Nigerian solar prices: ₦ per kVA for inverters, ₦ per kWh for lithium, ₦ per Wp for panels, plus mounting and labour — last checked September 2026. Use it to check any quote you have been given.',
  keywords: [
    'solar panel price in nigeria',
    'solar battery price in nigeria',
    'inverter price in nigeria',
    'how much does solar cost in nigeria',
    'solar cost nigeria 2026',
  ],
  openGraph: {
    title: 'What a Nigerian Solar System Actually Costs — Every Component, Every Price',
    description: 'Component-by-component Nigerian solar prices, dated and itemised.',
    url: `${SITE_URL}/blog/solar-cost-nigeria-2026`,
    type: 'article',
  },
  alternates: { canonical: `${SITE_URL}/blog/solar-cost-nigeria-2026` },
};

const TIERS: InverterTier[] = ['budget', 'mid', 'premium'];

/** Link a brand name to its page where we have one — a name with no page is still a real name. */
function BrandList({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => {
        const slug = brandSlugByName(name);
        return (
          <span key={name}>
            {i > 0 && ', '}
            {slug ? (
              <Link href={`/brands/${slug}`} className="text-[#F59E0B] font-semibold hover:underline">{name}</Link>
            ) : (
              name
            )}
          </span>
        );
      })}
    </>
  );
}

export default function SolarCostNigeriaPage() {
  // The receipt. Nigerians share itemised bills of materials, not price ranges,
  // so the centrepiece of this page is one real build costed line by line.
  const scenario = getScenario('how-many-solar-panels-for-3-bedroom-flat')!;
  const quote = scenarioQuote(scenario);
  const t = quote.tiers.standard;

  const familyHome = HEADLINE_PACKAGES[2];
  const panelUnit = PANEL_PER_WP.best * PANEL_WATTS;
  const moduleUnit = LITHIUM_PER_KWH.mid.best * LITHIUM_MODULE_KWH;
  const spreadPct = Math.round(((PANEL_PER_WP.high - PANEL_PER_WP.low) / PANEL_PER_WP.low) * 100);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: 'What a Nigerian Solar System Actually Costs — Every Component, Every Price',
    description:
      'Component-by-component Nigerian solar prices, dated and sourced: inverters per kVA, lithium per kWh, panels per Wp, plus balance of system and labour.',
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished: '2026-03-01',
    dateModified: PRICES_LAST_UPDATED,
    url: `${SITE_URL}/blog/solar-cost-nigeria-2026`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <main>

      <article className="max-w-3xl mx-auto px-6 py-16">
        <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: 'What solar costs in Nigeria' }]} className="mb-8" />

        <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
          Costs &amp; Pricing
        </span>

        <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-6">
          What a Nigerian Solar System Actually Costs — Every Component, Every Price
        </h1>

        <div className="flex items-center gap-4 text-[#94A3B8] text-sm mb-12 pb-8 border-b border-[#E2E8F0]">
          <span>Updated {PRICES_LAST_UPDATED_LABEL}</span>
          <span>·</span>
          <span>11 min read</span>
          <span>·</span>
          <span>By SolarBuilders.ng</span>
        </div>

        <div className="space-y-6 text-[#0A0F1E]">
          <p className="text-xl text-[#64748B] leading-relaxed">
            A {familyHome.label} system — a family home with one AC — is{' '}
            {formatNaira(familyHome.low)}–{formatNaira(familyHome.high)} installed, at prices last checked{' '}
            {PRICES_LAST_UPDATED_LABEL}. Below is every component that makes up that number, per kVA, per kWh and per
            watt, so you can check any quote you have been given against it.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">Installed price, by system size</h2>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">System</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">What it runs</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Installed</th>
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
          <p className="text-[#94A3B8] text-sm">
            Everything included: inverter, lithium battery, Tier-1 panels, mounting and protection, and installation
            labour. Import duty and VAT on panels, inverters and batteries are {EQUIPMENT_VAT}%.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">A real build, itemised</h2>
          <p className="text-[#64748B] leading-relaxed">
            Ranges are useful for budgeting and useless for checking a quote. So here is one actual system, priced line
            by line — our {scenario.question.toLowerCase()} load at the Standard build:{' '}
            {(quote.peakWatts / 1000).toFixed(1)}kW if everything runs at once, {quote.dailyKwh}kWh a day.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[620px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Item</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Spec</th>
                  <th className="text-right p-4 font-heading font-semibold text-[#0A0F1E]">Unit</th>
                  <th className="text-right p-4 font-heading font-semibold text-[#0A0F1E]">Line</th>
                </tr>
              </thead>
              <tbody>
                {t.bom.map((line, i) => (
                  <tr key={line.key} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">
                      {line.qty > 1 ? `${line.qty}× ` : ''}{line.item}
                    </td>
                    <td className="p-4 text-[#64748B]">{line.spec}</td>
                    <td className="p-4 text-right text-[#64748B]">{formatNaira(line.unitCost.best)}</td>
                    <td className="p-4 text-right font-semibold text-[#0A0F1E]">{formatNaira(line.lineCost.best)}</td>
                  </tr>
                ))}
                <tr className="bg-[#0A0F1E] text-white">
                  <td className="p-4 font-heading font-bold" colSpan={3}>Installed total</td>
                  <td className="p-4 text-right font-heading font-bold">{formatNaira(t.total.best)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[#94A3B8] text-sm">
            Range {formatRange(t.total)}. Quote {quote.code}. Full working on the{' '}
            <Link href={`/sizing/${scenario.slug}`} className="text-[#F59E0B] font-semibold hover:underline">
              sizing page for this load
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">1. Inverters — ₦ per kVA</h2>
          <p className="text-[#64748B] leading-relaxed">
            The inverter is the brain, and its size is set by the largest set of loads you might run simultaneously —
            not by your roof and not by your budget. Price it per kVA, because that is the only way to compare a 3.5kVA
            unit against a 10kVA one.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Class</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">₦ / kVA (low – high)</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Typical</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Brands we track</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier, i) => (
                  <tr key={tier} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{INVERTER_TIER_LABEL[tier]}</td>
                    <td className="p-4 text-[#64748B]">
                      {formatNaira(INVERTER_PER_KVA[tier].low)} – {formatNaira(INVERTER_PER_KVA[tier].high)}
                    </td>
                    <td className="p-4 font-semibold text-[#F59E0B]">{formatNaira(INVERTER_PER_KVA[tier].best)}</td>
                    <td className="p-4 text-[#64748B]"><BrandList names={INVERTER_BRANDS[tier]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            To use it: multiply by the kVA you need. A 5kVA budget-class inverter should land around{' '}
            {formatNaira(INVERTER_PER_KVA.budget.best * 5)}; the same size in premium class around{' '}
            {formatNaira(INVERTER_PER_KVA.premium.best * 5)}. If your quote is far outside that, the question is which
            class you are actually being sold. We rank every brand we track on measured ₦/kVA in{' '}
            <Link href="/blog/best-solar-inverter-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              the best solar inverter in Nigeria
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">2. Lithium batteries — ₦ per kWh</h2>
          <p className="text-[#64748B] leading-relaxed">
            The battery is the biggest line on almost every Nigerian quote, and the one where the difference between a
            good and a bad purchase compounds for a decade. The market standard is a {LITHIUM_MODULE_KWH}kWh 48V LiFePO4
            module — about {formatNaira(moduleUnit)} in mid class.
          </p>
          <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Class</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">₦ / kWh (low – high)</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Per {LITHIUM_MODULE_KWH}kWh module</th>
                  <th className="text-left p-4 font-heading font-semibold text-[#0A0F1E]">Brands we track</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier, i) => (
                  <tr key={tier} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                    <td className="p-4 font-heading font-semibold text-[#0A0F1E]">{INVERTER_TIER_LABEL[tier]}</td>
                    <td className="p-4 text-[#64748B]">
                      {formatNaira(LITHIUM_PER_KWH[tier].low)} – {formatNaira(LITHIUM_PER_KWH[tier].high)}
                    </td>
                    <td className="p-4 font-semibold text-[#F59E0B]">
                      {formatNaira(LITHIUM_PER_KWH[tier].best * LITHIUM_MODULE_KWH)}
                    </td>
                    <td className="p-4 text-[#64748B]"><BrandList names={LITHIUM_BRANDS[tier]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[#64748B] leading-relaxed">
            Tubular lead-acid is still sold widely: a 200Ah 12V unit is{' '}
            {formatNaira(TUBULAR_200AH.low)}–{formatNaira(TUBULAR_200AH.high)}. It looks much cheaper and is not, once
            you account for the half of it you are not allowed to use and the number of times you buy it again. We work
            that out in full in{' '}
            <Link href="/blog/lithium-vs-tubular-battery-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              lithium vs tubular batteries
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">3. Panels — ₦ per watt</h2>
          <p className="text-[#64748B] leading-relaxed">
            Panels are the commodity part of the system and the easiest line to check, because everything is priced per
            watt. Tier-1 mono and bifacial modules run{' '}
            {formatNaira(PANEL_PER_WP.low)}–{formatNaira(PANEL_PER_WP.high)} per Wp, which puts a {PANEL_WATTS}W panel
            at {formatNaira(PANEL_PER_WP.low * PANEL_WATTS)}–{formatNaira(PANEL_PER_WP.high * PANEL_WATTS)}, typically
            around {formatNaira(panelUnit)}. Brands we track: <BrandList names={PANEL_BRANDS} />.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            At the naira rate we priced against, the low end is roughly{' '}
            ${(PANEL_PER_WP.low * PANEL_WATTS / USD_NGN_RATE).toFixed(0)} a module landed. That is a genuinely thin
            number, which is why a panel quoted well below it is the single most reliable warning sign in the market —
            the full set of checks is in{' '}
            <Link href="/blog/fake-solar-panels-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              how to tell a real solar panel from a fake one
            </Link>.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">4. The costs quotes hide</h2>
          <p className="text-[#64748B] leading-relaxed">
            Two lines are missing from most Nigerian quotes, and they are the two that decide whether your system is
            still working in year five.
          </p>
          <ul className="space-y-3 text-[#64748B]">
            <li className="flex items-start gap-2">
              <span className="text-[#F59E0B] mt-1">•</span>
              <span>
                <strong className="text-[#0A0F1E]">Mounting, cables and protection</strong> — rails, DC and AC cable,
                breakers, surge protection, combiner box, earthing, changeover. We price this at{' '}
                {Math.round(BOS_FRACTION.low * 100)}–{Math.round(BOS_FRACTION.high * 100)}% of equipment cost, which on
                the build above is {formatNaira(t.bos.best)}. It is where corners get cut, because nobody photographs a
                surge arrester for Instagram.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#F59E0B] mt-1">•</span>
              <span>
                <strong className="text-[#0A0F1E]">Installation and commissioning</strong> —{' '}
                {formatNaira(LABOUR_PER_KVA.low)}–{formatNaira(LABOUR_PER_KVA.high)} per kVA for a Lagos, Abuja or Port
                Harcourt roof mount, with a floor of about {formatNaira(LABOUR_FLOOR)} because a small job still takes a
                crew a day. On the build above, {formatNaira(t.labour.best)}. Transport outside the city is extra and
                should be agreed before work starts, not discovered on the invoice.
              </span>
            </li>
          </ul>
          <p className="text-[#64748B] leading-relaxed">
            Optional but frequently needed, and frequently left out of the comparison:{' '}
            {OPTIONAL_ITEMS.avr_5kva.label.toLowerCase()} at{' '}
            {formatNaira(OPTIONAL_ITEMS.avr_5kva.low)}–{formatNaira(OPTIONAL_ITEMS.avr_5kva.high)},{' '}
            {OPTIONAL_ITEMS.changeover_63a.label.toLowerCase()} at{' '}
            {formatNaira(OPTIONAL_ITEMS.changeover_63a.low)}–{formatNaira(OPTIONAL_ITEMS.changeover_63a.high)}, and a{' '}
            {OPTIONAL_ITEMS.wifi_dongle.label.toLowerCase()} at{' '}
            {formatNaira(OPTIONAL_ITEMS.wifi_dongle.low)}–{formatNaira(OPTIONAL_ITEMS.wifi_dongle.high)}. The dongle is
            the one people skip and later wish they had not — without production data you cannot tell dust from a fault.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">5. Why the same item varies so much between sellers</h2>
          <p className="text-[#64748B] leading-relaxed">
            Look at the spread in any row above — on panels alone it is about {spreadPct}% from the bottom of the range
            to the top, for the same class of product. That is not noise. It reflects four real things:
          </p>
          <ul className="space-y-3 text-[#64748B]">
            {[
              ['Where in the chain you are buying', 'The low column is the bulk-wholesale floor — container quantities at Alaba. The high column is a single unit from a showroom or a marketplace listing, with someone’s warehousing, financing and returns risk priced in. Both are real prices for the same object.'],
              ['Model generation', 'Manufacturers run several lines under one brand name. A cheaper off-grid line and a flagship hybrid can sit ten centimetres apart in the same shop with the same badge on them, and only the model number tells you which is which.'],
              ['The naira', 'All of this is dollar-priced upstream. When the rate moves, every number on this page moves with it, which is exactly why the date at the top matters more than the figures do.'],
              ['What the buyer appears to know', 'Uncomfortable, but true: the price a Nigerian buyer is quoted varies with how much they seem to understand. A published price list is the cheapest defence available against that.'],
            ].map(([title, body]) => (
              <li key={title} className="flex items-start gap-2">
                <span className="text-[#F59E0B] mt-1">•</span>
                <span><strong className="text-[#0A0F1E]">{title}.</strong> {body}</span>
              </li>
            ))}
          </ul>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">6. Our method, and what {'“'}priced{'”'} means here</h2>
          <p className="text-[#64748B] leading-relaxed">
            Every figure on this page comes from a price research exercise over live Nigerian vendor listings — around
            130 priced data points across 38 sellers, each recorded with the vendor, the source page and the date it was
            seen. Those individual listings, with their sources, sit on the{' '}
            <Link href="/brands" className="text-[#F59E0B] font-semibold hover:underline">brand pages</Link> and in the{' '}
            <Link href="/shop" className="text-[#F59E0B] font-semibold hover:underline">shop</Link>. This page is the
            per-unit summary of them.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            What that means in practice: {'“'}low{'”'} is the bulk-wholesale floor, {'“'}typical{'”'} is what a buyer in
            Lagos or Abuja can realistically get, and {'“'}high{'”'} is showroom or single-unit marketplace pricing. The
            snapshot date is {PRICES_LAST_UPDATED_LABEL}. It is a snapshot and we say so — a price guide without a date
            is not a price guide, and several of the pages that rank for this question in Nigeria carry prices that are
            years old with nothing on the page to tell you.
          </p>
          <p className="text-[#64748B] leading-relaxed">
            And the disclosure that belongs in any article about prices: we make our money on procurement margin when we
            buy on a customer{'’'}s behalf. Publishing the floors is not charity — it is the reason to trust the rest.
          </p>

          <h2 className="font-heading font-bold text-2xl mt-10 mb-4">7. How to use this to check a quote</h2>
          <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
            <li><strong className="text-[#0A0F1E]">Get it itemised.</strong> If your quote is one number, ask for the component list with model numbers. That request alone tells you a great deal about who you are dealing with.</li>
            <li><strong className="text-[#0A0F1E]">Divide each line by its unit.</strong> Inverter price ÷ kVA. Battery price ÷ kWh. Panel price ÷ watts. Now compare with the tables above.</li>
            <li><strong className="text-[#0A0F1E]">Check the class matches the price.</strong> A premium-class price for a budget-class inverter is the most common overcharge in this market, and it is invisible until you divide.</li>
            <li><strong className="text-[#0A0F1E]">Check what is missing.</strong> Mounting, protection, earthing, changeover, commissioning. A quote that omits them is not cheaper, it is incomplete.</li>
            <li><strong className="text-[#0A0F1E]">Check the sizing before the price.</strong> The cheapest quote for the wrong system is the most expensive thing on this page.</li>
          </ol>
          <p className="text-[#64748B] leading-relaxed">
            Then run the same load through our{' '}
            <Link href="/calculator" className="text-[#F59E0B] font-semibold hover:underline">calculator</Link> and put
            the two itemised lists side by side. Where they differ, you have a specific question to ask rather than a
            general unease. If you want the payback arithmetic on top of the price, it is in{' '}
            <Link href="/blog/is-solar-worth-it-nigeria" className="text-[#F59E0B] font-semibold hover:underline">
              is solar worth it in Nigeria
            </Link>; if the person quoting you is the thing you are unsure about, start with{' '}
            <Link href="/blog/check-solar-installer-qualified-nemsa" className="text-[#F59E0B] font-semibold hover:underline">
              how to check your installer is qualified
            </Link>.
          </p>
        </div>

        <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-8">
          <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Get your own itemised quote</h3>
          <p className="text-[#64748B] mb-4">
            Pick your appliances and get three costed builds with a quote code, priced at {PRICES_LAST_UPDATED_LABEL}{' '}
            Nigerian vendor rates. Free, and no signup.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Calculate my system →
            </Link>
            <Link href="/brands" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors">
              Prices by brand
            </Link>
          </div>
        </div>
      </article>

      </main>
      <Footer />
    </div>
  );
}
