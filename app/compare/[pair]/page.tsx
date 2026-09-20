import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandMark from '@/components/ui/BrandMark';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import {
  CATEGORY_LABEL,
  TIER_LABEL,
  brandsInCategory,
  comparisonPairs,
  comparisonsFor,
  getComparison,
  unitPriceStats,
  vendorReach,
  type Brand,
  type ComparisonPair,
  type Product,
  type ProductCategory,
  type UnitPriceStats,
} from '@/lib/brands';
import { formatNaira, formatNairaShort } from '@/lib/quote';
import { PRICES_LAST_UPDATED, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';
import { ArrowRight, AlertTriangle, MessageCircle, Zap, Scale } from 'lucide-react';

interface Props {
  params: Promise<{ pair: string }>;
}

const PRICE_YEAR = PRICES_LAST_UPDATED.slice(0, 4);

export function generateStaticParams() {
  return comparisonPairs().map((p) => ({ pair: p.slug }));
}

/**
 * These pages are generated from a fixed, code-defined set, so a param outside
 * it is a 404 — not a page that might exist later.
 *
 * dynamicParams defaults to true, which makes Next render an unknown param on
 * demand: notFound() swaps in the not-found body and the response still goes
 * out as HTTP 200. A soft-404 across an unbounded crawlable URL space is the
 * last thing an SEO-led site wants.
 */
export const dynamicParams = false;


// ─────────────────────────────────────────────────────────
// Formatting — every figure comes from lib/brands + lib/prices
// ─────────────────────────────────────────────────────────

/** ₦113k / kVA, ₦173 / W — panels are priced per watt, so they need full naira. */
function perUnit(value: number, unit: string): string {
  return unit === 'W' ? formatNaira(value) : formatNairaShort(value);
}

function perUnitRange(s: UnitPriceStats): string {
  const lo = perUnit(s.lowPerUnit, s.unit);
  const hi = perUnit(s.highPerUnit, s.unit);
  return lo === hi ? `${lo} / ${s.unit}` : `${lo} – ${hi} / ${s.unit}`;
}

function num(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

function sizeRange(s: UnitPriceStats): string {
  return s.minSize === s.maxSize
    ? `${num(s.minSize)}${s.unit}`
    : `${num(s.minSize)}–${num(s.maxSize)}${s.unit}`;
}

function priceRange(p: Product): string {
  return p.priceLow === p.priceHigh
    ? formatNaira(p.priceLow)
    : `${formatNaira(p.priceLow)} – ${formatNaira(p.priceHigh)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09-13" → "13 Sep 2026", without depending on ICU locale data. */
function seenOnLabel(iso: string): string {
  const [y, m, d] = iso.split('-');
  const mi = Number(m) - 1;
  if (!y || !m || !d || mi < 0 || mi > 11) return iso;
  return `${Number(d)} ${MONTHS[mi]} ${y}`;
}

/** Midpoint of the ₦/unit spread — the fairest single number to compare on. */
function midPerUnit(s: UnitPriceStats): number {
  return (s.lowPerUnit + s.highPerUnit) / 2;
}

// ─────────────────────────────────────────────────────────
// Derived copy — never invents a capability
// ─────────────────────────────────────────────────────────

interface Gap {
  dearer: Brand;
  cheaper: Brand;
  dearerStats: UnitPriceStats;
  cheaperStats: UnitPriceStats;
  ratio: number;
  unit: string;
  category: ProductCategory;
  sentence: string;
}

function priceGap(pair: ComparisonPair): Gap | null {
  const category = pair.categories[0];
  if (!category) return null;
  const sa = unitPriceStats(pair.a, category);
  const sb = unitPriceStats(pair.b, category);
  if (!sa || !sb) return null;

  const aDearer = midPerUnit(sa) >= midPerUnit(sb);
  const dearer = aDearer ? pair.a : pair.b;
  const cheaper = aDearer ? pair.b : pair.a;
  const dearerStats = aDearer ? sa : sb;
  const cheaperStats = aDearer ? sb : sa;
  const ratio = midPerUnit(dearerStats) / midPerUnit(cheaperStats);
  const unit = sa.unit;

  const sentence =
    ratio >= 1.1
      ? `${dearer.name} costs about ${ratio.toFixed(1)}× more per ${unit} than ${cheaper.name} across the ${CATEGORY_LABEL[category].toLowerCase()} we price.`
      : `The two sit within ${Math.max(1, Math.round((ratio - 1) * 100))}% of each other per ${unit} on the ${CATEGORY_LABEL[category].toLowerCase()} we price — this is not a price decision.`;

  return { dearer, cheaper, dearerStats, cheaperStats, ratio, unit, category, sentence };
}

/**
 * "Choose X if…" — uses the brand's published `bestFor` when we have one.
 * When we don't, the line is derived from tier and measured price position
 * only. We never attribute a capability we cannot point at.
 */
function chooseLine(brand: Brand, gap: Gap): string {
  if (brand.attributes?.bestFor) return brand.attributes.bestFor;
  const tierPrefix = brand.tier ? `${TIER_LABEL[brand.tier]} tier. ` : '';
  if (brand.slug === gap.cheaper.slug) {
    return `${tierPrefix}It is the cheaper of the two per ${gap.unit} on our data — pick it when upfront cost is what decides the build.`;
  }
  return `${tierPrefix}It is the dearer of the two per ${gap.unit} on our data, and nothing beyond that is published for it — weigh the premium against what your build actually needs.`;
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** vendorReach is brand-wide: how many Nigerian sellers in our catalogue carry it. */
function vendorReachLabel(brand: Brand): string {
  const n = vendorReach(brand);
  if (n === 0) return 'None in our catalogue yet';
  return `${n} seller${n === 1 ? '' : 's'} in our catalogue`;
}

function attrRows(brand: Brand): Array<[string, string]> {
  const a = brand.attributes;
  return [
    ['Phases', a?.phases ?? 'Not published'],
    ['Monitoring app', a?.monitoringApp ?? 'Not published'],
    ['Warranty', a?.warranty ?? 'Not published'],
    ['Service in Nigeria', a?.serviceNigeria ?? 'Not published'],
  ];
}

// ─────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair: slug } = await params;
  const pair = getComparison(slug);
  if (!pair) return { title: 'Comparison not found' };

  const { a, b } = pair;
  const gap = priceGap(pair);
  const cats = pair.categories.map((c) => CATEGORY_LABEL[c].toLowerCase()).join(' and ');
  const title = `${a.name} vs ${b.name} in Nigeria — ${PRICE_YEAR} Prices Compared`;
  const spread = gap
    ? ` ${gap.cheaper.name} ${perUnitRange(gap.cheaperStats)}, ${gap.dearer.name} ${perUnitRange(gap.dearerStats)}.`
    : '';
  const description = `${a.name} vs ${b.name} for ${cats} in Nigeria: real ${PRICES_LAST_UPDATED_LABEL} prices per ${gap?.unit ?? 'unit'}, sizes, warranty and service, side by side.${spread} We source either one for you.`;

  return {
    title,
    description,
    keywords: [
      `${a.name} vs ${b.name}`,
      `${a.name} vs ${b.name} Nigeria`,
      `${a.name} price Nigeria`,
      `${b.name} price Nigeria`,
      `${a.name} or ${b.name}`,
    ],
    openGraph: {
      title: `${a.name} vs ${b.name} in Nigeria — ${PRICE_YEAR} prices compared`,
      description,
      url: `${SITE_URL}/compare/${pair.slug}`,
      type: 'article',
    },
    alternates: { canonical: `${SITE_URL}/compare/${pair.slug}` },
  };
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default async function ComparePairPage({ params }: Props) {
  const { pair: slug } = await params;
  const pair = getComparison(slug);
  if (!pair) notFound();

  const { a, b } = pair;
  const gap = priceGap(pair);
  const catList = pair.categories.map((c) => CATEGORY_LABEL[c].toLowerCase()).join(' and ');

  const waText = `Hi SolarBuilders, I'm deciding between ${a.name} and ${b.name}. Which one should I use and what would it cost? ${SITE_URL}/compare/${pair.slug}`;

  // Cross-links: every other comparison either brand appears in.
  const related = [...comparisonsFor(a.slug), ...comparisonsFor(b.slug)]
    .filter((p) => p.slug !== pair.slug)
    .filter((p, i, arr) => arr.findIndex((x) => x.slug === p.slug) === i);

  const faqs = buildFaqs(pair, gap);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>

      {/* Hero */}
      <header className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <nav className="text-sm text-slate-500 mb-6">
            <Breadcrumbs trail={[{ href: '/compare', label: 'Compare' }, { label: `${pair.a.name} vs ${pair.b.name}` }]} className="mb-6" />
            <span className="mx-2">/</span>
            <span className="text-slate-600">{a.name} vs {b.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-6">
            <BrandMark brand={a} size={56} />
            <span className="font-heading font-extrabold text-slate-300 text-2xl">vs</span>
            <BrandMark brand={b} size={56} />
          </div>

          <h1 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl mb-4">
            {a.name} vs {b.name} in Nigeria
          </h1>

          <p className="text-slate-500 text-lg max-w-3xl">
            {a.tier ? `${a.name} sits in the ${TIER_LABEL[a.tier].toLowerCase()} bracket` : a.name}
            {b.tier ? ` and ${b.name} in the ${TIER_LABEL[b.tier].toLowerCase()} bracket` : ` and ${b.name}`}; both are
            priced here for {catList}. {gap?.sentence}
          </p>

          <p className="text-slate-500 text-sm mt-4">
            Prices last checked {PRICES_LAST_UPDATED_LABEL} at Nigerian retailers. We publish the price we can verify —
            and then source the equipment for you at it.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        {/* Verdict */}
        {gap && (
          <section className="mb-16">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-5">
                <Scale className="w-5 h-5 text-amber-600" />
                <h2 className="font-heading font-bold text-slate-900 text-xl">The short answer</h2>
              </div>
              <p className="text-slate-700 mb-6">{gap.sentence}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[a, b].map((brand) => (
                  <div key={brand.slug} className="bg-white rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <BrandMark brand={brand} size={32} />
                      <h3 className="font-heading font-bold text-slate-900">Choose {brand.name} if…</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{chooseLine(brand, gap)}</p>
                    <p className="text-slate-500 text-xs mt-3">
                      {(() => {
                        const s = unitPriceStats(brand, gap.category);
                        return s ? `${perUnitRange(s)} · ${s.models} model${s.models === 1 ? '' : 's'} tracked` : null;
                      })()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Per-category comparison */}
        {pair.categories.map((category) => {
          const sa = unitPriceStats(a, category);
          const sb = unitPriceStats(b, category);
          if (!sa || !sb) return null;
          const ranking = brandsInCategory(category);
          const maxLow = Math.max(...ranking.map((br) => unitPriceStats(br, category)!.lowPerUnit));

          return (
            <section key={category} className="mb-16">
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-6">
                {CATEGORY_LABEL[category]}: {a.name} vs {b.name}
              </h2>

              {/* Spec + price table */}
              <div className="rounded-2xl border border-slate-100 overflow-hidden mb-8">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left font-semibold text-slate-500 text-xs uppercase tracking-wide px-4 py-3 w-[28%]">
                          &nbsp;
                        </th>
                        {[a, b].map((brand) => (
                          <th key={brand.slug} className="text-left px-4 py-3 w-[36%]">
                            <span className="inline-flex items-center gap-2">
                              <BrandMark brand={brand} size={24} />
                              <span className="font-heading font-bold text-slate-900">{brand.name}</span>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Price per ' + sa.unit, perUnitRange(sa), perUnitRange(sb)],
                        ['Sizes we track', sizeRange(sa), sizeRange(sb)],
                        ['Models we price', String(sa.models), String(sb.models)],
                        ['Nigerian vendors we track', vendorReachLabel(a), vendorReachLabel(b)],
                        ...attrRows(a).map((row, i) => [row[0], row[1], attrRows(b)[i][1]] as [string, string, string]),
                        [
                          'Tier',
                          a.tier ? TIER_LABEL[a.tier] : 'Not published',
                          b.tier ? TIER_LABEL[b.tier] : 'Not published',
                        ],
                        ['Origin', a.origin, b.origin],
                      ].map(([label, va, vb]) => (
                        <tr key={label} className="border-b border-slate-100 last:border-0 align-top">
                          <th className="text-left font-medium text-slate-500 px-4 py-3">{label}</th>
                          <td className={`px-4 py-3 ${va === 'Not published' ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
                            {va}
                          </td>
                          <td className={`px-4 py-3 ${vb === 'Not published' ? 'text-slate-500' : 'text-slate-900 font-medium'}`}>
                            {vb}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Model lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {[a, b].map((brand) => (
                  <div key={brand.slug} className="rounded-2xl border border-slate-100 p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <BrandMark brand={brand} size={28} />
                      <h3 className="font-heading font-bold text-slate-900">
                        {brand.name} {CATEGORY_LABEL[category].toLowerCase()} we price
                      </h3>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {brand.products
                        .filter((p) => p.category === category)
                        .map((p) => (
                          <li key={`${brand.slug}-${p.model}`} className="py-3 first:pt-0 last:pb-0">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                              <span className="font-semibold text-slate-900 text-sm">{p.model}</span>
                              <span className="font-heading font-bold text-slate-900 text-sm">{priceRange(p)}</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">{p.spec}</p>
                            <p className="text-slate-500 text-xs mt-1">
                              Price seen {seenOnLabel(p.seenOn)}
                              {p.note ? ` · ${p.note}` : ''}
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Market position */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 md:p-6">
                <h3 className="font-heading font-bold text-slate-900 mb-1">
                  Where they sit in the Nigerian {CATEGORY_LABEL[category].toLowerCase()} market
                </h3>
                <p className="text-slate-500 text-sm mb-5">
                  Every brand we price in this category, cheapest entry ₦/{sa.unit} first.
                </p>
                <ol className="space-y-3">
                  {ranking.map((brand, i) => {
                    const s = unitPriceStats(brand, category)!;
                    const isSubject = brand.slug === a.slug || brand.slug === b.slug;
                    const width = Math.max(6, Math.round((s.lowPerUnit / maxLow) * 100));
                    return (
                      <li key={brand.slug}>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 mb-1">
                          <span className={`text-sm ${isSubject ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            {i + 1}. {brand.name}
                          </span>
                          <span className={`text-sm tabular-nums ${isSubject ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                            from {perUnit(s.lowPerUnit, s.unit)} / {s.unit}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isSubject ? 'bg-amber-400' : 'bg-slate-300'}`}
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>
          );
        })}

        {/* Watch outs */}
        {[a, b].some((brand) => brand.attributes?.watchOut) && (
          <section className="mb-16">
            <h2 className="font-heading font-extrabold text-slate-900 text-2xl mb-5">Watch out for</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[a, b].map((brand) =>
                brand.attributes?.watchOut ? (
                  <div key={brand.slug} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <h3 className="font-heading font-bold text-slate-900 text-sm">{brand.name}</h3>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{brand.attributes.watchOut}</p>
                  </div>
                ) : null,
              )}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mb-16">
          <div className="rounded-2xl bg-[#0A0F1E] p-8 md:p-10">
            <h2 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
              We source either one at the market price
            </h2>
            <p className="text-slate-400 max-w-2xl mb-6">
              You do not need to chase {a.name} or {b.name} around Alaba. Tell us what the house needs, we size it, buy
              the equipment on your behalf and hand over a working system. You pay the brand&apos;s market price — our
              margin comes from our distributor arrangements, not from a markup on your quote.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-colors"
              >
                <Zap className="w-4 h-4" /> Size my system &amp; get a price
              </Link>
              <WhatsAppLink
                text={waText}
                placement={`compare:${pair.slug}`}
                className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white rounded-full px-6 py-3 font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Ask us which one to use
              </WhatsAppLink>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl mb-6">
            {a.name} vs {b.name}: common questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-slate-100 p-5 md:p-6">
                <h3 className="font-heading font-bold text-slate-900 mb-2">{f.q}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-links */}
        <section>
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl mb-5">Keep comparing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/compare/${p.slug}`}
                className="group rounded-2xl border border-slate-100 hover:border-slate-300 p-4 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <BrandMark brand={p.a} size={28} />
                  <BrandMark brand={p.b} size={28} />
                  <span className="font-semibold text-slate-900 text-sm">
                    {p.a.name} vs {p.b.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 ml-auto flex-shrink-0" />
                </span>
                <span className="block text-slate-500 text-xs mt-2">
                  {p.categories.map((c) => CATEGORY_LABEL[c]).join(' · ')}
                </span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {[a, b].map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
              >
                All {brand.name} prices <ArrowRight className="w-4 h-4" />
              </Link>
            ))}
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              All comparisons <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      </main>
      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FAQ — every answer is generated from the catalogue data
// ─────────────────────────────────────────────────────────

function buildFaqs(pair: ComparisonPair, gap: Gap | null): Array<{ q: string; a: string }> {
  const { a, b } = pair;
  const out: Array<{ q: string; a: string }> = [];

  if (gap) {
    const catLabel = CATEGORY_LABEL[gap.category].toLowerCase();
    out.push({
      q: `Which is cheaper in Nigeria, ${a.name} or ${b.name}?`,
      a: `${gap.cheaper.name} is. On the ${catLabel} we price (checked ${PRICES_LAST_UPDATED_LABEL}), ${gap.cheaper.name} runs ${perUnitRange(gap.cheaperStats)} and ${gap.dearer.name} runs ${perUnitRange(gap.dearerStats)}. ${gap.sentence}`,
    });

    const dearerBest = gap.dearer.attributes?.bestFor;
    const cheaperBest = gap.cheaper.attributes?.bestFor;
    out.push({
      q: `Is ${gap.dearer.name} worth the extra over ${gap.cheaper.name} in Nigeria?`,
      a:
        `${gap.sentence}` +
        (dearerBest ? ` ${gap.dearer.name} is documented as the pick for ${lowerFirst(dearerBest)}.` : '') +
        (cheaperBest ? ` ${gap.cheaper.name} is documented as the pick for ${lowerFirst(cheaperBest)}.` : '') +
        ` Decide on those lines rather than on the brand name — and remember the price you pay depends heavily on where the unit is bought.`,
    });

    out.push({
      q: `What sizes of ${catLabel} do ${a.name} and ${b.name} offer in Nigeria?`,
      a: `We track ${gap.cheaperStats.models} priced ${gap.cheaper.name} model${gap.cheaperStats.models === 1 ? '' : 's'} from ${sizeRange(gap.cheaperStats)}, and ${gap.dearerStats.models} priced ${gap.dearer.name} model${gap.dearerStats.models === 1 ? '' : 's'} from ${sizeRange(gap.dearerStats)}. Sizes outside those ranges exist but were not publicly priced in Nigeria when we last checked, in ${PRICES_LAST_UPDATED_LABEL}.`,
    });
  }

  const warrantyA = a.attributes?.warranty;
  const warrantyB = b.attributes?.warranty;
  if (warrantyA || warrantyB) {
    out.push({
      q: `What warranty do ${a.name} and ${b.name} come with in Nigeria?`,
      a: `${a.name}: ${warrantyA ?? 'no warranty term published for the Nigerian market that we could verify'}. ${b.name}: ${warrantyB ?? 'no warranty term published for the Nigerian market that we could verify'}. Warranty is only worth what the seller will honour, which is why we buy through distributors who register the unit.`,
    });
  }

  out.push({
    q: `Where do I buy ${a.name} or ${b.name} in Nigeria?`,
    a: `Through us. SolarBuilders.ng sources either brand on your behalf at its Nigerian market price — you tell us the size, we buy it, and it arrives as part of a working system. Our margin comes from wholesale and distributor arrangements, not from a markup on your quote. Prices on this page were last verified in ${PRICES_LAST_UPDATED_LABEL}.`,
  });

  return out.slice(0, 4);
}
