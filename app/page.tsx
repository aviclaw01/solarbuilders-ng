import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { BUILDERS, formatNaira } from '@/lib/mock-data';
import { CheckCircle, Zap, Search, MessageCircle, Star, MapPin, ArrowRight, Globe } from 'lucide-react';

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 bg-[#10B981] text-white text-xs font-semibold px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Nexprove Verified
    </span>
  );
}

function BuilderCard({ builder }: { builder: typeof BUILDERS[0] }) {
  const waLink = `https://wa.me/${builder.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on SolarBuilders.ng. I\'m interested in a solar installation.')}`;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden min-w-[260px] w-[260px] flex-shrink-0 md:min-w-0 md:w-auto">
      <div className="aspect-[4/3] overflow-hidden bg-[#E2E8F0]">
        <img
          src={builder.coverImage}
          alt={builder.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {builder.verified && <VerifiedBadge />}
        </div>
        <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg mb-1">{builder.name}</h3>
        <div className="flex items-center gap-1 text-[#64748B] text-sm mb-2">
          <MapPin className="w-3.5 h-3.5" />
          <span>{builder.location}, {builder.state}</span>
        </div>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 text-[#F59E0B] fill-current" />
          <span className="font-semibold text-sm text-[#0F172A]">{builder.rating}</span>
          <span className="text-[#64748B] text-sm">({builder.reviewCount} reviews)</span>
        </div>
        <p className="text-[#F59E0B] font-bold text-base mb-3">
          From {formatNaira(builder.startingPrice)}
        </p>
        <div className="flex gap-2">
          <Link href={`/builders/${builder.slug}`}
            className="flex-1 border border-[#0F172A] text-[#0F172A] text-sm font-semibold py-2 rounded-lg text-center hover:bg-[#0F172A] hover:text-white transition-colors">
            View Profile
          </Link>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="flex-1 bg-[#25D366] text-white text-sm font-semibold py-2 rounded-lg text-center hover:bg-[#22c55e] transition-colors">
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const featuredBuilders = BUILDERS.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* HERO */}
      <section className="bg-[#0F172A] px-4 py-16 md:py-24">
        <div className="max-w-7xl mx-auto md:grid md:grid-cols-2 md:gap-12 md:items-center">
          <div>
            <h1 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
              Nigeria&apos;s Solar<br />Marketplace.
            </h1>
            <p className="text-[#94A3B8] text-lg md:text-xl leading-relaxed mb-8">
              Find out exactly what you need.<br className="hidden md:block" />
              Then find someone you can trust to build it.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/calculator"
                className="flex items-center justify-center gap-2 bg-[#F59E0B] text-[#0F172A] px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#D97706] transition-colors"
                style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
              >
                <Zap className="w-5 h-5" fill="currentColor" />
                Calculate My Load
              </Link>
              <Link
                href="/marketplace"
                className="flex items-center justify-center gap-2 border border-[#94A3B8] text-[#94A3B8] px-6 py-4 rounded-lg font-semibold hover:border-white hover:text-white transition-colors"
              >
                Browse verified builders →
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              {[
                '47 verified builders across Nigeria',
                'Free calculator, no signup needed',
                'WhatsApp-native contact — no forms',
              ].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span className="text-[#94A3B8] text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero image */}
          <div className="hidden md:block mt-8 md:mt-0">
            <div className="rounded-2xl overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop&q=80"
                alt="Solar panels installed on Nigerian home"
                className="w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 px-4 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-3xl md:text-4xl font-bold text-[#0F172A] text-center mb-3">
            Nigeria&apos;s solar marketplace, made simple.
          </h2>
          <p className="text-center text-[#64748B] mb-12">Three steps to go solar</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-8 h-8 text-[#F59E0B]" fill="currentColor" />,
                step: '1',
                title: 'Calculate your load',
                desc: 'Tell us what appliances you run. We calculate exactly what system size you need — in seconds.',
              },
              {
                icon: <Search className="w-8 h-8 text-[#F59E0B]" />,
                step: '2',
                title: 'Match with verified builders',
                desc: 'See builders who can handle your exact system, near you, with real reviews from real customers.',
              },
              {
                icon: <MessageCircle className="w-8 h-8 text-[#F59E0B]" />,
                step: '3',
                title: 'Contact directly on WhatsApp',
                desc: 'No middleman. One tap. Their number, your message, your job. Nigeria runs on WhatsApp.',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 shadow-sm">
                <div className="mb-4">{item.icon}</div>
                <div className="w-7 h-7 bg-[#F59E0B] rounded-full flex items-center justify-center mb-3">
                  <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-[#0F172A] font-bold text-sm">{item.step}</span>
                </div>
                <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl mb-2">{item.title}</h3>
                <p className="text-[#64748B] text-base leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="bg-[#0F172A] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { number: '47+', label: 'Verified Builders' },
              { number: '4.8★', label: 'Average Rating' },
              { number: 'Free', label: 'Calculator Tool' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-3xl md:text-4xl font-extrabold text-[#F59E0B] mb-1">
                  {stat.number}
                </div>
                <div className="text-[#94A3B8] text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR CTA */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 shadow-sm">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl font-bold text-[#0F172A] mb-2">What do you run at home?</h2>
          <p className="text-[#64748B] mb-6">Tell us your appliances. We&apos;ll tell you exactly what system you need and what it costs.</p>
          <div className="text-3xl mb-6 flex flex-wrap gap-3">
            {['🌬️', '❄️', '🧊', '📺', '💡', '📱', '💻', '🚿'].map((emoji) => (
              <span key={emoji}>{emoji}</span>
            ))}
          </div>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#D97706] transition-colors w-full justify-center"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <Zap className="w-5 h-5" fill="currentColor" />
            Calculate My System Size →
          </Link>
        </div>
      </section>

      {/* FEATURED BUILDERS */}
      <section className="py-12 px-4 bg-[#FAFAF7]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl md:text-3xl font-bold text-[#0F172A]">
              Verified builders near you
            </h2>
            <Link href="/marketplace" className="text-[#F59E0B] font-semibold text-sm hover:underline flex items-center gap-1">
              Browse all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile: horizontal scroll, Desktop: grid */}
          <div className="flex gap-4 overflow-x-auto hide-scrollbar md:grid md:grid-cols-4 md:overflow-visible pb-2">
            {featuredBuilders.map((builder) => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </div>
        </div>
      </section>

      {/* DIASPORA CALLOUT */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto bg-[#0F172A] rounded-2xl p-8 md:p-12">
          <div className="text-4xl mb-4">🌍</div>
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl md:text-3xl font-bold text-white mb-4">
            Based in London, Toronto, or elsewhere?
          </h2>
          <p className="text-[#94A3B8] text-lg leading-relaxed mb-8">
            Your mum is running a generator 18 hours a day. You&apos;ve been meaning to fix it.
            Now you can — from wherever you are. Find a verified builder, commission via WhatsApp,
            stay in the loop at every step.
          </p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#D97706] transition-colors"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <Globe className="w-5 h-5" />
            Power the home you left behind →
          </Link>
        </div>
      </section>

      {/* FOR BUILDERS CTA */}
      <section className="py-12 px-4 border-t border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="text-2xl md:text-3xl font-bold text-[#0F172A] mb-3">
            Are you a solar installer?
          </h2>
          <p className="text-[#64748B] text-lg mb-6">
            Get matched to customers in your area automatically.<br />
            First 20 builders get the Verified badge free.
          </p>
          <Link
            href="/for-builders"
            className="inline-flex items-center gap-2 border-2 border-[#F59E0B] text-[#F59E0B] px-6 py-4 rounded-lg font-bold text-lg hover:bg-[#F59E0B] hover:text-[#0F172A] transition-colors"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            List Your Business Free →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
