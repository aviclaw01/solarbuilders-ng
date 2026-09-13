import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { getBrand, vendors } from '@/lib/brands';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar in Lagos — 2026 Prices, Brands & Quotes | SolarBuilders.ng',
  description: 'Real 2026 solar prices for Lagos — inverters, lithium batteries and panels by brand — plus an itemised quote calculator and a team that gets your system installed.',
  keywords: ['solar installer Lagos', 'solar company Lagos Nigeria', 'solar installation Lagos', 'best solar Lagos 2026', 'solar panels Lagos price'],
  openGraph: {
    title: 'Solar in Lagos — 2026 Prices, Brands & Quotes',
    description: 'Real 2026 solar prices and itemised quotes for Lagos State.',
    url: 'https://solarbuildersng.com/solar/lagos',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/solar/lagos' },
};

export default function SolarLagosPage() {
  const localVendors = vendors().filter(v => v.origin.includes('Lagos'));
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
            <span className="text-[#0A0F1E]">Lagos</span>
          </div>
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar in Lagos — 2026 Prices, Brands & Quotes
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl leading-relaxed">
            Lagos is Nigeria&apos;s biggest solar market — and its most competitive, which is why prices vary so much from Alaba to Lekki. Below are real 2026 prices by brand and the Lagos vendors we source from. Size your system, get an itemised quote, and we handle the buying and installation anywhere from Ikeja to Ajah.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Brands & vendors */}
        <div className="mb-16">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">Solar equipment prices for Lagos</h2>
          <p className="text-slate-500 mb-6 max-w-2xl">Real 2026 listings by brand, and the vendors that serve Lagos. Size your system, get an itemised quote, and we handle sourcing and installation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...localVendors, ...featuredBrands].slice(0, 6).map(b => <BrandCard key={b!.slug} brand={b!} />)}
          </div>
          <div className="mt-6">
            <Link href="/brands" className="text-amber-600 font-semibold text-sm hover:underline underline-offset-4">All brands &amp; vendors →</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl mb-8">Frequently Asked Questions — Solar in Lagos</h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does solar installation cost in Lagos?',
                a: 'In 2026, solar installation in Lagos ranges from about ₦1.4M for a 5kWh lithium starter system (lights, fans, TV, fridge — no AC) to ₦6M+ for a 10kVA home running several ACs. The most common package — a 5kVA inverter with 10kWh lithium and 6–8 panels — costs ₦3.2M–₦4.8M installed.',
              },
              {
                q: 'How long does solar installation take in Lagos?',
                a: 'Most residential solar installations in Lagos take 1–2 days. The actual mounting and wiring typically takes one day; testing and handover takes another half day. Complex commercial systems or large arrays may take 3–5 days.',
              },
              {
                q: 'Is solar worth it in Lagos given the cost of electricity?',
                a: 'Yes. A Lagos household running a generator 4–6 hours a day spends ₦100,000–₦250,000 per month on fuel and servicing. A ₦3.5M–₦4M solar system pays for itself in roughly 2–3 years at those rates, and lithium batteries last 10+ years — after that the power is essentially free.',
              },
              {
                q: 'What warranty should I expect from a Lagos solar installer?',
                a: 'Reputable Lagos installers should offer at minimum: 1-2 year workmanship warranty, 5-year product warranty on inverters, 10-year product warranty on solar panels (with 25-year performance guarantee), and 1-year warranty on batteries.',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-[#E2E8F0] rounded-2xl p-6">
                <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-3">{faq.q}</h3>
                <p className="text-[#64748B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#FEF3C7] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Calculate your Lagos system</h3>
            <p className="text-[#64748B] mb-4">Know exactly what you need before contacting any installer.</p>
            <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Free Calculator →
            </Link>
          </div>
          <div className="bg-[#0A0F1E] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-white text-xl mb-2">Installer or vendor in Lagos?</h3>
            <p className="text-[#94A3B8] mb-4">Work with us on customer builds — we bring the quote, the equipment and the client.</p>
            <Link href="/for-builders" className="inline-flex items-center border-2 border-white text-white px-6 py-3 rounded-full font-heading font-semibold text-sm hover:bg-white hover:text-[#0A0F1E] transition-colors">
              Work with us →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
