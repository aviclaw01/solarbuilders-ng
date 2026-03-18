import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar Installers in Enugu — Verified & Reviewed | SolarBuilders.ng',
  description: 'Find trusted solar installation companies in Enugu, Nigeria. Browse Nexprove Verified builders across GRA, Independence Layout, Abakpa, and all of Enugu State.',
  keywords: ['solar installer Enugu', 'solar company Enugu Nigeria', 'solar installation Enugu State', 'solar panels Enugu price', 'best solar Enugu 2026'],
  openGraph: {
    title: 'Solar Installers in Enugu — Nexprove Verified',
    description: 'Find trusted solar installation companies across Enugu State, Nigeria.',
    url: 'https://solarbuilders.ng/solar/enugu',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/solar/enugu' },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How much does solar cost in Enugu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Solar installation in Enugu typically costs between ₦380,000 for a basic 2kVA system and ₦2,000,000+ for premium hybrid systems. Enugu has good solar conditions and a growing installer base."
      }
    },
    {
      "@type": "Question",
      "name": "How long does solar installation take in Enugu?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Residential solar installations in Enugu typically take 1–3 days to complete. The timeline depends on system size, roof type, and parts availability."
      }
    },
    {
      "@type": "Question",
      "name": "Are solar installers in Enugu insured?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Nexprove Verified builders on SolarBuilders.ng have been vetted by our team, including business registration and customer history checks. Always verify credentials before paying."
      }
    }
  ]
};

export default function SolarEnuguPage() {
  const enuguBuilders = BUILDERS.filter(b => b.state === 'Enugu' || b.state === 'Enugu State');
  const displayBuilders = enuguBuilders.length > 0 ? enuguBuilders : BUILDERS.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />

      <div className="bg-white border-b border-slate-100 px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-slate-900">Marketplace</Link>
            <span>/</span>
            <span className="text-slate-900">Enugu</span>
          </div>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mb-4">
            Solar Installers in Enugu — Find Verified Builders
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Enugu&apos;s power situation — like much of South-East Nigeria — means residents depend heavily on generators. Solar is the smart exit. We&apos;ve vetted installers across GRA, Independence Layout, Abakpa, New Haven, and the wider Enugu State so you don&apos;t have to take chances.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {enuguBuilders.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <p className="text-amber-800 font-semibold">We&apos;re actively onboarding verified builders in Enugu. Meanwhile, these builders serve clients across Nigeria including Enugu State.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {displayBuilders.map(builder => {
            const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in solar installation in Enugu.')}`;
            return (
              <div key={builder.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-amber-300 transition-all duration-200">
                <div className="aspect-video overflow-hidden bg-slate-50 relative">
                  <Image src={builder.coverImage} alt={`${builder.name} solar Enugu`} width={400} height={225} className="w-full h-full object-cover" />
                  {builder.verified && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" />Verified
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="font-heading font-bold text-slate-900 text-lg mb-1">{builder.name}</h2>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
                    <MapPin className="w-3.5 h-3.5" /><span>{builder.location}, {builder.state}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-3">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(builder.rating) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                      ))}
                    </div>
                    <span className="font-semibold text-sm">{builder.rating}</span>
                    <span className="text-slate-400 text-sm">({builder.reviewCount})</span>
                  </div>
                  <p className="text-amber-500 font-heading font-bold text-base mb-4">From {formatNaira(builder.startingPrice)}</p>
                  <div className="flex gap-2">
                    <Link href={`/builders/${builder.slug}`} className="flex-1 border border-slate-200 hover:border-slate-400 text-slate-700 text-sm font-semibold py-2.5 rounded-full text-center transition-colors">View Profile</Link>
                    <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#25D366] hover:bg-[#22c55e] text-white text-sm font-semibold py-2.5 rounded-full text-center transition-colors">WhatsApp</a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mb-16">
          <h2 className="font-heading font-bold text-slate-900 text-3xl mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'How much does solar cost in Enugu?',
                a: 'Solar installation in Enugu typically costs between ₦380,000 for a basic 2kVA system and ₦2,000,000+ for premium hybrid systems. Enugu has good solar conditions and a growing installer base.',
              },
              {
                q: 'How long does solar installation take in Enugu?',
                a: 'Residential solar installations in Enugu typically take 1–3 days to complete. The timeline depends on system size, roof type, and parts availability.',
              },
              {
                q: 'Are solar installers in Enugu insured?',
                a: 'Nexprove Verified builders on SolarBuilders.ng have been vetted by our team, including business registration and customer history checks. Always verify credentials before making any payment.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-slate-900 mb-2">{q}</h3>
                <p className="text-slate-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-400 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-3">
            Calculate your solar system size
          </h3>
          <p className="text-slate-800 mb-6">Free tool. Takes 5 minutes. No signup required.</p>
          <Link href="/calculator" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full px-6 py-3 transition-all">
            Calculate My System →
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
