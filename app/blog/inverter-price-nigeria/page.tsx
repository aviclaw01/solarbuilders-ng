import type { Metadata } from 'next';
import {
  INVERTER_BRANDS,
  INVERTER_PER_KVA,
  PRICES_LAST_UPDATED_LABEL,
  SOURCING_MARGIN_LABEL,
  inverterSizeFactor,
} from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { A, BrandList, GridTable, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import { LOAD_5KVA, PRICE_GUIDE_TITLES, TIERS, TIER_NAME, buildFor, calculatorHref, scaleRange, tierBuilds } from '../_lib/price-guides';

const SLUG = 'inverter-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];

const SIZES = [1.5, 2.5, 3.5, 5, 8, 10];

/** Inverter price at a size and class: per-kVA price × kVA × the small-inverter factor. */
function inverterPrice(tier: (typeof TIERS)[number], kva: number) {
  return scaleRange(INVERTER_PER_KVA[tier], kva * inverterSizeFactor(kva));
}

const FIVE_MID = inverterPrice('mid', 5);
const DESCRIPTION = `A 5kVA hybrid inverter costs ${formatNairaShort(FIVE_MID.low)}–${formatNairaShort(FIVE_MID.high)} in Nigeria at mid brand class. Prices from 1.5kVA to 10kVA at budget, mid and premium class, computed per kVA — checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['inverter price in nigeria', '5kva inverter price in nigeria', '3.5kva inverter price', 'hybrid inverter price nigeria', '10kva inverter price'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

export default function InverterPricePage() {
  const mid5 = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');

  const faqs: Faq[] = [
    {
      q: 'How much is a 5kVA inverter in Nigeria?',
      a: `${formatNaira(FIVE_MID.low)}–${formatNaira(FIVE_MID.high)} for a mid-class hybrid (Growatt, Luxpower, Must, Solis class), typically ${formatNaira(FIVE_MID.best)}. Budget class is typically ${formatNaira(inverterPrice('budget', 5).best)}, premium ${formatNaira(inverterPrice('premium', 5).best)}.`,
    },
    {
      q: 'Hybrid or off-grid inverter?',
      a: 'A hybrid inverter can use the grid, a generator, panels and battery together, and decides which to draw from. An off-grid inverter runs from battery and panels, with the grid or generator only as a charger or bypass. For most Nigerian homes with some grid supply, hybrid is the right buy. Every price here is for a hybrid, so check which one a quote is for before comparing it.',
    },
    {
      q: 'Why do small inverters cost more per kVA?',
      a: `Most of the parts are the same whatever the size. In our prices a 3–3.6kVA costs about ${Math.round((inverterSizeFactor(3.5) - 1) * 100)}% more per kVA than a 5kVA, and a 2.5kVA or smaller about ${Math.round((inverterSizeFactor(2.5) - 1) * 100)}% more.`,
    },
    {
      q: 'What size inverter do I need?',
      a: 'Add up what you run at the same time, allow for the startup surge of any AC, fridge or pump, and size so the inverter is not loaded above about 80% continuously. Our inverter size guide walks through it; the calculator does it for you.',
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Inverter price"
      tag="Costs & Pricing"
      readTime="7 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A hybrid inverter in Nigeria costs {formatNaira(INVERTER_PER_KVA.mid.low)}–{formatNaira(INVERTER_PER_KVA.mid.high)} per kVA
          at mid brand class, so a 5kVA is {formatNaira(FIVE_MID.low)}–{formatNaira(FIVE_MID.high)}, typically{' '}
          {formatNaira(FIVE_MID.best)}. Under 5kVA you pay more per kVA.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/best-solar-inverter-nigeria', label: 'The best solar inverter, ranked by price per kVA' },
        { href: '/blog/inverter-size-guide', label: 'What size inverter do I need?' },
        { href: '/brands/deye', label: 'Deye inverter prices' },
        { href: '/brands/growatt', label: 'Growatt inverter prices' },
        { href: '/compare/growatt-vs-luxpower', label: 'Growatt vs Luxpower' },
        { href: '/compare/felicity-vs-sako', label: 'Felicity vs Sako' },
        { href: '/sizing/what-can-a-5kva-inverter-run', label: 'What a 5kVA inverter can run' },
      ]}
      calculator={{ href: calculatorHref(mid5), label: 'Find my inverter size' }}
      whatsapp={{
        heading: 'Been quoted for an inverter?',
        body: 'Send us the brand, model and price. We will tell you where it sits against these ranges, and whether it is a hybrid.',
        label: 'Check an inverter price on WhatsApp',
        text: guideWhatsappText(SLUG, `a 5kVA hybrid is around ${formatNaira(FIVE_MID.best)} there. Can you check an inverter price I was given?`),
      }}
    >
      <H2>Mid-class hybrid inverter prices, 1.5kVA to 10kVA</H2>
      <P>
        Each row is the per-kVA price for the class times the size, with the small-inverter premium applied below 5kVA.
        Mid class is Growatt, Luxpower, Must and Solis — the class most Nigerian homes buy.
      </P>
      <PriceTable
        itemHeader="Mid-class hybrid"
        rows={[
          { key: 'per', item: 'Per kVA (5kVA and above)', range: INVERTER_PER_KVA.mid },
          ...SIZES.map((kva) => ({ key: String(kva), item: `${kva}kVA`, range: inverterPrice('mid', kva) })),
        ]}
      />
      <Note>
        Market prices from Nigerian vendor listings, checked {PRICES_LAST_UPDATED_LABEL}, before our {SOURCING_MARGIN_LABEL}{' '}
        sourcing fee. Computed from per-kVA prices, so a specific model can sit above or below its row.
      </Note>

      <H2>Every size at every class</H2>
      <GridTable
        head={['Size', ...TIERS.map((k) => `${TIER_NAME[k]} (typical)`)]}
        minWidth={520}
        rows={SIZES.map((kva) => [`${kva}kVA`, ...TIERS.map((k) => formatNaira(inverterPrice(k, kva).best))])}
      />
      <ul className="space-y-2 text-[#64748B] list-disc pl-5">
        {TIERS.map((k) => (
          <li key={k}>
            <strong className="text-[#0A0F1E]">{TIER_NAME[k]}</strong> ({formatNaira(INVERTER_PER_KVA[k].best)} per kVA typical):{' '}
            <BrandList names={INVERTER_BRANDS[k]} />
          </li>
        ))}
      </ul>
      <P>
        The premium class is priced on Deye{'’'}s SG-series hybrids, not its cheaper off-grid range, which is why it sits
        well above mid class. For brand-by-brand prices per kVA, measured from the models Nigerian sellers list, see{' '}
        <A href="/blog/best-solar-inverter-nigeria">the best solar inverter in Nigeria</A>.
      </P>

      <H2>Hybrid vs off-grid</H2>
      <P>
        A hybrid inverter manages grid, generator, panels and battery together: it runs the house from the sun by day,
        from the battery in the evening, and lets the grid carry the load and charge the battery when it is on. An
        off-grid inverter treats the grid as a charger or a bypass at most. Every price on this page is for hybrids,
        because that is what a Nigerian home with any grid supply should buy. If a quote looks cheap, check the model
        number: an off-grid unit sold as a {'“'}hybrid{'”'} is a common way for two quotes to look comparable when they
        are not.
      </P>

      <H2>Choosing the size before the price</H2>
      <P>
        The cheapest inverter is the one that is the right size. Too small and it trips every time the AC starts; too big
        and you have paid for capacity you never use. The <A href="/blog/inverter-size-guide">inverter size guide</A>{' '}
        explains the sum, the <A href="/sizing/what-can-a-5kva-inverter-run">what can a 5kVA run</A> page shows one
        common answer, and the <A href="/calculator">calculator</A> works it out from your own appliances.
      </P>
    </PriceGuideShell>
  );
}
