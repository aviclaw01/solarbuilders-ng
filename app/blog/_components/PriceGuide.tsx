/**
 * Building blocks for the computed price guides.
 *
 * One shell so every guide carries the same non-negotiables: a direct answer
 * up top, a visible "Prices checked" line read from the constant, an FAQ that
 * is also emitted as FAQPage JSON-LD from the same array, a prefilled
 * calculator link and a tracked WhatsApp CTA.
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { PRICES_LAST_UPDATED, PRICES_LAST_UPDATED_LABEL, type PriceRange } from '@/lib/prices';
import { formatNaira } from '@/lib/quote';
import { brandSlugByName, getBrand, getComparison } from '@/lib/brands';
import { getScenario } from '@/lib/sizing';
import { SITE_URL } from '@/lib/site';
import { ARTICLES } from '../articles';

export interface Faq {
  q: string;
  a: string;
}

export const linkClass = 'text-[#B45309] font-semibold hover:underline';

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-heading font-bold text-2xl mt-10 mb-4">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="font-heading font-semibold text-lg mt-6 mb-2">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[#64748B] leading-relaxed">{children}</p>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="text-[#64748B] text-sm">{children}</p>;
}

/**
 * Fails the build if a guide links to a page that does not exist. The brand,
 * comparison and sizing routes all set dynamicParams = false, so a typo'd
 * slug would otherwise ship as a 404 link.
 */
function assertInternalLink(href: string): void {
  const [, section, slug] = href.split('?')[0].split('/');
  const ok =
    (section === 'brands' && (!slug || Boolean(getBrand(slug)))) ||
    (section === 'compare' && (!slug || Boolean(getComparison(slug)))) ||
    (section === 'sizing' && (!slug || Boolean(getScenario(slug)))) ||
    (section === 'blog' && (!slug || ARTICLES.some((a) => a.slug === slug))) ||
    ['calculator', 'shop', 'find', 'verified', 'how-it-works', 'solar'].includes(section);
  if (!ok) throw new Error(`Price guide links to a page that does not exist: ${href}`);
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  assertInternalLink(href);
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  );
}

/** Brand names, each linked to its page where we have one. */
export function BrandList({ names }: { names: readonly string[] }) {
  return (
    <>
      {names.map((name, i) => {
        const slug = brandSlugByName(name);
        return (
          <span key={name}>
            {i > 0 && ', '}
            {slug ? <A href={`/brands/${slug}`}>{name}</A> : name}
          </span>
        );
      })}
    </>
  );
}

export interface PriceRow {
  item: ReactNode;
  /** stable key; defaults to the row index */
  key?: string;
  range: PriceRange;
  /** total rows are drawn dark, like the BOM total on the cost guide */
  total?: boolean;
}

/** The standard item | low | typical | high table. "Typical" is the range's best price. */
export function PriceTable({ rows, itemHeader = 'Item' }: { rows: PriceRow[]; itemHeader?: string }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
      <table className="w-full text-sm min-w-[480px]">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            <th className="text-left p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">{itemHeader}</th>
            <th className="text-right p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">Low</th>
            <th className="text-right p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">Typical</th>
            <th className="text-right p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">High</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) =>
            r.total ? (
              <tr key={r.key ?? i} className="bg-[#0A0F1E] text-white">
                <td className="p-3 md:p-4 font-heading font-bold">{r.item}</td>
                <td className="p-3 md:p-4 text-right font-heading font-bold">{formatNaira(r.range.low)}</td>
                <td className="p-3 md:p-4 text-right font-heading font-bold">{formatNaira(r.range.best)}</td>
                <td className="p-3 md:p-4 text-right font-heading font-bold">{formatNaira(r.range.high)}</td>
              </tr>
            ) : (
              <tr key={r.key ?? i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
                <td className="p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">{r.item}</td>
                <td className="p-3 md:p-4 text-right text-[#64748B]">{formatNaira(r.range.low)}</td>
                <td className="p-3 md:p-4 text-right font-semibold text-[#0A0F1E]">{formatNaira(r.range.best)}</td>
                <td className="p-3 md:p-4 text-right text-[#64748B]">{formatNaira(r.range.high)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

/** A plain table for non-price grids (sizes, counts). Cells are pre-rendered. */
export function GridTable({ head, rows, minWidth = 560 }: { head: string[]; rows: ReactNode[][]; minWidth?: number }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] overflow-x-auto">
      <table className="w-full text-sm" style={{ minWidth }}>
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {head.map((h) => (
              <th key={h} className="text-left p-3 md:p-4 font-heading font-semibold text-[#0A0F1E]">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i} className={`border-b border-[#E2E8F0] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}>
              {cells.map((c, j) => (
                <td key={j} className={`p-3 md:p-4 ${j === 0 ? 'font-heading font-semibold text-[#0A0F1E]' : 'text-[#64748B]'}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface RelatedLink {
  href: string;
  label: string;
}

interface ShellProps {
  slug: string;
  title: string;
  crumb: string;
  tag: string;
  readTime: string;
  description: string;
  datePublished: string;
  /** the direct answer — rendered as the lead paragraph */
  answer: ReactNode;
  children: ReactNode;
  faqs: Faq[];
  related: RelatedLink[];
  calculator: { href: string; label: string };
  whatsapp: { text: string; label: string; heading: string; body: string };
}

export function PriceGuideShell({
  slug,
  title,
  crumb,
  tag,
  readTime,
  description,
  datePublished,
  answer,
  children,
  faqs,
  related,
  calculator,
  whatsapp,
}: ShellProps) {
  const url = `${SITE_URL}/blog/${slug}`;
  related.forEach((r) => assertInternalLink(r.href));

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    author: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    publisher: { '@type': 'Organization', name: 'SolarBuilders.ng' },
    datePublished,
    // A guide published after the last price check was not modified before it was published.
    dateModified: PRICES_LAST_UPDATED > datePublished ? PRICES_LAST_UPDATED : datePublished,
    url,
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const btnPrimary =
    'inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors';
  const btnSecondary =
    'inline-flex items-center justify-center gap-2 border-2 border-[#0A0F1E] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-[#0A0F1E] hover:text-white transition-colors';

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>
        <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-16">
          <Breadcrumbs trail={[{ href: '/blog', label: 'Blog' }, { label: crumb }]} className="mb-8" />

          <span className="inline-block bg-[#FEF3C7] text-[#0A0F1E] text-xs font-heading font-semibold px-3 py-1 rounded-full mb-6">
            {tag}
          </span>

          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl leading-tight mb-6">{title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#64748B] text-sm mb-10 pb-8 border-b border-[#E2E8F0]">
            <span className="font-semibold text-[#0A0F1E]">Prices checked {PRICES_LAST_UPDATED_LABEL}</span>
            <span>·</span>
            <span>{readTime}</span>
            <span>·</span>
            <span>By SolarBuilders.ng</span>
          </div>

          <div className="space-y-6 text-[#0A0F1E]">
            <p className="text-xl text-[#0A0F1E] leading-relaxed">{answer}</p>

            {children}

            <H2>Questions people ask</H2>
            <div className="space-y-5">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-heading font-semibold text-[#0A0F1E] text-lg mb-1">{f.q}</h3>
                  <p className="text-[#64748B] leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <H2>Related pages</H2>
            <ul className="space-y-2 list-disc pl-5 text-[#64748B]">
              {related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className={linkClass}>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 bg-[#FEF3C7] rounded-2xl p-6 md:p-8">
            <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">{whatsapp.heading}</h3>
            <p className="text-[#64748B] mb-4">{whatsapp.body}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={calculator.href} className={btnPrimary}>
                {calculator.label} →
              </Link>
              <WhatsAppLink text={whatsapp.text} placement={`blog:${slug}`} className={btnSecondary}>
                <MessageCircle className="w-4 h-4" /> {whatsapp.label}
              </WhatsAppLink>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

/** WhatsApp message that names the guide the reader came from. */
export function guideWhatsappText(slug: string, context: string): string {
  return `Hi SolarBuilders, I read ${SITE_URL}/blog/${slug} — ${context}`;
}
