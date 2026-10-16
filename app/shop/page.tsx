import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ArrowRight } from 'lucide-react';
import { catalogue, midPrice, productSize } from '@/lib/cart';
import type { ProductCategory } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SHOP_FAQS, faqPageJsonLd } from '@/lib/faq';
import ShopClient, { type ShopItem, type SizeUnit } from './ShopClient';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Solar Equipment Prices in Nigeria — Inverters, Batteries, Panels',
  description: `Real Nigerian prices for solar inverters, lithium batteries, panels and complete packages, checked ${PRICES_LAST_UPDATED_LABEL}. Filter by brand, size and budget, then let us source it — you pay nothing until we confirm.`,
  keywords: [
    'solar inverter price Nigeria',
    'lithium battery price Nigeria',
    'solar panel price Nigeria',
    'solar equipment prices Nigeria 2026',
    'buy solar inverter Lagos',
  ],
  openGraph: {
    title: 'Solar Equipment Prices in Nigeria | SolarBuilders.ng',
    description: `Real Nigerian listings for inverters, batteries and panels, checked ${PRICES_LAST_UPDATED_LABEL}. We source it for you — nothing is paid until we confirm.`,
    url: 'https://solarbuildersng.com/shop',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/shop' },
};

/** The unit each category is measured in. Others have no single meaningful unit. */
const CATEGORY_UNIT: Partial<Record<ProductCategory, SizeUnit>> = {
  inverter: 'kVA',
  battery: 'kWh',
  panel: 'W',
};

/**
 * Flatten the catalogue into rows that are safe to send to the browser.
 *
 * Brand records carry internal procurement contacts (phones, WhatsApp,
 * website) and every product carries the vendor it was seen at. None of that
 * goes to the client: we are the buyer's agent, and the seller list is ours.
 */
function shopItems(): ShopItem[] {
  return catalogue().map(({ id, brand, product }) => {
    const size = productSize(product);
    const unit = CATEGORY_UNIT[product.category];
    const mid = midPrice(product);
    return {
      id,
      brandSlug: brand.slug,
      brandName: brand.name,
      brandLogo: brand.logo,
      brandTier: brand.tier,
      category: product.category,
      model: product.model,
      spec: product.spec,
      image: product.image,
      size,
      unit,
      priceLow: product.priceLow,
      priceHigh: product.priceHigh,
      priceMid: mid,
      unitPrice: size && unit ? Math.round(mid / size) : undefined,
      seenOn: product.seenOn,
      note: product.note,
      caveat: product.excludeFromAutoMatch,
    };
  });
}

export default function ShopPage() {
  const items = shopItems();

    // ItemList of the catalogue. Individual Product/Offer markup lives on the
  // brand pages (one canonical place per product); here we describe the list.
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Solar equipment prices in Nigeria',
    numberOfItems: items.length,
    itemListElement: items.slice(0, 50).map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${it.brandName} ${it.model}`,
      url: `${SITE_URL}/brands/${it.brandSlug}`,
    })),
  };

return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(SHOP_FAQS)) }} />
      <Navbar />
      <main>

      <div className="px-4 sm:px-6 pt-12 pb-8 md:pt-16">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-heading font-extrabold text-ink text-title">Shop solar equipment</h1>
            <p className="text-muted mt-2">
              {items.length} products · prices checked {PRICES_LAST_UPDATED_LABEL}
            </p>
          </div>
          <Link href="/find" className="text-sm font-semibold text-ink hover:text-sun-ink inline-flex items-center gap-1">
            Not sure what you need? Find my kit <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <ShopClient items={items} />
      </div>

      {/* Buying questions — the same items render on /faq, from lib/faq.ts */}
      <section className="border-t border-slate-100 bg-[#FAFAF7] px-6 py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl mb-2">
            Before you send an order request
          </h2>
          <p className="text-slate-500 mb-6">
            What these prices are, what they are not, and what happens after you tick something.
          </p>
          <div className="space-y-3">
            {SHOP_FAQS.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-heading font-bold text-[#0A0F1E] text-base md:text-lg">
                  <h3 className="font-heading font-bold">{f.q}</h3>
                  <span
                    className="text-amber-600 text-2xl leading-none transition-transform group-open:rotate-45 flex-shrink-0"
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>
                <p className="text-slate-600 leading-relaxed mt-4">{f.a}</p>
                {f.link && (
                  <Link
                    href={f.link.href}
                    className="inline-flex items-center gap-1 text-amber-700 text-sm font-semibold mt-3 hover:underline underline-offset-4"
                  >
                    {f.link.label} <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </details>
            ))}
          </div>
          <Link
            href="/faq"
            className="inline-flex items-center gap-1 text-[#0A0F1E] font-semibold text-sm mt-6 hover:underline underline-offset-4 min-h-[44px]"
          >
            All solar FAQs — costs, sizing, installation <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      </main>
      <Footer />
      {/* room for the phone-only order bar in ShopClient, so it never covers the footer */}
      <div className="md:hidden h-20" aria-hidden="true" />
    </div>
  );
}
