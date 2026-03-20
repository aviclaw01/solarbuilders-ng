import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';

export const metadata: Metadata = {
  title: 'About SolarBuilders.ng — Nigeria\'s Verified Solar Marketplace',
  description: 'SolarBuilders.ng is Nigeria\'s first verified solar marketplace. Built by Nexprove to solve the trust problem in Nigeria\'s solar industry.',
  alternates: { canonical: 'https://solarbuilders.ng/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero — dark navy, amber accent */}
      <section className="bg-[#0F172A] px-4 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="inline-block bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-sm font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
              Our Story
            </div>
          </AnimatedSection>
          <AnimatedSection delay={75}>
            <h1 className="font-heading font-extrabold text-white text-5xl md:text-6xl leading-[1.1] mb-6">
              We&rsquo;re building{' '}
              <span className="text-[#F59E0B]">trust</span>{' '}
              into solar in Nigeria.
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <p className="text-[#94A3B8] text-xl leading-relaxed">
              Nigeria has 90 million people without reliable electricity. We&rsquo;re not solving that alone. But we&rsquo;re making sure that every Nigerian who goes solar doesn&rsquo;t get burned by a bad installer.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* The problem we're solving */}
      <section className="bg-[#FAFAF7] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-4">
              The problem we solve
            </h2>
            <p className="text-[#64748B] text-lg mb-12 max-w-2xl">
              The Nigerian solar market is full of demand. It&rsquo;s full of supply. But it&rsquo;s broken by a trust deficit that costs homeowners millions of naira every year.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <AnimatedSection delay={75}>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 card-hover">
                <div className="text-2xl mb-4">😤</div>
                <h3 className="font-heading font-bold text-[#0F172A] text-xl mb-4">Before SolarBuilders.ng</h3>
                <ul className="space-y-3">
                  {[
                    'WhatsApp vendors disappear after payment',
                    'Substandard panels with inflated specs',
                    'No way to verify a contractor\'s track record',
                    'Installations fail within 6 months',
                    'No recourse when things go wrong',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#64748B]">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            {/* After */}
            <AnimatedSection delay={150}>
              <div className="bg-white rounded-2xl border-2 border-[#10B981] p-8 card-hover">
                <div className="text-2xl mb-4">✅</div>
                <h3 className="font-heading font-bold text-[#0F172A] text-xl mb-4">With SolarBuilders.ng</h3>
                <ul className="space-y-3">
                  {[
                    'Every builder vetted by our team personally',
                    'Customer references called — not just checked',
                    'Real portfolios, real installations, real people',
                    'Badge revoked if quality drops',
                    'Free calculator, no commission, no middlemen',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#0F172A]">
                      <span className="text-[#10B981] mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How verification works */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="max-w-xl mb-14">
              <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-4">
                How verification works
              </h2>
              <p className="text-[#64748B] text-lg">Three steps. No shortcuts.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Apply',
                desc: 'Installers submit business details, experience history, equipment brands used, and at least 3 verifiable customer references. We review everything before scheduling a call.',
              },
              {
                num: '02',
                title: 'Background Check',
                desc: 'Our team calls the applicant and their references. We ask about recent installations, how they handle issues, equipment sourcing, and whether they carry genuine products.',
              },
              {
                num: '03',
                title: 'Live on Platform',
                desc: 'Approved builders get the Verified badge. But it\'s not permanent — we monitor reviews. Builders who accumulate complaints lose the badge. Strictness is the product.',
              },
            ].map((step, i) => (
              <AnimatedSection key={step.num} delay={(i + 1) * 75 as 75 | 150 | 225 | 300 | 450}>
                <div className="bg-[#FAFAF7] rounded-2xl p-8 card-hover h-full">
                  <div className="font-heading font-extrabold text-[#F59E0B] text-5xl mb-5 leading-none">
                    {step.num}
                  </div>
                  <h3 className="font-heading font-bold text-[#0F172A] text-xl mb-3">{step.title}</h3>
                  <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers that matter */}
      <section className="bg-[#0F172A] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-white text-3xl md:text-4xl mb-4">
              Numbers that matter
            </h2>
            <p className="text-[#94A3B8] text-lg mb-12">
              We keep these numbers low on purpose. That&rsquo;s the point.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: '23', label: 'Companies audited', sub: 'and counting' },
              { stat: '8', label: 'Verified and live', sub: 'on the platform today' },
              { stat: '15', label: 'Rejected applications', sub: 'because standards matter' },
            ].map((item, i) => (
              <AnimatedSection key={item.label} delay={(i + 1) * 75 as 75 | 150 | 225 | 300 | 450}>
                <div className="bg-[#1E293B] rounded-2xl p-8 card-hover">
                  <div className="font-heading font-extrabold text-[#F59E0B] text-5xl mb-2">
                    {item.stat}
                  </div>
                  <p className="font-heading font-semibold text-white text-lg">{item.label}</p>
                  <p className="text-[#64748B] text-sm mt-1">{item.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <AnimatedSection delay={300}>
            <p className="text-[#94A3B8] text-lg mt-10 max-w-2xl">
              &ldquo;23 companies audited. 8 verified. That&rsquo;s on purpose.&rdquo; The strictness IS the product. A badge that&rsquo;s easy to get isn&rsquo;t worth having.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* The team behind it */}
      <section className="bg-[#FAFAF7] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-6">
                The team behind it
              </h2>
              <p className="text-[#64748B] text-lg leading-relaxed mb-6">
                SolarBuilders.ng is a product of{' '}
                <a
                  href="https://www.nexprove.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F172A] font-semibold underline decoration-[#F59E0B] underline-offset-2 hover:text-[#F59E0B] transition-colors"
                >
                  Nexprove
                </a>{' '}
                — the product studio that builds trust-first marketplaces. We fix trust problems with technology and verification.
              </p>
              <p className="text-[#64748B] text-lg leading-relaxed mb-8">
                We saw a market full of demand, full of supply, but broken by a trust deficit. We know how to fix that. It&rsquo;s what we do.
              </p>
              <a
                href="https://www.nexprove.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-7 py-3.5 rounded-full font-heading font-semibold btn-primary hover:bg-[#1E293B]"
              >
                Visit Nexprove →
              </a>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 card-hover">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[#F59E0B] flex items-center justify-center text-[#0F172A] font-bold text-lg">N</div>
                  <div>
                    <p className="font-heading font-bold text-[#0F172A]">Nexprove</p>
                    <p className="text-[#64748B] text-sm">Premium Product Development Studio</p>
                  </div>
                </div>
                <ul className="space-y-3">
                  {[
                    '🏢 Offices in Lagos, Toronto, New York & Berlin',
                    '🛡️ Trust-first marketplace specialists',
                    '⚡ MVP to scale — from idea to product',
                    '🤝 Worked with BASSSE3, BlueTide, Ellum, Simoles',
                  ].map((item) => (
                    <li key={item} className="text-[#64748B] text-sm flex items-start gap-2">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white px-4 py-16 md:py-20">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-4">
              Think you qualify?
            </h2>
            <p className="text-[#64748B] text-lg mb-8">
              Apply to list your company. We review every application personally.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/for-builders"
                className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-lg btn-primary hover:bg-[#D97706]"
              >
                Apply to List Your Company →
              </Link>
              <Link
                href="/marketplace"
                className="inline-flex items-center justify-center border-2 border-[#0F172A] text-[#0F172A] px-8 py-4 rounded-full font-heading font-semibold hover:bg-[#0F172A] hover:text-white transition-all duration-200"
              >
                Browse Verified Builders
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
