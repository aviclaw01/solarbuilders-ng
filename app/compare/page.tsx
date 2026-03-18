import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Solar System Comparison Nigeria — Budget vs Standard vs Premium',
  description: 'Compare solar system tiers for Nigerian homes. Budget, Standard, and Premium side-by-side — costs, specs, what you can run, and who each is best for.',
  keywords: ['solar system comparison Nigeria', 'solar tiers Nigeria', 'budget vs premium solar Nigeria', 'solar system price comparison Nigeria'],
  openGraph: {
    title: 'Solar System Comparison — Budget vs Standard vs Premium | SolarBuilders.ng',
    description: 'Compare solar system tiers for Nigerian homes and choose the right one for your budget.',
    url: 'https://solarbuilders.ng/compare',
    type: 'website',
  },
  alternates: { canonical: 'https://solarbuilders.ng/compare' },
};

const TIERS = [
  {
    name: 'Budget',
    tagline: 'Essentials only',
    color: 'slate',
    highlight: false,
    kva: '1.5–2kVA',
    panels: '2–4 × 250W',
    batteries: '2 × 200Ah Lead Acid',
    backup: '4–6 hours',
    costRange: '₦350,000 – ₦600,000',
    bestFor: 'Single occupancy, flats, minimal power needs',
    canRun: ['LED lights (8–10)', 'Ceiling fans (2–3)', 'TV (32")', 'Phone chargers', 'WiFi router', 'Small fridge'],
    cannotRun: ['Air conditioner', 'Water pump', 'Washing machine'],
    lifespan: '2–4 years (lead-acid batteries)',
  },
  {
    name: 'Standard',
    tagline: 'Full home coverage',
    color: 'amber',
    highlight: true,
    kva: '3.5–5kVA',
    panels: '4–8 × 300W',
    batteries: '4 × 200Ah Lead Acid or 1 Lithium Pack',
    backup: '8–12 hours',
    costRange: '₦650,000 – ₦1,200,000',
    bestFor: 'Family homes (3–4 bedrooms), moderate AC use',
    canRun: ['Everything in Budget', '1 AC (1.5HP)', 'Refrigerator + freezer', 'Washing machine', 'Water pump', 'Multiple TVs'],
    cannotRun: ['Multiple ACs simultaneously', '2HP+ AC units all day'],
    lifespan: '8–12 years with lithium',
  },
  {
    name: 'Premium',
    tagline: 'Total energy independence',
    color: 'navy',
    highlight: false,
    kva: '7.5–15kVA',
    panels: '8–16 × 400W',
    batteries: '2–4 Lithium Packs (LiFePO4)',
    backup: '24+ hours',
    costRange: '₦1,200,000 – ₦3,000,000+',
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
            Budget, Standard, or Premium — choose the right system tier for your home and your wallet. Side-by-side comparison with real Nigerian pricing.
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
            <p className="text-slate-500 mb-6">Browse verified installers who can deliver all three system tiers.</p>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 transition-all font-semibold"
            >
              Browse Builders →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
