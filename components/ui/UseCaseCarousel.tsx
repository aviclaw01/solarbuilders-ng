'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { HEADLINE_PACKAGES, PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import { formatNairaShort } from '@/lib/quote';

const STARTER = HEADLINE_PACKAGES[1];   // 3.5kVA · 5kWh
const FAMILY = HEADLINE_PACKAGES[2];    // 5kVA · 10kWh
const COMMERCIAL = HEADLINE_PACKAGES[4]; // 15–20kVA

const range = (p: { low: number; high: number }) => `${formatNairaShort(p.low)} – ${formatNairaShort(p.high)}`;

/**
 * The "Compare brands" card is the only part of this carousel that needs the
 * product catalogue. Importing lib/brands here would ship all ~90 products to
 * every homepage visitor for a count and four labels, so the server page
 * resolves them and passes them down instead.
 */
export interface ComparisonSummary {
  /** total number of brand-vs-brand pages we publish */
  count: number;
  /** first few pairs, already shortened to "Deye vs Felicity" */
  labels: string[];
}

function buildUseCases(comparisons: ComparisonSummary) {
  return [
  {
    tab: 'Residential Home',
    headline: 'Size your home solar system',
    subtext: `From 1.5kVA to 10kVA — know exactly what you need, and what every part of it costs.`,
    card: {
      type: 'calculator',
      title: 'System Estimate',
      rows: [
        { label: 'Recommended size', value: STARTER.label.split(' · ')[0] },
        { label: 'Battery backup', value: STARTER.label.split(' · ')[1] },
        { label: 'Installed cost', value: range(STARTER), highlight: true },
      ],
    },
  },
  {
    tab: 'SME / Office',
    headline: 'Power your business without the generator',
    subtext: 'Commercial systems from 10kVA up. Priced line by line, not as one lump sum.',
    card: {
      type: 'quotes',
      title: 'What it costs',
      badge: `Real prices, ${PRICES_LAST_UPDATED_LABEL}`,
      rows: [
        { label: FAMILY.label, value: range(FAMILY) },
        { label: HEADLINE_PACKAGES[3].label, value: range(HEADLINE_PACKAGES[3]) },
        { label: COMMERCIAL.label, value: range(COMMERCIAL), highlight: true },
      ],
    },
  },
  {
    tab: 'Diaspora Install',
    headline: 'Power the home you left behind',
    subtext: 'Fund and follow an installation for family from the UK, US or Canada, over WhatsApp.',
    card: {
      type: 'whatsapp',
      messages: [
        { from: 'you', text: 'Hi, how is the installation going?' },
        { from: 'builder', text: 'Inverter and batteries mounted today ✅' },
        { from: 'builder', text: 'Panels going up tomorrow. Sending photos from site.' },
      ],
    },
  },
  {
    tab: 'Lithium vs Tubular',
    headline: 'See what the battery really costs',
    subtext: 'Tubular is cheaper today and dearer over ten years. The calculator prices both.',
    card: {
      type: 'savings',
      title: 'Battery over 10 years',
      stat: '1 vs 3–5',
      statLabel: 'packs bought over a decade',
      rows: [
        { label: 'Lithium life', value: '10+ years' },
        { label: 'Tubular life', value: '2–4 years' },
        { label: 'Usable capacity', value: '90% vs 50%' },
      ],
    },
  },
  {
    tab: 'Compare brands',
    headline: 'Deye, Felicity, Growatt, Jinko',
    subtext: 'What each brand actually costs per kVA, kWh and watt, from live Nigerian listings.',
    card: {
      type: 'project',
      title: 'Head to head',
      badge: `${comparisons.count} comparisons`,
      rows: comparisons.labels.map((label) => ({ label, value: 'compare →' })),
    },
  },
  ] as const;
}

type UseCase = ReturnType<typeof buildUseCases>[number];

function MockCard({ useCase }: { useCase: UseCase }) {
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

export default function UseCaseCarousel({ comparisons }: { comparisons: ComparisonSummary }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const useCases = useMemo(() => buildUseCases(comparisons), [comparisons]);
  const count = useCases.length;

  const next = useCallback(() => {
    setActive(i => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(next, 4000);
    return () => clearInterval(interval);
  }, [paused, next]);

  const current = useCases[active];

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
          {useCases.map((uc, i) => (
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
          {useCases.map((_, i) => (
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
