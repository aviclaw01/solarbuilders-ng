import type { Metadata } from 'next';
import {
  INVERTER_BRANDS,
  INVERTER_PER_KVA,
  LITHIUM_MODULE_KWH,
  PRICES_LAST_UPDATED_LABEL,
  SOURCING_MARGIN_LABEL,
  inverterSizeFactor,
} from '@/lib/prices';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { getScenario } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';
import { A, BrandList, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import {
  PRICE_GUIDE_TITLES,
  TIERS,
  TIER_NAME,
  buildFor,
  calculatorHref,
  lineCost,
  num,
  scaleRange,
  tierBuilds,
} from '../_lib/price-guides';

const SLUG = '3-5kva-solar-system-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const SCENARIO_SLUG = 'what-can-a-3-5kva-inverter-run';

function builds() {
  const scenario = getScenario(SCENARIO_SLUG);
  if (!scenario) throw new Error(`3.5kVA price guide: sizing scenario ${SCENARIO_SLUG} is gone`);
  return tierBuilds(scenario.appliances, 3.5);
}

const DESCRIPTION = (() => {
  const mid = buildFor(builds(), 'mid').t;
  return `A 3.5kVA solar system with ${num(mid.batteryKwh)}kWh of lithium costs ${formatRange(mid.total)} in Nigeria before installation at mid brand class. Itemised at three brand classes, and why small inverters cost more per kVA — checked ${PRICES_LAST_UPDATED_LABEL}.`;
})();

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['3.5kva solar system price in nigeria', '3.5kva inverter price', '3.5kva solar package price', '3.5kva inverter with lithium battery price'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

const SIZES = [2.5, 3.5, 5];

export default function ThreePointFiveKvaPricePage() {
  const all = builds();
  const mid = buildFor(all, 'mid');
  const t = mid.t;

  const perKva = SIZES.map((kva) => ({
    kva,
    factor: inverterSizeFactor(kva),
    range: scaleRange(INVERTER_PER_KVA.mid, inverterSizeFactor(kva)),
  }));
  const premiumPct = Math.round((inverterSizeFactor(3.5) - 1) * 100);
  const premiumPctSmall = Math.round((inverterSizeFactor(2.5) - 1) * 100);

  const faqs: Faq[] = [
    {
      q: 'What can a 3.5kVA solar system run?',
      a: 'One 1.5HP AC plus a fridge, TV, fans, lights, a laptop and Wi-Fi — the size at which a single air conditioner becomes possible. Two ACs need a 5kVA.',
    },
    {
      q: 'How many batteries for a 3.5kVA inverter?',
      a: `For the representative load, our engine fits ${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh lithium module${t.batteryModules > 1 ? 's' : ''} (${num(t.batteryKwh)}kWh). A 3.5kVA usually runs a 24V battery, so tubular batteries go in pairs.`,
    },
    {
      q: 'Is it worth going straight to 5kVA?',
      a: `Often, yes. A 3.5kVA costs more per kVA than a 5kVA (about ${premiumPct}% more on the inverter line in our prices), and if you expect a second AC within a couple of years, buying 3.5kVA now means buying an inverter twice. If you will never run more than one AC, 3.5kVA is the right size.`,
    },
    {
      q: 'Is installation included?',
      a: `No. Prices here are equipment and materials. Installers charge separately, typically ${formatRange(t.labourRef)} for a ${t.inverterKva}kVA system.`,
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="3.5kVA solar price"
      tag="Costs & Pricing"
      readTime="7 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A 3.5kVA solar system with {num(t.batteryKwh)}kWh of lithium costs {formatNaira(t.total.low)}–{formatNaira(t.total.high)} in
          Nigeria before installation at mid brand class, typically {formatNaira(t.total.best)}. Across all three classes it runs{' '}
          {formatNairaShort(buildFor(all, 'budget').t.total.low)} to {formatNairaShort(buildFor(all, 'premium').t.total.high)}.
        </>
      }
      faqs={faqs}
      related={[
        { href: `/sizing/${SCENARIO_SLUG}`, label: 'What a 3.5kVA inverter can run' },
        { href: '/sizing/what-size-inverter-for-1-5hp-ac', label: 'What size inverter for a 1.5HP AC' },
        { href: '/brands/felicity', label: 'Felicity inverter prices' },
        { href: '/compare/felicity-vs-growatt', label: 'Felicity vs Growatt, per kVA' },
        { href: '/blog/5kva-solar-system-price-nigeria', label: '5kVA solar system price, itemised' },
        { href: '/blog/inverter-price-nigeria', label: 'Inverter prices from 1.5kVA to 10kVA' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'Open this 3.5kVA build in the calculator' }}
      whatsapp={{
        heading: 'Want a 3.5kVA priced for your place?',
        body: 'Send us your appliance list on WhatsApp, or change it in the calculator and send the quote code.',
        label: 'Ask about a 3.5kVA on WhatsApp',
        text: guideWhatsappText(SLUG, `a 3.5kVA with ${num(t.batteryKwh)}kWh lithium is around ${formatNaira(t.total.best)} there. Can you price one for my place?`),
      }}
    >
      <H2>The 3.5kVA build, itemised</H2>
      <P>
        One real build out of the quote engine: the representative load from our{' '}
        <A href={`/sizing/${SCENARIO_SLUG}`}>what can a 3.5kVA inverter run</A> page — one 1.5HP AC, a fridge, a TV,
        lights, fans and electronics — at the Mid brand class.
      </P>
      <PriceTable
        rows={[
          { key: 'inv', item: `${t.inverterKva}kVA hybrid inverter`, range: lineCost(t, 'inverter') },
          { key: 'bat', item: `${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh lithium (${num(t.batteryKwh)}kWh)`, range: lineCost(t, 'battery') },
          { key: 'pan', item: `${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp)`, range: lineCost(t, 'panels') },
          { key: 'bos', item: 'Mounting, cable, breakers, surge protection, changeover, earthing', range: t.bos },
          { key: 'con', item: 'Contingency', range: t.contingency },
          { key: 'tot', item: 'Total before installation', range: t.total, total: true },
        ]}
      />
      <Note>
        Every line includes our {SOURCING_MARGIN_LABEL} sourcing fee. Installation is extra: typically {formatRange(t.labourRef)}.
      </Note>

      <H2>The same 3.5kVA at each brand class</H2>
      <PriceTable itemHeader="Brand class" rows={all.map((b) => ({ key: b.tier, item: TIER_NAME[b.tier], range: b.t.total }))} />
      <ul className="space-y-2 text-[#64748B] list-disc pl-5">
        {TIERS.map((k) => (
          <li key={k}>
            <strong className="text-[#0A0F1E]">{TIER_NAME[k]}:</strong> <BrandList names={INVERTER_BRANDS[k]} />
          </li>
        ))}
      </ul>

      <H2>Why small inverters cost more per kVA</H2>
      <P>
        A 3.5kVA inverter has most of the same parts as a 5kVA — the casing, the display, the charge controller, the
        communication board — spread over fewer kVA. Nigerian listings show it: in our prices a 3–3.6kVA inverter costs
        about {premiumPct}% more per kVA than a 5kVA, and a 2.5kVA or smaller about {premiumPctSmall}% more.
      </P>
      <PriceTable
        itemHeader="Mid-class inverter, per kVA"
        rows={perKva.map((r) => ({ key: String(r.kva), item: `${r.kva}kVA`, range: r.range }))}
      />
      <Note>Market price per kVA before our fee, checked {PRICES_LAST_UPDATED_LABEL}.</Note>
      <P>
        That premium is small on the inverter line and invisible on the total, because at this size the battery is the
        biggest line. It matters when you are choosing between 3.5kVA now and 5kVA later: paying for one inverter is
        cheaper than paying for two. The 5kVA build is in the{' '}
        <A href="/blog/5kva-solar-system-price-nigeria">5kVA price guide</A>.
      </P>
    </PriceGuideShell>
  );
}
