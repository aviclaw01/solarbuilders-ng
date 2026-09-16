import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import WhatsAppLink from '@/components/ui/WhatsAppLink';
import {
  ArrowRight,
  Building2,
  Calculator,
  MessageCircle,
  Receipt,
  Ruler,
  ShoppingCart,
  Store,
  Wallet,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { FAQS, faqPageJsonLd, faqsByCategory, type FaqCategory } from '@/lib/faq';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { SITE_URL } from '@/lib/site';

/**
 * Every answer is rendered into the HTML, not lazily on open — `<details>`
 * hides the text visually but keeps it in the document, which is what makes
 * it crawlable and what lets the FAQPage schema match the page exactly.
 * Do not move these into a client component that renders on interaction.
 */

export const metadata: Metadata = {
  title: 'Solar FAQs for Nigeria — Costs, Sizing, Installation',
  description:
    `${FAQS.length} straight answers about solar in Nigeria — what a system really costs at ${PRICES_LAST_UPDATED_LABEL} prices, ` +
    `what size you need, lithium vs tubular, who installs it, warranties, and how paying for it actually works. Every naira figure is computed from real Nigerian listings.`,
  keywords: [
    'solar questions nigeria',
    'how much does solar cost in nigeria',
    'solar faq nigeria',
    'lithium vs tubular battery nigeria',
    'does solar run air conditioner nigeria',
  ],
  openGraph: {
    title: 'Solar FAQs for Nigeria — Costs, Sizing, Installation',
    description:
      `${FAQS.length} honest answers on Nigerian solar: costs at ${PRICES_LAST_UPDATED_LABEL} prices, sizing, batteries, installation, warranty and payment.`,
    url: `${SITE_URL}/faq`,
    type: 'website',
  },
  alternates: { canonical: `${SITE_URL}/faq` },
};

const CATEGORY_ICON: Record<FaqCategory, LucideIcon> = {
  prices: Receipt,
  sizing: Ruler,
  buying: ShoppingCart,
  payment: Wallet,
  installation: Wrench,
  'about-us': Building2,
};

const STUCK_LINKS = [
  { href: '/sizing', icon: Ruler, title: 'Sizing guides', blurb: 'Worked answers for a flat, a shop, one AC, a borehole pump.' },
  { href: '/shop', icon: Store, title: 'Equipment prices', blurb: 'What inverters, batteries and panels are actually selling for.' },
  { href: '/brands', icon: Building2, title: 'Brands compared', blurb: 'Felicity, Deye, Growatt, Luxpower — prices, warranty, watch-outs.' },
  { href: '/how-it-works', icon: Wrench, title: 'How it works', blurb: 'From quote code to commissioning, and where our margin comes from.' },
];

export default function FaqPage() {
  const groups = faqsByCategory();
  const waText = `Hi SolarBuilders, I read your FAQs and still have a question. ${SITE_URL}/faq`;

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd(FAQS)) }}
      />
      <Navbar />

      <main>
        {/* Header */}
        <header className="bg-white border-b border-slate-100 px-6 py-10 md:py-14">
          <div className="max-w-3xl mx-auto">
            <Breadcrumbs trail={[{ label: 'FAQs' }]} className="mb-6" />
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Questions &amp; answers</span>
            <h1 className="font-heading font-extrabold text-[#0A0F1E] text-3xl md:text-5xl mt-3 mb-4">
              Solar questions Nigerians actually ask
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed">
              {FAQS.length} answers on what solar costs, what size you need, who installs it and how paying for it
              works. Every naira figure here is computed from real Nigerian listings last checked in{' '}
              {PRICES_LAST_UPDATED_LABEL} — and where we genuinely don&apos;t know something, the answer says so
              instead of guessing.
            </p>

            {/* Jump links */}
            <nav aria-label="FAQ categories" className="flex flex-wrap gap-2 mt-7">
              {groups.map((g) => {
                const Icon = CATEGORY_ICON[g.category];
                return (
                  <a
                    key={g.category}
                    href={`#${g.category}`}
                    className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-400 text-[#0A0F1E] rounded-full px-4 py-2 text-sm font-semibold transition-colors min-h-[44px]"
                  >
                    <Icon className="w-4 h-4 text-amber-500" />
                    {g.label}
                    <span className="text-slate-400 font-normal">{g.items.length}</span>
                  </a>
                );
              })}
            </nav>
          </div>
        </header>

        {/* Questions */}
        <div className="max-w-3xl mx-auto px-6 py-12 md:py-16">
          {groups.map((group) => {
            const Icon = CATEGORY_ICON[group.category];
            return (
              <section key={group.category} id={group.category} className="mb-14 last:mb-0 scroll-mt-24">
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl md:text-3xl">{group.label}</h2>
                    <p className="text-slate-500 mt-1">{group.blurb}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {group.items.map((f) => (
                    <details key={f.q} className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
                      <summary className="cursor-pointer list-none flex items-start justify-between gap-4 font-heading font-bold text-[#0A0F1E] text-base md:text-lg">
                        <h3 className="font-heading font-bold">{f.q}</h3>
                        <span
                          className="text-amber-500 text-2xl leading-none transition-transform group-open:rotate-45 flex-shrink-0"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      </summary>
                      <p className="text-slate-600 leading-relaxed mt-4">{f.a}</p>
                      {f.link && (
                        <Link
                          href={f.link.href}
                          className="inline-flex items-center gap-1 text-amber-600 text-sm font-semibold mt-3 hover:underline underline-offset-4"
                        >
                          {f.link.label} <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </details>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* CTA */}
        <section className="px-6 pb-14">
          <div className="max-w-3xl mx-auto">
            <div className="bg-[#0A0F1E] rounded-2xl p-8 md:p-12 text-center">
              <h2 className="font-heading font-extrabold text-white text-2xl md:text-3xl mb-3">
                Your own numbers beat any FAQ
              </h2>
              <p className="text-slate-300 mb-8 max-w-xl mx-auto">
                Tick the appliances you actually run and get an itemised quote — inverter, battery, panels, cables and
                labour, each priced from {PRICES_LAST_UPDATED_LABEL} Nigerian listings. Free, no sign-up.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/calculator"
                  className="inline-flex items-center justify-center gap-2 bg-[#F59E0B] hover:bg-amber-500 text-[#0A0F1E] px-8 py-4 rounded-full font-heading font-bold transition-colors min-h-[56px]"
                >
                  <Calculator className="w-5 h-5" /> Get my itemised quote
                </Link>
                <WhatsAppLink
                  text={waText}
                  placement="faq"
                  className="inline-flex items-center justify-center gap-2 border border-white/20 hover:border-white/50 text-white px-8 py-4 rounded-full font-heading font-semibold transition-colors min-h-[56px]"
                >
                  <MessageCircle className="w-5 h-5" /> Ask us on WhatsApp
                </WhatsAppLink>
              </div>
            </div>
          </div>
        </section>

        {/* Still stuck */}
        <section className="px-6 pb-20">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-heading font-extrabold text-[#0A0F1E] text-2xl mb-2">Still stuck?</h2>
            <p className="text-slate-500 mb-6">
              These four pages answer most of what an FAQ can only summarise.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {STUCK_LINKS.map(({ href, icon: Icon, title, blurb }) => (
                <Link
                  key={href}
                  href={href}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-amber-500" />
                    <span className="font-heading font-bold text-[#0A0F1E]">{title}</span>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
