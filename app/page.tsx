import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import BrandCard from '@/components/ui/BrandCard';
import { BRANDS, comparisonPairs, getBrand, manufacturers, vendors } from '@/lib/brands';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';
import { Star, CheckCircle } from 'lucide-react';

/** Verifiable facts about our own research — no invented totals. */
const PRICED_PRODUCTS = BRANDS.reduce((n, b) => n + b.products.length, 0);
import HomepageClient from '@/components/ui/HomepageClient';
import UseCaseCarousel from '@/components/ui/UseCaseCarousel';
import CountdownCTA from '@/components/ui/CountdownCTA';
import RotatingText from '@/components/ui/RotatingText';
import LeadCaptureModal from '@/components/ui/LeadCaptureModal';

export const metadata: Metadata = {
  title: "Real Nigerian Solar Prices — And We Buy It For You | SolarBuilders.ng",
  description: `We publish what solar actually costs in Nigeria (Felicity, Deye, Growatt, Jinko — real listings, ${PRICES_LAST_UPDATED_LABEL}). Size your system free, then we order the equipment at that market price and put a vetted installer on the job in Lagos, Abuja, Port Harcourt and beyond.`,
  alternates: { canonical: 'https://solarbuildersng.com' },
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-1 rounded-full">
      <CheckCircle className="w-3 h-3" />
      Verified
    </span>
  );
}

/**
 * Sample prices shown on the "Real Prices by Brand" card. Looked up from
 * lib/brands.ts by brand + model at render, so the card can never drift from
 * the catalogue. Each must match a real `Product.model` string.
 */
const PRICE_SAMPLES: { brand: string; model: string; label: string }[] = [
  { brand: 'felicity', model: 'IVEM5048 / IVPS 5kVA', label: 'Felicity 5kVA hybrid' },
  { brand: 'deye', model: 'BOS-SE-G5.1 LV', label: 'Deye 5.12kWh lithium' },
  { brand: 'jinko', model: '600W bifacial', label: 'Jinko 600W panel' },
];

export default function HomePage() {
  const featuredBrands = ['felicity', 'deye', 'growatt'].map(getBrand).filter(Boolean);
  const familyHome = HEADLINE_PACKAGES[2];
  const comparisons = comparisonPairs().slice(0, 4);
  const priceSamples = PRICE_SAMPLES.flatMap(({ brand, model, label }) => {
    const p = getBrand(brand)?.products.find((x) => x.model === model);
    return p ? [{ label, price: `${formatNairaShort(p.priceLow)}–${formatNairaShort(p.priceHigh)}` }] : [];
  });

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>

      {/* ──────────────── HERO ──────────────── */}
      <section className="bg-gradient-to-br from-white via-amber-50/30 to-white px-6 py-20 md:py-28">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              Real Nigerian prices · {PRICES_LAST_UPDATED_LABEL} ⚡
            </div>
            <h1 className="font-heading font-extrabold text-slate-900 text-4xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-6 min-h-[1.2em]">
              See <RotatingText /><br />We do the buying.
            </h1>
            <p className="text-slate-500 text-xl leading-relaxed mb-8 max-w-xl">
              We track what solar actually costs in Nigeria: inverters, lithium batteries, panels, every figure taken from
              a real Nigerian listing with the date on it. Size your system free, then we buy it at that price and put a
              vetted installer on the job.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 min-h-[44px] transition-all text-base"
              >
                Calculate My System →
              </Link>
              <Link
                href="/brands"
                className="inline-flex items-center justify-center border border-slate-200 hover:border-slate-400 text-slate-700 rounded-full px-6 py-3 min-h-[44px] transition-all text-base font-semibold"
              >
                Brands &amp; Prices
              </Link>
            </div>
            {/* Trust row */}
            <p className="text-slate-400 text-sm font-medium">
              Real {PRICES_LAST_UPDATED_LABEL} prices · Itemised quote · ₦0 to use · You pay the market price
            </p>
          </div>

          {/* Right: calculator preview card */}
          <div className="hidden md:block">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <p className="font-heading font-semibold text-slate-900 text-sm mb-4">What do you run at home?</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { name: 'AC', selected: true },
                  { name: 'Fridge', selected: true },
                  { name: 'TV', selected: false },
                  { name: 'Fan', selected: true },
                  { name: 'Lights', selected: true },
                  { name: 'Laptop', selected: false },
                ].map(item => (
                  <div key={item.name} className={`rounded-xl border-2 p-3 text-center transition-colors ${
                    item.selected
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-slate-100 bg-white'
                  }`}>
                    <div className="text-xs font-semibold text-slate-700">{item.name}</div>
                  </div>
                ))}
              </div>
              {/* Result preview */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-700 font-heading font-bold text-sm text-center">
                  Your system: {familyHome.label} → {formatNairaShort(familyHome.low)}–{formatNairaShort(familyHome.high)}
                </p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500 text-xs">Estimated system size</span>
                  <span className="font-heading font-bold text-slate-900 text-sm">{familyHome.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Estimated cost range</span>
                  <span className="font-heading font-bold text-amber-500 text-sm">{formatNairaShort(familyHome.low)}–{formatNairaShort(familyHome.high)}</span>
                </div>
              </div>
              <Link href="/calculator" className="block w-full bg-amber-400 hover:bg-amber-500 text-slate-900 py-3 rounded-full text-center font-semibold text-sm transition-all">
                Get My Real Estimate →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF TICKER */}
      <HomepageClient />

      {/* ──────────────── USE CASE CAROUSEL ──────────────── */}
      <UseCaseCarousel />

      {/* ──────────────── FEATURE CARDS (replaces "How it works") ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">How It Works</span>
          </div>
          <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight mb-16">
            Everything you need to go solar
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 — Calculator */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5">
                <div className="space-y-2">
                  {['AC', 'Fridge', 'Lights'].map((item, i) => (
                    <div key={item} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${i < 2 ? 'border-amber-400 bg-amber-400' : 'border-slate-300'}`}>
                        {i < 2 && <span className="text-white text-[10px]">✓</span>}
                      </div>
                      <span className="text-xs text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 bg-amber-400 rounded-lg h-2 w-3/4" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Free Calculator</h3>
              <p className="text-slate-500 text-sm">Size your system in 60 seconds. Know what you need before you talk to anyone.</p>
            </div>

            {/* Card 2 — Real prices by brand */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                {priceSamples.map(({ label, price }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-900">{price}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Real Prices by Brand</h3>
              <p className="text-slate-500 text-sm">Every price is a live Nigerian listing with a source and date. No guesswork, no inflated quotes.</p>
            </div>

            {/* Card 3 — We buy it and run the build */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                {[
                  'Ordered at the market price',
                  'Vetted installer on site',
                  'Warranty in your name',
                ].map((line) => (
                  <div key={line} className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs text-slate-600">{line}</span>
                  </div>
                ))}
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">We Buy It, We Run It</h3>
              <p className="text-slate-500 text-sm">We order the equipment at the price on this site, put a vetted installer on the job and get the warranty paperwork into your name.</p>
            </div>

            {/* Card 4 — Brand comparisons */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
                {comparisonPairs().slice(0, 3).map((pair) => (
                  <div key={pair.slug} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{pair.a.name.split(' ')[0]} vs {pair.b.name.split(' ')[0]}</span>
                    <span className="text-amber-600 font-semibold">compare →</span>
                  </div>
                ))}
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">Compare Before You Buy</h3>
              <p className="text-slate-500 text-sm">{comparisonPairs().length} head-to-head brand comparisons, priced per kVA, kWh and watt.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── WHAT WE ACTUALLY TRACK ──────────────── */}
      <section className="bg-slate-900 py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 max-w-2xl">
            <h2 className="font-heading font-extrabold text-white text-3xl md:text-4xl mb-3">
              The price research behind every quote
            </h2>
            <p className="text-slate-400">
              Not estimates, not a mark-up on a guess. Every figure on this site is a real Nigerian listing with the date we
              checked it, and we re-confirm with the distributor before you pay anything.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { stat: String(PRICED_PRODUCTS), label: 'Prices tracked, each with a date' },
              { stat: String(manufacturers().length), label: 'Brands priced and compared' },
              { stat: String(vendors().length), label: 'Nigerian sellers monitored' },
              { stat: String(comparisonPairs().length), label: 'Head-to-head brand comparisons' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50">
                <p className="font-heading font-extrabold text-amber-400 text-3xl md:text-4xl">{item.stat}</p>
                <p className="text-slate-400 text-sm mt-1 leading-snug">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-xs mt-6">Last full price refresh: {PRICES_LAST_UPDATED_LABEL}.</p>
        </div>
      </section>

      {/* ──────────────── WHY SOLARBUILDERS + TRUST ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-slate-900 text-4xl md:text-5xl leading-tight">
              We publish the real price. Then we buy it for you at that price.
            </h2>
          </div>
          <div className="space-y-8">
            {[
              {
                title: 'Prices with a source and a date',
                desc: `Every inverter, battery and panel figure on this site came off a real Nigerian listing, and it carries the date we saw it (${PRICES_LAST_UPDATED_LABEL}). Nothing is padded, nothing is invented.`,
              },
              {
                title: 'We buy on your behalf',
                desc: 'You pay the brand\'s market price, the same number we publish. Our margin comes from the trade terms we hold with distributors, not from a mark-up added to your quote.',
              },
              {
                title: 'One accountable contact',
                desc: 'From the quote to commissioning you deal with us. We place the vetted installer, chase the delivery, and make sure the warranty paperwork ends up in your name.',
              },
            ].map(feature => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex-shrink-0 w-5 h-5 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-base mb-1">{feature.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── STOP THE CHAOS ──────────────── */}
      <section className="bg-white py-20 md:py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight text-center mb-4">
            Stop managing 5 contractor WhatsApps
          </h2>
          <p className="text-slate-500 text-lg text-center mb-12 max-w-2xl mx-auto">
            Going solar in Nigeria shouldn&apos;t feel like a part-time job.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <p className="font-heading font-bold text-red-800 text-sm uppercase tracking-wide mb-5">Before SolarBuilders</p>
              <ul className="space-y-3.5">
                {[
                  'Unknown contractor credentials',
                  'Price hidden until last minute',
                  'No updates during install',
                  'Warranty? Good luck.',
                  '5 WhatsApp threads going',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-red-400 flex-shrink-0 mt-0.5">❌</span>
                    <span className="text-red-900 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* After */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
              <p className="font-heading font-bold text-emerald-800 text-sm uppercase tracking-wide mb-5">With SolarBuilders</p>
              <ul className="space-y-3.5">
                {[
                  'Published prices with sources and dates',
                  'Equipment bought at the market price',
                  'A vetted installer we put on the job',
                  'WhatsApp progress updates from site',
                  'One company answerable to you',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="text-emerald-500 flex-shrink-0 mt-0.5">✅</span>
                    <span className="text-emerald-900 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────── DIASPORA SECTION ──────────────── */}
      <section className="bg-slate-900 py-20 md:py-28 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-extrabold text-white text-4xl md:text-5xl leading-tight mb-6">
              Power the home you left behind.
            </h2>
            <p className="text-slate-400 text-xl leading-relaxed mb-8">
              Install solar for family back home — from anywhere in the world. Nigerians in the UK, Canada, and US are funding solar installations for parents and siblings. We keep you informed at every step via WhatsApp, with photos from site.
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
            >
              Get an itemised quote →
            </Link>
          </div>
          <div className="hidden md:flex items-center justify-center">
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 border border-white/10 rounded-full"></div>
              <div className="absolute inset-8 border border-white/10 rounded-full"></div>
              <div className="absolute inset-16 border border-white/10 rounded-full"></div>
              {[
                { label: 'Lagos', top: '20%', left: '20%' },
                { label: 'Abuja', top: '35%', left: '55%' },
                { label: 'PH', top: '65%', left: '60%' },
                { label: 'Kano', top: '10%', left: '50%' },
              ].map(city => (
                <div key={city.label} className="absolute flex flex-col items-center gap-1" style={{ top: city.top, left: city.left }}>
                  <div className="w-2.5 h-2.5 bg-amber-400 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.6)]"></div>
                  <span className="text-amber-400 text-xs font-semibold">{city.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* ──────────────── COUNTDOWN CTA ──────────────── */}
      <CountdownCTA />

      <LeadCaptureModal />
      </main>
      <Footer />
    </div>
  );
}
