import NavbarClient from '@/components/ui/NavbarClient';
import type { MenuGroup, MenuItem } from '@/components/ui/navTypes';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { comparisonPairs } from '@/lib/brands';
import { SIZING_SCENARIOS } from '@/lib/sizing';
import { BUDGET_POINTS } from '@/lib/budget';
import { formatNairaShort } from '@/lib/quote';

/**
 * Three top-level items, each a small menu, plus one primary action.
 *
 * The site has ~15 destinations. Listing them flat turned the bar into a wall
 * of links, so they are grouped by what someone is trying to do: buy something,
 * check a price, or work out what they need. The calculator is the action
 * rather than a nav item, because it is what we actually want people to do.
 *
 * This file is a **server component on purpose**. The labels below are derived
 * from lib/prices, lib/brands, lib/sizing and lib/quote — together ~110KB of
 * source. Computing them in the client component shipped all four tables to
 * every visitor's browser (24KB gzipped on every page) to render a dropdown.
 * Built here, only the ~2KB of finished strings crosses the wire.
 */

const FAMILY = HEADLINE_PACKAGES[2];
const TOP_COMPARISON = comparisonPairs()[0];

/** Sits beside the menus as a plain link — no dropdown, like Beam's "Our Customers". */
const PLAIN_LINK: MenuItem = { href: '/for-builders', label: 'Work with us' };

const MENUS: MenuGroup[] = [
  {
    label: 'Shop',
    items: [
      { href: '/shop', label: 'All equipment', hint: 'Every price we track' },
      { href: '/shop?cat=inverter', label: 'Inverters' },
      { href: '/shop?cat=battery', label: 'Batteries' },
      { href: '/shop?cat=panel', label: 'Solar panels' },
      { href: '/shop?cat=package', label: 'Complete packages' },
      { href: '/cart', label: 'Your order' },
    ],
    featured: {
      href: '/calculator',
      eyebrow: 'Not sure what fits?',
      title: 'Size your system first',
      body: `Tick your appliances and get an itemised list in two minutes. A family home with one AC runs about ${formatNairaShort(FAMILY.low)}–${formatNairaShort(FAMILY.high)} installed.`,
      stat: `${formatNairaShort(FAMILY.low)}–${formatNairaShort(FAMILY.high)}`,
    },
  },
  {
    label: 'Prices',
    items: [
      { href: '/brands', label: 'Prices by brand', hint: 'Felicity, Deye, Growatt, Jinko…' },
      { href: '/compare', label: 'Compare brands', hint: `${comparisonPairs().length} head-to-head pages` },
      { href: '/blog/solar-cost-nigeria-2026', label: 'What a full system costs' },
      { href: '/blog/inverter-size-guide', label: 'Inverter size guide' },
    ],
    featured: TOP_COMPARISON
      ? {
          href: `/compare/${TOP_COMPARISON.slug}`,
          eyebrow: 'Most compared',
          title: `${TOP_COMPARISON.a.name.split(' ')[0]} vs ${TOP_COMPARISON.b.name.split(' ')[0]}`,
          body: 'Per kVA, per kWh, model by model, with what each is actually good for.',
          stat: 'Head to head',
        }
      : { href: '/compare', eyebrow: 'Compare', title: 'Brand comparisons', body: 'See what each brand costs.' },
  },
  {
    label: 'Resources',
    items: [
      { href: '/sizing', label: 'Sizing guides', hint: `${SIZING_SCENARIOS.length} worked answers` },
      { href: '/budget', label: 'What my budget buys', hint: `${BUDGET_POINTS.length} budgets, priced` },
      { href: '/blog', label: 'Solar guides', hint: 'Costs, maintenance, financing' },
      { href: '/faq', label: 'FAQs', hint: 'Straight answers, no sales pitch' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/verified', label: 'How we vet installers' },
      { href: '/blog/solar-loans-nigeria', label: 'Paying for it' },
    ],
    featured: {
      href: '/budget',
      eyebrow: 'Start from the money',
      title: 'What will my budget buy?',
      body: `Name the amount and get the system it actually buys — including the budgets that honestly buy nothing yet. Prices from ${PRICES_LAST_UPDATED_LABEL}.`,
      stat: `${BUDGET_POINTS.length} budgets`,
    },
  },
];

export default function Navbar() {
  return <NavbarClient menus={MENUS} plainLink={PLAIN_LINK} />;
}
