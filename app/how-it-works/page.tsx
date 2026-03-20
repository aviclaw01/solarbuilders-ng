import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { Calculator, Search, MessageCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'How It Works — SolarBuilders.ng',
  description: 'Size your system, browse verified solar builders in Nigeria, and connect directly on WhatsApp. No middleman.',
  alternates: { canonical: 'https://solarbuildersng.com/how-it-works' },
};

const STEPS = [
  {
    step: '01',
    icon: Calculator,
    title: 'Size your system',
    description: 'Use the free calculator to find out your exact kVA requirement and estimated cost range — in under 2 minutes.',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    step: '02',
    icon: Search,
    title: 'Browse verified builders',
    description: 'Filter by city, system size, and budget. Every listed company has been reviewed by the Nexprove team.',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    step: '03',
    icon: MessageCircle,
    title: 'Contact directly on WhatsApp',
    description: 'No forms, no waiting. Chat directly with the builder, get quotes, and negotiate terms — zero commission.',
    iconBg: 'bg-green-50',
    iconColor: 'text-green-600',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-slate-100 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <p className="text-amber-600 font-semibold text-sm tracking-wide uppercase mb-3">How it works</p>
            <h1 className="font-heading font-extrabold text-[#0F172A] text-4xl md:text-5xl mb-4 leading-tight">
              Go solar in 3 simple steps
            </h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              From calculator to contractor — the fastest way to find a trusted solar installer in Nigeria.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6">
            {STEPS.map(({ step, icon: Icon, title, description, iconBg, iconColor }, i) => (
              <AnimatedSection key={step} delay={i === 0 ? 75 : i === 1 ? 150 : 300}>
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

          {/* Connector lines (visual only, hidden on mobile) */}
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={450}>
            <div className="bg-[#0F172A] rounded-2xl p-10 text-center">
              <h2 className="font-heading font-extrabold text-white text-3xl mb-3">
                Ready to get started?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                Find out what size system you need — takes less than 2 minutes.
              </p>
              <Link
                href="/calculator"
                className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
              >
                Start with the calculator <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
