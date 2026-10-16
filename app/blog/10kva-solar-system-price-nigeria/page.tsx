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
import { SITE_URL } from '@/lib/site';
import { A, BrandList, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import {
  LOAD_10KVA,
  PRICE_GUIDE_TITLES,
  TIERS,
  TIER_NAME,
  buildFor,
  calculatorHref,
  headlinePackage,
  lineCost,
  num,
  scaleRange,
  tierBuilds,
} from '../_lib/price-guides';

const SLUG = '10kva-solar-system-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const PKG = headlinePackage('8–10kVA');
const DESCRIPTION = `A 10kVA solar system for a large Nigerian home costs ${formatNairaShort(PKG.low)}–${formatNairaShort(PKG.high)} before installation. Itemised at three brand classes, plus one 10kVA against two 5kVAs in parallel — checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['10kva solar system price in nigeria', '10kva inverter price in nigeria', '10kva solar package price', '10kva lithium battery price'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

export default function TenKvaPricePage() {
  const all = tierBuilds(LOAD_10KVA, 10);
  const mid = buildFor(all, 'mid');
  const t = mid.t;

  const single = TIERS.map((tier) => ({
    tier,
    one: scaleRange(INVERTER_PER_KVA[tier], 10 * inverterSizeFactor(10)),
    two: scaleRange(INVERTER_PER_KVA[tier], 2 * 5 * inverterSizeFactor(5)),
  }));
  const sameCost = single.every((s) => s.one.best === s.two.best);

  const faqs: Faq[] = [
    {
      q: 'What can a 10kVA solar system run?',
      a: 'A whole large house: two or three ACs, a borehole pump, fridges and freezers, a microwave and everything else, all available at once. At this size the battery and the roof space limit you more than the inverter does.',
    },
    {
      q: 'How many batteries and panels does a 10kVA need?',
      a: `For our reference large-home load, the engine fits ${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh lithium modules (${num(t.batteryKwh)}kWh) and ${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp). A home with poor grid supply needs more battery.`,
    },
    {
      q: 'Is one 10kVA better than two 5kVA inverters?',
      a: 'Two 5kVAs in parallel keep half the house running if one fails, and can be bought one at a time. One 10kVA is a single unit to configure, warranty and monitor. Paralleling needs two inverters of the same model that support it, plus careful setup; ask the installer to show parallel installs they have done.',
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
      crumb="10kVA solar price"
      tag="Costs & Pricing"
      readTime="8 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A 10kVA solar system for a large home with two or three ACs costs {formatNaira(PKG.low)}–{formatNaira(PKG.high)} in
          Nigeria before installation. The typical Mid-class build, with {num(t.batteryKwh)}kWh of lithium, is{' '}
          {formatNaira(t.total.best)}; add {formatRange(t.labourRef)} for the installer.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/sizing/what-can-a-10kva-inverter-run', label: 'What a 10kVA inverter can run' },
        { href: '/sizing/solar-for-4-bedroom-house-with-2-acs', label: 'Solar for a 4-bedroom house with 2 ACs' },
        { href: '/brands/deye', label: 'Deye inverter prices' },
        { href: '/compare/deye-vs-victron', label: 'Deye vs Victron' },
        { href: '/compare/deye-vs-luxpower', label: 'Deye vs Luxpower' },
        { href: '/blog/5kva-solar-system-price-nigeria', label: '5kVA solar system price, itemised' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'Open this 10kVA build in the calculator' }}
      whatsapp={{
        heading: 'Pricing a 10kVA for a big house?',
        body: 'Send us the appliance list or the quote you were given. At this size, a second opinion on the sizing saves real money.',
        label: 'Ask about a 10kVA on WhatsApp',
        text: guideWhatsappText(SLUG, `a 10kVA with ${num(t.batteryKwh)}kWh lithium is around ${formatNaira(t.total.best)} there. Can you price one for my house?`),
      }}
    >
      <H2>The 10kVA build, itemised</H2>
      <P>
        One real build out of the quote engine: a large home with two 1.5HP ACs, two fridges, a water pump, a microwave,
        TVs, fans and lights, at the Mid brand class.
      </P>
      <PriceTable
        rows={[
          { key: 'inv', item: `${t.inverterKva}kVA 48V hybrid inverter`, range: lineCost(t, 'inverter') },
          { key: 'bat', item: `${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh lithium (${num(t.batteryKwh)}kWh)`, range: lineCost(t, 'battery') },
          { key: 'pan', item: `${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp)`, range: lineCost(t, 'panels') },
          { key: 'bos', item: 'Mounting, cable, breakers, battery rack, changeover, earthing', range: t.bos },
          { key: 'con', item: 'Contingency', range: t.contingency },
          { key: 'tot', item: 'Total before installation', range: t.total, total: true },
        ]}
      />
      <Note>
        Every line includes our {SOURCING_MARGIN_LABEL} sourcing fee. Above 5kVA the protection gear steps up — a 160A
        battery breaker, heavier cable and a 100A changeover — and a bank above two modules needs a rack, so the
        balance-of-system line is larger than on a 5kVA.
      </Note>

      <H2>The same 10kVA at each brand class</H2>
      <PriceTable itemHeader="Brand class" rows={all.map((b) => ({ key: b.tier, item: TIER_NAME[b.tier], range: b.t.total }))} />
      <ul className="space-y-2 text-[#64748B] list-disc pl-5">
        {TIERS.map((k) => (
          <li key={k}>
            <strong className="text-[#0A0F1E]">{TIER_NAME[k]}:</strong> <BrandList names={INVERTER_BRANDS[k]} />
          </li>
        ))}
      </ul>

      <H2>One 10kVA or two 5kVAs in parallel?</H2>
      <P>
        On the inverter line alone, the two options cost
        {sameCost ? ' the same in our prices, because per-kVA pricing is flat from 5kVA up' : ' slightly different amounts'}:
      </P>
      <PriceTable
        itemHeader="Inverter line"
        rows={single.flatMap((s) => [
          { key: `${s.tier}-1`, item: `${TIER_NAME[s.tier]} · one 10kVA`, range: s.one },
          { key: `${s.tier}-2`, item: `${TIER_NAME[s.tier]} · two 5kVA`, range: s.two },
        ])}
      />
      <Note>Market prices before our fee, checked {PRICES_LAST_UPDATED_LABEL}. We do not hold a price for parallel kits or cables, so they are not in these rows.</Note>
      <P>
        So the decision is not about price. Two 5kVAs give you redundancy — if one fails, half the house stays on — and
        let you buy in two stages. One 10kVA is simpler: one unit to set up, one warranty, one app. Paralleling only works
        with two inverters of the same model that support it, configured correctly; it is where inexperienced installers
        get into trouble, so ask to see one they have commissioned. Before either, make sure you need 10kVA at all: our{' '}
        <A href="/sizing/what-can-a-10kva-inverter-run">what can a 10kVA inverter run</A> page shows what the size covers,
        and the <A href="/calculator">calculator</A> will tell you if a 5kVA or 8kVA does the job.
      </P>
    </PriceGuideShell>
  );
}
