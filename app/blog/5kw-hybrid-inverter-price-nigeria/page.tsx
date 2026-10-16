import type { Metadata } from 'next';
import { getBrand, manufacturers, type Brand, type Product } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL, SOURCING_MARGIN_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { A, GridTable, H2, Note, P, PriceGuideShell, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import { LOAD_5KVA, PRICE_GUIDE_TITLES, buildFor, calculatorHref, tierBuilds } from '../_lib/price-guides';

const SLUG = '5kw-hybrid-inverter-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];

interface Row {
  brand: Brand;
  p: Product;
}

/** Every 5–5.5kVA inverter in the catalogue, cheapest first. Read from lib/brands.ts, never typed. */
const ROWS: Row[] = manufacturers()
  .flatMap((brand) => brand.products.filter((p) => p.category === 'inverter' && p.kva && p.kva >= 5 && p.kva <= 5.5).map((p) => ({ brand, p })))
  .sort((a, b) => a.p.priceLow - b.p.priceLow);

/** The models people put head to head in search: "Deye 5kW" against "Growatt 5kW". */
function find(slug: string, match: (p: Product) => boolean): Row | null {
  const brand = getBrand(slug);
  const p = brand?.products.find((x) => x.category === 'inverter' && match(x));
  return brand && p ? { brand, p } : null;
}
const DEYE_5 = find('deye', (p) => p.kva === 5 && !p.excludeFromAutoMatch);
const GROWATT_5 = find('growatt', (p) => p.kva === 5);
const FELICITY_7_5 = find('felicity', (p) => p.model.includes('7548'));
const GROWATT_6 = find('growatt', (p) => p.model.includes('6000'));

const k = (n: number) => formatNairaShort(Math.round(n / 1000) * 1000);
const price = (p: Product) => (Math.round(p.priceLow / 1000) === Math.round(p.priceHigh / 1000) ? k(p.priceLow) : `${k(p.priceLow)}–${k(p.priceHigh)}`);
const perKva = (p: Product) => `${k(p.priceLow / p.kva!)}/kVA`;

const LOW = ROWS[0];
const HIGH = ROWS.reduce((a, b) => (b.p.priceHigh > a.p.priceHigh ? b : a), ROWS[0]);

const DESCRIPTION = `A 5kW hybrid inverter costs ${k(LOW.p.priceLow)} (${LOW.brand.name}) to ${k(HIGH.p.priceHigh)} (${HIGH.brand.name}) in Nigeria. ${
  DEYE_5 && GROWATT_5 ? `Deye 5kW ${price(DEYE_5.p)}, Growatt 5kW ${price(GROWATT_5.p)}. ` : ''
}Every model with a live price, checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'deye 5kw hybrid inverter price nigeria',
    'growatt 5kw hybrid inverter price nigeria',
    '5kva hybrid inverter price nigeria',
    'felicity 5kva inverter price',
    'luxpower 5kw price',
    'felicity ivpm 7548 vs growatt',
  ],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

export default function FiveKwInverterPricePage() {
  const mid5 = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');

  const faqs: Faq[] = [
    DEYE_5 && {
      q: 'How much is a Deye 5kW hybrid inverter in Nigeria?',
      a: `The ${DEYE_5.p.model} (${DEYE_5.p.spec}) is ${price(DEYE_5.p)}, seen at ${DEYE_5.p.seenAt.length} sellers. Deye's cheaper OG off-grid line is a different, lower-spec product — check the model number on any quote.`,
    },
    GROWATT_5 && {
      q: 'How much is a Growatt 5kW inverter in Nigeria?',
      a: `The ${GROWATT_5.p.model} (${GROWATT_5.p.spec}) is ${price(GROWATT_5.p)}, seen at ${GROWATT_5.p.seenAt.length} sellers.`,
    },
    DEYE_5 && GROWATT_5 && {
      q: 'Why is Deye so much dearer than Growatt at 5kW?',
      a: `They are different classes of machine. The Deye SUN-SG is a grid-interactive hybrid with app monitoring and generator management. The Growatt SPF ES is an off-grid hybrid: it uses the grid and generator as a charger and bypass rather than blending them. For a house that only needs backup and solar, the Growatt does the job for about ${k(DEYE_5.p.priceLow - GROWATT_5.p.priceLow)} less.`,
    },
    FELICITY_7_5 && GROWATT_6 && {
      q: 'Felicity IVPM 7548 or Growatt SPF 6000 ES — which is better?',
      a: `They are different sizes: the Felicity is ${FELICITY_7_5.p.spec} at ${price(FELICITY_7_5.p)}, the Growatt ${GROWATT_6.p.spec} at ${price(GROWATT_6.p)}. Per kVA that is ${perKva(FELICITY_7_5.p)} against ${perKva(GROWATT_6.p)}. If 6kVA covers your load, the Growatt is the cheaper buy; if you need the extra 1.5kVA, compare the Felicity with a Growatt or Luxpower of the same size.`,
    },
  ].filter((f): f is Faq => Boolean(f));

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="5kW inverter price"
      tag="Costs & Pricing"
      readTime="6 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A 5kW hybrid inverter costs {k(LOW.p.priceLow)} to {k(HIGH.p.priceHigh)} in Nigeria, depending on brand and on
          whether it is a true grid-interactive hybrid or an off-grid hybrid.
          {DEYE_5 && GROWATT_5 ? (
            <>
              {' '}The two most searched: Deye {DEYE_5.p.model} at {price(DEYE_5.p)}, Growatt {GROWATT_5.p.model} at {price(GROWATT_5.p)}.
            </>
          ) : null}
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/inverter-price-nigeria', label: 'Inverter prices from 1.5kVA to 10kVA' },
        { href: '/blog/5kva-solar-system-price-nigeria', label: 'Full 5kVA solar system price, itemised' },
        { href: '/blog/best-solar-inverter-nigeria', label: 'The best solar inverter in Nigeria' },
        { href: '/compare/deye-vs-growatt', label: 'Deye vs Growatt' },
        { href: '/compare/felicity-vs-growatt', label: 'Felicity vs Growatt' },
        { href: '/compare/growatt-vs-luxpower', label: 'Growatt vs Luxpower' },
        { href: '/sizing/what-can-a-5kva-inverter-run', label: 'What a 5kVA inverter can run' },
      ]}
      calculator={{ href: calculatorHref(mid5), label: 'Check 5kVA is the right size' }}
      whatsapp={{
        heading: 'Been quoted for a 5kW inverter?',
        body: 'Send us the model number and price. We will tell you where it sits against these listings and whether it is a true hybrid.',
        label: 'Check an inverter quote on WhatsApp',
        text: guideWhatsappText(SLUG, 'I have a quote for a 5kW inverter. Can you check the model and price?'),
      }}
    >
      <H2>Every 5kW inverter with a live price</H2>
      <GridTable
        head={['Brand', 'Model', 'Type', 'Price', 'Sellers']}
        minWidth={640}
        rows={ROWS.map((r) => [
          <A key="b" href={`/brands/${r.brand.slug}`}>{r.brand.name}</A>,
          r.p.model,
          r.p.spec,
          price(r.p),
          String(r.p.seenAt.length),
        ])}
      />
      <Note>
        Prices from Nigerian vendor listings, checked {PRICES_LAST_UPDATED_LABEL}, including our {SOURCING_MARGIN_LABEL}{' '}
        sourcing fee. A range means different sellers listed different prices. Guide prices without a live listing are
        marked on each brand page.
      </Note>

      {DEYE_5 && GROWATT_5 ? (
        <>
          <H2>Deye 5kW vs Growatt 5kW</H2>
          <GridTable
            head={['', `Deye ${DEYE_5.p.model}`, `Growatt ${GROWATT_5.p.model}`]}
            minWidth={520}
            rows={[
              ['Price', price(DEYE_5.p), price(GROWATT_5.p)],
              ['Type', DEYE_5.p.spec, GROWATT_5.p.spec],
              ['Warranty', DEYE_5.brand.attributes?.warranty ?? 'Not published', GROWATT_5.brand.attributes?.warranty ?? 'Not published'],
              ['Best for', DEYE_5.brand.attributes?.bestFor ?? '—', GROWATT_5.brand.attributes?.bestFor ?? '—'],
            ]}
          />
          <P>
            The Deye costs more because it does more: it blends grid, generator, panels and battery, and is the one to buy
            if you will add panels or batteries later, or want to watch production on your phone. The Growatt is the
            sensible buy for a home that wants solar and backup and nothing more. The full side-by-side is on{' '}
            <A href="/compare/deye-vs-growatt">Deye vs Growatt</A>.
          </P>
        </>
      ) : null}

      {FELICITY_7_5 && GROWATT_6 ? (
        <>
          <H2>Felicity IVPM 7548 vs Growatt SPF 6000 ES</H2>
          <P>
            A common question, though the two are not the same size. The Felicity {FELICITY_7_5.p.model} is{' '}
            {FELICITY_7_5.p.spec} at {price(FELICITY_7_5.p)} ({perKva(FELICITY_7_5.p)}); the Growatt {GROWATT_6.p.model} is{' '}
            {GROWATT_6.p.spec} at {price(GROWATT_6.p)} ({perKva(GROWATT_6.p)}). Decide the size first — the{' '}
            <A href="/calculator">calculator</A> does it from your appliances — then compare brands at that size.
          </P>
        </>
      ) : null}

      <H2>Check the model number, not the label</H2>
      <P>
        Two quotes for {'“'}a 5kVA hybrid{'”'} can be for very different machines. Deye{'’'}s cheaper OG range and
        Growatt{'’'}s SPF ES are off-grid hybrids; Deye{'’'}s SUN-SG is grid-interactive. Both kinds run a house from solar
        and battery, but only the second blends grid and solar at the same time. Make sure every quote you compare names
        the exact model, and ask the seller which kind it is.
      </P>
    </PriceGuideShell>
  );
}
