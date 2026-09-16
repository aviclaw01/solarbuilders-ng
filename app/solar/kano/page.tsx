import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { getBrand, vendors } from '@/lib/brands';
import { HEADLINE_PACKAGES } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar in Kano — 2026 Prices, Brands & Quotes',
  description: 'Real 2026 solar prices for Kano — inverters, lithium batteries and panels by brand — plus an itemised quote calculator and a team that gets your system installed.',
  keywords: ['solar installer Kano', 'solar company Kano Nigeria', 'solar installation Kano State', 'solar panels Kano price', 'best solar Kano 2026'],
  openGraph: {
    title: 'Solar in Kano — 2026 Prices, Brands & Quotes',
    description: 'Real 2026 solar prices and itemised quotes for Kano State, Nigeria.',
    url: 'https://solarbuildersng.com/solar/kano',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/solar/kano' },
};

const span = (low: number, high: number) => `${formatNairaShort(low)}\u2013${formatNairaShort(high)}`;

const STARTER = HEADLINE_PACKAGES[0];  // 1.5-2.5kVA - 5kWh lithium
const COMMON = HEADLINE_PACKAGES[2];   // 5kVA - 10kWh lithium
const LARGE = HEADLINE_PACKAGES[3];    // 8-10kVA - 15kWh

/**
 * One array feeding both the visible FAQ and the FAQPage JSON-LD. These were
 * written out twice as byte-identical copies waiting to drift, and structured
 * data that disagrees with the page it describes is a rich-result violation.
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does solar cost in Kano?',
    a:
      `A solar installation costs from about ${formatNairaShort(STARTER.low)} for a ${STARTER.label} starter ` +
      `system (${STARTER.powers}) up to ${formatNairaShort(LARGE.high)} at the ${LARGE.label} end. A typical ` +
      `${COMMON.label} system is ${span(COMMON.low, COMMON.high)} installed. These are national equipment ` +
      `prices — we track prices by product, not by city. Equipment for Kano is generally moved from Lagos, and ` +
      `that transport shows up in the installer's quote rather than in the equipment price.`,
  },
  { q: 'How long does solar installation take in Kano?', a: 'Most residential solar installations in Kano take 1–3 days. Commercial installations may take 3–7 days depending on system size and site conditions.' },
  { q: 'Are solar installers in Kano insured?', a: 'Every installer we send to a job is checked for business registration, past installations and customer references, and we stay involved until commissioning. Always ask for a written warranty on both equipment and workmanship.' },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function SolarKanoPage() {
  const localVendors = vendors().filter(v => v.origin.includes('Kano'));
  const featuredBrands = ['felicity', 'deye', 'growatt', 'jinko'].map(getBrand).filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Navbar />
      <main>

      <div className="bg-white border-b border-slate-100 px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Link href="/" className="hover:text-slate-900">Home</Link>
            <span>/</span>
            <Link href="/brands" className="hover:text-slate-900">Brands &amp; Prices</Link>
            <span>/</span>
            <span className="text-slate-900">Kano</span>
          </div>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mb-4">
            Solar in Kano — Real Prices & Brands
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl leading-relaxed">
            Kano has some of the best solar conditions in Nigeria — high irradiance and minimal cloud cover — so you need fewer panels per kWh than in the south. Below are real 2026 prices by brand. Size your system, get an itemised quote, and we handle sourcing (from Lagos or Kano suppliers) and installation.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Brands & vendors */}
        <div className="mb-16">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">Solar equipment prices for Kano</h2>
          <p className="text-slate-500 mb-6 max-w-2xl">Real 2026 listings by brand, and the vendors that serve Kano. Size your system, get an itemised quote, and we handle sourcing and installation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...localVendors, ...featuredBrands].slice(0, 6).map(b => <BrandCard key={b!.slug} brand={b!} />)}
          </div>
          <div className="mt-6">
            <Link href="/brands" className="text-amber-600 font-semibold text-sm hover:underline underline-offset-4">All brands &amp; vendors →</Link>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mb-16">
          <h2 className="font-heading font-bold text-slate-900 text-3xl mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white border border-slate-100 rounded-2xl p-6">
                <h3 className="font-heading font-semibold text-slate-900 mb-2">{q}</h3>
                <p className="text-slate-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-amber-400 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-3">
            Not sure what system you need?
          </h3>
          <p className="text-slate-800 mb-6">Use our free calculator — tailored for Nigerian homes and businesses.</p>
          <Link href="/calculator" className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full px-6 py-3 transition-all">
            Calculate My System →
          </Link>
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
