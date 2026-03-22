import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { MessageCircle, Mail, ArrowRight, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Get in Touch — SolarBuilders.ng',
  description: 'Contact the SolarBuilders.ng team. We respond within 2 hours on WhatsApp. Visit us at 11 Mogbonjubola St, Gbagada, Lagos.',
  alternates: { canonical: 'https://solarbuilders-ng.vercel.app/contact' },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      <main>
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
                  <span className="inline-flex items-center gap-2 bg-[#F59E0B] text-[#0F172A] px-5 py-2.5 rounded-full font-semibold text-sm group-hover:bg-amber-500 transition-colors min-h-[44px]">
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
                  <span className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-full font-semibold text-sm group-hover:border-amber-400 group-hover:text-amber-600 transition-colors min-h-[44px]">
                    Compose email <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </a>
            </AnimatedSection>
          </div>

          {/* Phone + Address */}
          <div className="max-w-3xl mx-auto mt-6 grid md:grid-cols-2 gap-6">
            <AnimatedSection delay={150}>
              <a
                href="tel:+2349168394923"
                className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-amber-200 transition-all"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-[#0F172A] text-lg mb-1">Call us</h2>
                  <p className="text-amber-600 font-semibold underline underline-offset-2">+234 916 839 4923</p>
                  <p className="text-slate-500 text-sm mt-1">Mon–Sat, 8am–6pm WAT</p>
                </div>
              </a>
            </AnimatedSection>

            <AnimatedSection delay={225}>
              <div className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-slate-600" />
                </div>
                <address className="not-italic">
                  <h2 className="font-heading font-bold text-[#0F172A] text-lg mb-1">Visit us</h2>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    11 Mogbonjubola St,<br />
                    Gbagada, Lagos,<br />
                    Nigeria
                  </p>
                </address>
              </div>
            </AnimatedSection>
          </div>

          {/* Google Maps */}
          <AnimatedSection delay={300}>
            <div className="max-w-3xl mx-auto mt-6">
              <div className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.432!2d3.3897!3d6.5548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b93b01e7fc04f%3A0x1234567890!2s11+Mogbonjubola+St%2C+Gbagada%2C+Lagos%2C+Nigeria!5e0!3m2!1sen!2sng!4v1700000000000!5m2!1sen!2sng"
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="SolarBuilders.ng office — 11 Mogbonjubola St, Gbagada, Lagos"
                  aria-label="Map showing SolarBuilders.ng office location at 11 Mogbonjubola St, Gbagada, Lagos"
                />
              </div>
              <p className="text-center text-slate-500 text-sm mt-3">
                <a
                  href="https://maps.google.com/?q=11+Mogbonjubola+St,+Gbagada,+Lagos,+Nigeria"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-600 underline underline-offset-4 hover:text-amber-700 transition-colors"
                >
                  Open in Google Maps →
                </a>
              </p>
            </div>
          </AnimatedSection>

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
                  className="flex-shrink-0 bg-[#F59E0B] hover:bg-amber-500 text-[#0F172A] px-6 py-3 rounded-full font-semibold text-sm transition-colors min-h-[44px] flex items-center"
                >
                  Go to For Builders →
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </section>
      </main>

      <Footer />
    </div>
  );
}
