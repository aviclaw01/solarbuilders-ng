import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'About SolarBuilders.ng — Nigeria\'s Verified Solar Marketplace',
  description: 'SolarBuilders.ng is Nigeria\'s first verified solar marketplace. Built by Nexprove to solve the trust problem in Nigeria\'s solar industry.',
  alternates: { canonical: 'https://solarbuilders.ng/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-[#E2E8F0] px-4 py-20 md:py-28">
        <div className="max-w-7xl mx-auto max-w-3xl">
          <h1 className="font-heading font-extrabold text-[#0A0F1E] text-5xl md:text-6xl leading-tight mb-6">
            Nigeria deserves a solar market it can trust.
          </h1>
          <p className="text-[#64748B] text-xl leading-relaxed">
            We built SolarBuilders.ng because the alternative was unacceptable: Nigerians spending ₦400,000+ on solar systems from unvetted WhatsApp vendors, getting substandard installs, and losing money with no recourse. There&apos;s a better way.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="bg-[#F8FAFC] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto max-w-3xl">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-6">Our Mission</h2>
          <p className="text-[#64748B] text-lg leading-relaxed mb-6">
            We believe every Nigerian home and business should have access to reliable, affordable solar energy — and that going solar should not require gambling with your savings on an unproven installer.
          </p>
          <p className="text-[#64748B] text-lg leading-relaxed mb-6">
            SolarBuilders.ng is built on one principle: trust through verification. Every builder on our platform has been reviewed by the Nexprove team. We check their experience, their equipment sourcing, their customer history, and their physical presence. We don&apos;t just list anyone.
          </p>
          <p className="text-[#64748B] text-lg leading-relaxed">
            We also believe in transparency. Our calculator is free. There&apos;s no commission on jobs. We make money from installer listings — so our incentive is to only list good installers, because our reputation depends on their quality.
          </p>
        </div>
      </section>

      {/* Nexprove Verified Process */}
      <section className="bg-white px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mb-12">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-4xl mb-4">
              How Nexprove Verified works
            </h2>
            <p className="text-[#64748B] text-lg">Three steps. No shortcuts.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Apply',
                desc: 'Installers submit their business details, experience history, equipment brands used, and at least 3 verifiable customer references. We review everything before scheduling a call.',
              },
              {
                num: '02',
                title: 'Verification Call',
                desc: 'Our team calls the applicant and their references. We ask about their most recent installations, how they handle issues, what equipment they source, and whether they carry genuine products.',
              },
              {
                num: '03',
                title: 'Approved — and Monitored',
                desc: 'Approved builders get the Verified badge. But it\'s not permanent — we monitor reviews and customer feedback. Builders who accumulate complaints lose the badge.',
              },
            ].map(step => (
              <div key={step.num} className="border border-[#E2E8F0] rounded-2xl p-8">
                <div className="font-heading font-extrabold text-[#F59E0B] text-5xl mb-4 leading-none">{step.num}</div>
                <h3 className="font-heading font-bold text-[#0A0F1E] text-xl mb-3">{step.title}</h3>
                <p className="text-[#64748B] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nexprove Brand */}
      <section className="bg-[#0A0F1E] px-4 py-16 md:py-20">
        <div className="max-w-7xl mx-auto max-w-3xl">
          <h2 className="font-heading font-extrabold text-white text-3xl md:text-4xl mb-6">
            Built by Nexprove
          </h2>
          <p className="text-[#94A3B8] text-lg leading-relaxed mb-6">
            SolarBuilders.ng is a product of Nexprove — Nigeria&apos;s premium product studio. Nexprove builds digital products that solve real problems in the Nigerian market, with offices in Lagos, Toronto, New York, and Berlin.
          </p>
          <p className="text-[#94A3B8] text-lg leading-relaxed mb-8">
            We built SolarBuilders.ng because we saw a gap: a market full of demand, full of supply, but broken by a trust deficit. We fix trust problems with technology and verification. That&apos;s what we do.
          </p>
          <a href="https://www.nexprove.com" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border-2 border-white text-white px-7 py-3.5 rounded-full font-heading font-semibold hover:bg-white hover:text-[#0A0F1E] transition-colors">
            Visit Nexprove →
          </a>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#F8FAFC] px-4 py-16">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading font-extrabold text-[#0A0F1E] text-3xl mb-4">Ready to go solar?</h2>
          <p className="text-[#64748B] mb-8">Start with our free calculator. Know what you need before talking to any installer.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/calculator" className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-bold hover:bg-[#D97706] transition-colors">
              Calculate My System →
            </Link>
            <Link href="/for-builders" className="inline-flex items-center justify-center border-2 border-[#0A0F1E] text-[#0A0F1E] px-7 py-3.5 rounded-full font-heading font-semibold hover:bg-[#0A0F1E] hover:text-white transition-colors">
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
