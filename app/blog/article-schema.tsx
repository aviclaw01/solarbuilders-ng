import { ARTICLES } from './articles';
import { SITE_URL } from '@/lib/site';

/**
 * Article JSON-LD for a blog post, read from the registry so the headline and
 * summary cannot drift from what the blog index and sitemap say.
 *
 * BreadcrumbList is not emitted here: every post renders <Breadcrumbs>, which
 * already outputs it alongside the visible trail.
 *
 * dateModified: the registry's `updated` wins; otherwise the page's own
 * last-known revision date; otherwise the publish date.
 */
export default function ArticleSchema({
  slug,
  datePublished,
  dateModified,
}: {
  slug: string;
  /** ISO date the post first went live. */
  datePublished: string;
  /** ISO date of the last known revision, when the registry has no `updated`. */
  dateModified?: string;
}) {
  const article = ARTICLES.find((a) => a.slug === slug);
  if (!article) return null;

  const url = `${SITE_URL}/blog/${article.slug}`;
  const org = { '@type': 'Organization', name: 'SolarBuilders.ng', url: SITE_URL };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title.length > 110 ? `${article.title.slice(0, 109)}…` : article.title,
    description: article.excerpt,
    datePublished,
    dateModified: article.updated ?? dateModified ?? datePublished,
    author: org,
    publisher: org,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />;
}
