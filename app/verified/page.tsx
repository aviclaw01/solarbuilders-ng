import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { ShieldCheck, FileCheck, Users, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nexprove Verified — SolarBuilders.ng',
  description: 'What the Nexprove Verified badge means, how builders earn it, and why it matters when choosing a solar installer in Nigeria.',
  alternates: { canonical: 'https://solarbuildersng.com/verified' },
};

const WHAT_IT_MEANS = [
  {
    icon: FileCheck,
    title: 'Background checked',
    description: 'We verify business registration, CAC documents, and operating history before any listing goes live.',
  },
  {
    icon: ShieldCheck,
    title: 'Credentials reviewed',
    description: 'Technical qualifications, equipment brands used, and installer experience are all manually reviewed.',
  },
  {
    icon: Users,
    title: 'Customer references',
    description: 'We contact past customers directly to confirm quality of work and post-installation support.',
  },
];

const VERIFICATION_STEPS = [
  {
    step: '01',
    title: 'Submit your application',
    description: 'Fill in your company details, upload your CAC certificate, and list your key projects via the For Builders form.',
  },
  {
    step: '02',
    title: 'Nexprove review',
    description: 'Our team reviews your documents, speaks with references, and assesses your technical capability. Usually completed within 5 business days.',
  },
  {
    step: '03',
    title: 'Go live with the badge',
    description: 'Approved companies get the Nexprove Verified badge on their profile, visible to every buyer searching in your city.',
  },
];

export default function VerifiedPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-slate-100 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-2 mb-6">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 font-semibold text-sm">Nexprove Verified</span>
            </div>
            <h1 className="font-heading font-extrabold text-[#0F172A] text-4xl md:text-5xl mb-4 leading-tight">
              What the badge really means
            </h1>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Not every solar company in Nigeria is equal. The Nexprove Verified badge tells you which ones have been checked — so you don&apos;t have to guess.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* What it means */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-bold text-[#0F172A] text-3xl mb-10 text-center">
              Three things we check
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {WHAT_IT_MEANS.map(({ icon: Icon, title, description }, i) => (
              <AnimatedSection key={title} delay={i === 0 ? 75 : i === 1 ? 150 : 300}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <h3 className="font-heading font-bold text-[#0F172A] text-lg mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="py-16 px-6 bg-white border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-bold text-[#0F172A] text-3xl mb-6 text-center">
              Why it matters
            </h2>
            <div className="space-y-4">
              {[
                'Solar is a 5–15 year commitment. A bad installer can cost you ₦500k+ in repairs.',
                'Nigeria has no official solar installer licensing body. Verification is voluntary — which is why we do it.',
                'Verified builders close 3× more leads on average, because buyers trust the badge.',
              ].map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-base">{point}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Verification process */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <h2 className="font-heading font-bold text-[#0F172A] text-3xl mb-10 text-center">
              The verification process
            </h2>
          </AnimatedSection>
          <div className="space-y-4">
            {VERIFICATION_STEPS.map(({ step, title, description }, i) => (
              <AnimatedSection key={step} delay={i === 0 ? 75 : i === 1 ? 150 : 300}>
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-5">
                  <span className="font-heading font-black text-slate-200 text-3xl leading-none flex-shrink-0 w-10">{step}</span>
                  <div>
                    <h3 className="font-heading font-bold text-[#0F172A] text-lg mb-1">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection delay={450}>
            <div className="bg-[#0F172A] rounded-2xl p-10 text-center">
              <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h2 className="font-heading font-extrabold text-white text-3xl mb-3">
                Ready to get verified?
              </h2>
              <p className="text-slate-400 mb-8 text-lg">
                List your company free, then apply for verification from your profile.
              </p>
              <Link
                href="/for-builders"
                className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] px-8 py-4 rounded-full font-heading font-bold text-lg transition-colors"
              >
                Get Listed Free <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
