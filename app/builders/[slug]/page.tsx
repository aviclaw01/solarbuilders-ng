import { notFound } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, getBuilderBySlug, formatNairaFull } from '@/lib/mock-data';
import { CheckCircle, Star, MapPin, ArrowLeft, MessageCircle } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return BUILDERS.map(b => ({ slug: b.slug }));
}

export default async function BuilderProfilePage({ params }: Props) {
  const { slug } = await params;
  const builder = getBuilderBySlug(slug);
  if (!builder) return notFound();

  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I'm interested in a solar installation. Can you help?`)}`;

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero photo */}
      <div className="relative">
        <img
          src={builder.coverImage}
          alt={builder.name}
          className="w-full h-56 md:h-80 object-cover"
        />
        <div className="absolute top-4 left-4">
          <Link href="/marketplace"
            className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-[#0F172A] text-sm font-semibold px-3 py-2 rounded-lg hover:bg-white transition-colors shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6 pb-24 md:pb-8">
        {/* Header card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex-1">
              {builder.verified && (
                <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                  <CheckCircle className="w-3 h-3" />
                  Nexprove Verified
                </span>
              )}
              <h1 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">
                {builder.name}
              </h1>
              <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
                <MapPin className="w-4 h-4" />
                <span>{builder.location}, {builder.state}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-[#F59E0B] fill-current" />
                <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg">{builder.rating}</span>
                <span className="text-[#64748B] text-sm">({builder.reviewCount} reviews)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-[#0F172A] rounded-xl p-5 mb-4 grid grid-cols-3 text-center divide-x divide-white/10">
          {[
            { value: `${builder.jobsCompleted}+`, label: 'Jobs Completed' },
            { value: `Since ${builder.yearFounded}`, label: '' },
            { value: builder.responseTime, label: 'Response Time' },
          ].map((stat, i) => (
            <div key={i} className="px-2">
              <div style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-xl md:text-2xl font-extrabold text-white">{stat.value}</div>
              {stat.label && <div className="text-[#94A3B8] text-xs mt-1">{stat.label}</div>}
            </div>
          ))}
        </div>

        {/* About */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl mb-3">About</h2>
          <p className="text-[#0F172A] text-base leading-relaxed">{builder.bio}</p>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl mb-3">Services</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {builder.services.map(service => (
              <span key={service} className="bg-[#F1F5F9] text-[#0F172A] text-sm font-medium px-3 py-1.5 rounded-full">
                {service}
              </span>
            ))}
          </div>
          <p className="text-sm text-[#64748B] mb-2">Specialties</p>
          <p className="text-[#F59E0B] font-semibold text-sm">{builder.specialties.join(' · ')}</p>
        </div>

        {/* Packages */}
        {builder.packages.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
            <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl mb-4">Packages</h2>
            <div className="space-y-4">
              {builder.packages.map(pkg => (
                <div key={pkg.name} className="border border-[#E2E8F0] rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg">{pkg.name}</h3>
                    <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-extrabold text-[#F59E0B] text-xl whitespace-nowrap">
                      {formatNairaFull(pkg.price)}
                    </span>
                  </div>
                  <p className="text-[#64748B] text-sm mb-4">{pkg.description}</p>
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#22c55e] transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Get a Quote on WhatsApp →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-[#F59E0B] fill-current" />
            <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl">
              {builder.rating} overall
            </span>
            <span className="text-[#64748B]">· {builder.reviewCount} reviews</span>
          </div>

          <div className="space-y-4">
            {builder.reviews.map((review, i) => (
              <div key={i} className="border border-[#F1F5F9] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-semibold text-[#0F172A]">{review.author}</p>
                    <p className="text-[#64748B] text-xs">{review.location}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className={`w-3.5 h-3.5 ${j < review.rating ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[#0F172A] text-sm leading-relaxed mb-2">&quot;{review.body}&quot;</p>
                <div className="flex items-center gap-2">
                  {review.verified && (
                    <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-xs px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-2.5 h-2.5" />
                      Verified client
                    </span>
                  )}
                  <span className="text-[#94A3B8] text-xs">{review.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact block */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl mb-4">Contact</h2>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#64748B] text-sm hover:text-[#25D366] transition-colors">
            <MessageCircle className="w-4 h-4" />
            WhatsApp: {builder.whatsapp}
          </a>
        </div>

        {/* Desktop WhatsApp CTA */}
        <div className="hidden md:block">
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="w-full bg-[#25D366] text-white py-5 rounded-xl font-bold text-xl text-center flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
            <MessageCircle className="w-6 h-6" />
            Chat with {builder.name.split(' ')[0]} on WhatsApp →
          </a>
        </div>
      </div>

      {/* Sticky WhatsApp CTA — Mobile */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden z-50 p-4 bg-white/95 backdrop-blur-sm border-t border-[#E2E8F0]">
        <a href={waLink} target="_blank" rel="noopener noreferrer"
          className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-lg text-center flex items-center justify-center gap-2 hover:bg-[#22c55e] transition-colors"
          style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}>
          <MessageCircle className="w-5 h-5" />
          Chat with {builder.name.split(' ')[0]} on WhatsApp
        </a>
      </div>

      <Footer />
    </div>
  );
}
