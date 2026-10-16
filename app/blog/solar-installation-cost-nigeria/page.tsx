import type { Metadata } from 'next';
import {
  BOS_FRACTION,
  BOS_ITEMS,
  CONTINGENCY_FRACTION,
  LABOUR_FLOOR,
  LABOUR_PER_KVA,
  PRICES_LAST_UPDATED_LABEL,
  SOURCING_MARGIN_LABEL,
} from '@/lib/prices';
import { formatNaira, formatNairaShort, formatRange } from '@/lib/quote';
import { getScenario } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';
import { A, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import { LOAD_10KVA, LOAD_5KVA, PRICE_GUIDE_TITLES, buildFor, calculatorHref, tierBuilds } from '../_lib/price-guides';

const SLUG = 'solar-installation-cost-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const DESCRIPTION = `Solar installation labour in Nigeria runs ${formatNaira(LABOUR_PER_KVA.low)}–${formatNaira(LABOUR_PER_KVA.high)} per kVA, with a minimum of about ${formatNairaShort(LABOUR_FLOOR)}. Labour by system size, the protection gear a proper install needs, and what a quote must itemise — checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['solar installation cost in nigeria', 'cost of solar installation per kva', 'solar installer charges nigeria', 'solar workmanship cost'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

const BOS_LABELS: Record<keyof typeof BOS_ITEMS, string> = {
  mounting_per_panel: 'Panel mounting (rails, clamps, L-feet) — per panel',
  pv_cable_per_m: '6mm² DC solar cable — per metre',
  mc4_pair: 'MC4 connector — per pair',
  pv_combiner: 'PV combiner box, DC breaker and DC surge protector',
  battery_protection: 'Battery breaker, fuse and cable (up to 5kVA)',
  battery_protection_large: 'Battery breaker, fuse and cable (above 5kVA)',
  ac_protection: 'AC breakers, distribution board, AC surge protector',
  changeover_63a: 'Changeover switch, 63A (up to 5kVA)',
  changeover_100a: 'Changeover switch, 100A (above 5kVA)',
  earthing_kit: 'Earth rod, clamp and earth cable',
  battery_rack: 'Battery rack or cabinet (above two modules)',
  fire_extinguisher: 'Fire extinguisher beside the battery bank',
  sundries_per_kva: 'Trunking, conduit, glands, lugs — per kVA',
};

const pct = (f: number) => `${Math.round(f * 100)}%`;

export default function InstallationCostPage() {
  const three = getScenario('what-can-a-3-5kva-inverter-run');
  if (!three) throw new Error('Installation guide: 3.5kVA sizing scenario is gone');
  const systems = [
    buildFor(tierBuilds(three.appliances, 3.5), 'mid'),
    buildFor(tierBuilds(LOAD_5KVA, 5), 'mid'),
    buildFor(tierBuilds(LOAD_10KVA, 10), 'mid'),
  ];
  const five = systems[1];
  const bosShare = five.t.bos.best / five.t.equipment.best;

  const faqs: Faq[] = [
    {
      q: 'How much do installers charge per kVA in Nigeria?',
      a: `Typically ${formatNaira(LABOUR_PER_KVA.best)} per kVA, in a range of ${formatNaira(LABOUR_PER_KVA.low)}–${formatNaira(LABOUR_PER_KVA.high)}, with a minimum of about ${formatNairaShort(LABOUR_FLOOR)} for a small job. That is a reference range from the market, not a price we set: we do not employ installers.`,
    },
    {
      q: 'Is installation included in solar package prices?',
      a: 'Sometimes, and it is the first thing to check. Our quotes never include it; we show the typical labour range beside the total so it is not a surprise. A package that says "installed" should list labour as its own line.',
    },
    {
      q: 'What does a proper installation include?',
      a: 'Mounting, DC cable and connectors, a PV isolator with surge protection, a battery breaker and fuse, AC breakers and surge protection, a changeover, earthing, and a fire extinguisher beside a lithium bank. Then commissioning: settings for your battery, a test under load, and the monitoring app set up.',
    },
    {
      q: 'Why does my quote have a contingency line?',
      a: `Because a site survey almost always finds something — a longer cable run, a tired distribution board, an extra rail — and prices move between quote and purchase. We add ${pct(CONTINGENCY_FRACTION.low)}–${pct(CONTINGENCY_FRACTION.high)} of equipment and materials for it.`,
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Installation cost"
      tag="Costs & Pricing"
      readTime="8 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          Solar installation labour in Nigeria typically costs {formatNaira(LABOUR_PER_KVA.low)}–{formatNaira(LABOUR_PER_KVA.high)} per
          kVA, with a minimum of about {formatNairaShort(LABOUR_FLOOR)}. For a 5kVA that is {formatRange(five.t.labourRef)},
          on top of {formatRange(five.t.bos)} of protection and mounting materials.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/check-solar-installer-qualified-nemsa', label: 'How to check your installer is qualified' },
        { href: '/blog/choose-solar-installer-lagos', label: 'How to choose a solar installer' },
        { href: '/blog/5kva-solar-system-price-nigeria', label: '5kVA solar system price, itemised' },
        { href: '/brands/deye', label: 'Deye prices in Nigeria' },
        { href: '/compare/deye-vs-felicity', label: 'Deye vs Felicity' },
        { href: '/sizing/what-can-a-5kva-inverter-run', label: 'What a 5kVA inverter can run' },
      ]}
      calculator={{ href: calculatorHref(five), label: 'Get an itemised quote to compare' }}
      whatsapp={{
        heading: 'Got a quote from an installer?',
        body: 'Send it to us. We will go through it line by line against these prices and tell you what is missing.',
        label: "Send us your installer's quote on WhatsApp",
        text: guideWhatsappText(SLUG, "I have an installer's quote and want it checked line by line. Can I send it to you?"),
      }}
    >
      <H2>Labour, by system size</H2>
      <P>
        Installers price labour per kVA of inverter, with a floor for small jobs. These are the typical ranges for three
        common systems, from the same reference figures our quote engine shows beside every total.
      </P>
      <PriceTable
        rows={[
          { key: 'per', item: 'Labour per kVA', range: LABOUR_PER_KVA },
          ...systems.map((s) => ({ key: String(s.t.inverterKva), item: `Labour, ${s.t.inverterKva}kVA system`, range: s.t.labourRef })),
        ]}
      />
      <Note>
        Reference range only — installers set their own price. On small systems the per-kVA rate gives way to a minimum
        of about {formatNairaShort(LABOUR_FLOOR)}, because a small job still takes a crew a day. Distance, roof access and a
        ground mount all push it up.
      </Note>

      <H2>The materials an installation needs</H2>
      <P>
        Labour is the smaller half. The protection and mounting gear — what our quotes call balance of system — is where
        cheap installs cut corners, and where the safety of a lithium bank actually lives. Unit prices:
      </P>
      <PriceTable
        rows={(Object.keys(BOS_ITEMS) as (keyof typeof BOS_ITEMS)[]).map((k) => ({ key: k, item: BOS_LABELS[k], range: BOS_ITEMS[k] }))}
      />
      <Note>
        Market prices, checked {PRICES_LAST_UPDATED_LABEL}, before our {SOURCING_MARGIN_LABEL} sourcing fee. Quantities depend on
        the system; the quote engine works them out from panel count, string count and inverter size.
      </Note>
      <P>
        Added up for our typical 5kVA build, these come to {formatRange(five.t.bos)}, about {pct(bosShare)} of the
        equipment cost. The old rule of thumb was {pct(BOS_FRACTION.low)}–{pct(BOS_FRACTION.high)}; priced item by item, a
        proper install sits {bosShare > BOS_FRACTION.high ? 'above' : bosShare < BOS_FRACTION.low ? 'below' : 'inside'} that
        range. A quote with one {'“'}accessories{'”'} line well below this is leaving something out.
      </P>

      <H2>Contingency</H2>
      <P>
        Our quotes carry a contingency line of {pct(CONTINGENCY_FRACTION.low)}–{pct(CONTINGENCY_FRACTION.high)} on equipment and
        materials ({formatRange(five.t.contingency)} on the 5kVA build). It covers what a site survey finds and price
        movement since our last check. An installer who quotes without seeing the site and without any allowance will
        usually come back for it later.
      </P>

      <H2>What a quote must itemise</H2>
      <ol className="space-y-3 text-[#64748B] list-decimal pl-5">
        <li><strong className="text-[#0A0F1E]">Inverter</strong> — brand, model number, kVA, and whether it is hybrid.</li>
        <li><strong className="text-[#0A0F1E]">Battery</strong> — brand, chemistry, voltage, kWh and number of units.</li>
        <li><strong className="text-[#0A0F1E]">Panels</strong> — brand, wattage, number of panels.</li>
        <li><strong className="text-[#0A0F1E]">Mounting and DC cable</strong> — with cable size and length.</li>
        <li><strong className="text-[#0A0F1E]">Protection</strong> — PV isolator and surge protector, battery breaker and fuse, AC breakers and surge protector.</li>
        <li><strong className="text-[#0A0F1E]">Changeover and earthing</strong> — the two lines most often missing.</li>
        <li><strong className="text-[#0A0F1E]">Labour and commissioning</strong> — as its own line, with what commissioning includes.</li>
        <li><strong className="text-[#0A0F1E]">Warranty and payment terms</strong> — who honours which warranty, and when each payment is due.</li>
      </ol>
      <P>
        A quote that is one number is not a quote. Ask for the list; how the installer responds tells you a lot. Then put
        it beside an itemised build from the <A href="/calculator">calculator</A> and check the installer against{' '}
        <A href="/blog/check-solar-installer-qualified-nemsa">the three checks before money moves</A>.
      </P>
    </PriceGuideShell>
  );
}
