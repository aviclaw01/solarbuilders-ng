import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { manufacturers, vendors, type ProductCategory } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { Zap, MessageCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar Brands & Prices in Nigeria — Felicity, Deye, Growatt, Jinko',
  description:
    'Real Nigerian prices for solar inverters, lithium batteries and panels by brand — Felicity, Deye, Growatt, Luxpower, Victron, Jinko, Longi and more — plus the Lagos and Abuja vendors that stock them.',
  keywords: ['Felicity inverter price Nigeria', 'Deye inverter price Nigeria', 'lithium battery price Nigeria', 'solar panel price Nigeria', 'Growatt price Nigeria'],
  openGraph: {
    title: 'Solar Brands & Prices in Nigeria | SolarBuilders.ng',
    description: 'Inverter, battery and panel prices by brand, with the vendors that stock them.',
    url: 'https://solarbuildersng.com/brands',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/brands' },
};

const SECTIONS: { key: ProductCategory; title: string; blurb: string }[] = [
  { key: 'inverter', title: 'Inverter brands', blurb: 'Hybrid inverters from ₦63k to ₦400k per kVA. Budget = Felicity/Sako, mid = Growatt/Luxpower/Solis, premium = Deye/Victron.' },
  { key: 'battery', title: 'Lithium battery brands', blurb: 'LiFePO4 packs from ₦129k to ₦330k per kWh. Most homes install 5–10kWh.' },
  { key: 'panel', title: 'Solar panel brands', blurb: 'Tier-1 550–700W panels. Alaba wholesale ₦170–200/W; showrooms ₦225–300/W.' },
];

export default function BrandsPage() {
  const makers = manufacturers();
  const sellers = vendors();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
        <div className="max-w-6xl mx-auto">
          <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Brands &amp; prices</span>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mt-3 mb-4">
            What solar equipment actually costs in Nigeria
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Every price here is a real Nigerian listing, checked on the date shown ({PRICES_LAST_UPDATED_LABEL}). Pick a
            brand, see what each model actually costs, then let us buy it at that price and get it installed.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/calculator" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors">
              <Zap className="w-4 h-4" fill="currentColor" /> Size my system first
            </Link>
            <WhatsAppLink text={'Hi SolarBuilders, I was looking at the brands page and want help choosing equipment.'} placement="brands_index" className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors">
              <MessageCircle className="w-4 h-4" /> Ask us which brand
            </WhatsAppLink>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">
        {SECTIONS.map((s) => {
          const list = makers.filter((b) => b.categories[0] === s.key);
          if (list.length === 0) return null;
          return (
            <section key={s.key} id={s.key}>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">{s.title}</h2>
              <p className="text-slate-500 mb-6 max-w-2xl">{s.blurb}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {list.map((b) => <BrandCard key={b.slug} brand={b} />)}
              </div>
            </section>
          );
        })}

        <section id="vendors">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">The market we track</h2>
          <p className="text-slate-500 mb-6 max-w-2xl">
            These are the Nigerian distributors and retailers whose prices we monitor — from Alaba wholesalers to Victoria
            Island showrooms. The same inverter can differ by more than double between them. We watch all of it and buy on
            your behalf at the market price, so you don&apos;t have to ring round.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellers.map((b) => <BrandCard key={b.slug} brand={b} />)}
          </div>
        </section>

        <section className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">We do the buying</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-6">
            Size your system, get an itemised quote with a code, and send it to us. We confirm today&apos;s price, order the
            equipment at the market rate, and put a vetted installer on the job. You pay what the brand charges — our
            margin comes from our trade terms, not from a mark-up on you.
          </p>
          <Link href="/calculator" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-8 py-4 font-heading font-bold transition-colors">
            Get my itemised quote →
          </Link>
        </section>
      </div>
      <Footer />
    </div>
  );
}
