import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, getBuilderBySlug, formatNairaFull } from '@/lib/mock-data';
import { CheckCircle, Star, MapPin, ArrowLeft, Clock, Calendar, Briefcase } from 'lucide-react';

function getOutcome(kva: number): string {
  if (kva <= 3.5) return "Powers lights, fans, fridge, TV — no AC";
  if (kva <= 5) return "Powers everything including 1 standard AC unit";
  if (kva <= 7.5) return "Powers full home — multiple ACs, all appliances";
  return "Full commercial or large home — unlimited capacity";
}
import ReviewForm from '@/components/ui/ReviewForm';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BUILDERS.map(b => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const builder = getBuilderBySlug(slug);
  if (!builder) return { title: 'Builder Not Found' };

  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": builder.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": builder.location,
      "addressRegion": builder.state,
      "addressCountry": "NG"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": builder.rating.toString(),
      "reviewCount": builder.reviewCount.toString()
    },
    "url": `https://solarbuilders.ng/builders/${builder.slug}`,
    "description": builder.bio,
  };

  return {
    title: `${builder.name} — Solar Installer in ${builder.state} | SolarBuilders.ng`,
    description: builder.bio,
    openGraph: {
      title: `${builder.name} — Solar Installer in ${builder.state}`,
      description: builder.bio,
      url: `https://solarbuilders.ng/builders/${builder.slug}`,
      type: 'website',
    },
    alternates: { canonical: `https://solarbuilders.ng/builders/${builder.slug}` },
    other: {
      'application/ld+json': JSON.stringify(schema),
    },
  };
}

export default async function BuilderProfilePage({ params }: Props) {
  const { slug } = await params;
  const builder = getBuilderBySlug(slug);
  if (!builder) return notFound();

  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation. Can you help?`)}`;

  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": builder.name,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": builder.location,
      "addressRegion": builder.state,
      "addressCountry": "NG"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": builder.rating.toString(),
      "reviewCount": builder.reviewCount.toString()
    },
    "url": `https://solarbuilders.ng/builders/${builder.slug}`,
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Navbar />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm text-[#64748B]">
          <Link href="/" className="hover:text-[#0A0F1E] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-[#0A0F1E] transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="text-[#0A0F1E] font-medium">{builder.name}</span>
        </div>
      </div>

      {/* Cover photo */}
      <div className="relative aspect-[21/9] overflow-hidden bg-[#F8FAFC] max-h-80">
        <Image
          src={builder.coverImage}
          alt={`${builder.name} — solar installer in ${builder.state}`}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-6 flex items-center gap-3">
          <h1 className="font-heading font-extrabold text-white text-3xl md:text-4xl">{builder.name}</h1>
          {builder.verified && (
            <span className="inline-flex items-center gap-1 bg-[#059669] text-white text-xs font-heading font-semibold px-3 py-1.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified
            </span>
          )}
        </div>
        <div className="absolute top-4 left-4">
          <Link href="/marketplace"
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#0A0F1E] text-sm font-semibold px-4 py-2 rounded-full hover:bg-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div><div className="font-heading font-extrabold text-slate-900 text-2xl">{builder.jobsCompleted}+</div><div className="text-slate-500 text-sm">Jobs Completed</div></div>
          <div><div className="font-heading font-extrabold text-slate-900 text-2xl">{builder.rating}</div><div className="text-slate-500 text-sm">Average Rating</div></div>
          <div><div className="font-heading font-extrabold text-slate-900 text-2xl">{builder.responseTime}</div><div className="text-slate-500 text-sm">Response Time</div></div>
          <div><div className="font-heading font-extrabold text-slate-900 text-2xl">Since {builder.yearFounded}</div><div className="text-slate-500 text-sm">In Business</div></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 pb-32 md:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main content — col-span-2 */}
          <div className="md:col-span-2 space-y-8">
            {/* About */}
            <div>
              <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">About</h2>
              <p className="text-[#64748B] text-base leading-relaxed">{builder.bio}</p>
            </div>

            {/* Services */}
            <div>
              <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">Services</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {builder.services.map(s => {
                  const map: Record<string, {icon:string;desc:string}> = {
                    "Full Installation": {icon:"🔧", desc:"End-to-end design, supply, and installation"},
                    "System Design": {icon:"📐", desc:"Custom load analysis and system sizing"},
                    "Residential": {icon:"🏠", desc:"Home systems from 1.5kVA to 15kVA"},
                    "Commercial": {icon:"🏢", desc:"Office and retail solutions, 10kVA+"},
                    "Off-grid": {icon:"🔋", desc:"Complete battery-backed, no PHCN needed"},
                    "Hybrid": {icon:"⚡", desc:"Grid-tied + battery backup systems"},
                    "Repair": {icon:"🛠️", desc:"Fault diagnosis and component replacement"},
                    "Maintenance": {icon:"🔍", desc:"Periodic checks and performance optimization"},
                  };
                  const d = map[s] || {icon:"✅", desc:""};
                  return (
                    <div key={s} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xl">{d.icon}</span>
                      <div><div className="font-heading font-semibold text-slate-900 text-sm">{s}</div><div className="text-slate-500 text-xs">{d.desc}</div></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {builder.specialties.map(s => (
                  <span key={s} className="px-4 py-2 bg-[#FEF3C7] border border-[#F59E0B]/30 text-[#0A0F1E] text-sm rounded-full font-medium">{s}</span>
                ))}
              </div>
            </div>

            {/* Packages */}
            <div>
              <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">Packages</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {builder.packages.map((pkg, i) => (
                  <div key={pkg.name} className={`rounded-2xl border-2 p-6 ${i === 0 ? 'border-[#F59E0B]' : 'border-[#E2E8F0]'}`}>
                    {i === 0 && <span className="inline-block bg-[#F59E0B] text-[#0A0F1E] text-xs font-heading font-bold px-3 py-1 rounded-full mb-3">Recommended</span>}
                    <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full mb-3">⚡ {pkg.kva}kVA</div>
                    <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-2">{pkg.name}</h3>
                    <p className="text-emerald-700 font-semibold text-sm mb-2">{getOutcome(pkg.kva)}</p>
                    <p className="text-[#64748B] text-sm mb-4 leading-relaxed">{pkg.description}</p>
                    <p className="font-heading font-extrabold text-[#F59E0B] text-xl">{formatNairaFull(pkg.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div>
              <h2 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-4">
                Reviews <span className="text-[#F59E0B]">({builder.reviewCount})</span>
              </h2>
              <div className="space-y-4">
                {builder.reviews.map((review, i) => (
                  <div key={i} className="rounded-2xl border border-[#E2E8F0] p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-heading font-semibold text-[#0A0F1E] text-sm">{review.author}</p>
                        <p className="text-[#94A3B8] text-xs">{review.location} · {review.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#64748B] text-base leading-relaxed">&ldquo;{review.body}&rdquo;</p>
                    {review.verified && (
                      <div className="flex items-center gap-1 mt-3 text-[#059669] text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Verified purchase
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <ReviewForm builderSlug={builder.slug} builderName={builder.name} />
            </div>

            {/* Calculator CTA */}
            <div className="bg-[#FEF3C7] rounded-2xl p-8">
              <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-2">Not sure what size you need?</h3>
              <p className="text-[#64748B] mb-4">Use our free calculator to figure out your exact requirements before reaching out.</p>
              <Link href="/calculator" className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-6 py-3 rounded-full font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
                Calculate My System →
              </Link>
            </div>
          </div>

          {/* Sticky contact card */}
          <div className="md:col-span-1">
            <div className="rounded-2xl border border-[#E2E8F0] p-6 md:sticky md:top-24">
              <div className="flex items-center gap-1 mb-2">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(builder.rating) ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                  ))}
                </div>
                <span className="font-semibold text-[#0A0F1E] text-sm ml-1">{builder.rating}</span>
                <span className="text-[#94A3B8] text-sm">({builder.reviewCount} reviews)</span>
              </div>

              <p className="font-heading font-bold text-[#0A0F1E] text-xl mb-1">{builder.name}</p>
              <div className="flex items-center gap-1 text-[#64748B] text-sm mb-6">
                <MapPin className="w-3.5 h-3.5" />
                <span>{builder.location}, {builder.state}</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Clock className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" />
                  <span>Responds in {builder.responseTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" />
                  <span>Member since {builder.yearFounded}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <Briefcase className="w-4 h-4 flex-shrink-0 text-[#F59E0B]" />
                  <span>{builder.jobsCompleted} jobs completed</span>
                </div>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-[#25D366] text-white text-center py-4 rounded-full font-heading font-bold text-base hover:bg-[#22c55e] transition-colors mb-3"
              >
                💬 Contact on WhatsApp
              </a>

              <p className="text-[#94A3B8] text-xs text-center">Free to contact · No commission taken</p>

              <div className="border-t border-[#E2E8F0] mt-6 pt-4">
                <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-1">Starting from</p>
                <p className="font-heading font-extrabold text-[#F59E0B] text-2xl">{formatNairaFull(builder.startingPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky WhatsApp */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E2E8F0] md:hidden z-40">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#25D366] text-white text-center py-4 rounded-full font-heading font-bold text-base hover:bg-[#22c55e] transition-colors"
        >
          💬 Contact on WhatsApp
        </a>
      </div>

      <Footer />
    </div>
  );
}
