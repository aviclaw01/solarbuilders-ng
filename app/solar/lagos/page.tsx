import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar Installers in Lagos — Nexprove Verified | SolarBuilders.ng',
  description: 'Find trusted solar installation companies in Lagos, Nigeria. Browse Nexprove Verified builders across Lagos Island, Ikeja, Lekki, Victoria Island and all of Lagos State.',
  keywords: ['solar installer Lagos', 'solar company Lagos Nigeria', 'solar installation Lagos', 'best solar Lagos 2026', 'solar panels Lagos price'],
  openGraph: {
    title: 'Solar Installers in Lagos — Nexprove Verified',
    description: 'Find trusted solar installation companies across Lagos State.',
    url: 'https://solarbuilders.ng/solar/lagos',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/solar/lagos' },
};

export default function SolarLagosPage() {
  const lagosBuilders = BUILDERS.filter(b => b.state === 'Lagos');

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-white border-b border-[#E2E8F0] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#64748B] mb-6">
            <Link href="/" className="hover:text-[#0A0F1E]">Home</Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-[#0A0F1E]">Marketplace</Link>
            <span>/</span>
            <span className="text-[#0A0F1E]">Lagos</span>
          </div>
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar Installers in Lagos — Nexprove Verified
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl leading-relaxed">
            Lagos is Nigeria&apos;s biggest solar market — and also its most competitive. With high electricity costs, erratic NEPA supply, and expensive generator fuel, Lagosians are going solar faster than anywhere else in the country. We&apos;ve verified the best installers across Lagos Island, Mainland, Lekki, Ikeja, and beyond, so you don&apos;t have to gamble.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {lagosBuilders.map(builder => {
            const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in solar installation in Lagos.')}`;
            return (
              <div key={builder.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#F59E0B] hover:shadow-lg transition-all duration-200">
                <div className="aspect-video overflow-hidden bg-[#F8FAFC] relative">
                  <Image src={builder.coverImage} alt={`${builder.name} Lagos`} width={400} height={225} className="w-full h-full object-cover" />
                  {builder.verified && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1 bg-[#059669] text-white text-xs font-heading font-semibold px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />Verified
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-heading font-bold text-[#0A0F1E] text-lg mb-1">{builder.name}</h2>
                  <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
                    <MapPin className="w-3.5 h-3.5" /><span>{builder.location}, Lagos</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(builder.rating) ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                      ))}
                    </div>
                    <span className="font-semibold text-sm">{builder.rating}</span>
                    <span className="text-[#94A3B8] text-sm">({builder.reviewCount})</span>
                  </div>
                  <p className="text-[#F59E0B] font-heading font-bold text-base mb-4">From {formatNaira(builder.startingPrice)}</p>
                  <div className="flex gap-2">
                    <Link href={`/builders/${builder.slug}`} className="flex-1 border-2 border-[#0A0F1E] text-[#0A0F1E] text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#0A0F1E] hover:text-white transition-colors">View Profile</Link>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] text-white text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#22c55e] transition-colors">💬 WhatsApp</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl mb-8">Frequently Asked Questions — Solar in Lagos</h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does solar installation cost in Lagos?',
                a: 'Solar installation in Lagos ranges from ₦350,000 for a basic 2kVA system to ₦1,500,000+ for a full 10kVA home solution. A 3kVA system suitable for an average Lagos home (fridge, fans, lights — no AC) typically costs ₦480,000–₦650,000 installed.',
              },
              {
                q: 'How long does solar installation take in Lagos?',
                a: 'Most residential solar installations in Lagos take 1–2 days. The actual mounting and wiring typically takes one day; testing and handover takes another half day. Complex commercial systems or large arrays may take 3–5 days.',
              },
              {
                q: 'Is solar worth it in Lagos given the cost of electricity?',
                a: 'Yes — very much so. The average Lagos generator user spends ₦35,000–₦60,000 per month on fuel. A solar system pays for itself in 10–14 months at those rates, after which electricity is essentially free for the next 10–15 years.',
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
            <h3 className="font-heading font-bold text-white text-xl mb-2">Are you a Lagos installer?</h3>
            <p className="text-[#94A3B8] mb-4">List your business free and get matched to customers.</p>
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
