import { BUDGET_POINTS } from '@/lib/budget';
import { PRICES_LAST_UPDATED } from '@/lib/prices';

export interface BudgetSitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'monthly';
  priority: number;
}

/**
 * Sitemap rows for the budget hub and every budget page.
 * Imported by app/sitemap.ts — this file owns nothing else.
 */
export function budgetSitemapEntries(baseUrl: string): BudgetSitemapEntry[] {
  const base = baseUrl.replace(/\/$/, '');
  return [
    { url: `${base}/budget`, lastModified: new Date(PRICES_LAST_UPDATED), changeFrequency: 'monthly', priority: 0.85 },
    ...BUDGET_POINTS.map((p) => ({
      url: `${base}/budget/${p.slug}`,
      lastModified: new Date(PRICES_LAST_UPDATED),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
