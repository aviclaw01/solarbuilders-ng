import type { Metadata } from 'next';
import { PANEL_BRANDS, PANEL_PER_WP, PANEL_WATTS, PRICES_LAST_UPDATED_LABEL, SOURCING_MARGIN_LABEL } from '@/lib/prices';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { SITE_URL } from '@/lib/site';
import { A, BrandList, H2, Note, P, PriceGuideShell, PriceTable, guideWhatsappText, type Faq } from '../_components/PriceGuide';
import { LOAD_5KVA, PRICE_GUIDE_TITLES, buildFor, calculatorHref, lineCost, num, scaleRange, tierBuilds } from '../_lib/price-guides';

const SLUG = 'solar-panel-price-nigeria';
const TITLE = PRICE_GUIDE_TITLES[SLUG];
const DESCRIPTION = `Tier-1 solar panels cost ${formatNaira(PANEL_PER_WP.low)}–${formatNaira(PANEL_PER_WP.high)} per watt in Nigeria. Per-panel prices for 450W, 550W, 600W and 650W, the brands, and how to spot a fake — checked ${PRICES_LAST_UPDATED_LABEL}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ['solar panel price in nigeria', '550w solar panel price in nigeria', 'price of solar panel per watt nigeria', '600w solar panel price'],
  openGraph: { title: TITLE, description: DESCRIPTION, url: `${SITE_URL}/blog/${SLUG}`, type: 'article' },
  alternates: { canonical: `${SITE_URL}/blog/${SLUG}` },
};

const SIZES = [450, 550, 600, 650];

export default function SolarPanelPricePage() {
  const perPanel = SIZES.map((w) => ({ w, range: scaleRange(PANEL_PER_WP, w) }));
  const main = scaleRange(PANEL_PER_WP, PANEL_WATTS);
  const floor550 = scaleRange(PANEL_PER_WP, 550).low;

  const mid = buildFor(tierBuilds(LOAD_5KVA, 5), 'mid');
  const array = lineCost(mid.t, 'panels');

  const faqs: Faq[] = [
    {
      q: 'How much is a 550W solar panel in Nigeria?',
      a: `${formatNaira(scaleRange(PANEL_PER_WP, 550).low)}–${formatNaira(scaleRange(PANEL_PER_WP, 550).high)} for a genuine Tier-1 mono panel, computed from the per-watt price. Typical is ${formatNaira(scaleRange(PANEL_PER_WP, 550).best)}.`,
    },
    {
      q: 'Mono or bifacial — which should I buy?',
      a: 'Both are monocrystalline; a bifacial panel also collects light reflected onto its back. On a pitched Nigerian roof the back sees very little, so the gain is small. On a raised ground mount or a light-coloured flat roof it is worth having. At the same per-watt price, buy whichever is in stock from a traceable seller.',
    },
    {
      q: 'Are tokunbo (used) solar panels worth it?',
      a: 'Usually not. A used panel has no transferable warranty, its real output is unknown until you measure it, and microcracks from shipping do not show on the surface. If you buy one, test its open-circuit voltage and short-circuit current in full sun against the label, and pay for measured watts, not printed ones.',
    },
    {
      q: 'How many panels do I need?',
      a: `It follows your daily energy use, not your inverter. A typical 5kVA family-home build in our engine uses ${mid.t.panelCount} × ${mid.t.panelWatts}W panels, which is ${formatNaira(array.best)} of panels at the typical price.`,
    },
  ];

  return (
    <PriceGuideShell
      slug={SLUG}
      title={TITLE}
      crumb="Solar panel price"
      tag="Costs & Pricing"
      readTime="7 min read"
      description={DESCRIPTION}
      datePublished="2026-10-16"
      answer={
        <>
          A genuine Tier-1 solar panel costs {formatNaira(PANEL_PER_WP.low)}–{formatNaira(PANEL_PER_WP.high)} per watt in
          Nigeria, typically {formatNaira(PANEL_PER_WP.best)}. That makes a {PANEL_WATTS}W panel {formatNaira(main.low)}–
          {formatNaira(main.high)}.
        </>
      }
      faqs={faqs}
      related={[
        { href: '/blog/fake-solar-panels-nigeria', label: 'How to tell a real panel from a fake' },
        { href: '/brands/jinko', label: 'Jinko panel prices' },
        { href: '/brands/longi', label: 'Longi panel prices' },
        { href: '/compare/jinko-vs-longi', label: 'Jinko vs Longi, per watt' },
        { href: '/sizing/how-many-solar-panels-for-3-bedroom-flat', label: 'How many panels for a 3-bedroom flat' },
      ]}
      calculator={{ href: calculatorHref(mid), label: 'See how many panels your home needs' }}
      whatsapp={{
        heading: 'Been quoted for panels?',
        body: 'Send us the brand, the wattage and the price. We will tell you where it sits against the per-watt range above.',
        label: 'Check a panel price on WhatsApp',
        text: guideWhatsappText(SLUG, `panels are ${formatNaira(PANEL_PER_WP.low)}–${formatNaira(PANEL_PER_WP.high)} per watt there. Can you check a panel price I was given?`),
      }}
    >
      <H2>Price per panel, by wattage</H2>
      <P>
        Nigerian sellers quote per panel, but panels are priced per watt. Each row below is computed from the per-watt
        price, so you can check any listing by dividing its price by its wattage.
      </P>
      <PriceTable
        rows={[
          { key: 'wp', item: 'Per watt (Tier-1 mono / bifacial)', range: PANEL_PER_WP },
          ...perPanel.map((r) => ({
            key: String(r.w),
            item: (
              <>
                {r.w}W panel <span className="font-normal text-[#64748B]">· computed from per-watt price</span>
              </>
            ),
            range: r.range,
          })),
        ]}
      />
      <Note>
        Market prices from Nigerian vendor listings, checked {PRICES_LAST_UPDATED_LABEL}. Low is the Alaba/Jiji bulk floor,
        high a showroom single-unit price. Our quotes add a {SOURCING_MARGIN_LABEL} sourcing fee on top. Retail is now
        mostly {PANEL_WATTS}W-class modules; 450W stock is older and should not cost more per watt than the newer sizes.
      </Note>

      <H2>What moves a panel price</H2>
      <P>
        Not the brand as much as you would think. In the listings we track, the Tier-1 brands sit inside the same
        per-watt band. The spread in the table comes from where you buy (a wholesale floor in Alaba
        against a single panel delivered from a showroom), how many you buy, and the exchange rate on the week the
        container landed. A panel quoted well above the high end is a margin question to ask; one quoted below the low end
        is a different question entirely.
      </P>

      <H2>The brands you will see</H2>
      <P>
        The Tier-1 panels sold in volume in Nigeria are <BrandList names={PANEL_BRANDS} />. Any of them is a sound
        choice at the right price; what matters more is that the serial number on the panel checks out on the
        manufacturer{'’'}s site and the seller can show where it came from. Two head-to-heads we price per watt:{' '}
        <A href="/compare/jinko-vs-longi">Jinko vs Longi</A> and <A href="/compare/ja-solar-vs-jinko">JA Solar vs Jinko</A>.
      </P>

      <H2>The price test for a fake panel</H2>
      <P>
        The per-watt floor is the most useful check you have. A genuine 550W Tier-1 panel does not sell below about{' '}
        {formatNairaShort(floor550)} in Nigeria right now. A {'“'}550W{'”'} panel offered well under that is either not
        550W, not Tier-1, or not new. The physical checks — weight, frame, junction box, the label against the serial —
        are in <A href="/blog/fake-solar-panels-nigeria">how to tell a real solar panel from a fake</A>.
      </P>

      <H2>How many you need</H2>
      <P>
        Panel count comes from daily energy use. Our engine{'’'}s typical 5kVA family-home build carries{' '}
        {mid.t.panelCount} × {mid.t.panelWatts}W panels ({num(mid.t.arrayKwp)}kWp), which is {formatNaira(array.low)}–
        {formatNaira(array.high)} of panels including our fee. The full build is in the{' '}
        <A href="/blog/5kva-solar-system-price-nigeria">5kVA price guide</A>; your own count comes out of the{' '}
        <A href="/calculator">calculator</A>.
      </P>
    </PriceGuideShell>
  );
}
