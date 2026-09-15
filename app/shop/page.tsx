import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { Calculator, MessageCircle, ShieldCheck } from 'lucide-react';
import { catalogue, midPrice, productSize } from '@/lib/cart';
import type { ProductCategory } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import ShopClient, { type ShopItem, type SizeUnit } from './ShopClient';

export const metadata: Metadata = {
  title: 'Solar Equipment Prices in Nigeria — Inverters, Batteries, Panels',
  description: `Real Nigerian prices for solar inverters, lithium batteries, panels and complete packages, checked ${PRICES_LAST_UPDATED_LABEL}. Filter by brand, size and budget, then let us source it at the market price — you pay nothing until we confirm.`,
  keywords: [
    'solar inverter price Nigeria',
    'lithium battery price Nigeria',
    'solar panel price Nigeria',
    'solar equipment prices Nigeria 2026',
    'buy solar inverter Lagos',
  ],
  openGraph: {
    title: 'Solar Equipment Prices in Nigeria | SolarBuilders.ng',
    description: `Real Nigerian listings for inverters, batteries and panels, checked ${PRICES_LAST_UPDATED_LABEL}. We source at the market price — nothing is paid until we confirm.`,
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Equipment &amp; prices</span>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mt-3 mb-4">
            Solar equipment prices in Nigeria
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Every one of these {items.length} listings is a real Nigerian price, checked in{' '}
            {PRICES_LAST_UPDATED_LABEL} — inverters, lithium batteries, panels, charge controllers and complete
            packages. Add what you want to an order request and we source it at the brand&apos;s market price. We take
            no card payment: we confirm today&apos;s price with the distributor and come back to you with a final
            figure before you pay anyone.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors"
            >
              <Calculator className="w-4 h-4" /> Not sure what you need? Size it first
            </Link>
            <WhatsAppLink
              text="Hi SolarBuilders, I was looking at your equipment prices and want help choosing."
              placement="shop_header"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Ask us what fits
            </WhatsAppLink>
          </div>

          <p className="flex items-start gap-2 text-xs text-slate-400 mt-6 max-w-2xl">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-px" />
            <span>
              Prices are what sellers were asking when we checked, not a quote. Where a price shows a range, that is
              the spread we saw across sellers for the same model. We don&apos;t hold stock, so we won&apos;t pretend
              to know what is on the shelf today — we check before we confirm.
            </span>
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <ShopClient items={items} />
      </div>

      <Footer />
    </div>
  );
}
