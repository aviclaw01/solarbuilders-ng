import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';

import WhatsAppLink from '@/components/ui/WhatsAppLink';
import { Calculator, FileText, MessageCircle, ClipboardCheck, Wallet, Wrench, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — Itemised Quote, We Buy It, We Build It',
  description: `Pick your appliances, get an itemised solar quote priced from live Nigerian listings (${PRICES_LAST_UPDATED_LABEL}), send us the quote code, and we order the equipment at the market price and put a vetted installer on the job until commissioning.`,
  alternates: { canonical: 'https://solarbuildersng.com/how-it-works' },
};

const STEPS = [
  {
    step: '01',
    icon: Calculator,
    title: 'Pick your appliances in the calculator',
    description:
      'Tick what you run at home or in the office — ACs, fridge, freezer, TV, pumping machine, lights — and how many hours a day. Two minutes, free, no sign-up.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    step: '02',
    icon: FileText,
    title: 'Get an itemised quote',
    description: `Not one vague number. You see the inverter, the lithium battery, the panels, cables and protection, and labour — each line priced from live Nigerian vendor listings as of ${PRICES_LAST_UPDATED_LABEL}. Every quote gets a code (SB-…) and you can download it as a PDF or image.`,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    step: '03',
    icon: MessageCircle,
    title: 'Send us the code on WhatsApp',
    description:
      'One tap from the quote opens WhatsApp with your quote code already filled in. Or email it to us. That code lets us pull up your exact system and prices.',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
  {
    step: '04',
    icon: ClipboardCheck,
    title: 'We confirm today’s price',
    description:
      'Prices move with the naira and with stock, so we check the current figure with the distributor before anything is agreed. Then we adjust for your roof, your location and anything you already own (an inverter, a changeover, existing wiring) and give you one final number that includes workmanship. Nothing appears later.',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    step: '05',
    icon: Wallet,
    title: 'We order it at the market price',
    description:
      'You pay what the equipment sells for in Nigeria — the same figure we publish on the brand pages — and we place the order ourselves. We do not add a fee on top of your bill. Our margin comes from the trade terms we hold with distributors, so we earn on the buying, not on marking you up.',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    step: '06',
    icon: Wrench,
    title: 'A vetted installer fits it, and the paperwork is yours',
    description:
      'We put a vetted installer on the job and stay on it: photos from site as the work progresses, a commissioning checklist before you sign off, and the equipment warranty paperwork registered in your name, not ours. If something fails later, you are the one holding the warranty.',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
];

const FAQS = [
  {
    q: 'Do I pay SolarBuilders.ng?',
    a: 'You pay the market price for the equipment — the same Nigerian price we publish on the brand pages — plus the installer’s labour. We do not add a fee on top of your bill. Our margin comes from the trade terms we hold with distributors, so we earn on the buying rather than by marking you up. The calculator and the quote are free.',
  },
  {
    q: 'Can I buy the equipment myself?',
    a: 'Yes. The quote is an itemised bill of materials with every spec written out, so you can take it to any installer you already trust or shop it around yourself. Nothing on it is locked to us.',
  },
  {
    q: 'Is the price on the quote final?',
    a: `No. It is an estimate built from Nigerian listings as of ${PRICES_LAST_UPDATED_LABEL}. Prices move with the naira and with stock, so we confirm today’s figure with the distributor before you pay anything, and you hear it from us if it moved.`,
  },
  {
    q: 'What does a typical system cost?',
    a: `As of ${PRICES_LAST_UPDATED_LABEL}, a no-AC home starts around ${formatNairaShort(HEADLINE_PACKAGES[0].low)}, a family home with one AC (5kVA, 10kWh lithium) runs ${formatNairaShort(HEADLINE_PACKAGES[2].low)}–${formatNairaShort(HEADLINE_PACKAGES[2].high)} installed, and an office with 20–30kWh of storage is ${formatNairaShort(HEADLINE_PACKAGES[4].low)}–${formatNairaShort(HEADLINE_PACKAGES[4].high)}. The calculator gives you your own number.`,
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const DELAYS = [75, 150, 225, 300, 450, 450] as const;

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      <main>
      {/* Hero */}
      <section className="bg-white border-b border-slate-100 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-amber-600 font-semibold text-sm tracking-wide uppercase mb-3">How it works</p>
            <h1 className="font-heading font-extrabold text-[#0F172A] text-4xl md:text-5xl mb-4 leading-tight">
              Real prices first. Then we get it built.
            </h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Size your system, see exactly what each part costs in Nigeria, and send us the quote code. We buy it at
              that price, put a vetted installer on the job, and stay with it to commissioning.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {STEPS.map(({ step, icon: Icon, title, description, iconBg, iconColor }, i) => (
              <AnimatedSection key={step} delay={DELAYS[i]}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col md:flex-row items-start gap-6">
                  {/* Step number + icon */}
                  <div className="flex items-center gap-4 md:flex-col md:items-center md:min-w-[80px]">
                    <span className="font-heading font-black text-slate-200 text-4xl leading-none">{step}</span>
                    <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                  {/* Content */}
                  <div>
                    <h2 className="font-heading font-bold text-[#0F172A] text-2xl mb-2">{title}</h2>
                    <p className="text-slate-500 text-base leading-relaxed">{description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* What it costs */}
      <section className="bg-white border-y border-slate-100 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-3">
              What it costs
            </h2>
            <p className="text-slate-500 text-lg mb-10 max-w-2xl">
              Installed ranges from our quote engine, using vendor listings as of {PRICES_LAST_UPDATED_LABEL}.
              Where you land inside a range depends on brand tier (Felicity vs Growatt vs Deye), your roof and your city.
            </p>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#FAFAF7] text-slate-500 uppercase tracking-wide text-xs">
                  <tr>
                    <th className="px-5 py-3 font-semibold">System</th>
                    <th className="px-5 py-3 font-semibold">Runs</th>
                    <th className="px-5 py-3 font-semibold text-right whitespace-nowrap">Installed (₦)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {HEADLINE_PACKAGES.map((p) => (
                    <tr key={p.label}>
                      <td className="px-5 py-4 font-heading font-semibold text-[#0F172A] whitespace-nowrap">{p.label}</td>
                      <td className="px-5 py-4 text-slate-500">{p.powers}</td>
                      <td className="px-5 py-4 text-right font-semibold text-[#0F172A] whitespace-nowrap">
                        {formatNairaShort(p.low)} – {formatNairaShort(p.high)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-slate-400 text-sm mt-4">
              Estimates, not final prices. Equipment carries 0% import duty and is VAT-exempt in Nigeria; labour is included in these ranges.
              We confirm today’s figure with the distributor before you pay, and you pay that market price — our margin sits in our trade terms, not on top of your bill.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-extrabold text-[#0F172A] text-3xl md:text-4xl mb-10">
              Questions people ask us
            </h2>
          </AnimatedSection>
          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <AnimatedSection key={f.q} delay={DELAYS[Math.min(i, DELAYS.length - 1)]}>
                <details className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-heading font-bold text-[#0F172A] text-lg">
                    {f.q}
                    <span className="text-amber-500 text-2xl leading-none transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="text-slate-500 leading-relaxed mt-4">{f.a}</p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={300}>
            <div className="bg-[#0F172A] rounded-2xl p-10 text-center">
              <h2 className="font-heading font-extrabold text-white text-3xl mb-3">
                Start with your appliances
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Two minutes to an itemised quote you can download and send to us — or to anyone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
                >
                  Get my itemised quote <ArrowRight className="w-5 h-5" />
                </Link>
                <WhatsAppLink text={'Hi SolarBuilders, I read how it works and have a question before I run the calculator.'} placement="how_it_works"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white px-8 py-4 rounded-full font-heading font-semibold text-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" /> Ask us first
                </WhatsAppLink>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
