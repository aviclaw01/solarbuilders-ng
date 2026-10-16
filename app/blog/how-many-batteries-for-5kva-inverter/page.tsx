import type { Metadata } from 'next';
import { LITHIUM_MODULE_KWH, LITHIUM_PER_KWH, PRICES_LAST_UPDATED_LABEL, SOURCING_MARGIN_LABEL, TUBULAR_200AH } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { getScenario, scenarioQuote } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';
import { A, GridTable, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import {
  LITHIUM_MODULE_USABLE_KWH,
  LITHIUM_USABLE,
  LOAD_5KVA,
  PRICE_GUIDE_TITLES,
  TUBULAR_SERIES_48V,
  TUBULAR_USABLE,
  TUBULAR_USABLE_KWH,
  buildFor,
  calculatorHref,
  lithiumModulesFor,
  num,
  scaleRange,
  tierBuilds,
  tubularCountFor,
} from '../_lib/price-guides';

const SLUG = 'how-many-batteries-for-5kva-inverter';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const DESCRIPTION = `How many lithium or tubular batteries a 5kVA inverter needs for 4, 8 or 12 hours of backup at 1kW, 2kW or 3kW — with the cost of each, at prices checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['how many batteries for 5kva inverter', 'how many batteries for 5kva solar system', 'how many lithium batteries for 5kva', 'battery for 3.5kva inverter'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

const LOADS_KW = [1, 2, 3];
const HOURS = [4, 8, 12];

export default function BatteriesFor5KvaPage() {
  const moduleCost = scaleRange(LITHIUM_PER_KWH.mid, LITHIUM_MODULE_KWH);

  const grid = LOADS_KW.flatMap((kw) =>
    HOURS.map((h) => {
      const kwh = kw * h;
      const li = lithiumModulesFor(kwh);
      const tu = tubularCountFor(kwh);
      return { kw, h, kwh, li, tu, liCost: li * moduleCost.best, tuCost: tu * TUBULAR_200AH.best };
    }),
  );
  const example = grid.find((g) => g.kw === 1 && g.h === 8)!;

  const mid = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');
  const small = ['what-can-a-3-5kva-inverter-run', 'what-can-a-2-5kva-inverter-run'].map((slug) => {
    const scenario = getScenario(slug)!;
    const t = scenarioQuote(scenario).tiers.standard;
    return { slug, kva: t.inverterKva, t };
  });

  const faqs: Faq[] = [
    {
      q: 'How many lithium batteries for a 5kVA inverter?',
      a: `Usually ${mid.t.batteryModules}: our engine puts ${mid.t.batteryModules} × ${num(LITHIUM_MODULE_KWH)}kWh 48V modules on a typical 5kVA family home with some grid. One module is the minimum that works; each extra module adds about ${num(LITHIUM_MODULE_USABLE_KWH)}kWh of usable backup.`,
    },
    {
      q: 'How many tubular batteries for a 5kVA inverter?',
      a: `At least ${TUBULAR_SERIES_48V}, because a 5kVA runs a 48V bank and each tubular is 12V. More backup means another set of ${TUBULAR_SERIES_48V}, not one more battery. ${TUBULAR_SERIES_48V} × 200Ah gives about ${num(TUBULAR_SERIES_48V * TUBULAR_USABLE_KWH)}kWh usable.`,
    },
    {
      q: 'How long will a 5kVA inverter run on batteries?',
      a: `Usable battery kWh divided by your load in kW. ${num(mid.t.batteryKwh)}kWh of lithium gives about ${num(mid.t.batteryKwh * LITHIUM_USABLE)}kWh usable, so roughly ${Math.floor(mid.t.batteryKwh * LITHIUM_USABLE)} hours at 1kW, or half that at 2kW. The inverter size does not change the hours; the battery does.`,
    },
    {
      q: 'Can I mix lithium and tubular batteries?',
      a: 'No. They charge at different voltages and the inverter can only be set for one battery type. Pick one and build the bank from matching units bought together.',
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Batteries for a 5kVA"
      tag="System Sizing"
      readTime="7 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A 5kVA inverter needs {mid.t.batteryModules} × {num(LITHIUM_MODULE_KWH)}kWh lithium modules for a typical family home,
          or at least {TUBULAR_SERIES_48V} tubular batteries. For a 1kW load through 8 hours that is {example.li} lithium modules
          (about {formatNairaShort(example.liCost)}) or {example.tu} tubulars (about {formatNairaShort(example.tuCost)}).
        </>
      }
      faqs={faqs}
      related={[
        { href: '/sizing/what-can-a-5kva-inverter-run', label: 'What a 5kVA inverter can run' },
        { href: '/blog/lithium-battery-price-nigeria', label: 'Lithium battery prices by brand class' },
        { href: '/blog/lithium-vs-tubular-battery-nigeria', label: 'Lithium vs tubular: the ten-year cost' },
        { href: '/brands/felicity', label: 'Felicity battery prices' },
        { href: '/compare/deye-vs-dyness', label: 'Deye vs Dyness lithium' },
        { href: '/blog/5kva-solar-system-price-nigeria', label: '5kVA solar system price, itemised' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'Size the battery for my own load' }}
      whatsapp={{
        heading: 'Not sure how many hours you need?',
        body: 'Tell us what has to stay on when NEPA goes and for how long. We will work out the battery with you.',
        label: 'Ask about batteries on WhatsApp',
        text: guideWhatsappText(SLUG, 'I want to know how many batteries my 5kVA needs for the hours I want. Can you help?'),
      }}
    >
      <H2>The table: load × hours → batteries → cost</H2>
      <P>
        Pick the row closest to what you want running when the grid is off and for how long. The kWh column is the
        energy that takes; the battery counts are what holds that much usable energy on a 5kVA (48V) system.
      </P>
      <GridTable
        head={['Load', 'Hours', 'Energy', 'Lithium modules', 'Lithium cost', 'Tubulars', 'Tubular cost']}
        minWidth={640}
        rows={grid.map((g) => [
          `${g.kw}kW`,
          `${g.h}h`,
          `${g.kwh}kWh`,
          `${g.li} × ${num(LITHIUM_MODULE_KWH)}kWh`,
          formatNairaShort(g.liCost),
          `${g.tu} × 200Ah`,
          formatNairaShort(g.tuCost),
        ])}
      />
      <Note>
        Lithium counted at {Math.round(LITHIUM_USABLE * 100)}% usable, tubular at {Math.round(TUBULAR_USABLE * 100)}%, tubulars in
        sets of {TUBULAR_SERIES_48V} for 48V. Costs at typical mid-class prices. 1kW is lights, fans, TV, a fridge and
        Wi-Fi; 2kW adds a small AC; 3kW is a 1.5HP AC with the rest of the house.
      </Note>

      <H2>What each battery costs</H2>
      <PriceTable
        rows={[
          { key: 'li', item: `Lithium module, ${num(LITHIUM_MODULE_KWH)}kWh 48V (mid class)`, range: moduleCost },
          { key: 'tu', item: 'Tubular 200Ah 12V', range: TUBULAR_200AH },
          { key: 'tu4', item: `${TUBULAR_SERIES_48V} tubulars, one 48V set`, range: scaleRange(TUBULAR_200AH, TUBULAR_SERIES_48V) },
        ]}
      />
      <Note>
        Market prices, checked {PRICES_LAST_UPDATED_LABEL}; our quotes add a {SOURCING_MARGIN_LABEL} sourcing fee.
      </Note>

      <H2>Why the 12-hour rows look so large</H2>
      <P>
        Because running a house all night on batteries alone is expensive, and anyone who tells you otherwise has not
        costed it. Most homes do not need it: with some grid supply, the battery only has to cover the hours the grid is
        off after dark, and the panels refill it the next day. That is why our engine{'’'}s typical 5kVA build carries{' '}
        {mid.t.batteryModules} modules, not {Math.max(...grid.map((g) => g.li))}. If your evenings are long and your grid is poor, the{' '}
        <A href="/calculator">calculator</A> lets you set grid supply to {'“'}poor{'”'} or {'“'}none{'”'} and watch the
        battery grow.
      </P>

      {small.map((s) => (
        <div key={s.slug}>
          <H2>And for a {s.kva}kVA inverter?</H2>
          <P>
            A {s.kva}kVA inverter usually runs a 24V battery, so tubulars go in pairs and lithium is a 24V module of the
            same {num(LITHIUM_MODULE_KWH)}kWh. For the representative load on our{' '}
            <A href={`/sizing/${s.slug}`}>what can a {s.kva}kVA inverter run</A> page, the engine fits{' '}
            {s.t.batteryModules} lithium module{s.t.batteryModules > 1 ? 's' : ''} ({num(s.t.batteryKwh)}kWh). Same rule as
            above: the hours come from the battery, not the inverter.
          </P>
        </div>
      ))}
    </PriceGuideShell>
  );
}
