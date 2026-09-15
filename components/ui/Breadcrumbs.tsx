import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SITE_URL } from '@/lib/site';

/**
 * Visible breadcrumbs plus matching BreadcrumbList JSON-LD.
 *
 * Deep pages (a brand, a comparison, a sizing answer) are the ones most likely
 * to be a searcher's entry point, and breadcrumbs are what let Google show the
 * site's structure under the result instead of a bare URL. The markup must
 * mirror what is on the page, so both come from one array.
 */

export interface Crumb {
  /** omit href on the final crumb — it is the current page */
  href?: string;
  label: string;
}

export default function Breadcrumbs({ trail, className = '' }: { trail: Crumb[]; className?: string }) {
  const full: Crumb[] = [{ href: '/', label: 'Home' }, ...trail];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: full.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className={`flex items-center flex-wrap gap-1 text-sm text-slate-500 ${className}`}>
        {full.map((c, i) => (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
            {c.href ? (
              <Link href={c.href} className="hover:text-slate-900 transition-colors">
                {c.label}
              </Link>
            ) : (
              <span className="text-slate-900 font-medium">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
