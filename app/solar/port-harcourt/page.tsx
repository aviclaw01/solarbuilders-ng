import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { getBrand, vendors } from '@/lib/brands';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar in Port Harcourt — 2026 Prices, Brands & Quotes',
  description: 'Real 2026 solar prices for Port Harcourt — inverters, lithium batteries and panels by brand — plus an itemised quote calculator and a team that gets your system installed.',
  keywords: ['solar installer Port Harcourt', 'solar company Port Harcourt Nigeria', 'solar installation Rivers State', 'solar PH Nigeria', 'solar panels Port Harcourt price'],
  openGraph: {
    title: 'Solar in Port Harcourt — 2026 Prices, Brands & Quotes',
    description: 'Real 2026 solar prices and itemised quotes for Port Harcourt, Nigeria.',
    url: 'https://solarbuildersng.com/solar/port-harcourt',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/solar/port-harcourt' },
};

export default function SolarPortHarcourtPage() {
  const localVendors = vendors().filter(v => v.origin.includes('Port Harcourt'));
  const featuredBrands = ['felicity', 'deye', 'growatt', 'jinko'].map(getBrand).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

      <div className="bg-white border-b border-[#E2E8F0] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-[#0A0F1E]">Brands &amp; Prices</Link>
            <span>/</span>
            <span className="text-[#0A0F1E]">Port Harcourt</span>
          </div>
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar in Port Harcourt — 2026 Prices, Brands & Quotes
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl leading-relaxed">
            Port Harcourt&apos;s diesel costs and unreliable grid make it one of the most cost-effective cities in Nigeria to go solar. Below are real 2026 prices by brand and the vendors that deliver to PH. Size your system, get an itemised quote, and we handle sourcing and installation across GRA, Trans-Amadi, Rumuola and beyond.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brands & vendors */}
        <div className="mb-16">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">Solar equipment prices for Port Harcourt</h2>
          <p className="text-slate-500 mb-6 max-w-2xl">Real 2026 listings by brand, and the vendors that serve Port Harcourt. Size your system, get an itemised quote, and we handle sourcing and installation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...localVendors, ...featuredBrands].slice(0, 6).map(b => <BrandCard key={b!.slug} brand={b!} />)}
          </div>
          <div className="mt-6">
            <Link href="/brands" className="text-amber-600 font-semibold text-sm hover:underline underline-offset-4">All brands &amp; vendors →</Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FEF3C7] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Calculate your PH system</h3>
            <p className="text-[#64748B] mb-4">Know exactly what you need before getting quotes.</p>
            <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Free Calculator →
            </Link>
          </div>
          <div className="bg-[#0A0F1E] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-white text-xl mb-2">Installer or vendor in Port Harcourt?</h3>
            <p className="text-[#94A3B8] mb-4">Work with us on customer builds — we bring the quote, the equipment and the client.</p>
            <Link href="/for-builders" className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-white hover:text-[#0A0F1E] transition-colors">
              Work with us →
            </Link>
          </div>
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
