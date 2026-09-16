import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';

import WhatsAppLink from '@/components/ui/WhatsAppLink';

export const metadata: Metadata = {
  title: 'About Us — Real Solar Prices for Nigeria, Built by Nexprove',
  description: 'SolarBuilders.ng gives Nigerians real solar prices and itemised quotes, then gets the system built. Built by Nexprove to solve the trust problem in Nigeria\'s solar industry.',
  alternates: { canonical: 'https://solarbuildersng.com/about' },
};

const FAMILY_HOME = HEADLINE_PACKAGES[2];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      <main>
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
              Nobody publishes what solar{' '}
              <span className="text-[#F59E0B]">actually costs</span>{' '}
              in Nigeria. So we did.
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <p className="text-[#94A3B8] text-xl leading-relaxed">
              SolarBuilders.ng shows you the real price of every part of a solar system, item by item, from Nigerian vendors.
              Then we become the one number you call to get it sourced and installed properly.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* The problem we're solving */}
      <section className="bg-[#FAFAF7] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-4">
              The problem
            </h2>
            <p className="text-[#64748B] text-lg mb-12 max-w-2xl">
              Going solar in Nigeria means asking an installer &ldquo;how much?&rdquo; and having no way to check the answer.
              Because nobody publishes equipment prices, the quote you get depends on who you are, not on what the parts cost.
              The same 5kVA inverter can be listed at more than double the price from one Lagos vendor to the next.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <AnimatedSection delay={75}>
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 card-hover">
                <div className="text-2xl mb-4">😤</div>
                <h3 className="font-heading font-bold text-[#0F172A] text-xl mb-4">What usually happens</h3>
                <ul className="space-y-3">
                  {[
                    'One lump-sum quote with no breakdown — you can\'t tell where the money goes',
                    'Systems oversized to inflate the bill: a 10kVA inverter for a two-bedroom flat',
                    'Prices padded because the installer knows you have nothing to compare against',
                    'WhatsApp vendors who collect a deposit and disappear',
                    'Panels and batteries sold with specs they don\'t meet',
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
                    'An itemised bill of materials: inverter, battery, panels, cables, labour — each priced',
                    'Every price comes from a live Nigerian listing, with the vendor and the date',
                    'A system sized from your actual appliances, not from the installer\'s margin',
                    'A quote code you can download, share, and use to shop around',
                    'One point of contact who sources the equipment and manages the installer',
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

      {/* What we did */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="max-w-xl mb-14">
              <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-4">
                What we did about it
              </h2>
              <p className="text-[#64748B] text-lg">Three things, in this order.</p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                title: 'Researched the real prices',
                desc: `In ${PRICES_LAST_UPDATED_LABEL} we went through the live product pages of 38 Nigerian vendors — Felicity, Zit, Jumia, Jiji, Gennex, Solar Depot, Kasot and more — and recorded about 130 prices for inverters, lithium batteries, panels, cables and protection. Every figure has a source and a date. We refresh them as the market moves.`,
              },
              {
                num: '02',
                title: 'Built a calculator that shows the bill of materials',
                desc: 'Pick your appliances and the calculator sizes the inverter, battery and panels, then prices each line from that research. You see the whole bill — not one number — with a quote code you can download as a PDF and take anywhere.',
              },
              {
                num: '03',
                title: 'Became the one contact that gets it built',
                desc: 'Send us your quote code. We confirm current prices with the vendor, adjust for your roof and what you already own, buy the equipment, and manage a vetted installer through to commissioning. Our sourcing fee is agreed with you before you pay anyone.',
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

      {/* Where the numbers come from */}
      <section className="bg-[#0F172A] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-white text-3xl md:text-4xl mb-4">
              Where our numbers come from
            </h2>
            <p className="text-[#94A3B8] text-lg mb-12">
              Nothing on this site is a guess. These are the inputs behind every quote.
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { stat: '~130', label: 'Live prices recorded', sub: 'inverters, batteries, panels, BOS, labour' },
              { stat: '38', label: 'Nigerian vendors checked', sub: 'Lagos, Abuja and online stores' },
              { stat: PRICES_LAST_UPDATED_LABEL, label: 'Last price refresh', sub: 'shown on every quote' },
            ].map((item, i) => (
              <AnimatedSection key={item.label} delay={(i + 1) * 75 as 75 | 150 | 225 | 300 | 450}>
                <div className="bg-[#1E293B] rounded-2xl p-8 card-hover">
                  <div className="font-heading font-extrabold text-[#F59E0B] text-4xl md:text-5xl mb-2">
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
              For example: a family home with one AC ({FAMILY_HOME.label}) comes out at{' '}
              <span className="text-white font-semibold">{formatNairaShort(FAMILY_HOME.low)}–{formatNairaShort(FAMILY_HOME.high)}</span>{' '}
              installed, depending on brand tier. If someone quotes you far outside that, you now know to ask why.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Who we are */}
      <section className="bg-[#FAFAF7] px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-6">
                Who we are
              </h2>
              <p className="text-[#64748B] text-lg leading-relaxed mb-6">
                SolarBuilders.ng is built and run by{' '}
                <a
                  href="https://www.nexprove.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#0F172A] font-semibold underline decoration-[#F59E0B] underline-offset-2 hover:text-[#F59E0B] transition-colors"
                >
                  Nexprove
                </a>
                , a Lagos product studio. We are based in Gbagada, and the WhatsApp number on this site goes to us, not to a call centre.
              </p>
              <p className="text-[#64748B] text-lg leading-relaxed mb-8">
                We don&rsquo;t manufacture equipment and we don&rsquo;t climb roofs. We do the research, the sizing and the sourcing, and we hold the installer to a commissioning checklist. If the equipment is wrong or the price doesn&rsquo;t match the quote, that&rsquo;s our problem to fix before it becomes yours.
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
                    <p className="text-[#64748B] text-sm">Product studio · Lagos</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    '🏢 Office in Gbagada, Lagos',
                    '⚡ MVP to scale — from idea to product',
                    '🤝 Worked with BASSSE3, BlueTide, Ellum, Simoles',
                  ].map((item) => (
                    <li key={item} className="text-[#64748B] text-sm flex items-start gap-2">
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="font-heading font-semibold text-[#0F172A] text-sm mb-3">How we make money</p>
                <ul className="space-y-3">
                  {[
                    'The calculator and quote are free — no sign-up, no fee',
                    'You pay the vendor and the installer directly',
                    'We charge a sourcing fee, agreed in writing before you pay anyone',
                    'No commission hidden inside the equipment price',
                  ].map((item) => (
                    <li key={item} className="text-[#64748B] text-sm flex items-start gap-2">
                      <span className="text-[#10B981] flex-shrink-0">✓</span>
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
              See what your system really costs
            </h2>
            <p className="text-[#64748B] text-lg mb-8">
              Two minutes in the calculator gets you an itemised quote. Send us the code when you&rsquo;re ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center bg-[#F59E0B] text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-lg btn-primary hover:bg-[#D97706]"
              >
                Get my itemised quote →
              </Link>
              <WhatsAppLink text={'Hi SolarBuilders, I read your About page and want to talk about a solar system.'} placement="about"
                className="inline-flex items-center justify-center border-2 border-[#0F172A] text-[#0F172A] px-8 py-4 rounded-full font-heading font-semibold hover:bg-[#0F172A] hover:text-white transition-all duration-200"
              >
                Chat with us on WhatsApp
              </WhatsAppLink>
            </div>
          </AnimatedSection>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
