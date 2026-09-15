import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { formatNairaShort } from '@/lib/quote';
import { CheckCircle, ArrowRight } from 'lucide-react';
import BrandMark from '@/components/ui/BrandMark';
import { CATEGORY_LABEL, comparisonPairs, type ProductCategory } from '@/lib/brands';
import { PRICES_LAST_UPDATED_LABEL, HEADLINE_PACKAGES } from '@/lib/prices';

export const metadata: Metadata = {
  title: 'Solar System Comparison Nigeria — Budget vs Standard vs Premium',
  description: 'Compare solar system tiers for Nigerian homes — Budget, Standard and Premium side-by-side — then compare the brands themselves head to head: Deye vs Felicity, Growatt vs Luxpower, Jinko vs Longi and more, on real Nigerian prices.',
  keywords: ['solar system comparison Nigeria', 'solar tiers Nigeria', 'budget vs premium solar Nigeria', 'solar system price comparison Nigeria', 'solar brand comparison Nigeria', 'Deye vs Felicity', 'Growatt vs Luxpower', 'Jinko vs Longi'],
  openGraph: {
    title: 'Solar System Comparison — Budget vs Standard vs Premium | SolarBuilders.ng',
    description: 'Compare solar system tiers for Nigerian homes, and compare brands head to head on real Nigerian prices.',
    url: 'https://solarbuildersng.com/compare',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuildersng.com/compare' },
};

const TIERS = [
  {
    name: 'Budget',
    tagline: 'Essentials only',
    color: 'slate',
    highlight: false,
    kva: '1.5–3.5kVA',
    panels: '3–4 × 550W',
    batteries: '5kWh lithium (LiFePO4)',
    backup: '~4 hours',
    costRange: `${formatNairaShort(HEADLINE_PACKAGES[0].low)} – ${formatNairaShort(HEADLINE_PACKAGES[1].high)}`,
    bestFor: 'Single occupancy, flats, minimal power needs',
    canRun: ['LED lights (8–10)', 'Ceiling fans (2–3)', 'TV (32")', 'Phone chargers', 'WiFi router', 'Small fridge'],
    cannotRun: ['Air conditioner', 'Water pump', 'Washing machine'],
    lifespan: '8–10 years (lithium)',
  },
  {
    name: 'Standard',
    tagline: 'Full home coverage',
    color: 'amber',
    highlight: true,
    kva: '3.5–5kVA',
    panels: '5–8 × 550W',
    batteries: '10kWh lithium (2 × 5kWh)',
    backup: '~6 hours',
    costRange: `${formatNairaShort(HEADLINE_PACKAGES[2].low)} – ${formatNairaShort(HEADLINE_PACKAGES[2].high)}`,
    bestFor: 'Family homes (3–4 bedrooms), moderate AC use',
    canRun: ['Everything in Budget', '1 AC (1.5HP)', 'Refrigerator + freezer', 'Washing machine', 'Water pump', 'Multiple TVs'],
    cannotRun: ['Multiple ACs simultaneously', '2HP+ AC units all day'],
    lifespan: '10+ years (lithium)',
  },
  {
    name: 'Premium',
    tagline: 'Total energy independence',
    color: 'navy',
    highlight: false,
    kva: '8–12kVA (Deye-class)',
    panels: '8–16 × 550W',
    batteries: '15–25kWh lithium (3–5 × 5kWh)',
    backup: '10+ hours',
    costRange: `${formatNairaShort(HEADLINE_PACKAGES[3].low)} – ${formatNairaShort(HEADLINE_PACKAGES[4].high)}`,
    bestFor: 'Large homes, businesses, total off-grid living',
    canRun: ['Multiple ACs', 'Full kitchen appliances', 'Water heater', 'Commercial equipment', 'Swimming pool pump'],
    cannotRun: ['Nothing significant — this system runs everything'],
    lifespan: '10–15 years (premium lithium)',
  },
];

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">System Comparison</span>
          </div>
          <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl mb-4">
            Solar System Comparison
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl">
            Budget, Standard, or Premium — choose the right system tier for your home and your wallet. Side-by-side comparison with real Nigerian market prices (September 2026, lithium systems).
          </p>
        </div>
      </div>

      {/* Comparison cards */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TIERS.map(tier => (
            <div
              key={tier.name}
              className={`rounded-2xl border p-6 relative ${
                tier.highlight
                  ? 'border-amber-400 ring-2 ring-amber-400 ring-offset-2'
                  : 'border-slate-100'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <div className="mb-6">
                <h2 className="font-heading font-extrabold text-slate-900 text-2xl mb-1">{tier.name}</h2>
                <p className="text-slate-500 text-sm">{tier.tagline}</p>
              </div>

              <div className="mb-6">
                <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Cost Range</p>
                <p className={`font-heading font-extrabold text-2xl ${tier.highlight ? 'text-amber-500' : 'text-slate-900'}`}>
                  {tier.costRange}
                </p>
              </div>

              {/* Specs */}
              <div className="space-y-3 mb-6 pb-6 border-b border-slate-100">
                {[
                  { label: 'Inverter', value: tier.kva },
                  { label: 'Solar Panels', value: tier.panels },
                  { label: 'Batteries', value: tier.batteries },
                  { label: 'Backup Time', value: tier.backup },
                  { label: 'Battery Lifespan', value: tier.lifespan },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-semibold text-slate-900 text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>

              {/* Best for */}
              <div className="mb-4">
                <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Best For</p>
                <p className="text-slate-700 text-sm">{tier.bestFor}</p>
              </div>

              {/* Can run */}
              <div className="mb-4">
                <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Can Run</p>
                <ul className="space-y-1">
                  {tier.canRun.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {tier.cannotRun[0] !== 'Nothing significant — this system runs everything' && (
                <div className="mb-6">
                  <p className="text-slate-400 text-xs uppercase font-semibold mb-2">Cannot Run Well</p>
                  <ul className="space-y-1">
                    {tier.cannotRun.map(item => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <span className="w-4 h-4 flex-shrink-0 mt-0.5 text-center text-slate-300">×</span>
                        <span className="text-slate-400">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Link
                href="/calculator"
                className={`block w-full text-center py-3 rounded-full font-semibold text-sm transition-all mt-4 ${
                  tier.highlight
                    ? 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                    : 'border border-slate-200 hover:border-slate-400 text-slate-700'
                }`}
              >
                Calculate for my home →
              </Link>
            </div>
          ))}
        </div>

        {/* What drives cost */}
        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-8 mb-12">
          <h2 className="font-heading font-bold text-slate-900 text-2xl mb-6">What drives the cost difference?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                factor: 'Battery Technology',
                detail: 'Lead-acid batteries are cheap but short-lived (2–4 years). Lithium (LiFePO4) costs 2–3× more upfront but lasts 10+ years and performs better in heat.',
              },
              {
                factor: 'Inverter Brand',
                detail: 'Reputable brands (Victron, Growatt, Schneider) cost more than no-name alternatives, but come with warranties and local support. Don\'t cut corners here.',
              },
              {
                factor: 'Panel Wattage & Count',
                detail: 'More panels = more power generation and more battery charging per day. The difference between 4 × 250W and 8 × 400W panels is significant in rainy season performance.',
              },
            ].map(({ factor, detail }) => (
              <div key={factor}>
                <h3 className="font-heading font-semibold text-slate-900 mb-2">{factor}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Brand head-to-head comparisons */}
        <section className="mb-12">
          <h2 className="font-heading font-extrabold text-slate-900 text-2xl md:text-3xl mb-2">
            Compare brands head to head
          </h2>
          <p className="text-slate-500 mb-8 max-w-2xl">
            Tier tells you how big a system to buy. These pages tell you which brand to put in it — real Nigerian prices
            per kVA, kWh and watt, last checked {PRICES_LAST_UPDATED_LABEL}.
          </p>

          <div className="space-y-10">
            {(['inverter', 'battery', 'panel'] as ProductCategory[]).map(category => {
              const pairs = comparisonPairs().filter(p => p.categories.includes(category));
              if (pairs.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="font-heading font-bold text-slate-900 text-lg mb-4">{CATEGORY_LABEL[category]}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {pairs.map(pair => (
                      <Link
                        key={pair.slug}
                        href={`/compare/${pair.slug}`}
                        className="group rounded-2xl border border-slate-100 hover:border-slate-300 p-4 transition-colors"
                      >
                        <span className="flex items-center gap-2 mb-2">
                          <BrandMark brand={pair.a} size={28} />
                          <BrandMark brand={pair.b} size={28} />
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 ml-auto flex-shrink-0" />
                        </span>
                        <span className="block font-semibold text-slate-900 text-sm">
                          {pair.a.name} vs {pair.b.name}
                        </span>
                        <span className="block text-slate-400 text-xs mt-1">
                          {pair.categories.map(c => CATEGORY_LABEL[c]).join(' · ')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Recommendation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 rounded-2xl p-8">
            <h3 className="font-heading font-bold text-white text-xl mb-3">Not sure which tier?</h3>
            <p className="text-slate-400 mb-6">Our calculator sizes your system precisely based on your appliances. Takes 5 minutes.</p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
            >
              Calculate My System →
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-8">
            <h3 className="font-heading font-bold text-slate-900 text-xl mb-3">Ready to find a builder?</h3>
            <p className="text-slate-500 mb-6">See what each brand costs before you decide on a tier.</p>
            <Link
              href="/brands"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 transition-all font-semibold"
            >
              Brands &amp; Prices →
            </Link>
          </div>
        </div>
      </div>

      </main>
      <Footer />
    </div>
  );
}
