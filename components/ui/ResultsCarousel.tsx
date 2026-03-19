'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Share2 } from 'lucide-react';

interface ApplianceItem {
  id: string;
  name: string;
  emoji: string;
  watts: number;
  qty: number;
  hoursPerDay: number;
}

interface TierResult {
  label: string;
  emoji: string;
  kva: number;
  batteries: number;
  panels: number;
  panelWatts: number;
  minCost: number;
  maxCost: number;
  coverage: number;
  note: string;
}

interface CalculationResult {
  totalWatts: number;
  dailyKwh: number;
  budget: TierResult;
  standard: TierResult;
  premium: TierResult;
}

interface ResultsCarouselProps {
  result: CalculationResult;
  selectedAppliances: ApplianceItem[];
}

function formatNaira(amount: number): string {
  if (amount >= 1000000) return `\u20A6${(amount / 1000000).toFixed(1)}M`;
  return `\u20A6${(amount / 1000).toFixed(0)}k`;
}

const FRIENDLY_NAMES: Record<string, string> = {
  ac_1_5hp: 'Air conditioning (1.5HP)',
  deep_freezer: 'Deep freezer',
  refrigerator: 'Fridge',
  water_pump: 'Water pump',
  washing_machine: 'Washing machine',
  water_heater: 'Water heater',
  tv_32: 'TV',
  tv_55: 'TV',
  laptop: 'Laptop',
  desktop_pc: 'Desktop PC',
  microwave: 'Microwave',
  standing_fan: 'Fans',
  ceiling_fan: 'Fans',
  decoder: 'TV + decoder',
  led_bulb: 'All lights',
  phone_charger: 'Phone charging',
  wifi_router: 'WiFi router',
  security_light: 'Security lights',
};

const SMALL_ITEMS = new Set(['led_bulb', 'phone_charger', 'wifi_router', 'security_light', 'standing_fan', 'ceiling_fan']);

function getWhatYouCanRun(
  tier: 'budget' | 'standard' | 'premium',
  coverage: number,
  appliances: ApplianceItem[],
  totalWatts: number,
): string[] {
  if (appliances.length === 0) return [];

  let fittingAppliances: ApplianceItem[];

  if (tier === 'budget') {
    // Sort by watts descending, greedily pick what fits in 60% of total
    const wattBudget = totalWatts * (coverage / 100);
    const sorted = [...appliances].sort((a, b) => (b.watts * b.qty) - (a.watts * a.qty));
    let remaining = wattBudget;
    fittingAppliances = [];
    for (const a of sorted) {
      const load = a.watts * a.qty;
      if (load <= remaining) {
        fittingAppliances.push(a);
        remaining -= load;
      }
    }
  } else {
    fittingAppliances = [...appliances];
  }

  // Group small items together
  const lines: string[] = [];
  const smallGroup: string[] = [];
  const seen = new Set<string>();

  for (const a of fittingAppliances) {
    const baseId = a.id.startsWith('custom_') ? a.id : a.id;
    const friendlyKey = a.id.startsWith('custom_') ? a.name : a.id;

    if (SMALL_ITEMS.has(a.id)) {
      const label = FRIENDLY_NAMES[a.id] || a.name;
      if (!seen.has(label)) {
        smallGroup.push(label.toLowerCase());
        seen.add(label);
      }
      continue;
    }

    // Merge TVs and decoders
    if ((a.id === 'tv_32' || a.id === 'tv_55') && seen.has('tv')) continue;
    if (a.id === 'decoder' && seen.has('tv')) continue;
    if (a.id === 'tv_32' || a.id === 'tv_55' || a.id === 'decoder') {
      seen.add('tv');
      // Check if decoder is also in the list
      const hasDecoder = fittingAppliances.some(x => x.id === 'decoder' && x.qty > 0);
      const hasTv = fittingAppliances.some(x => (x.id === 'tv_32' || x.id === 'tv_55') && x.qty > 0);
      if (hasTv && hasDecoder) {
        lines.push('TV + decoder');
      } else if (hasTv) {
        lines.push('TV');
      } else {
        lines.push('Decoder');
      }
      continue;
    }

    const friendly = FRIENDLY_NAMES[a.id] || a.name;
    if (!seen.has(friendly)) {
      const prefix = a.qty > 1 ? `${a.qty}\u00D7 ` : '';
      lines.push(`${prefix}${friendly}`);
      seen.add(friendly);
    }
  }

  if (smallGroup.length > 0) {
    // Capitalize first item
    const grouped = smallGroup.join(', ');
    lines.push(grouped.charAt(0).toUpperCase() + grouped.slice(1));
  }

  if (tier === 'premium') {
    lines.push('Room to add more appliances');
  }

  return lines;
}

export default function ResultsCarousel({ result, selectedAppliances }: ResultsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(1); // Start on Standard (recommended)
  const [toast, setToast] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const tiers: { key: 'budget' | 'standard' | 'premium'; tier: TierResult; recommended: boolean }[] = [
    { key: 'budget', tier: result.budget, recommended: false },
    { key: 'standard', tier: result.standard, recommended: true },
    { key: 'premium', tier: result.premium, recommended: false },
  ];

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeIndex < 2) setActiveIndex(prev => prev + 1);
      if (diff < 0 && activeIndex > 0) setActiveIndex(prev => prev - 1);
    }
  }, [activeIndex]);

  const handleShare = useCallback(async (tierKey: 'budget' | 'standard' | 'premium', tier: TierResult) => {
    const url = `https://solarbuilders-ng.vercel.app/calculator?budget=${tier.minCost}&kva=${tier.kva}&batteries=${tier.batteries}&panels=${tier.panels}&tier=${tierKey}`;
    const text = `My Solar Estimate (via SolarBuilders.ng):\nSystem: ${tier.kva}kVA ${tier.label}\nBatteries: ${tier.batteries}\u00D7 200Ah\nPanels: ${tier.panels}\u00D7 ${tier.panelWatts}W\nEstimated cost: ${formatNaira(tier.minCost)}\u2013${formatNaira(tier.maxCost)}\n\nSize your own system: https://solarbuilders-ng.vercel.app/calculator`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'My Solar Estimate', text, url });
        return;
      } catch {
        // User cancelled or share failed, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  }, []);

  const otherOptionsLabel = activeIndex === 0
    ? 'Standard & Premium'
    : activeIndex === 1
      ? 'Budget & Premium'
      : 'Budget & Standard';

  return (
    <div>
      {/* Carousel */}
      <div
        className="overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 90}%)` }}
        >
          {tiers.map(({ key, tier, recommended }) => {
            const canRun = getWhatYouCanRun(key, tier.coverage, selectedAppliances, result.totalWatts);

            return (
              <div
                key={key}
                className="flex-shrink-0 pr-4"
                style={{ width: '90%' }}
              >
                <div
                  className={`bg-white rounded-2xl p-6 h-full ${
                    recommended
                      ? 'border-2 border-[#F59E0B] shadow-lg shadow-amber-100'
                      : 'border border-[#E2E8F0]'
                  }`}
                >
                  {/* Top row: badge + share */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-[#F8FAFC] text-[#64748B] px-3 py-1 rounded-full border border-[#E2E8F0] font-medium">
                        {tier.emoji} {tier.label}
                      </span>
                      {recommended && (
                        <span className="bg-[#F59E0B] text-[#0A0F1E] text-xs font-heading font-bold px-3 py-1 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleShare(key, tier)}
                      className="text-[#94A3B8] hover:text-[#F59E0B] transition-colors flex items-center gap-1.5 text-sm"
                    >
                      <Share2 className="w-4 h-4" /> Share
                    </button>
                  </div>

                  {/* Price — huge, first thing */}
                  <p className="font-heading font-extrabold text-[#F59E0B] text-3xl sm:text-4xl leading-tight">
                    {formatNaira(tier.minCost)} &ndash; {formatNaira(tier.maxCost)}
                  </p>
                  <p className="text-[#64748B] text-sm mt-1 mb-5">
                    {tier.label} System &middot; {tier.coverage}% coverage
                  </p>

                  <hr className="border-[#E2E8F0] mb-5" />

                  {/* Specs */}
                  <div className="space-y-2.5 mb-5">
                    <div className="flex items-center gap-2.5 text-[#0A0F1E]">
                      <span className="text-base">&#9889;</span>
                      <span className="text-sm font-medium">{tier.kva}kVA Inverter</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#0A0F1E]">
                      <span className="text-base">&#128267;</span>
                      <span className="text-sm font-medium">{tier.batteries}&times; 200Ah Batteries</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-[#0A0F1E]">
                      <span className="text-base">&#9728;&#65039;</span>
                      <span className="text-sm font-medium">{tier.panels}&times; {tier.panelWatts}W Solar Panels</span>
                    </div>
                  </div>

                  <hr className="border-[#E2E8F0] mb-5" />

                  {/* What you can run */}
                  {canRun.length > 0 && (
                    <div className="mb-5">
                      <p className="text-xs font-heading font-semibold text-[#64748B] uppercase tracking-widest mb-3">
                        You can run at once
                      </p>
                      <div className="space-y-1.5">
                        {canRun.map((line, i) => (
                          <p key={i} className="text-sm text-[#0A0F1E] flex items-start gap-2">
                            <span className="text-[#059669] mt-0.5">{line === 'Room to add more appliances' ? '+' : '\u2713'}</span>
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* CTA */}
                  <Link
                    href="/marketplace"
                    className="w-full bg-[#F59E0B] text-[#0A0F1E] py-3.5 rounded-full font-heading font-bold text-sm text-center flex items-center justify-center gap-2 hover:bg-[#D97706] transition-colors"
                  >
                    Get Quotes from Builders &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 mt-5">
        {tiers.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              i === activeIndex ? 'bg-[#F59E0B]' : 'bg-[#E2E8F0]'
            }`}
          />
        ))}
      </div>

      {/* Blinking view other options button */}
      <button
        onClick={() => setActiveIndex((activeIndex + 1) % 3)}
        className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 bg-white border-2 border-[#F59E0B] text-[#0A0F1E] font-heading font-bold py-4 rounded-full text-lg animate-pulse mt-4"
      >
        View other options ({otherOptionsLabel}) &rarr;
      </button>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0A0F1E] text-white px-5 py-3 rounded-full text-sm font-medium shadow-lg z-50 animate-fade-in">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
