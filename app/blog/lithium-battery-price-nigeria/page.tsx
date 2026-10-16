import type { Metadata } from 'next';
import {
  LITHIUM_BRANDS,
  LITHIUM_MODULE_KWH,
  LITHIUM_PER_KWH,
  PRICES_LAST_UPDATED_LABEL,
  SOURCING_MARGIN_LABEL,
  TUBULAR_200AH,
} from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { A, BrandList, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import {
  LITHIUM_MODULE_USABLE_KWH,
  LITHIUM_USABLE,
  LOAD_5KVA,
  PRICE_GUIDE_TITLES,
  TIERS,
  TIER_NAME,
  TUBULAR_KWH,
  TUBULAR_USABLE,
  TUBULAR_USABLE_KWH,
  buildFor,
  calculatorHref,
  num,
  scaleRange,
  tierBuilds,
} from '../_lib/price-guides';

const SLUG = 'lithium-battery-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const ONE_MODULE_MID = scaleRange(LITHIUM_PER_KWH.mid, LITHIUM_MODULE_KWH);
const DESCRIPTION = `A ${num(LITHIUM_MODULE_KWH)}kWh 48V lithium battery costs ${formatNairaShort(scaleRange(LITHIUM_PER_KWH.budget, LITHIUM_MODULE_KWH).low)}–${formatNairaShort(scaleRange(LITHIUM_PER_KWH.premium, LITHIUM_MODULE_KWH).high)} in Nigeria depending on brand class. 5kWh, 10kWh and 15kWh priced by tier, and lithium against tubular per usable kWh — checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['lithium battery price in nigeria', '5kwh lithium battery price in nigeria', '10kwh lithium battery price', '48v lithium battery price nigeria'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

const MODULES = [1, 2, 3];

export default function LithiumPricePage() {
  const rows = TIERS.flatMap((tier) =>
    MODULES.map((n) => ({
      key: `${tier}-${n}`,
      item: (
        <>
          {TIER_NAME[tier]} · {n} module{n > 1 ? 's' : ''}{' '}
          <span className="font-normal text-[#64748B]">({num(n * LITHIUM_MODULE_KWH)}kWh)</span>
        </>
      ),
      range: scaleRange(LITHIUM_PER_KWH[tier], n * LITHIUM_MODULE_KWH),
    })),
  );

  // Cost per usable kWh: lithium uses ~80% of its rating, lead-acid ~50%.
  const lithiumPerUsable = scaleRange(LITHIUM_PER_KWH.mid, 1 / LITHIUM_USABLE);
  const tubularPerNominal = scaleRange(TUBULAR_200AH, 1 / TUBULAR_KWH);
  const tubularPerUsable = scaleRange(TUBULAR_200AH, 1 / TUBULAR_USABLE_KWH);
  const tubularsForOneModule = Math.ceil(LITHIUM_MODULE_USABLE_KWH / TUBULAR_USABLE_KWH);
  const tubularEquivalent = scaleRange(TUBULAR_200AH, tubularsForOneModule);

  const mid = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');

  const faqs: Faq[] = [
    {
      q: 'How long does a lithium battery last in Nigeria?',
      a: 'A LiFePO4 module from a known brand is rated for thousands of cycles and should give ten years or more of daily use if it is kept out of direct sun and not run flat. Heat is the main enemy; a battery in a hot, unventilated store ages faster than its datasheet.',
    },
    {
      q: '24V or 48V lithium — which do I need?',
      a: `It is set by the inverter. Below 5kVA most hybrid inverters in Nigeria run a 24V battery; at 5kVA and above they run 48V. Our engine also moves any bank above two modules to a 48V system, because paralleling many 24V modules on a small inverter is where installs go wrong. Buy the battery for the inverter you have, not the other way round.`,
    },
    {
      q: 'How do I tell an original lithium battery from a fake?',
      a: `Check the serial number on the manufacturer's site or app, ask for the battery management system (BMS) to be shown connected to the inverter with its reported capacity, and weigh it — a real ${num(LITHIUM_MODULE_KWH)}kWh LiFePO4 module is heavy. Then the price test: a module quoted below about ${formatNairaShort(scaleRange(LITHIUM_PER_KWH.budget, LITHIUM_MODULE_KWH).low)} is below even the budget-class floor.`,
    },
    {
      q: 'Is lithium really cheaper than tubular?',
      a: `Per usable kWh on day one, tubular is cheaper: ${formatNairaShort(tubularPerUsable.best)} against ${formatNairaShort(lithiumPerUsable.best)} for mid-class lithium at typical prices. Lithium wins over the life of the system because tubular batteries are replaced every few years. The ten-year sum is in our lithium vs tubular guide.`,
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Lithium battery price"
      tag="Costs & Pricing"
      readTime="8 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A {num(LITHIUM_MODULE_KWH)}kWh 48V lithium battery costs {formatNaira(ONE_MODULE_MID.low)}–{formatNaira(ONE_MODULE_MID.high)} in
          Nigeria at mid brand class, typically {formatNaira(ONE_MODULE_MID.best)}. That is{' '}
          {formatNaira(LITHIUM_PER_KWH.mid.best)} per kWh; 10kWh and 15kWh are two and three of the same module.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/lithium-battery-brands-nigeria', label: 'Lithium battery brands compared per kWh' },
        { href: '/blog/lithium-vs-tubular-battery-nigeria', label: 'Lithium vs tubular: the ten-year cost' },
        { href: '/brands/felicity', label: 'Felicity battery prices' },
        { href: '/brands/deye', label: 'Deye battery prices' },
        { href: '/compare/deye-vs-pylontech', label: 'Deye vs Pylontech lithium' },
        { href: '/compare/blue-carbon-vs-felicity', label: 'Blue Carbon vs Felicity lithium' },
        { href: '/blog/how-many-batteries-for-5kva-inverter', label: 'How many batteries for a 5kVA inverter' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'See how much battery your home needs' }}
      whatsapp={{
        heading: 'Been quoted for a lithium battery?',
        body: 'Send us the brand, the kWh and the price. We will tell you where it sits against the ranges above.',
        label: 'Check a battery price on WhatsApp',
        text: guideWhatsappText(SLUG, `a ${num(LITHIUM_MODULE_KWH)}kWh module is around ${formatNaira(ONE_MODULE_MID.best)} there. Can you check a battery price I was given?`),
      }}
    >
      <H2>5kWh, 10kWh and 15kWh by brand class</H2>
      <P>
        Nearly every lithium battery sold for home solar in Nigeria is now the same building block: a 48V, 100Ah LiFePO4
        module of {num(LITHIUM_MODULE_KWH)}kWh. {'“'}10kWh{'”'} is two of them, {'“'}15kWh{'”'} is three. So the table is
        simply the per-kWh price for each brand class times the size.
      </P>
      <PriceTable rows={rows} />
      <Note>
        Market prices from Nigerian vendor listings, checked {PRICES_LAST_UPDATED_LABEL}. Our quotes add a{' '}
        {SOURCING_MARGIN_LABEL} sourcing fee. A bank above two modules also needs a rack or cabinet, which the quote
        engine adds as a separate line.
      </Note>

      <H2>Which brands sit in each class</H2>
      <ul className="space-y-3 text-[#64748B] list-disc pl-5">
        {TIERS.map((k) => (
          <li key={k}>
            <strong className="text-[#0A0F1E]">{TIER_NAME[k]}</strong> ({formatNaira(LITHIUM_PER_KWH[k].best)} per kWh typical):{' '}
            <BrandList names={LITHIUM_BRANDS[k]} />
          </li>
        ))}
      </ul>
      <P>
        The class mostly buys you the battery management system, the warranty you can actually claim in Nigeria, and
        whether the battery talks to your inverter properly. A premium module paired with the same brand of inverter is
        the least trouble; a budget module on a mid-class inverter is fine if the communication protocol is supported.
        Ask the seller to confirm that before you pay.
      </P>

      <H2>Lithium against tubular, per usable kWh</H2>
      <P>
        Comparing a lithium battery{'’'}s price with a tubular battery{'’'}s price is comparing different things. A lithium
        module can be used to about {Math.round(LITHIUM_USABLE * 100)}% of its rating every day; a 12V 200Ah tubular
        ({num(TUBULAR_KWH)}kWh) should not go much below {Math.round(TUBULAR_USABLE * 100)}% if you want it to last. Per usable kWh:
      </P>
      <PriceTable
        rows={[
          { key: 'li', item: 'Mid-class lithium, per usable kWh', range: lithiumPerUsable },
          { key: 'tn', item: 'Tubular 200Ah, per nominal kWh', range: tubularPerNominal },
          { key: 'tu', item: 'Tubular 200Ah, per usable kWh', range: tubularPerUsable },
          { key: 'one', item: `One lithium module (${num(LITHIUM_MODULE_KWH)}kWh)`, range: ONE_MODULE_MID },
          { key: 'eq', item: `${tubularsForOneModule} tubulars — the same usable storage`, range: tubularEquivalent },
        ]}
      />
      <P>
        On day one, tubular is cheaper for the same usable energy. It stops being cheaper the first time you replace the
        bank: tubulars last a few years in daily cycling, a lithium module ten or more. The full ten-year arithmetic,
        and the three cases where tubular still wins, are in{' '}
        <A href="/blog/lithium-vs-tubular-battery-nigeria">lithium vs tubular batteries in Nigeria</A>.
      </P>

      <H2>How much do you actually need?</H2>
      <P>
        Less than most quotes suggest if you have some grid supply, more if you have none. Our typical 5kVA family-home
        build carries {mid.t.batteryModules} modules ({num(mid.t.batteryKwh)}kWh). If you want hours of backup for a
        specific load, the table in <A href="/blog/how-many-batteries-for-5kva-inverter">how many batteries for a 5kVA
        inverter</A> reads straight across from load and hours to module count and cost.
      </P>
    </PriceGuideShell>
  );
}
