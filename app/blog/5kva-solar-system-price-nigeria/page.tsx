import type { Metadata } from 'next';
import {
  INVERTER_BRANDS,
  LABOUR_FLOOR,
  LABOUR_PER_KVA,
  LITHIUM_BRANDS,
  LITHIUM_MODULE_KWH,
  PRICES_LAST_UPDATED_LABEL,
  SOURCING_MARGIN_LABEL,
} from '@/lib/prices';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import {
  A,
  BrandList,
  GridTable,
  H2,
  Note,
  P,
  PriceGuideShell,
  PriceTable,
  guideWhatsappText,
  type Faq,
} from '../_components/PriceGuide';
import {
  LOAD_5KVA,
  PRICE_GUIDE_TITLES,
  TIERS,
  TIER_NAME,
  buildFor,
  calculatorHref,
  headlinePackage,
  lineCost,
  num,
  sumRanges,
  tierBuilds,
} from '../_lib/price-guides';

const SLUG = '5kva-solar-system-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const PKG = headlinePackage('5kVA');
const DESCRIPTION = `A 5kVA solar system with 10kWh of lithium costs ${formatNairaShort(PKG.low)}–${formatNairaShort(PKG.high)} in Nigeria before installation. Inverter, battery, panels, protection and labour priced line by line, checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['5kva solar system price in nigeria', '5kva inverter price', '5kva solar package price', '5kva lithium battery price'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

export default function FiveKvaPricePage() {
  const builds = tierBuilds(LOAD_5KVA, 5);
  const mid = buildFor(builds, 'mid');
  const t = mid.t;
  const bos = t.bos;
  const panelsWp = t.panelCount * t.panelWatts;

  const rows = [
    { key: 'inv', item: `${t.inverterKva}kVA 48V hybrid inverter`, range: lineCost(t, 'inverter') },
    { key: 'bat', item: `${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh lithium (${num(t.batteryKwh)}kWh)`, range: lineCost(t, 'battery') },
    { key: 'pan', item: `${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp)`, range: lineCost(t, 'panels') },
    { key: 'bos', item: 'Mounting, cable, breakers, surge protection, changeover, earthing', range: bos },
    { key: 'con', item: 'Contingency', range: t.contingency },
    { key: 'tot', item: 'Total before installation', range: t.total, total: true },
  ];

  const faqs: Faq[] = [
    {
      q: 'How many batteries does a 5kVA solar system need?',
      a: `For a family home with one AC and some grid supply, our quote engine puts ${t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh 48V lithium modules (${num(t.batteryKwh)}kWh) on a 5kVA inverter. More hours of backup means more modules; the inverter does not change. In tubular terms, a 5kVA runs on a 48V bank, so tubular batteries go in sets of four.`,
    },
    {
      q: 'How many solar panels does a 5kVA system need?',
      a: `${t.panelCount} × ${t.panelWatts}W panels (${num(t.arrayKwp)}kWp) for this load. The panel count follows your daily energy use, not the inverter size, which is why two 5kVA quotes can carry very different arrays.`,
    },
    {
      q: 'Why do 5kVA quotes differ so much?',
      a: `Three reasons: the brand class of the inverter and battery (the same size runs from ${formatNairaShort(buildFor(builds, 'budget').t.total.low)} to ${formatNairaShort(buildFor(builds, 'premium').t.total.high)} across classes), how much battery is included, and whether the protection gear is in the quote at all. Divide each line by its unit — naira per kVA, per kWh, per watt — and the difference becomes visible.`,
    },
    {
      q: 'Is installation included in the 5kVA price?',
      a: `No. The prices here are equipment and materials. Installers price their own labour; for a ${t.inverterKva}kVA system it typically runs ${formatRange(t.labourRef)}, from ${formatNaira(LABOUR_PER_KVA.low)}–${formatNaira(LABOUR_PER_KVA.high)} per kVA with a floor around ${formatNairaShort(LABOUR_FLOOR)}.`,
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="5kVA solar price"
      tag="Costs & Pricing"
      readTime="8 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A 5kVA solar system with {num(t.batteryKwh)}kWh of lithium costs {formatNaira(PKG.low)}–{formatNaira(PKG.high)} in
          Nigeria before installation. The typical Mid-class build is {formatNaira(t.total.best)}; add{' '}
          {formatRange(t.labourRef)} for the installer.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/sizing/what-can-a-5kva-inverter-run', label: 'What a 5kVA inverter can actually run' },
        { href: '/brands/deye', label: 'Deye prices in Nigeria' },
        { href: '/brands/growatt', label: 'Growatt prices in Nigeria' },
        { href: '/compare/deye-vs-growatt', label: 'Deye vs Growatt, compared per kVA' },
        { href: '/blog/how-many-batteries-for-5kva-inverter', label: 'How many batteries for a 5kVA inverter' },
        { href: '/blog/solar-cost-nigeria-2026', label: 'Every component price, explained' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'Open this 5kVA build in the calculator' }}
      whatsapp={{
        heading: 'Want this 5kVA priced for your house?',
        body: 'Change the appliances in the calculator, or send us your list on WhatsApp and we will check the size and price with you.',
        label: 'Ask about a 5kVA on WhatsApp',
        text: guideWhatsappText(SLUG, `a 5kVA with ${num(t.batteryKwh)}kWh lithium is around ${formatNaira(t.total.best)} there. Can you price one for my place?`),
      }}
    >
      <H2>The 5kVA build, itemised</H2>
      <P>
        This is one real build out of our quote engine: a family home with one 1HP AC, a fridge, a freezer, a water pump,
        TVs, fans and lights, at the Mid brand class. The engine sized it to a {t.inverterKva}kVA inverter, {num(t.batteryKwh)}kWh of
        lithium and {num(t.arrayKwp)}kWp of panels.
      </P>
      <PriceTable rows={rows} />
      <Note>
        Low is the Alaba/Jiji wholesale floor, high is a showroom or single-unit online price, typical is what a buyer can
        actually get in Lagos or Abuja. Every line includes our {SOURCING_MARGIN_LABEL} sourcing fee. Installation is not in the
        total: budget {formatRange(t.labourRef)} for it separately ({formatNaira(LABOUR_PER_KVA.best)} per kVA is typical, with a
        minimum of about {formatNairaShort(LABOUR_FLOOR)} for small jobs).
      </Note>

      <H2>The same 5kVA at each brand class</H2>
      <P>
        Same inverter size, same battery, same panels — only the brand class changes. This is where most of the spread
        between two 5kVA quotes comes from.
      </P>
      <PriceTable
        itemHeader="Brand class"
        rows={builds.map((b) => ({ key: b.tier, item: TIER_NAME[b.tier], range: b.t.total }))}
      />
      <GridTable
        head={['Line', ...TIERS.map((k) => TIER_NAME[k])]}
        minWidth={480}
        rows={[
          ['Inverter', ...builds.map((b) => formatNaira(lineCost(b.t, 'inverter').best))],
          ['Lithium', ...builds.map((b) => formatNaira(lineCost(b.t, 'battery').best))],
          ['Panels', ...builds.map((b) => formatNaira(lineCost(b.t, 'panels').best))],
          ['Everything else', ...builds.map((b) => formatNaira(sumRanges(b.t.bos, b.t.contingency).best))],
        ]}
      />
      <Note>Typical prices. Panels and protection gear are the same in every class; the inverter and battery are not, and the contingency line moves with them.</Note>

      <H2>What a 5kVA runs</H2>
      <P>
        At 80% continuous loading a 5kVA inverter carries about 4kW all day, which is enough for one or two 1.5HP ACs,
        a fridge and freezer, a pump and the normal household electronics — as long as the motors do not all start in
        the same second. The battery sets how long it does that after dark: this build's {num(t.batteryKwh)}kWh gives
        roughly {t.autonomyHours} hours with everything covered running at an average load. Our{' '}
        <A href="/sizing/what-can-a-5kva-inverter-run">what can a 5kVA inverter run</A> page lists one full load that lands
        on this size, appliance by appliance.
      </P>

      <H2>5kW vs 5kVA: are they the same?</H2>
      <P>
        Not quite. kVA is apparent power; kW is the real power your appliances use. Many hybrid inverters sold as
        {' “'}5kVA{'”'} in Nigeria are rated for about 5kW of output, but older and cheaper units may be 5kVA at a 0.8 power
        factor, which is 4kW. Check the spec sheet for the rated output in watts, not the number on the box. It also
        changes the panel input: a 5kW hybrid usually accepts more PV than you would put on it, so the inverter is rarely
        what limits a 5kVA array.
      </P>
      <P>
        Separately, {num(panelsWp / 1000)}kWp of panels is not the same thing as a 5kVA inverter either. The array is sized
        from your daily energy use; the inverter from the most you run at once. A {'“'}5kVA package{'”'} with only four
        panels is a 5kVA inverter with an undersized roof.
      </P>

      <H2>Which brands sit in each class</H2>
      <ul className="space-y-3 text-[#64748B] list-disc pl-5">
        {TIERS.map((k) => (
          <li key={k}>
            <strong className="text-[#0A0F1E]">{TIER_NAME[k]} inverters:</strong> <BrandList names={INVERTER_BRANDS[k]} />.
            Lithium in this class: <BrandList names={LITHIUM_BRANDS[k]} />.
          </li>
        ))}
      </ul>
      <P>
        The two most compared 5kVA inverters in Nigeria are Deye and Growatt; we set their prices per kVA side by side in{' '}
        <A href="/compare/deye-vs-growatt">Deye vs Growatt</A>. For the ranking across every brand we track, see{' '}
        <A href="/blog/best-solar-inverter-nigeria">the best solar inverter in Nigeria</A>.
      </P>
    </PriceGuideShell>
  );
}
