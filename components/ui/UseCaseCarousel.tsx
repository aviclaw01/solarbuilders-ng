'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const USE_CASES = [
  {
    tab: 'Residential Home',
    headline: 'Size your home solar system',
    subtext: 'From 1.5kVA to 10kVA — know exactly what you need before you talk to a builder.',
    card: {
      type: 'calculator',
      title: 'System Estimate',
      rows: [
        { label: 'Recommended size', value: '3.5 kVA' },
        { label: 'Battery backup', value: '5kWh Lithium' },
        { label: 'Estimated cost', value: '₦480k – ₦750k', highlight: true },
      ],
    },
  },
  {
    tab: 'SME / Office',
    headline: 'Power your business 24/7',
    subtext: 'Commercial systems from 10kVA+. Stop losing revenue to power cuts.',
    card: {
      type: 'quotes',
      title: 'Quote Comparison',
      badge: 'You received 3 quotes',
      rows: [
        { label: 'SunTech Installs', value: '₦2.8M' },
        { label: 'GreenPower NG', value: '₦3.1M' },
        { label: 'SolarCity Lagos', value: '₦2.6M', highlight: true },
      ],
    },
  },
  {
    tab: 'Diaspora Install',
    headline: 'Power the home you left behind',
    subtext: 'Coordinate installations for family from the UK, US, or Canada via WhatsApp.',
    card: {
      type: 'whatsapp',
      messages: [
        { from: 'you', text: 'Hi, how is the installation going?' },
        { from: 'builder', text: 'Installation 60% complete ✅' },
        { from: 'builder', text: 'Panels mounted, wiring tomorrow. Will send photos.' },
      ],
    },
  },
  {
    tab: 'Hybrid + Battery',
    headline: 'Store energy, sell back excess',
    subtext: 'Hybrid systems with lithium battery backup. Maximize your investment.',
    card: {
      type: 'savings',
      title: 'Monthly Savings',
      stat: '₦0',
      statLabel: 'spent on generator this month',
      rows: [
        { label: 'Solar generated', value: '420 kWh' },
        { label: 'Grid exported', value: '85 kWh' },
        { label: 'Generator runtime', value: '0 hrs' },
      ],
    },
  },
  {
    tab: 'C&I / Solar Farm',
    headline: 'Scale to megawatts',
    subtext: 'Large commercial, estate, and industrial installations with Nexprove oversight.',
    card: {
      type: 'project',
      title: 'Project Scoped',
      badge: 'Nexprove Managed',
      rows: [
        { label: 'Capacity', value: '500 kWp' },
        { label: 'Panels', value: '1,000 × 500W' },
        { label: 'ROI estimate', value: '3.2 years' },
        { label: 'CO₂ offset', value: '380 tonnes/yr' },
      ],
    },
  },
];

function MockCard({ useCase }: { useCase: typeof USE_CASES[0] }) {
  const card = useCase.card;

  if (card.type === 'whatsapp') {
    return (
      <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-5 space-y-3">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-3">WhatsApp Updates</p>
        {card.messages!.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === 'you' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-xl px-4 py-2.5 max-w-[85%] ${
              msg.from === 'you'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-800 text-slate-200'
            }`}>
              {msg.from === 'builder' && <p className="text-emerald-400 text-[10px] font-semibold mb-0.5">Builder</p>}
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (card.type === 'savings') {
    return (
      <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-5">
        <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-4">{card.title}</p>
        <div className="text-center mb-4">
          <p className="font-extrabold text-white text-4xl mb-1">{card.stat}</p>
          <p className="text-slate-400 text-sm">{card.statLabel}</p>
        </div>
        <div className="space-y-2.5">
          {card.rows!.map((row, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-400">{row.label}</span>
              <span className="text-white font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // calculator, quotes, project — all use rows layout
  return (
    <div className="bg-slate-900 border-2 border-amber-400/60 rounded-2xl p-5">
      <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1">{card.title}</p>
      {'badge' in card && card.badge && (
        <p className="text-emerald-400 text-xs font-medium mb-3">{card.badge}</p>
      )}
      {!('badge' in card) && <div className="mb-3" />}
      <div className="space-y-3">
        {card.rows!.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-slate-400">{row.label}</span>
            <span className={`font-semibold ${'highlight' in row && row.highlight ? 'text-amber-400' : 'text-white'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UseCaseCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setActive(i => (i + 1) % USE_CASES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [paused, next]);

  const current = USE_CASES[active];

  return (
    <section className="bg-slate-50 py-20 md:py-28 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <span className="text-amber-500 text-sm font-semibold tracking-wide uppercase">Use Cases</span>
        </div>
        <h2 className="font-heading font-extrabold text-slate-900 text-3xl md:text-5xl leading-tight mb-10">
          Solar for every Nigerian
        </h2>

        {/* Tabs */}
        <div
          className="flex gap-1 overflow-x-auto pb-1 mb-10 scrollbar-hide"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {USE_CASES.map((uc, i) => (
            <button
              key={uc.tab}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap px-5 py-2.5 text-sm font-semibold rounded-full transition-all ${
                i === active
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-white text-slate-500 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {uc.tab}
            </button>
          ))}
        </div>

        {/* Active tab indicator bar */}
        <div className="flex gap-1 mb-10">
          {USE_CASES.map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${
                i === active ? 'bg-amber-400' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Left — text */}
          <div>
            <h3 className="font-heading font-extrabold text-slate-900 text-2xl md:text-4xl leading-tight mb-4">
              {current.headline}
            </h3>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              {current.subtext}
            </p>
            <Link
              href="/calculator"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold rounded-full px-6 py-3 transition-all"
            >
              Get Started →
            </Link>
          </div>

          {/* Right — mockup card */}
          <div className="flex justify-center md:justify-end">
            <div className="w-full max-w-sm">
              <MockCard useCase={current} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
