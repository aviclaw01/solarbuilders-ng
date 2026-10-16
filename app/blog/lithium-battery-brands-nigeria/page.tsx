import type { Metadata } from 'next';
import { manufacturers, unitPriceStats, type Brand, type Product } from '@/lib/brands';
import { LITHIUM_MODULE_KWH, PRICES_LAST_UPDATED_LABEL, SOURCING_MARGIN_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { A, GridTable, H2, Note, P, PriceGuideShell, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import { LOAD_5KVA, PRICE_GUIDE_TITLES, buildFor, calculatorHref, tierBuilds } from '../_lib/price-guides';

const SLUG = 'lithium-battery-brands-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];

/** Every manufacturer with a priced battery, cheapest ₦/kWh first. Read from the catalogue, never typed. */
const BATTERY_BRANDS: Brand[] = manufacturers()
  .filter((b) => unitPriceStats(b, 'battery'))
  .sort((a, b) => unitPriceStats(a, 'battery')!.lowPerUnit - unitPriceStats(b, 'battery')!.lowPerUnit);

interface Row {
  brand: Brand;
  p: Product;
  perKwhLow: number;
  perKwhHigh: number;
}

const ROWS: Row[] = BATTERY_BRANDS.flatMap((brand) =>
  brand.products
    .filter((p) => p.category === 'battery' && p.kwh)
    .map((p) => ({ brand, p, perKwhLow: p.priceLow / p.kwh!, perKwhHigh: p.priceHigh / p.kwh! })),
).sort((a, b) => a.perKwhLow - b.perKwhLow);

/** The ~5kWh, 48V-class modules a 5kVA home actually buys — the like-for-like comparison. */
const FIVE_KWH = ROWS.filter((r) => r.p.kwh! >= 4.8 && r.p.kwh! <= 5.2 && !/\b24V\b/.test(r.p.spec));

/** Guide prices (no live listing) stay in the tables, flagged, but never set the headline numbers. */
const isGuide = (p: Product) => /guide/i.test(`${p.note ?? ''} ${p.spec}`);

/** Each brand's cheapest live 5kWh-class module — what "a 5kWh battery from brand X" costs. */
const FIVE_BY_BRAND = Object.values(
  FIVE_KWH.filter((r) => !isGuide(r.p)).reduce<Record<string, Row>>((acc, r) => {
    if (!acc[r.brand.slug] || r.p.priceLow < acc[r.brand.slug].p.priceLow) acc[r.brand.slug] = r;
    return acc;
  }, {}),
).sort((a, b) => a.p.priceLow - b.p.priceLow);
const FIVE_LOW = FIVE_BY_BRAND[0];
const FIVE_HIGH = FIVE_BY_BRAND[FIVE_BY_BRAND.length - 1];

const perKwh = (b: Brand) => unitPriceStats(b, 'battery')!;
const k = (n: number) => `${formatNairaShort(Math.round(n / 1000) * 1000)}`;
const range = (lo: number, hi: number) => (Math.round(lo / 1000) === Math.round(hi / 1000) ? k(lo) : `${k(lo)}–${k(hi)}`);

const CHEAPEST = BATTERY_BRANDS[0];
const DEAREST = BATTERY_BRANDS[BATTERY_BRANDS.length - 1];
const NAMES = new Intl.ListFormat('en-GB', { type: 'conjunction' }).format(BATTERY_BRANDS.map((b) => b.name));

const DESCRIPTION = `${NAMES} lithium battery prices in Nigeria, model by model and per kWh — from ${k(perKwh(CHEAPEST).lowPerUnit)}/kWh (${CHEAPEST.name}) to ${k(perKwh(DEAREST).highPerUnit)}/kWh (${DEAREST.name}). Checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'lithium battery brands nigeria',
    'felicity lithium battery price',
    'pylontech battery price nigeria',
    'dyness battery price',
    'deye battery price nigeria',
    'blue carbon lithium battery price',
    'itel lithium battery price',
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

function brandFaq(slug: string, q: string): Faq | null {
  const b = BATTERY_BRANDS.find((x) => x.slug === slug);
  if (!b) return null;
  const rows = ROWS.filter((r) => r.brand.slug === slug);
  const list = rows.map((r) => `${r.p.model} (${r.p.kwh}kWh) ${range(r.p.priceLow, r.p.priceHigh)}`).join('; ');
  return { q, a: `${list}. That is ${range(perKwh(b).lowPerUnit, perKwh(b).highPerUnit)} per kWh.${b.attributes?.watchOut ? ` ${b.attributes.watchOut}` : ''}` };
}

export default function LithiumBatteryBrandsPage() {
  const mid5 = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');

  const faqs: Faq[] = [
    {
      q: 'Which lithium battery brand is cheapest in Nigeria?',
      a: `Per kWh, ${CHEAPEST.name} at ${k(perKwh(CHEAPEST).lowPerUnit)}/kWh in our listings. Cheapest per kWh is not cheapest to own: check the warranty, who services it in Nigeria, and whether it talks to your inverter.`,
    },
    brandFaq('felicity', 'How much is a Felicity lithium battery?'),
    brandFaq('deye', 'How much is a Deye lithium battery?'),
    brandFaq('pylontech', 'How much is a Pylontech battery in Nigeria?'),
    brandFaq('dyness', 'How much is a Dyness battery?'),
    {
      q: 'Will any lithium battery work with my inverter?',
      a: 'Voltage must match (most 5kVA and larger inverters are 48V), and for the inverter to read the battery properly the two need a common BMS protocol. Deye, Growatt, Luxpower and most Felicity hybrids list compatible battery brands in their manuals. Send us both model numbers and we will check.',
    },
  ].filter((f): f is Faq => f !== null);

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Lithium battery brands"
      tag="Costs & Pricing"
      readTime="7 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          Across the {BATTERY_BRANDS.length} lithium brands Nigerian sellers price publicly, a kWh of storage costs from{' '}
          {k(perKwh(CHEAPEST).lowPerUnit)} ({CHEAPEST.name}) to {k(perKwh(DEAREST).highPerUnit)} ({DEAREST.name}). A standard 5kWh
          48V module runs from {k(FIVE_LOW.p.priceLow)} ({FIVE_LOW.brand.name} {FIVE_LOW.p.model}) to {k(FIVE_HIGH.p.priceLow)}{' '}
          ({FIVE_HIGH.brand.name} {FIVE_HIGH.p.model}).
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/lithium-battery-price-nigeria', label: 'Lithium battery price by size: 5kWh, 10kWh, 15kWh' },
        { href: '/blog/how-many-batteries-for-5kva-inverter', label: 'How many batteries for a 5kVA inverter' },
        { href: '/blog/lithium-vs-tubular-battery-nigeria', label: 'Lithium vs tubular batteries' },
        { href: '/compare/deye-vs-pylontech', label: 'Deye vs Pylontech' },
        { href: '/compare/blue-carbon-vs-felicity', label: 'Blue Carbon vs Felicity' },
        { href: '/compare/felicity-vs-itel-energy', label: 'Felicity vs ITEL Energy' },
        { href: '/compare/deye-vs-dyness', label: 'Deye vs Dyness' },
      ]}
      calculator={{ href: calculatorHref(mid5), label: 'Size my battery bank' }}
      whatsapp={{
        heading: 'Choosing between two batteries?',
        body: 'Send us both models, or a quote you have been given. We will check the price against these listings and whether it suits your inverter.',
        label: 'Ask about a battery on WhatsApp',
        text: guideWhatsappText(SLUG, 'I am choosing a lithium battery. Can you compare two models for me?'),
      }}
    >
      <H2>The 5kWh module, brand against brand</H2>
      <P>
        Most homes on a 5kVA inverter buy 48V modules of about {LITHIUM_MODULE_KWH}kWh, one to three of them. This is the
        fairest comparison, because it is the same job done by each brand.
      </P>
      <GridTable
        head={['Brand', 'Model', 'Size', 'Price', 'Per kWh']}
        minWidth={600}
        rows={FIVE_KWH.map((r) => [
          <A key="b" href={`/brands/${r.brand.slug}`}>{r.brand.name}</A>,
          isGuide(r.p) ? `${r.p.model} (guide price)` : r.p.model,
          `${r.p.kwh}kWh`,
          range(r.p.priceLow, r.p.priceHigh),
          range(r.perKwhLow, r.perKwhHigh),
        ])}
      />

      <H2>Every model we have a price for, cheapest per kWh first</H2>
      <GridTable
        head={['Brand', 'Model', 'Spec', 'Price', 'Per kWh']}
        minWidth={680}
        rows={ROWS.map((r) => [
          <A key="b" href={`/brands/${r.brand.slug}`}>{r.brand.name}</A>,
          isGuide(r.p) ? `${r.p.model} (guide price)` : r.p.model,
          r.p.spec,
          range(r.p.priceLow, r.p.priceHigh),
          range(r.perKwhLow, r.perKwhHigh),
        ])}
      />
      <Note>
        Prices from Nigerian vendor listings, checked {PRICES_LAST_UPDATED_LABEL}, including our {SOURCING_MARGIN_LABEL}{' '}
        sourcing fee. A range means different sellers listed different prices. Rows marked as a guide price had no live
        listing; confirm before buying.
      </Note>

      <H2>What each brand is good for</H2>
      <ul className="space-y-3 text-[#64748B] list-disc pl-5">
        {BATTERY_BRANDS.map((b) => (
          <li key={b.slug}>
            <A href={`/brands/${b.slug}`}>{b.name}</A> — {range(perKwh(b).lowPerUnit, perKwh(b).highPerUnit)} per kWh.{' '}
            {b.attributes?.bestFor ? `${b.attributes.bestFor}.` : b.tagline + '.'}
            {b.attributes?.warranty ? ` Warranty: ${b.attributes.warranty}.` : ''}
            {b.attributes?.serviceNigeria ? ` Service in Nigeria: ${b.attributes.serviceNigeria}.` : ''}
          </li>
        ))}
      </ul>

      <H2>Per kWh is the number to compare</H2>
      <P>
        Battery prices are quoted per unit, and units come in 2.4kWh, 5kWh, 10kWh and 16kWh sizes, so the sticker price on
        its own tells you little. Divide by the kWh. Then weigh three things the price does not show: the warranty and who
        in Nigeria honours it, whether the battery talks to your inverter over its BMS, and how many cycles it is rated
        for. A cheaper kWh with no local support can cost more over ten years than a dearer one that gets fixed.
      </P>
      <P>
        For how many kWh you need, see <A href="/blog/how-many-batteries-for-5kva-inverter">how many batteries for a 5kVA
        inverter</A>, or let the <A href="/calculator">calculator</A> size it from your appliances.
      </P>
    </PriceGuideShell>
  );
}
