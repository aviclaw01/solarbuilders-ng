import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import HomepageClient from '@/components/ui/HomepageClient';
import UseCaseCarousel from '@/components/ui/UseCaseCarousel';
import CountdownCTA from '@/components/ui/CountdownCTA';
import RotatingText from '@/components/ui/RotatingText';

export const metadata: Metadata = {
  title: "Nigeria's Verified Solar Marketplace — Free Calculator | SolarBuilders.ng",
  description: "Find trusted solar installers in Lagos, Abuja, Port Harcourt and across Nigeria. Use our free calculator to size your system, compare verified builders, and go solar with confidence.",
  alternates: { canonical: 'https://solarbuilders.ng' },
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Verified
    </span>
  );
}

function BuilderCard({ builder }: { builder: typeof BUILDERS[0] }) {
  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in a solar installation.')}`;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-amber-300 transition-all duration-200">
      <div className="aspect-video overflow-hidden bg-slate-50 relative">
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
        <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">{builder.name}</h3>
        <div className="flex items-center gap-1 text-slate-500 text-sm mb-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{builder.location}, {builder.state}</span>
        </div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => (
              <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(builder.rating) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
            ))}
          </div>
          <span className="font-semibold text-sm text-slate-900">{builder.rating}</span>
          <span className="text-slate-400 text-sm">({builder.reviewCount})</span>
        </div>
        <p className="text-amber-500 font-heading font-bold text-base mb-4">
          From {formatNaira(builder.startingPrice)}
        </p>
        <div className="flex gap-2">
          <Link href={`/builders/${builder.slug}`}
            className="flex-1 border border-slate-200 hover:border-slate-400 text-slate-700 text-sm font-semibold py-2.5 rounded-full text-center transition-colors">
            View Profile
          </Link>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] hover:bg-[#22c55e] text-white text-sm font-semibold py-2.5 rounded-full text-center transition-colors">
            WhatsApp
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
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex gap-0.5 mb-4">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
        ))}
      </div>
      <p className="text-slate-800 text-base leading-relaxed mb-5 italic">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="font-heading font-semibold text-slate-900 text-sm">{name}</p>
        <p className="text-slate-500 text-xs">{city} · {type}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const featuredBuilders = BUILDERS.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ──────────────── HERO ──────────────── */}
      <section className="bg-gradient-to-br from-white via-amber-50/30 to-white px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              Nigeria&apos;s #1 Solar Marketplace ⚡
            </div>
            <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6">
              Find. <RotatingText /><br />Go Solar.
            </h1>
            <p className="text-slate-500 text-xl leading-relaxed mb-8 max-w-xl">
              Size your system with our free calculator, then connect with verified builders near you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all text-base"
              >
                Calculate My System →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 transition-all text-base font-semibold"
              >
                Browse Builders
              </Link>
            </div>
            {/* Trust row */}
            <p className="text-slate-400 text-sm font-medium">
              ★★★★★ 4.8 on Google · 200+ Verified Builders · ₦0 to use · 5-min setup
            </p>
          </div>

          {/* Right: calculator preview card */}
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <p className="font-heading font-semibold text-slate-900 text-sm mb-4">What do you run at home?</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { name: 'AC', selected: true },
                  { name: 'Fridge', selected: true },
                  { name: 'TV', selected: false },
                  { name: 'Fan', selected: true },
                  { name: 'Lights', selected: true },
                  { name: 'Laptop', selected: false },
                ].map(item => (
                  <div key={item.name} className={`rounded-xl border-2 p-3 text-center transition-colors ${
                    item.selected
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-100 bg-white'
                  }`}>
                    <div className="text-xs font-semibold text-slate-700">{item.name}</div>
                  </div>
                ))}
              </div>
              {/* Result preview */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-700 font-heading font-bold text-sm text-center">
                  Your system: 3.5kVA → ₦480k–₦750k
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 text-xs">Estimated system size</span>
                  <span className="font-heading font-bold text-slate-900 text-sm">3.5 kVA</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Estimated cost range</span>
                  <span className="font-heading font-bold text-amber-500 text-sm">₦450k–₦750k</span>
                </div>
              </div>
              <Link href="/calculator" className="block w-full bg-amber-400 hover:bg-amber-500 text-slate-900 py-3 rounded-full text-center font-semibold text-sm transition-all">
                Get My Real Estimate →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF TICKER */}
      <HomepageClient />

      {/* ──────────────── USE CASE CAROUSEL ──────────────── */}
      <UseCaseCarousel />

      {/* ──────────────── FEATURE CARDS (replaces "How it works") ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">How It Works</span>
          </div>
          <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight mb-16">
            Everything you need to go solar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 — Calculator */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <div className="space-y-2">
                  {['AC', 'Fridge', 'Lights'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${i < 2 ? 'border-amber-400 bg-amber-400' : 'border-slate-300'}`}>
                        {i < 2 && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className="text-xs text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-amber-400 rounded-lg h-2 w-3/4" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Free Calculator</h3>
              <p className="text-slate-500 text-sm">Size your system in 60 seconds. Know what you need before you talk to anyone.</p>
            </div>

            {/* Card 2 — Verified Builders */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">SunTech Installs</span>
                      <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        <CheckCircle className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Verified Builders</h3>
              <p className="text-slate-500 text-sm">Every builder is Nexprove-verified. Real reviews, real credentials, real work.</p>
            </div>

            {/* Card 3 — WhatsApp Direct */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-[#075E54] rounded-xl p-4 mb-5">
                <div className="bg-white/10 rounded-lg px-3 py-2">
                  <p className="text-white text-xs leading-relaxed">
                    Hi, I found you on SolarBuilders.ng. Interested in a quote.
                  </p>
                </div>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">WhatsApp Direct</h3>
              <p className="text-slate-500 text-sm">Message builders directly on WhatsApp. No forms, no middleman.</p>
            </div>

            {/* Card 4 — Track Savings */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 text-center">
                <p className="font-heading font-extrabold text-slate-900 text-2xl mb-0.5">₦180,000</p>
                <p className="text-slate-500 text-[10px] font-medium">saved this month</p>
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Track Savings</h3>
              <p className="text-slate-500 text-sm">See exactly how much you save vs. generator every month.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── STATS + INTERLEAVED QUOTES ──────────────── */}
      <section className="bg-slate-900 py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {[
            {
              stat: '350+',
              statLabel: 'Families Powered',
              quote: 'My generator has been off since August 2025.',
              name: 'Tunde A.',
              city: 'Lagos',
            },
            {
              stat: '28',
              statLabel: 'States Covered',
              quote: 'The builder kept me in the loop via WhatsApp throughout. Parents love it.',
              name: 'Chidinma O.',
              city: 'London → Lagos',
            },
            {
              stat: '₦180k',
              statLabel: 'Avg/mo Saved',
              quote: 'Generator bills dropped from ₦180k/month to basically zero.',
              name: 'Adaeze M.',
              city: 'Abuja',
            },
          ].map((item, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center md:text-left">
                <p className="font-heading font-extrabold text-white text-4xl md:text-5xl">{item.stat}</p>
                <p className="text-slate-400 text-sm mt-1">{item.statLabel}</p>
              </div>
              <div className="md:col-span-2 bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <p className="text-slate-300 text-base italic mb-2">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-amber-400 text-sm font-semibold">{item.name} · {item.city}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────── FEATURED BUILDERS ──────────────── */}
      <section className="bg-slate-50 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-4xl mb-2">
                Verified builders near you
              </h2>
              <p className="text-slate-500">Hand-checked by the Nexprove team</p>
            </div>
            <Link href="/marketplace" className="hidden md:inline-flex items-center gap-1 text-amber-500 font-semibold text-sm hover:underline underline-offset-4">
              Browse all builders →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredBuilders.map(builder => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/marketplace" className="inline-flex items-center gap-1 text-amber-500 font-semibold text-sm hover:underline">
              Browse all builders →
            </Link>
          </div>
        </div>
      </section>

      {/* ──────────────── WHY SOLARBUILDERS + TRUST ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight">
              The only solar marketplace that verifies every builder.
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                title: 'Nexprove Verified Builders',
                desc: 'Every builder on our platform has been reviewed by our team. We check experience, equipment, and customer history before they go live.',
              },
              {
                title: 'WhatsApp-Native Contact',
                desc: 'No forms, no lead brokers. Talk directly to builders on WhatsApp — the platform every Nigerian already uses for business.',
              },
              {
                title: 'Free System Calculator',
                desc: 'Size your system before you talk to anyone. Know exactly what you need — so you can\'t be upsold something you don\'t.',
              },
            ].map(feature => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── STOP THE CHAOS ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight text-center mb-4">
            Stop managing 5 contractor WhatsApps
          </h2>
          <p className="text-slate-500 text-lg text-center mb-12 max-w-2xl mx-auto">
            Going solar in Nigeria shouldn&apos;t feel like a part-time job.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <p className="font-heading font-bold text-red-800 text-sm uppercase tracking-wide mb-5">Before SolarBuilders</p>
              <ul className="space-y-3.5">
                {[
                  'Unknown contractor credentials',
                  'Price hidden until last minute',
                  'No updates during install',
                  'Warranty? Good luck.',
                  '5 WhatsApp threads going',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400 flex-shrink-0 mt-0.5">❌</span>
                    <span className="text-red-900 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <p className="font-heading font-bold text-emerald-800 text-sm uppercase tracking-wide mb-5">With SolarBuilders</p>
              <ul className="space-y-3.5">
                {[
                  'Nexprove-verified & reviewed',
                  'Transparent pricing upfront',
                  'WhatsApp progress updates',
                  'Builder accountability guaranteed',
                  'One platform, one conversation',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">✅</span>
                    <span className="text-emerald-900 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── DIASPORA SECTION ──────────────── */}
      <section className="bg-slate-900 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight mb-6">
              Power the home you left behind.
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed mb-8">
              Install solar for family back home — from anywhere in the world. Nigerians in the UK, Canada, and US are funding solar installations for parents and siblings. Our verified builders keep you informed at every step via WhatsApp.
            </p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
            >
              Find a Verified Builder →
            </Link>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border border-white/10 rounded-full"></div>
              <div className="absolute inset-8 border border-white/10 rounded-full"></div>
              <div className="absolute inset-16 border border-white/10 rounded-full"></div>
              {[
                { label: 'Lagos', top: '20%', left: '20%' },
                { label: 'Abuja', top: '35%', left: '55%' },
                { label: 'PH', top: '65%', left: '60%' },
                { label: 'Kano', top: '10%', left: '50%' },
              ].map(city => (
                <div key={city.label} className="absolute flex flex-col items-center gap-1" style={{ top: city.top, left: city.left }}>
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div>
                  <span className="text-amber-400 text-xs font-semibold">{city.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── TESTIMONIALS ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mb-3">
              What Nigerians are saying
            </h2>
            <p className="text-slate-500 text-lg">Real customers. Real results.</p>
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

      {/* ──────────────── COUNTDOWN CTA ──────────────── */}
      <CountdownCTA />

      <Footer />
    </div>
  );
}
