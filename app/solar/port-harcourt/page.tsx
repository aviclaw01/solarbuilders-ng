import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar Installers in Port Harcourt — Nexprove Verified | SolarBuilders.ng',
  description: 'Find trusted solar installation companies in Port Harcourt, Nigeria. Browse Nexprove Verified builders across GRA, Trans-Amadi, Rumuola and all of Rivers State.',
  keywords: ['solar installer Port Harcourt', 'solar company Port Harcourt Nigeria', 'solar installation Rivers State', 'solar PH Nigeria', 'solar panels Port Harcourt price'],
  openGraph: {
    title: 'Solar Installers in Port Harcourt — Nexprove Verified',
    description: 'Find trusted solar installation companies across Port Harcourt, Nigeria.',
    url: 'https://solarbuilders.ng/solar/port-harcourt',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/solar/port-harcourt' },
};

export default function SolarPortHarcourtPage() {
  const phBuilders = BUILDERS.filter(b => b.state === 'Port Harcourt' || b.location.includes('Port Harcourt') || b.state === 'Rivers');

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
            <span className="text-[#0A0F1E]">Port Harcourt</span>
          </div>
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
            Solar Installers in Port Harcourt — Nexprove Verified
          </h1>
          <p className="text-[#64748B] text-lg max-w-2xl leading-relaxed">
            Port Harcourt&apos;s industrial activity, high cost of diesel, and unreliable grid power make it one of the most cost-effective cities in Nigeria to go solar. The PH market has grown significantly since 2022, with more quality installers entering the city. We&apos;ve reviewed the best options across GRA, Trans-Amadi, Rumuola, and beyond.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {phBuilders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {phBuilders.map(builder => {
              const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in solar installation in Port Harcourt.')}`;
              return (
                <div key={builder.id} className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#F59E0B] hover:shadow-lg transition-all duration-200">
                  <div className="aspect-video overflow-hidden bg-[#F8FAFC] relative">
                    <Image src={builder.coverImage} alt={`${builder.name} Port Harcourt`} width={400} height={225} className="w-full h-full object-cover" />
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
                      <MapPin className="w-3.5 h-3.5" /><span>{builder.location}</span>
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
        ) : (
          <div className="text-center py-16 mb-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-2">More PH builders coming soon</h3>
            <p className="text-[#64748B] mb-6">We&apos;re actively verifying Port Harcourt installers. In the meantime, browse all builders.</p>
            <Link href="/marketplace" className="bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-semibold hover:bg-[#D97706] transition-colors">
              Browse All Builders →
            </Link>
          </div>
        )}

        <div className="max-w-3xl mb-16">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl mb-8">FAQ — Solar in Port Harcourt</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Is solar effective in Port Harcourt despite the humidity?',
                a: 'Yes, solar works well in Port Harcourt. While the city has more cloud cover than drier northern regions, it still averages 4.5–5.5 peak sun hours daily — sufficient for excellent solar generation. Quality panels from reputable brands handle coastal humidity without issues when properly installed.',
              },
              {
                q: 'How much does solar cost in Port Harcourt?',
                a: 'Port Harcourt generally has slightly lower installation costs than Lagos. A 3kVA residential system typically runs ₦380,000–₦580,000 installed. A 5kVA system with AC support costs around ₦650,000–₦900,000.',
              },
              {
                q: 'What about salt air corrosion for panels in Port Harcourt?',
                a: 'This is a valid concern for waterfront properties. For coastal or riverside locations, specify marine-grade mounting hardware (anodised aluminium or galvanised steel) when requesting quotes. All reputable PH installers should know about this automatically.',
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
            <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Calculate your PH system</h3>
            <p className="text-[#64748B] mb-4">Know exactly what you need before getting quotes.</p>
            <Link href="/calculator" className="inline-flex items-center bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
              Free Calculator →
            </Link>
          </div>
          <div className="bg-[#0A0F1E] rounded-2xl p-8">
            <h3 className="font-heading font-bold text-white text-xl mb-2">PH installer?</h3>
            <p className="text-[#94A3B8] mb-4">Get listed and reach customers in Port Harcourt.</p>
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
