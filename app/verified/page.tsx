import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

import WhatsAppLink from '@/components/ui/WhatsAppLink';
import {
  ShieldCheck, FileCheck, Camera, Users, FileText, Phone, MapPin, ClipboardCheck,
  ArrowRight, CheckCircle, XCircle, MessageCircle, Store,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Vet Installers and Vendors — SolarBuilders.ng',
  description:
    'The checks every installer passes before we put them on a customer build, what we do on every job from price confirmation to commissioning, and what we never do. No paid badges, no listing fees.',
  keywords: ['vetted solar installer Nigeria', 'how to check a solar installer', 'solar installer CAC registration', 'solar workmanship warranty Nigeria'],
  openGraph: {
    title: 'How We Vet Installers and Vendors | SolarBuilders.ng',
    description: 'CAC, past installs with photos, references we call, a written warranty. Then we stay on the job until commissioning.',
    url: 'https://solarbuildersng.com/verified',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/verified' },
};

const INSTALLER_CHECKS = [
  {
    icon: FileCheck,
    title: 'CAC registration',
    description: 'A registered business name or company. We take the number and check it. No registration, no jobs.',
  },
  {
    icon: Camera,
    title: 'Three past installs, with photos',
    description: 'Real sites, not brochure shots. We want to see the inverter room, the battery bank and the roof, and we ask to speak to at least one of those customers.',
  },
  {
    icon: Users,
    title: 'Two customer references',
    description: 'We call them. Did the system do what was promised, was the site left tidy, did the installer come back when called.',
  },
  {
    icon: FileText,
    title: 'A written workmanship warranty',
    description: 'On paper, with the terms spelled out. It goes into the handover pack the customer receives, next to the equipment warranties.',
  },
];

const ON_EVERY_JOB = [
  {
    icon: Phone,
    title: 'Prices confirmed with the vendor before you pay',
    description: 'Your quote carries the prices we saw on the day it was made. Before any money moves we call the vendor and confirm today\'s price and stock. If it moved, you hear it from us first.',
  },
  {
    icon: MapPin,
    title: 'Site survey',
    description: 'Roof, cable runs, where the inverter and batteries will sit, how the changeover is wired. The installer joins the survey so there are no surprises on install day.',
  },
  {
    icon: Camera,
    title: 'Photos from site on WhatsApp',
    description: 'Mounting, wiring, battery bank, earthing, labelling. You see the job as it happens, whether you are in the house or in another country.',
  },
  {
    icon: ClipboardCheck,
    title: 'Commissioning checklist',
    description: 'Every string tested, battery settings confirmed, load test under real appliances, app set up on your phone. Signed off before we call it done.',
  },
  {
    icon: FileText,
    title: 'Warranty paperwork',
    description: 'Equipment warranties from the vendor, the installer\'s workmanship warranty, serial numbers, and your quote code in one handover pack.',
  },
];

const WE_DONT = [
  'We do not sell equipment ourselves. It comes from vendors on the brands page, at a price we confirm with them, so there is no margin hiding in a mystery bundle.',
  'We do not take money for listings, badges or placement. There is nothing for an installer or vendor to buy here.',
  'We do not send an installer we have not checked, and we do not stop at the referral. We stay on the job until commissioning.',
  'We do not guess prices. Every naira figure on this site carries the date we saw it.',
];

function fmtMillions(n: number) {
  return `₦${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

export default function VerifiedPage() {
  const smallest = HEADLINE_PACKAGES[0];
  const largeHome = HEADLINE_PACKAGES[3];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-slate-100 px-6 py-14 md:py-20">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">How we vet</span>
              <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mt-3 mb-4 max-w-3xl">
                How we vet installers and vendors
              </h1>
              <p className="text-slate-500 text-lg max-w-2xl">
                Nigeria has no licensing body for solar installers. So before anyone touches a roof on our behalf, they go
                through the checks below, and we stay on the job until commissioning.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/calculator"
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Get an itemised quote <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/for-builders"
                  className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 font-semibold text-sm transition-colors min-h-[44px]"
                >
                  Installer or vendor? Work with us
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Installer checklist */}
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">
                Four things every installer passes first
              </h2>
              <p className="text-slate-500 mb-8 max-w-2xl">
                Before an installer gets their first job from us. No exceptions for friends of friends.
              </p>
            </AnimatedSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INSTALLER_CHECKS.map(({ icon: Icon, title, description }, i) => (
                <AnimatedSection key={title} delay={i % 2 === 0 ? 75 : 150}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full">
                    <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-heading font-bold text-slate-900 text-lg mb-2">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Vendors */}
        <section className="px-6 pb-14">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-start">
                <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-heading font-extrabold text-slate-900 text-2xl mb-2">And the vendors on the brands page</h2>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4 max-w-2xl">
                    Vendors and distributors are listed free, with their public prices and the date we saw each one. A listing is
                    not an endorsement. The price that counts is the one we confirm with them by phone on the day you buy. Vendors
                    whose prices go stale get pulled.
                  </p>
                  <ul className="space-y-2">
                    {[
                      'Public price list or catalogue we can link to',
                      'CAC registration',
                      'Contact details as they publish them, so you can check us against them',
                      `Prices dated (currently ${PRICES_LAST_UPDATED_LABEL}) and re-checked before every purchase`,
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2 text-slate-700 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/brands" className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold mt-4 hover:underline underline-offset-4 min-h-[44px]">
                    See brands and vendors <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* On every job */}
        <section className="px-6 py-14 bg-slate-50 border-y border-slate-100">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">What we do on every job</h2>
              <p className="text-slate-500 mb-8 max-w-2xl">
                Vetting gets an installer in the door. This is what keeps the job honest from your quote code to handover.
              </p>
            </AnimatedSection>
            <div className="space-y-4">
              {ON_EVERY_JOB.map(({ icon: Icon, title, description }, i) => (
                <AnimatedSection key={title} delay={i === 0 ? 75 : i === 1 ? 150 : i === 2 ? 225 : 300}>
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-start gap-5">
                    <div className="flex-shrink-0 flex items-center gap-4">
                      <span className="font-heading font-black text-slate-200 text-3xl leading-none w-10">0{i + 1}</span>
                      <div className="w-11 h-11 bg-amber-50 rounded-xl hidden sm:flex items-center justify-center">
                        <Icon className="w-5 h-5 text-amber-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">{title}</h3>
                      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
            <AnimatedSection>
              <p className="text-slate-500 text-sm mt-6 max-w-2xl">
                For scale: installed systems we quote run from about {fmtMillions(smallest.low)} for a {smallest.label} starter to{' '}
                {fmtMillions(largeHome.high)} for a {largeHome.label} home, at {PRICES_LAST_UPDATED_LABEL} prices. That is enough
                money to deserve this much care.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* What we don't do */}
        <section className="px-6 py-14">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection>
              <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-8">What we do not do</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {WE_DONT.map((t) => (
                  <div key={t} className="flex items-start gap-3 bg-white rounded-2xl border border-slate-200 p-5">
                    <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-slate-700 text-sm leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection delay={300}>
              <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-center">
                <ShieldCheck className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h2 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
                  Start with the numbers
                </h2>
                <p className="text-slate-300 max-w-xl mx-auto mb-6">
                  Size your system, get an itemised quote with a code, then send it to us. We confirm the prices, source the
                  equipment and put a vetted installer on it.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href="/calculator"
                    className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-full px-8 py-4 font-heading font-bold transition-colors min-h-[56px]"
                  >
                    Get an itemised quote <ArrowRight className="w-5 h-5" />
                  </Link>
                  <WhatsAppLink text={'Hi SolarBuilders, I read how you vet installers and want to discuss a build.'} placement="verified"
                    className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#22c55e] text-white rounded-full px-8 py-4 font-heading font-bold transition-colors min-h-[56px]"
                  >
                    <MessageCircle className="w-5 h-5" /> WhatsApp us
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
