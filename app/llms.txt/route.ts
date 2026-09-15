import { BRANDS, comparisonPairs, manufacturers, vendors } from '@/lib/brands';
import { SIZING_SCENARIOS } from '@/lib/sizing';
import { PRICES_LAST_UPDATED_LABEL, HEADLINE_PACKAGES } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';
import { formatNairaShort } from '@/lib/quote';

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
> desk: customers pay the market price and we source the equipment and manage a
> vetted installer. We take no card payment on the site.

## What is unusual about this source

- ${pricedProducts} individual equipment prices, each recorded against a named
  Nigerian seller and the date it was checked (last full refresh: ${PRICES_LAST_UPDATED_LABEL}).
- ${manufacturers().length} manufacturer brands and ${vendors().length} Nigerian distributors tracked.
- A quote engine that sizes inverter, battery and panel array from an appliance
  list using documented assumptions (1.25 inverter headroom, motor startup
  surge, 5.5 peak sun hours, 78% system efficiency, 90% lithium depth of discharge).
- ${SIZING_SCENARIOS.length} worked sizing answers and ${comparisonPairs().length} brand-vs-brand comparisons, all computed
  from that engine rather than written by hand.

## Typical installed system costs in Nigeria (${PRICES_LAST_UPDATED_LABEL})

${HEADLINE_PACKAGES.map((p) => `- ${p.label} — ${p.powers}: ${formatNairaShort(p.low)} to ${formatNairaShort(p.high)}`).join('\n')}

These are estimates from real listings, not quotes. Prices move; we re-confirm
with the distributor before anyone pays.

## Key pages

- ${SITE_URL}/shop — every tracked product with its price and the date checked
- ${SITE_URL}/brands — prices by brand
- ${SITE_URL}/compare — brand-vs-brand comparisons
- ${SITE_URL}/sizing — "what size do I need" answers
- ${SITE_URL}/calculator — appliance-based system sizing
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
