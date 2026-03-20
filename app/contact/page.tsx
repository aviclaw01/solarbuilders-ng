import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { MessageCircle, Mail, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Get in Touch — SolarBuilders.ng',
  description: 'Contact the SolarBuilders.ng team. We respond within 2 hours on WhatsApp.',
  alternates: { canonical: 'https://solarbuildersng.com/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      {/* Hero */}
      <section className="bg-white border-b border-slate-100 py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection>
            <h1 className="font-heading font-extrabold text-[#0F172A] text-4xl md:text-5xl mb-4">
              Get in touch
            </h1>
            <p className="text-slate-500 text-lg">
              We respond within 2 hours on WhatsApp. For builder inquiries, use the For Builders form.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Contact options */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          {/* WhatsApp CTA */}
          <AnimatedSection>
            <a
              href="https://wa.me/2349168394923"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-1">Chat on WhatsApp</h2>
                <p className="text-slate-500 text-sm mb-4">Fastest way to reach us. We reply within 2 hours.</p>
                <span className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] px-5 py-2.5 rounded-full font-semibold text-sm group-hover:bg-amber-500 transition-colors">
                  Open WhatsApp <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          </AnimatedSection>

          {/* Email */}
          <AnimatedSection delay={150}>
            <a
              href="mailto:hello@solarbuildersng.com"
              className="flex flex-col items-start gap-4 p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all group"
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[#0F172A] text-xl mb-1">Send an email</h2>
                <p className="text-slate-500 text-sm mb-4">hello@solarbuildersng.com</p>
                <span className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-semibold text-sm group-hover:border-amber-400 group-hover:text-amber-600 transition-colors">
                  Compose email <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </a>
          </AnimatedSection>
        </div>

        {/* Builder inquiry nudge */}
        <AnimatedSection delay={300}>
          <div className="max-w-3xl mx-auto mt-6">
            <div className="bg-[#0F172A] text-white rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-heading font-semibold text-base mb-1">Are you a solar company?</p>
                <p className="text-slate-400 text-sm">List your company free and reach thousands of buyers.</p>
              </div>
              <Link
                href="/for-builders"
                className="flex-shrink-0 bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] px-6 py-3 rounded-full font-semibold text-sm transition-colors"
              >
                Go to For Builders →
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </section>

      <Footer />
    </div>
  );
}
