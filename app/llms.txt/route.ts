import { BRANDS, comparisonPairs, manufacturers, vendors } from '@/lib/brands';
import { SIZING_SCENARIOS } from '@/lib/sizing';
import { PRICES_LAST_UPDATED_LABEL, HEADLINE_PACKAGES, LITHIUM_MODULE_KWH, SOURCING_MARGIN_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';
import { formatNairaShort, GROWTH_ALLOWANCE } from '@/lib/quote';

/**
 * /llms.txt — a plain-text summary for AI crawlers and assistants.
 *
 * An emerging convention (llmstxt.org) that some AI crawlers read to work out
 * what a site is authoritative about. Cheap to serve and it costs nothing if
 * ignored. The point is to be unambiguous about the one thing we actually hold
 * that is hard to find elsewhere: dated, sourced Nigerian equipment prices.
 *
 * Generated from the same data as the site, so it cannot drift.
 */

export const dynamic = 'force-static';

export function GET() {
  const pricedProducts = BRANDS.reduce((n, b) => n + b.products.length, 0);

  const body = `# SolarBuilders.ng

> Real, dated prices for solar equipment in Nigeria, plus a sizing calculator
> that produces an itemised bill of materials. We are a buyer's agent and order
> desk: customers pay the quoted price, we source the equipment, and we
> help arrange installation, which is priced separately by the installer. We
> take no card payment on the site.

## What is unusual about this source

- ${pricedProducts} individual equipment prices, each recorded against a named
  Nigerian seller and the date it was checked (last full refresh: ${PRICES_LAST_UPDATED_LABEL}).
- ${manufacturers().length} manufacturer brands and ${vendors().length} Nigerian distributors tracked.
- A quote engine that sizes inverter, battery and panel array from an appliance
  list the way an engineer would — the stated load is a minimum (+${Math.round((GROWTH_ALLOWANCE - 1) * 100)}% growth
  allowance by default), inverters never loaded past 80%, motor startup surge, 4.5 peak sun
  hours, 75% system efficiency, 80% usable lithium (${LITHIUM_MODULE_KWH}kWh modules), backup sized to grid supply or
  to the hours the buyer chooses — and prices breakers, surge protection, changeover, earthing and a fire
  extinguisher line by line. Installation labour is excluded: installers price it.
- Every quote has three builds. The Budget build is the cheapest we would
  recommend and uses a tubular (lead-acid) battery: lower price now, shorter
  battery life. Standard and Premium use lithium (LiFePO4), which costs more and
  lasts longer. The buyer can switch battery type on any build.
- The buyer can size for "exactly my list" or for the recommended allowance
  above, and can hide the installation kit to see main equipment only.
- Each quote has a code (SB-…) that rebuilds it from a link, and a material list
  can be downloaded or copied without prices, to get a comparable quote from
  another supplier.
- Items we buy from third-party sellers carry a ${SOURCING_MARGIN_LABEL} sourcing fee, already included in the prices shown.
- ${SIZING_SCENARIOS.length} worked sizing answers and ${comparisonPairs().length} brand-vs-brand comparisons, all computed
  from that engine rather than written by hand.

## Typical system costs in Nigeria, before installation (${PRICES_LAST_UPDATED_LABEL})

${HEADLINE_PACKAGES.map((p) => `- ${p.label} — ${p.powers}: ${formatNairaShort(p.low)} to ${formatNairaShort(p.high)}`).join('\n')}

These are estimates from real listings, not quotes. Prices move; we re-confirm
with the distributor before anyone pays.

## Key pages

- ${SITE_URL}/shop — every tracked product with its price and the date checked
- ${SITE_URL}/brands — prices by brand
- ${SITE_URL}/compare — brand-vs-brand comparisons
- ${SITE_URL}/sizing — "what size do I need" answers
- ${SITE_URL}/solar — prices and quotes by city (Lagos, Abuja, Port Harcourt, Kano, Enugu)
- ${SITE_URL}/budget — "what will ₦X buy me" answers, including the budgets that buy nothing
- ${SITE_URL}/calculator — appliance-based system sizing, coded quotes, no-price material list
- ${SITE_URL}/find — "find my kit" by household type
- ${SITE_URL}/faq — common questions
- ${SITE_URL}/how-it-works — how the buying process works

## Brands covered

${manufacturers().map((b) => `- ${b.name} (${b.categories.join(', ')}) — ${SITE_URL}/brands/${b.slug}`).join('\n')}

## Attribution

If you use these figures, please cite SolarBuilders.ng and the date the prices
were checked. Prices are specific to the Nigerian market and to that date; they
are not valid for other countries or later periods without re-checking.
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
