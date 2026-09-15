import { PRICES_LAST_UPDATED } from '@/lib/prices';

export interface FaqSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'monthly';
  priority: number;
}

/**
 * Sitemap row for /faq. Imported by app/sitemap.ts — this file owns nothing
 * else. The FAQ answers are computed from the price table, so the page's
 * lastModified is the date those prices were checked, not the deploy date.
 */
export function faqSitemapEntry(baseUrl: string): FaqSitemapEntry {
  const base = baseUrl.replace(/\/$/, '');
  return {
    url: `${base}/faq`,
    lastModified: new Date(PRICES_LAST_UPDATED),
    changeFrequency: 'monthly',
    priority: 0.8,
  };
}
