import { MetadataRoute } from 'next';
import { BRANDS, comparisonPairs } from '@/lib/brands';
import { PRICES_LAST_UPDATED } from '@/lib/prices';
import { sizingSitemapEntries } from './sizing/sitemap-entries';
import { budgetSitemapEntries } from './budget/sitemap-entries';
import { faqSitemapEntry } from './faq/sitemap-entry';
import { ARTICLES } from './blog/articles';
import { SITE_URL } from '@/lib/site';

/**
 * `lastModified` used to be `new Date()` on every row, so each deploy claimed
 * every page changed today. Crawlers learn that a signal like that is noise and
 * discount it. These dates now track what actually changes content:
 *
 *  - PRICED: pages whose content is derived from the price catalogue.
 *  - EDITORIAL: prose we revised by hand; bump when the copy is rewritten.
 *  - A blog post's own `updated` date (app/blog/articles.ts), when it has one.
 *
 * No changeFrequency or priority: Google ignores both, and the hand-set
 * priorities said nothing a crawler could use.
 *
 * Deliberately absent, though still crawlable and linked from the footer:
 * /changelog, /privacy, /contact (low-value on a low-authority site — they
 * dilute crawl), /partners and /partners/[slug] (noindex while no partner is
 * approved), /partners/status and /for-builders (noindex), /cart (noindex,
 * personal to the visitor).
 */
const PRICED = new Date(PRICES_LAST_UPDATED);
const EDITORIAL = new Date('2026-09-15');

function page(path: string, lastModified: Date): MetadataRoute.Sitemap[number] {
  return { url: `${SITE_URL}${path}`, lastModified };
}

/** Strip the legacy changeFrequency/priority fields the section helpers still emit. */
function bare(entry: { url: string; lastModified: Date }): MetadataRoute.Sitemap[number] {
  return { url: entry.url, lastModified: entry.lastModified };
}

const CITY_PATHS = [
  '/solar/lagos',
  '/solar/abuja',
  '/solar/port-harcourt',
  '/solar/kano',
  '/solar/enugu',
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const core = [
    page('', PRICED),
    page('/shop', PRICED),
    page('/find', PRICED),
    page('/calculator', PRICED),
    page('/brands', PRICED),
    page('/compare', PRICED),
    page('/solar', PRICED),
    page('/blog', EDITORIAL),
    page('/how-it-works', EDITORIAL),
    page('/about', EDITORIAL),
    page('/verified', EDITORIAL),
  ];

  // Derived from the blog registry so a new post cannot be published without a
  // sitemap row. Two posts (solar-abuja-2026, solar-calculator-nigeria) were
  // live but absent from both this list and the blog index, which is what
  // happens when the same set of posts is maintained by hand in two places.
  const articles = ARTICLES.map((a) => page(`/blog/${a.slug}`, a.updated ? new Date(a.updated) : EDITORIAL));

  return [
    ...core,
    ...CITY_PATHS.map((path) => page(path, PRICED)),
    ...articles,
    ...BRANDS.map((brand) => page(`/brands/${brand.slug}`, PRICED)),
    ...comparisonPairs().map((pair) => page(`/compare/${pair.slug}`, PRICED)),
    ...sizingSitemapEntries(SITE_URL).map(bare),
    ...budgetSitemapEntries(SITE_URL).map(bare),
    bare(faqSitemapEntry(SITE_URL)),
  ];
}
