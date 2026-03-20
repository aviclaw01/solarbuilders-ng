import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

export const metadata: Metadata = {
  title: 'The True Cost of Generator vs Solar in Lagos (2026)',
  description: 'A real money comparison: how much Lagos households spend on generators vs solar energy over 3 years. Includes fuel costs, maintenance, and ROI calculation.',
  keywords: ['generator vs solar Lagos', 'solar vs generator Nigeria cost', 'solar roi Nigeria', 'generator cost Lagos 2026'],
  openGraph: {
    title: 'The True Cost of Generator vs Solar in Lagos',
    description: 'Real money comparison of generator vs solar in Lagos, Nigeria.',
    url: 'https://solarbuildersng.com/blog/generator-vs-solar-lagos',
    type: 'article',
  },
  alternates: { canonical: 'https://solarbuildersng.com/blog/generator-vs-solar-lagos' },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "The True Cost of Generator vs Solar in Lagos (2026)",
  "description": "A real money comparison of generator vs solar costs in Lagos, Nigeria.",
  "author": { "@type": "Organization", "name": "SolarBuilders.ng" },
  "datePublished": "2026-03-01",
  "url": "https://solarbuildersng.com/blog/generator-vs-solar-lagos",
};

export default function GeneratorVsSolarPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900">Blog</Link>
          <span>/</span>
          <span className="text-slate-900">Generator vs Solar</span>
        </div>

        <div className="mb-4">
          <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1 rounded-full border border-amber-200">Cost Analysis</span>
        </div>
        <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight mb-4">
          The True Cost of Generator vs Solar in Lagos
        </h1>
        <div className="flex items-center gap-4 text-slate-400 text-sm mb-12 pb-8 border-b border-slate-100">
          <span>March 2026</span>
          <span>·</span>
          <span>8 min read</span>
        </div>

        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 text-lg leading-relaxed mb-6">
            Most Lagosians know generators are expensive. But few have actually done the math on exactly how expensive. This article breaks down the full 3-year cost of running a generator vs installing a solar system — and the numbers may shock you.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">The generator situation in Lagos</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Lagos State gets an average of 6–10 hours of NEPA supply per day, depending on your area. Some estates in Lekki and Victoria Island fare better; areas like Agege, Bariga, and Mushin often get less than 4 hours. The result: generators run almost every night, and for many hours during the day.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            With petrol at ₦1,100–₦1,300 per litre in early 2026 and a typical 2.5kVA generator consuming 1–1.5 litres per hour, the meter runs fast.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Real cost breakdown: Generator (Year 1)</h2>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-6">
            <div className="space-y-3 text-sm">
              {[
                ['Generator purchase (2.5kVA)', '₦250,000', 'One-time'],
                ['Fuel (6hrs/day × 1.2L × ₦1,200 × 365)', '₦3,153,600', 'Per year'],
                ['Engine oil changes (every 50hrs)', '₦120,000', 'Per year'],
                ['Servicing (quarterly)', '₦80,000', 'Per year'],
                ['Repairs (average)', '₦60,000', 'Per year'],
                ['Noise/pollution (priceless)', '—', '—'],
              ].map(([item, cost, period]) => (
                <div key={item} className="flex justify-between items-start py-2 border-b border-slate-100 last:border-0">
                  <span className="text-slate-600 flex-1">{item}</span>
                  <span className="font-semibold text-slate-900 text-right ml-4">{cost}</span>
                  <span className="text-slate-400 text-right ml-4 w-20">{period}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-200 mt-3 pt-4 flex justify-between font-heading font-bold">
              <span className="text-slate-900">Year 1 total</span>
              <span className="text-red-500 text-xl">~₦3,663,600</span>
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed mb-6">
            That&apos;s assuming moderate use. Heavy users (running AC overnight) can spend ₦400,000–₦600,000 per month on fuel alone. Over 3 years, a generator costs the average Lagos family <strong>₦9–12 million</strong>.
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Real cost breakdown: Solar (3.5kVA hybrid system)</h2>
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
            <div className="space-y-3 text-sm">
              {[
                ['System installation (inverter + panels + batteries)', '₦700,000', 'One-time'],
                ['Annual maintenance (cleaning, check-up)', '₦30,000', 'Per year'],
                ['Battery replacement (after 8–10 years)', '₦150,000', 'Eventually'],
                ['Electricity bill from NEPA (when available)', '₦15,000', 'Per month'],
              ].map(([item, cost, period]) => (
                <div key={item} className="flex justify-between items-start py-2 border-b border-amber-100 last:border-0">
                  <span className="text-slate-600 flex-1">{item}</span>
                  <span className="font-semibold text-slate-900 text-right ml-4">{cost}</span>
                  <span className="text-slate-400 text-right ml-4 w-20">{period}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-amber-200 mt-3 pt-4 flex justify-between font-heading font-bold">
              <span className="text-slate-900">Year 1 total</span>
              <span className="text-emerald-600 text-xl">~₦910,000</span>
            </div>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">Side by side: 3-year cost comparison</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border border-slate-100 rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">Year</th>
                  <th className="text-left p-4 font-heading font-semibold text-red-500">Generator</th>
                  <th className="text-left p-4 font-heading font-semibold text-emerald-600">Solar</th>
                  <th className="text-left p-4 font-heading font-semibold text-slate-900">You Save</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Year 1', '₦3,663,600', '₦910,000', '₦2,753,600'],
                  ['Year 2', '₦3,413,600', '₦210,000', '₦3,203,600'],
                  ['Year 3', '₦3,413,600', '₦210,000', '₦3,203,600'],
                  ['3-Year Total', '₦10,490,800', '₦1,330,000', '₦9,160,800'],
                ].map(([year, gen, solar, save], i) => (
                  <tr key={year} className={`border-t border-slate-100 ${i === 3 ? 'font-bold' : ''}`}>
                    <td className="p-4 text-slate-900">{year}</td>
                    <td className="p-4 text-red-500">{gen}</td>
                    <td className="p-4 text-emerald-600">{solar}</td>
                    <td className="p-4 text-amber-600 font-semibold">{save}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-center">
            <p className="text-slate-400 text-sm mb-2">Total 3-year savings by switching to solar</p>
            <p className="font-heading font-extrabold text-amber-400 text-4xl">₦9,160,800</p>
          </div>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">The break-even point</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Based on the numbers above, a ₦700,000 solar installation pays for itself in roughly <strong>3 months</strong> — because you stop spending ₦260,000/month on generator fuel.
          </p>
          <p className="text-slate-600 leading-relaxed mb-6">
            After break-even, it&apos;s essentially free power for 20+ years (the rated lifespan of quality solar panels).
          </p>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">What you don&apos;t get with a generator</h2>
          <ul className="space-y-2 text-slate-600 mb-6 list-disc list-inside">
            <li>Clean, silent power — no fumes, no noise</li>
            <li>Instant-on when NEPA cuts (no running outside to start gen)</li>
            <li>Power available 24/7, even when petrol stations are closed</li>
            <li>No carbon emissions contributing to climate change</li>
            <li>Children sleeping without generator noise and fumes</li>
          </ul>

          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-4 mt-10">The bottom line</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            The generator is not cheap backup power — it&apos;s the most expensive electricity you can buy. At ₦260,000+ per month, it costs more than most car loans. Solar is the better investment by every measure: cost, convenience, safety, and long-term value.
          </p>
          <p className="text-slate-600 leading-relaxed">
            The only question is: which verified builder will you hire to install it?
          </p>
        </div>

        <div className="mt-16 bg-slate-900 rounded-2xl p-10 text-center">
          <h3 className="font-heading font-extrabold text-white text-2xl mb-3">
            Calculate your personal solar ROI
          </h3>
          <p className="text-slate-400 mb-6">Free, takes 5 minutes. See exactly how much you&apos;d save.</p>
          <Link
            href="/calculator"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
          >
            Calculate My System →
          </Link>
        </div>
      </article>
      <Footer />
    </div>
  );
}
