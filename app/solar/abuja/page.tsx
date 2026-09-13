import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { getBrand, vendors } from '@/lib/brands';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar in Abuja — 2026 Prices, Brands & Quotes | SolarBuilders.ng',
  description: 'Real 2026 solar prices for Abuja — inverters, lithium batteries and panels by brand — plus an itemised quote calculator and a team that gets your system installed.',
  keywords: ['solar installer Abuja', 'solar company Abuja Nigeria', 'solar installation FCT', 'best solar Abuja 2026', 'solar panels Abuja price'],
  openGraph: {
    title: 'Solar in Abuja — 2026 Prices, Brands & Quotes',
    description: 'Real 2026 solar prices and itemised quotes for Abuja, Nigeria.',
    url: 'https://solarbuildersng.com/solar/abuja',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/solar/abuja' },
};

export default function SolarAbujaPage() {
  const localVendors = vendors().filter(v => v.origin.includes('Abuja'));
  const featuredBrands = ['felicity', 'deye', 'growatt', 'jinko'].map(getBrand).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-[#E2E8F0] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-[#0A0F1E]">Brands &amp; Prices</Link>
            <span>/</span>
            <span className="text-[#0A0F1E]">Abuja</span>
          </div>
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar in Abuja — 2026 Prices, Brands & Quotes
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl leading-relaxed">
            Abuja gets 6 to 7 peak sun hours a day — among the best in Nigeria — but equipment is trucked in from Lagos, so prices run a little higher. Below are real 2026 prices by brand and the vendors that serve Abuja. Size your system, get an itemised quote, and we handle sourcing and installation across Wuse, Maitama, Gwarinpa and Kubwa.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brands & vendors */}
        <div className="mb-16">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">Solar equipment prices for Abuja</h2>
          <p className="text-slate-500 mb-6 max-w-2xl">Real 2026 listings by brand, and the vendors that serve Abuja. Size your system, get an itemised quote, and we handle sourcing and installation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...localVendors, ...featuredBrands].slice(0, 6).map(b => <BrandCard key={b!.slug} brand={b!} />)}
          </div>
          <div className="mt-6">
            <Link href="/brands" className="text-amber-600 font-semibold text-sm hover:underline underline-offset-4">All brands &amp; vendors →</Link>
          </div>
        </div>

        <div className="max-w-3xl mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl mb-8">FAQ — Solar in Abuja</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is Abuja good for solar energy?',
                a: 'Yes — Abuja is excellent for solar. With 6–7 peak sun hours daily and relatively lower humidity than coastal cities, solar panels in Abuja perform very well. The FCT is one of the most solar-optimal locations in Nigeria.',
              },
              {
                q: 'Should I get a hybrid or off-grid system in Abuja?',
                a: 'For most Abuja residents, a hybrid system makes more sense. Abuja has better NEPA supply than most Nigerian cities, so a hybrid system can use grid power when available and solar the rest of the time — giving you smaller (cheaper) battery requirements.',
              },
              {
                q: 'How much does solar cost in Abuja?',
                a: 'Abuja prices run slightly above Lagos because equipment is trucked in. In 2026 a 3.5kVA / 5kWh lithium system typically costs ₦1.9M–₦2.7M installed, and a 5kVA / 10kWh system with AC support ₦3.3M–₦5M.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-[#E2E8F0] rounded-2xl p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">{faq.q}</h3>
                <p className="text-[#64748B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FEF3C7] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Calculate your Abuja system</h3>
            <p className="text-[#64748B] mb-4">Know exactly what you need before getting quotes.</p>
            <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Free Calculator →
            </Link>
          </div>
          <div className="bg-[#0A0F1E] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-white text-xl mb-2">Installer in Abuja?</h3>
            <p className="text-[#94A3B8] mb-4">List your business free and reach more customers.</p>
            <Link href="/for-builders" className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-white hover:text-[#0A0F1E] transition-colors">
              List Free →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
