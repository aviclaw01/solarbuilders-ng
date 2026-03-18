'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import { Minus, Plus, X, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

interface ApplianceItem {
  id: string;
  name: string;
  emoji: string;
  watts: number;
  qty: number;
}

const STEP1_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'ac_1_5hp', name: 'Air Con (1.5HP)', emoji: '🌬️', watts: 1200 },
  { id: 'deep_freezer', name: 'Deep Freezer', emoji: '❄️', watts: 250 },
  { id: 'refrigerator', name: 'Refrigerator', emoji: '🧊', watts: 200 },
  { id: 'water_pump', name: 'Water Pump', emoji: '🚿', watts: 750 },
  { id: 'washing_machine', name: 'Washing Machine', emoji: '🧺', watts: 500 },
  { id: 'water_heater', name: 'Water Heater', emoji: '♨️', watts: 2000 },
];

const STEP2_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'tv_32', name: 'TV (32")', emoji: '📺', watts: 60 },
  { id: 'tv_55', name: 'TV (55"+)', emoji: '🖥️', watts: 150 },
  { id: 'laptop', name: 'Laptop', emoji: '💻', watts: 65 },
  { id: 'desktop_pc', name: 'Desktop PC', emoji: '🖨️', watts: 200 },
  { id: 'microwave', name: 'Microwave', emoji: '📦', watts: 1000 },
  { id: 'standing_fan', name: 'Standing Fan', emoji: '🌀', watts: 75 },
  { id: 'decoder', name: 'DSTV/Decoder', emoji: '📡', watts: 25 },
];

const STEP3_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'led_bulb', name: 'LED Bulb', emoji: '💡', watts: 10 },
  { id: 'phone_charger', name: 'Phone Charger', emoji: '📱', watts: 15 },
  { id: 'wifi_router', name: 'WiFi Router', emoji: '📻', watts: 15 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', emoji: '🌬️', watts: 70 },
  { id: 'security_light', name: 'Security Light', emoji: '💡', watts: 30 },
];

const TYPICAL_HOME_PRESET = [
  { id: 'ac_1_5hp', qty: 1 },
  { id: 'refrigerator', qty: 1 },
  { id: 'deep_freezer', qty: 1 },
  { id: 'tv_32', qty: 2 },
  { id: 'standing_fan', qty: 2 },
  { id: 'ceiling_fan', qty: 2 },
  { id: 'led_bulb', qty: 8 },
  { id: 'phone_charger', qty: 4 },
  { id: 'wifi_router', qty: 1 },
];

const STANDARD_KVA = [1, 1.5, 2, 2.5, 3, 3.5, 5, 7.5, 10, 15, 20];

function roundUpKva(watts: number): number {
  const kva = (watts * 1.25) / 1000;
  return STANDARD_KVA.find(k => k >= kva) ?? 20;
}

function calculateSystem(appliances: ApplianceItem[]) {
  const totalWatts = appliances.filter(a => a.qty > 0).reduce((sum, a) => sum + a.watts * a.qty, 0);
  const dailyKwh = (totalWatts * 6) / 1000;
  
  // Budget: ~60% coverage
  const budgetWatts = totalWatts * 0.6;
  const budgetKva = roundUpKva(budgetWatts);
  const budgetBatteries = Math.max(2, Math.ceil((budgetWatts * 4) / (24 * 0.5 * 0.8 * 200)));
  const budgetPanels = Math.max(2, Math.ceil((dailyKwh * 0.6 * 1000) / (6 * 0.8 * 400)));

  // Standard: 100% coverage + 20% headroom  
  const stdKva = roundUpKva(totalWatts * 1.2);
  const stdBatteries = Math.max(4, Math.ceil((totalWatts * 8) / (24 * 0.5 * 0.8 * 200)));
  const stdPanels = Math.max(4, Math.ceil((dailyKwh * 1000) / (6 * 0.8 * 400)));

  // Premium: 150% headroom, lithium battery tier
  const premKva = roundUpKva(totalWatts * 1.5);
  const premBatteries = Math.max(6, Math.ceil((totalWatts * 12) / (24 * 0.8 * 0.8 * 200)));
  const premPanels = Math.max(6, Math.ceil((dailyKwh * 1.5 * 1000) / (6 * 0.8 * 400)));

  return {
    totalWatts,
    dailyKwh,
    budget: {
      label: 'Budget',
      emoji: '💰',
      kva: budgetKva,
      batteries: budgetBatteries,
      panels: budgetPanels,
      panelWatts: 250,
      minCost: 350000,
      maxCost: 600000,
      coverage: 60,
      note: 'Covers essentials (lights, fans, fridge). Not suitable for AC.',
    },
    standard: {
      label: 'Standard',
      emoji: '⚡',
      kva: stdKva,
      batteries: stdBatteries,
      panels: stdPanels,
      panelWatts: 300,
      minCost: 600000,
      maxCost: 1200000,
      coverage: 100,
      note: 'Runs everything on your list comfortably.',
    },
    premium: {
      label: 'Premium',
      emoji: '👑',
      kva: premKva,
      batteries: premBatteries,
      panels: premPanels,
      panelWatts: 400,
      minCost: 1200000,
      maxCost: 2500000,
      coverage: 120,
      note: 'Everything + future expansion headroom. Lithium batteries.',
    },
  };
}

function formatNaira(amount: number): string {
  if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
  return `₦${(amount / 1000).toFixed(0)}k`;
}

function Stepper({ qty, onDecrement, onIncrement }: { qty: number; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mt-3">
      <button
        onClick={onDecrement}
        disabled={qty === 0}
        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${qty === 0 ? 'opacity-30 cursor-not-allowed text-[#64748B]' : 'text-[#64748B] hover:bg-[#F1F5F9]'}`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-lg text-[#0F172A] min-w-[28px] text-center">{qty}</span>
      <button
        onClick={onIncrement}
        className="w-9 h-9 rounded-lg flex items-center justify-center text-[#F59E0B] hover:bg-[#FFFBEB] transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [boltDismissed, setBoltDismissed] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sb_calculator');
      if (saved) {
        const data = JSON.parse(saved);
        setQuantities(data.quantities || {});
      }
    } catch {}
  }, []);

  // Save to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('sb_calculator', JSON.stringify({ quantities }));
    } catch {}
  }, [quantities]);

  const setQty = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const applyTypicalHome = () => {
    const preset: Record<string, number> = {};
    TYPICAL_HOME_PRESET.forEach(item => { preset[item.id] = item.qty; });
    setQuantities(prev => ({ ...prev, ...preset }));
  };

  const allAppliances: ApplianceItem[] = [
    ...STEP1_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0 })),
    ...STEP2_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0 })),
    ...STEP3_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0 })),
  ];

  const selectedAppliances = allAppliances.filter(a => a.qty > 0);
  const totalWatts = selectedAppliances.reduce((sum, a) => sum + a.watts * a.qty, 0);

  const currentStepAppliances = step === 1 ? STEP1_APPLIANCES : step === 2 ? STEP2_APPLIANCES : STEP3_APPLIANCES;

  const boltMessages: Record<number, string> = {
    1: "Let's figure out your system. Pick heavy appliances first — AC uses the most power.",
    2: "Almost there — these use moderate power.",
    3: "Last step — these are small but they add up!",
  };

  if (showResults) {
    const result = calculateSystem(selectedAppliances);
    const waLink = (location = 'Lagos') => {
      const msg = encodeURIComponent(`Hi, I found you on SolarBuilders.ng. I need a ${result.standard.kva}kVA solar system in ${location}. Can you help?`);
      return `/marketplace`;
    };

    return (
      <div className="min-h-screen bg-[#FAFAF7]">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setShowResults(false)} className="text-[#64748B] hover:text-[#0F172A] flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Recalculate
            </button>
          </div>

          {/* Bolt celebration chip */}
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-[#0F172A] font-semibold">Your system is ready!</p>
              <p className="text-[#64748B] text-sm">Based on <strong>{selectedAppliances.length} appliances</strong> · {(totalWatts / 1000).toFixed(1)}kW total load · ~{result.dailyKwh.toFixed(1)} kWh/day</p>
            </div>
          </div>

          {/* System cards */}
          <div className="space-y-4 mb-8">
            {/* Budget */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg">Budget System</h3>
                </div>
                <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-1 rounded-full">~{result.budget.coverage}% load</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Inverter', value: `${result.budget.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.budget.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.budget.panels}× ${result.budget.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.budget.minCost)}–${formatNaira(result.budget.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#64748B]">{item.label}</p>
                    <p style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#64748B] text-sm">⚠️ {result.budget.note}</p>
            </div>

            {/* Standard - RECOMMENDED */}
            <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-[#F59E0B]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-xl">Standard System</h3>
                </div>
                <span className="bg-[#F59E0B] text-[#0F172A] text-xs font-bold px-3 py-1 rounded-full">★ Best Value</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Inverter', value: `${result.standard.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.standard.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.standard.panels}× ${result.standard.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.standard.minCost)}–${formatNaira(result.standard.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#64748B]">{item.label}</p>
                    <p style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#10B981] text-sm font-medium">✅ {result.standard.note}</p>
            </div>

            {/* Premium */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A] text-lg">Premium System</h3>
                </div>
                <span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-1 rounded-full">Max headroom</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Inverter', value: `${result.premium.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.premium.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.premium.panels}× ${result.premium.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.premium.minCost)}–${formatNaira(result.premium.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#64748B]">{item.label}</p>
                    <p style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-bold text-[#0F172A]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#10B981] text-sm font-medium">✅ {result.premium.note}</p>
            </div>
          </div>

          {/* Adjust load */}
          {selectedAppliances.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <h3 style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-semibold text-[#64748B] text-sm uppercase tracking-wide mb-3">
                Adjust your load
              </h3>
              <div className="space-y-2">
                {selectedAppliances.map(appliance => (
                  <div key={appliance.id} className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
                    <span className="text-[#0F172A] text-sm">{appliance.qty}× {appliance.name}</span>
                    <button
                      onClick={() => setQty(appliance.id, 0)}
                      className="text-[#64748B] hover:text-[#EF4444] transition-colors p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <Link
            href="/marketplace"
            className="w-full bg-[#F59E0B] text-[#0F172A] py-5 rounded-xl font-bold text-xl text-center flex items-center justify-center gap-2 hover:bg-[#D97706] transition-colors"
            style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
          >
            <Zap className="w-6 h-6" fill="currentColor" />
            See Matching Builders →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-semibold text-[#0F172A] text-lg">
              Step {step} of 3: {step === 1 ? 'Heavy Appliances' : step === 2 ? 'Medium Appliances' : 'Light Appliances'}
            </span>
            <span className="text-[#64748B] text-sm">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Bolt chip */}
        {!boltDismissed && (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-3xl">⚡</span>
            <p className="text-[#0F172A] text-sm flex-1">{boltMessages[step]}</p>
            <button onClick={() => setBoltDismissed(true)} className="text-[#64748B] hover:text-[#0F172A]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Typical home preset (Step 1 only) */}
        {step === 1 && (
          <button
            onClick={applyTypicalHome}
            className="mb-6 bg-[#0F172A] text-[#FAFAF7] text-sm font-semibold px-4 py-2.5 rounded-full hover:bg-[#1E293B] transition-colors"
          >
            🏠 Typical 3-bedroom home
          </button>
        )}

        {/* Appliance grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {currentStepAppliances.map((appliance) => {
            const qty = quantities[appliance.id] || 0;
            const isSelected = qty > 0;

            return (
              <div
                key={appliance.id}
                className={`bg-white rounded-xl p-4 transition-all ${
                  isSelected
                    ? 'border-2 border-[#F59E0B] bg-[#FFFBEB]'
                    : 'border border-[#E2E8F0] shadow-sm'
                }`}
              >
                <div className="text-3xl text-center mb-2">{appliance.emoji}</div>
                <p style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}} className="font-semibold text-[#0F172A] text-sm text-center leading-tight">{appliance.name}</p>
                <p className="text-[#64748B] text-xs text-center mb-1">{appliance.watts}W</p>
                <Stepper
                  qty={qty}
                  onDecrement={() => setQty(appliance.id, qty - 1)}
                  onIncrement={() => setQty(appliance.id, qty + 1)}
                />
              </div>
            );
          })}
        </div>

        {/* Load summary bar */}
        {totalWatts > 0 && (
          <div className="bg-[#0F172A] rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-white text-sm font-semibold">{selectedAppliances.length} appliance{selectedAppliances.length !== 1 ? 's' : ''} selected</p>
              <p className="text-[#F59E0B] font-bold">{(totalWatts / 1000).toFixed(2)}kW total</p>
            </div>
            <Zap className="w-6 h-6 text-[#F59E0B]" fill="currentColor" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => { setStep(step - 1); setBoltDismissed(false); }}
              className="flex items-center gap-2 text-[#64748B] hover:text-[#0F172A] font-semibold py-4 px-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => { setStep(step + 1); setBoltDismissed(false); }}
              className="flex-1 bg-[#F59E0B] text-[#0F172A] py-4 rounded-lg font-bold text-lg hover:bg-[#D97706] transition-colors flex items-center justify-center gap-2"
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
            >
              Next: {step === 1 ? 'Medium Appliances' : 'Light Appliances'}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowResults(true)}
              disabled={selectedAppliances.length === 0}
              className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                selectedAppliances.length > 0
                  ? 'bg-[#F59E0B] text-[#0F172A] hover:bg-[#D97706]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
              style={{fontFamily: "'Plus Jakarta Sans', sans-serif"}}
            >
              <Zap className="w-5 h-5" fill={selectedAppliances.length > 0 ? 'currentColor' : 'none'} />
              Calculate My System
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
