import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import HomepageClient from '@/components/ui/HomepageClient';

export const metadata: Metadata = {
  title: "SolarBuilders.ng — Nigeria's Solar Marketplace",
  description: "Calculate exactly what solar system you need. Find verified solar installers in Lagos, Abuja, Port Harcourt and across Nigeria. Free solar calculator, no signup.",
  alternates: { canonical: 'https://solarbuilders.ng' },
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#059669] text-white text-xs font-heading font-semibold px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Verified
    </span>
  );
}

function BuilderCard({ builder }: { builder: typeof BUILDERS[0] }) {
  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in a solar installation.')}`;
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#F59E0B] hover:shadow-lg transition-all duration-200">
      <div className="aspect-video overflow-hidden bg-[#F8FAFC] relative">
        <Image
          src={builder.coverImage}
          alt={`${builder.name} solar installation`}
          width={400}
          height={225}
          className="w-full h-full object-cover"
        />
        {builder.verified && (
          <div className="absolute top-3 right-3">
            <VerifiedBadge />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-heading font-bold text-[#0A0F1E] text-lg mb-1">{builder.name}</h3>
        <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{builder.location}, {builder.state}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(builder.rating) ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
            ))}
          </div>
          <span className="font-semibold text-sm text-[#0A0F1E]">{builder.rating}</span>
          <span className="text-[#94A3B8] text-sm">({builder.reviewCount})</span>
        </div>
        <p className="text-[#F59E0B] font-heading font-bold text-base mb-4">
          From {formatNaira(builder.startingPrice)}
        </p>
        <div className="flex gap-2">
          <Link href={`/builders/${builder.slug}`}
            className="flex-1 border-2 border-[#0A0F1E] text-[#0A0F1E] text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#0A0F1E] hover:text-white transition-colors">
            View Profile
          </Link>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] text-white text-sm font-heading font-semibold py-2.5 rounded-full text-center hover:bg-[#22c55e] transition-colors">
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, city, type, rating }: {
  quote: string; name: string; city: string; type: string; rating: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
      <div className="flex gap-0.5 mb-4">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-[#F59E0B] fill-current' : 'text-[#E2E8F0]'}`} />
        ))}
      </div>
      <p className="text-[#0A0F1E] text-base leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-heading font-semibold text-[#0A0F1E] text-sm">{name}</p>
        <p className="text-[#64748B] text-xs">{city} · {type}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const featuredBuilders = BUILDERS.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* HERO — white bg, dark text */}
      <section className="bg-white px-4 py-20 md:py-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-heading font-extrabold text-[#0A0F1E] text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
              Nigeria&apos;s Solar<br />Marketplace.
            </h1>
            <p className="text-[#64748B] text-xl leading-relaxed mb-8 max-w-md">
              Calculate what you need. Find who you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-bold text-base hover:bg-[#D97706] transition-colors"
              >
                Calculate My System →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center gap-2 border-2 border-[#0A0F1E] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-semibold text-base hover:bg-[#0A0F1E] hover:text-white transition-colors"
              >
                Browse Builders
              </Link>
            </div>
            <p className="text-[#94A3B8] text-sm">
              200+ verified builders · 28 states · ₦0 to get started
            </p>
          </div>

          {/* Right: mini calculator preview card */}
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xl p-6">
              <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-4">What do you run at home?</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { emoji: '❄️', name: 'AC', selected: true },
                  { emoji: '🧊', name: 'Fridge', selected: true },
                  { emoji: '📺', name: 'TV', selected: false },
                  { emoji: '🌀', name: 'Fan', selected: true },
                  { emoji: '💡', name: 'Lights', selected: true },
                  { emoji: '💻', name: 'Laptop', selected: false },
                ].map(item => (
                  <div key={item.name} className={`rounded-xl border-2 p-3 text-center transition-colors ${
                    item.selected
                      ? 'border-[#F59E0B] bg-[#FEF3C7]'
                      : 'border-[#E2E8F0] bg-white'
                  }`}>
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-xs font-medium text-[#0A0F1E]">{item.name}</div>
                  </div>
                ))}
              </div>
              <div className="bg-[#F8FAFC] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[#64748B] text-xs">Estimated system size</span>
                  <span className="font-heading font-bold text-[#0A0F1E] text-sm">3.5 kVA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] text-xs">Estimated cost range</span>
                  <span className="font-heading font-bold text-[#F59E0B] text-sm">₦450k–₦750k</span>
                </div>
              </div>
              <Link href="/calculator" className="block w-full bg-[#F59E0B] text-[#0A0F1E] py-3 rounded-full text-center font-heading font-bold text-sm hover:bg-[#D97706] transition-colors">
                Get My Real Estimate →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF TICKER */}
      <HomepageClient />

      {/* TRUST BAR — amber bg */}
      <section className="bg-[#F59E0B] py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '200+', label: 'Verified Builders' },
              { number: '28', label: 'States Covered' },
              { number: '1,400+', label: 'Installs Done' },
              { number: '₦0', label: 'Fee to Start' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-1">{stat.number}</div>
                <div className="text-[#0A0F1E] text-sm font-medium opacity-70">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — white bg, editorial */}
      <section className="bg-white py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-16">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-4">
              Three steps.<br />That&apos;s all.
            </h2>
            <p className="text-[#64748B] text-lg">No agents, no commission, no forms. Just solar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                num: '01',
                title: 'Calculate',
                desc: 'Tell us what appliances you run. We calculate exactly what system size you need — free, in 60 seconds.',
              },
              {
                num: '02',
                title: 'Browse',
                desc: 'See verified solar builders near you. Real reviews, real prices, real contact details.',
              },
              {
                num: '03',
                title: 'Go Solar',
                desc: 'Reach out directly on WhatsApp. No middleman. No commission. Your job, your terms.',
              },
            ].map(step => (
              <div key={step.num}>
                <div className="font-heading font-extrabold text-[#F59E0B] text-6xl mb-4 leading-none">{step.num}</div>
                <h3 className="font-heading font-bold text-[#0A0F1E] text-2xl mb-3">{step.title}</h3>
                <p className="text-[#64748B] text-base leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED BUILDERS — surface bg */}
      <section className="bg-[#F8FAFC] py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-2">
                Verified builders near you
              </h2>
              <p className="text-[#64748B]">Hand-checked by the Nexprove team</p>
            </div>
            <Link href="/marketplace" className="hidden md:inline-flex items-center gap-1 text-[#F59E0B] font-heading font-semibold text-sm hover:underline underline-offset-4">
              Browse all builders →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBuilders.map(builder => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/marketplace" className="inline-flex items-center gap-1 text-[#F59E0B] font-heading font-semibold text-sm hover:underline">
              Browse all builders →
            </Link>
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR TEASER — amber-light bg */}
      <section className="bg-[#FEF3C7] py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl leading-tight mb-4">
              Your generator costs ₦40,000/month.
            </h2>
            <p className="text-[#64748B] text-xl mb-8">
              A 3kVA solar system pays for itself in 11 months. Then it&apos;s free power — forever.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-bold text-base hover:bg-[#D97706] transition-colors"
            >
              Calculate my solar ROI →
            </Link>
          </div>

          {/* CSS-only bar chart */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8">
            <p className="font-heading font-semibold text-[#0A0F1E] text-sm mb-6">Cost comparison over 3 years</p>
            <div className="flex items-end gap-6 h-40 mb-4">
              {/* Generator bars */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="flex-1 bg-[#94A3B8] rounded-t-lg" style={{height: '40%'}}></div>
                  <div className="flex-1 bg-[#64748B] rounded-t-lg" style={{height: '70%'}}></div>
                  <div className="flex-1 bg-[#475569] rounded-t-lg" style={{height: '100%'}}></div>
                </div>
                <span className="text-xs text-[#64748B] font-medium">Generator</span>
                <span className="text-xs text-[#64748B]">₦480k+</span>
              </div>
              {/* Solar bars */}
              <div className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1 h-32">
                  <div className="flex-1 bg-[#FDE68A] rounded-t-lg" style={{height: '100%'}}></div>
                  <div className="flex-1 bg-[#FCD34D] rounded-t-lg" style={{height: '20%'}}></div>
                  <div className="flex-1 bg-[#F59E0B] rounded-t-lg" style={{height: '5%'}}></div>
                </div>
                <span className="text-xs text-[#0A0F1E] font-semibold">Solar</span>
                <span className="text-xs text-[#059669] font-semibold">₦0/mo after Y1</span>
              </div>
            </div>
            <div className="flex justify-between text-xs text-[#94A3B8] px-2">
              <span>Year 1</span>
              <span>Year 2</span>
              <span>Year 3</span>
            </div>
          </div>
        </div>
      </section>

      {/* DIASPORA SECTION — navy bg */}
      <section className="bg-[#0A0F1E] py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight mb-6">
              Power the home you left behind.
            </h2>
            <p className="text-[#94A3B8] text-xl leading-relaxed mb-8">
              Install solar for family back home — from anywhere in the world. Our verified builders keep you informed at every step via WhatsApp.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 border-2 border-white text-white px-7 py-3.5 rounded-full font-heading font-semibold text-base hover:bg-white hover:text-[#0A0F1E] transition-colors"
            >
              Find a builder →
            </Link>
          </div>

          {/* Nigeria map graphic — CSS only */}
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border-2 border-white/10 rounded-full flex items-center justify-center">
                <div className="text-white/20 text-8xl">🇳🇬</div>
              </div>
              {/* Amber dots for cities */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="absolute -top-16 -left-8 flex flex-col items-center gap-1">
                    <div className="w-3 h-3 bg-[#F59E0B] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"></div>
                    <span className="text-[#F59E0B] text-xs font-semibold">Abuja</span>
                  </div>
                  <div className="absolute top-4 -left-20 flex flex-col items-center gap-1">
                    <div className="w-3 h-3 bg-[#F59E0B] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"></div>
                    <span className="text-[#F59E0B] text-xs font-semibold">Lagos</span>
                  </div>
                  <div className="absolute top-8 left-8 flex flex-col items-center gap-1">
                    <div className="w-3 h-3 bg-[#F59E0B] rounded-full shadow-[0_0_12px_rgba(245,158,11,0.8)]"></div>
                    <span className="text-[#F59E0B] text-xs font-semibold">PH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS — white bg */}
      <section className="bg-white py-20 md:py-28 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-12">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-4xl md:text-5xl mb-4">
              What Nigerians are saying
            </h2>
            <p className="text-[#64748B] text-lg">Real customers. Real results.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Best decision I ever made. Installation was clean and professional. My generator has been off since August 2025."
              name="Tunde A."
              city="Lagos Island"
              type="3kVA Home System"
              rating={5}
            />
            <TestimonialCard
              quote="Commissioned from London for my parents' house. The builder kept me in the loop via WhatsApp throughout. Parents love it."
              name="Chidinma O."
              city="Victoria Island, Lagos"
              type="5kVA Hybrid System"
              rating={5}
            />
            <TestimonialCard
              quote="Generator bills dropped from ₦180k/month to basically zero. Professional from start to finish. Highly recommend."
              name="Adaeze M."
              city="Wuse 2, Abuja"
              type="15kVA Commercial"
              rating={5}
            />
          </div>
        </div>
      </section>

      {/* FOR BUILDERS CTA */}
      <section className="bg-[#F8FAFC] py-16 px-4 border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-4">
            Are you a solar installer?
          </h2>
          <p className="text-[#64748B] text-lg mb-8 max-w-xl mx-auto">
            Get matched to customers in your area. List free, get verified, grow your business.
          </p>
          <Link
            href="/for-builders"
            className="inline-flex items-center gap-2 bg-[#0A0F1E] text-white px-8 py-4 rounded-full font-heading font-bold text-base hover:bg-[#1E293B] transition-colors"
          >
            List Your Business Free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
