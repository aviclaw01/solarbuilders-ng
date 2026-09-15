import { SIZING_SCENARIOS } from '@/lib/sizing';
import { PRICES_LAST_UPDATED } from '@/lib/prices';

export interface SizingSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'monthly';
  priority: number;
}

/**
 * Sitemap rows for the sizing hub and every scenario page.
 * Imported by app/sitemap.ts — this file owns nothing else.
 */
export function sizingSitemapEntries(baseUrl: string): SizingSitemapEntry[] {
  const base = baseUrl.replace(/\/$/, '');
  return [
    { url: `${base}/sizing`, lastModified: new Date(PRICES_LAST_UPDATED), changeFrequency: 'monthly', priority: 0.8 },
    ...SIZING_SCENARIOS.map((s) => ({
      url: `${base}/sizing/${s.slug}`,
      lastModified: new Date(PRICES_LAST_UPDATED),
      changeFrequency: 'monthly' as const,
      priority: 0.75,
    })),
  ];
}
