import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import {
  BRANDS,
  CATEGORY_LABEL,
  TIER_LABEL,
  getBrand,
  vendorsFor,
  type Product,
  type ProductCategory,
} from '@/lib/brands';
import { formatNaira } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import BrandMark from '@/components/ui/BrandMark';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { CheckCircle2, MessageCircle, Zap, Info, MapPin } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BRANDS.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return { title: 'Brand not found' };
  const what = brand.kind === 'manufacturer' ? `${brand.name} prices in Nigeria` : `${brand.name} — solar vendor in ${brand.origin}`;
  return {
    title: `${what} (${PRICES_LAST_UPDATED_LABEL}) | SolarBuilders.ng`,
    description: `${brand.tagline}. ${brand.products.length ? `${brand.products.length} priced models with sources.` : ''} ${brand.description.slice(0, 120)}…`,
    openGraph: { title: what, description: brand.tagline, url: `${SITE_URL}/brands/${brand.slug}`, type: 'website' },
    alternates: { canonical: `${SITE_URL}/brands/${brand.slug}` },
  };
}

function priceCell(p: Product) {
  return p.priceLow === p.priceHigh
    ? formatNaira(p.priceLow)
    : `${formatNaira(p.priceLow)} – ${formatNaira(p.priceHigh)}`;
}

function unitPrice(p: Product): string | null {
  if (p.category === 'inverter' && p.kva) return `₦${Math.round(p.priceLow / p.kva / 1000)}k–${Math.round(p.priceHigh / p.kva / 1000)}k / kVA`;
  if (p.category === 'battery' && p.kwh) return `₦${Math.round(p.priceLow / p.kwh / 1000)}k–${Math.round(p.priceHigh / p.kwh / 1000)}k / kWh`;
  if (p.category === 'panel' && p.watts) return `₦${Math.round(p.priceLow / p.watts)}–${Math.round(p.priceHigh / p.watts)} / W`;
  return null;
}

export default async function BrandPage({ params }: Props) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const isMaker = brand.kind === 'manufacturer';
  const stockists = isMaker ? vendorsFor(brand) : [];
  const carried = !isMaker ? (brand.carries ?? []).map(getBrand).filter(Boolean) : [];
  const byCategory = (['inverter', 'battery', 'panel', 'controller', 'package'] as ProductCategory[])
    .map((c) => ({ c, items: brand.products.filter((p) => p.category === c) }))
    .filter((g) => g.items.length > 0);

  const waText = `Hi SolarBuilders, I'm interested in ${brand.name}${isMaker ? ' equipment' : ''}. Can you help me get a system built with it? ${SITE_URL}/brands/${brand.slug}`;

  // Brand + one Product/Offer per priced model. The Offer price is what puts a
  // \u20a6 figure straight into the Google result for "<brand> price nigeria".
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Brand',
        '@id': `${SITE_URL}/brands/${brand.slug}#brand`,
        name: brand.name,
        description: brand.tagline,
      },
      ...brand.products.map((p) => ({
        '@type': 'Product',
        name: `${brand.name} ${p.model}`,
        description: p.spec,
        brand: { '@id': `${SITE_URL}/brands/${brand.slug}#brand` },
        category: CATEGORY_LABEL[p.category],
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'NGN',
          lowPrice: p.priceLow,
          highPrice: p.priceHigh,
          offerCount: p.seenAt.length,
          availability: 'https://schema.org/InStock',
          url: `${SITE_URL}/brands/${brand.slug}`,
          seller: { '@type': 'Organization', name: 'SolarBuilders.ng' },
        },
      })),
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main>

      <div className="bg-white border-b border-slate-100 px-6 py-10 md:py-14">
        <div className="max-w-6xl mx-auto">
          <Breadcrumbs
            trail={[{ href: '/brands', label: 'Brands & prices' }, { label: brand.name }]}
            className="mb-6"
          />
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-sky-50 text-sky-700 border-sky-200">
              {isMaker ? 'Manufacturer' : 'Nigerian vendor'}
            </span>
            {isMaker && brand.tier && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                {TIER_LABEL[brand.tier]} tier
              </span>
            )}
            <span className="text-slate-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" /> {brand.origin}</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <BrandMark brand={brand} size={56} />
            <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl">{brand.name}</h1>
          </div>
          <p className="text-slate-600 text-lg max-w-2xl mb-6">{brand.tagline}</p>
          <div className="flex flex-wrap gap-3">
            <WhatsAppLink text={waText} placement={`brand:${brand.slug}`} className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-full px-6 py-3 font-semibold text-sm transition-colors">
              <MessageCircle className="w-4 h-4" /> Get a system built with {isMaker ? brand.name : 'us'}
            </WhatsAppLink>
            <Link href="/calculator" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors">
              <Zap className="w-4 h-4" /> Size my system
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="font-heading font-bold text-slate-900 text-xl mb-3">About {brand.name}</h2>
            <p className="text-slate-600 leading-relaxed">{brand.description}</p>
          </section>

          {byCategory.map(({ c, items }) => (
            <section key={c}>
              <h2 className="font-heading font-bold text-slate-900 text-xl mb-1">{CATEGORY_LABEL[c]}</h2>
              <p className="text-slate-400 text-xs mb-4">Prices seen at Nigerian vendors, {PRICES_LAST_UPDATED_LABEL}. Tap a source to verify.</p>
              <div className="rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm table-fixed">
                  <colgroup><col className="w-[46%]" /><col className="w-[36%]" /><col className="w-[18%]" /></colgroup>
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                      <th className="text-left font-semibold p-3">Model</th>
                      <th className="text-right font-semibold p-3">Price (₦)</th>
                      <th className="text-right font-semibold p-3">Checked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((p, i) => {
                      const unit = unitPrice(p);
                      return (
                        <tr key={i} className="border-t border-slate-100 align-top">
                          <td className="p-3">
                            <p className="font-semibold text-slate-900">{p.model}</p>
                            <p className="text-xs text-slate-500">{p.spec}</p>
                            {p.note && <p className="text-[11px] text-amber-700 mt-0.5">{p.note}</p>}
                          </td>
                          <td className="p-3 text-right">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm">{priceCell(p)}</p>
                            {unit && <p className="text-[11px] text-slate-400">{unit}</p>}
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              across {p.seenAt.length} {p.seenAt.length === 1 ? 'seller' : 'sellers'}
                            </p>
                          </td>
                          <td className="p-3 text-right">
                            <span className="inline-flex items-center gap-1 text-xs text-slate-400" title={`Price checked ${p.seenOn}`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {p.seenOn.slice(5).replace('-', '/')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          {brand.products.length === 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
              {brand.pricesPublic
                ? `${brand.name} doesn't list its own products here yet — see the brands it stocks on the right, or ask us.`
                : `${brand.name} sells on quote only. Send us your system size and we'll get a price from them for you.`}
            </section>
          )}

          <div className="flex gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-4">
            <Info className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <p>
              Every price here is a real Nigerian listing we checked on the date shown, and ranges span the sellers we
              compared. Prices move, so we re-confirm before you pay anything. We buy on your behalf at the market price
              and handle the warranty paperwork — you don&apos;t have to work out who is cheapest.
            </p>
          </div>
        </div>

        <aside className="space-y-8">
          <section className="bg-slate-50 rounded-2xl border border-slate-100 p-5">
            <h3 className="font-heading font-bold text-slate-900 text-sm uppercase tracking-widest mb-3">
              How you buy this
            </h3>
            <ol className="space-y-3 text-sm text-slate-600">
              {[
                'Size your system in the calculator and get an itemised quote with a code.',
                'Send us the code. We confirm today\u2019s price and stock before anything is paid.',
                `We order the ${isMaker ? brand.name : ''} equipment at the market price and arrange delivery.`,
                'A vetted installer fits and commissions it, with the warranty paperwork in your name.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-slate-400 mt-4">
              We compared {stockists.length > 0 ? `${stockists.length} Nigerian sellers` : 'the Nigerian market'} for this
              brand. You pay the market price; our margin comes from the trade terms we hold, not from a mark-up on you.
            </p>
          </section>

          {carried.length > 0 && (
            <section>
              <h3 className="font-heading font-bold text-slate-900 text-sm uppercase tracking-widest mb-3">Brands stocked</h3>
              <div className="flex flex-wrap gap-2">
                {carried.map((m) => (
                  <Link key={m!.slug} href={`/brands/${m!.slug}`} className="text-sm bg-white border border-slate-200 hover:border-amber-400 rounded-full px-3 py-1.5 text-slate-700">
                    {m!.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="bg-slate-900 rounded-2xl p-5 text-center">
            <p className="font-heading font-bold text-white mb-1">Want this in your build?</p>
            <p className="text-slate-300 text-sm mb-4">Size your system, get a quote code, and we source it for you.</p>
            <Link href="/calculator" className="inline-block bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-5 py-2.5 font-semibold text-sm">
              Get my quote →
            </Link>
          </section>
        </aside>
      </div>
      </main>
      <Footer />
    </div>
  );
}
