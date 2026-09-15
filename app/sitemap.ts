import { MetadataRoute } from 'next';
import { BRANDS, comparisonPairs } from '@/lib/brands';
import { PRICES_LAST_UPDATED } from '@/lib/prices';
import { sizingSitemapEntries } from './sizing/sitemap-entries';
import { SITE_URL } from '@/lib/site';

/**
 * `lastModified` used to be `new Date()` on every row, so each deploy claimed
 * every page changed today. Crawlers learn that a signal like that is noise and
 * discount it. These dates now track what actually changes content:
 *
 *  - PRICED: pages whose content is derived from the price catalogue.
 *  - EDITORIAL: prose we revised by hand; bump when the copy is rewritten.
 */
const PRICED = new Date(PRICES_LAST_UPDATED);
const EDITORIAL = new Date('2026-09-15');

type Freq = 'daily' | 'weekly' | 'monthly' | 'yearly';

function page(path: string, priority: number, changeFrequency: Freq, lastModified: Date) {
  return { url: `${SITE_URL}${path}`, lastModified, changeFrequency, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const core = [
    page('', 1.0, 'weekly', PRICED),
    page('/shop', 0.95, 'weekly', PRICED),
    page('/calculator', 0.9, 'monthly', PRICED),
    page('/brands', 0.9, 'weekly', PRICED),
    page('/sizing', 0.85, 'monthly', PRICED),
    page('/compare', 0.8, 'monthly', PRICED),
    page('/blog', 0.8, 'weekly', EDITORIAL),
    page('/how-it-works', 0.7, 'monthly', EDITORIAL),
    page('/for-builders', 0.7, 'monthly', EDITORIAL),
    page('/about', 0.6, 'monthly', EDITORIAL),
    page('/verified', 0.6, 'monthly', EDITORIAL),
    page('/contact', 0.5, 'monthly', EDITORIAL),
    // /cart is deliberately absent — it is noindex and personal to the visitor.
  ];

  const locations = [
    ['/solar/lagos', 0.85],
    ['/solar/abuja', 0.85],
    ['/solar/port-harcourt', 0.85],
    ['/solar/kano', 0.8],
    ['/solar/enugu', 0.8],
  ] as const;

  const articles = [
    ['/blog/solar-cost-nigeria-2026', 0.75],
    ['/blog/inverter-size-guide', 0.75],
    ['/blog/generator-vs-solar-lagos', 0.75],
    ['/blog/solar-calculator-nigeria', 0.75],
    ['/blog/solar-abuja-2026', 0.75],
    ['/blog/choose-solar-installer-lagos', 0.75],
    ['/blog/solar-maintenance-nigeria', 0.7],
    ['/blog/solar-loans-nigeria', 0.7],
  ] as const;

  return [
    ...core,
    ...locations.map(([path, p]) => page(path, p, 'weekly', PRICED)),
    ...articles.map(([path, p]) => page(path, p, 'monthly', EDITORIAL)),
    ...BRANDS.map((brand) => page(`/brands/${brand.slug}`, 0.75, 'monthly', PRICED)),
    ...comparisonPairs().map((pair) => page(`/compare/${pair.slug}`, 0.8, 'monthly', PRICED)),
    ...sizingSitemapEntries(SITE_URL),
  ];
}
