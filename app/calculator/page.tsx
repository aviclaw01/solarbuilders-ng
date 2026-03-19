'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { Minus, Plus, X, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

interface ApplianceItem {
  id: string;
  name: string;
  emoji: string;
  watts: number;
  qty: number;
  hoursPerDay: number;
}

const STEP1_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'ac_1_5hp', name: 'Air Con (1.5HP)', emoji: '🌬️', watts: 1200, hoursPerDay: 4 },
  { id: 'deep_freezer', name: 'Deep Freezer', emoji: '❄️', watts: 250, hoursPerDay: 8 },
  { id: 'refrigerator', name: 'Refrigerator', emoji: '🧊', watts: 200, hoursPerDay: 8 },
  { id: 'water_pump', name: 'Water Pump', emoji: '🚿', watts: 750, hoursPerDay: 2 },
  { id: 'washing_machine', name: 'Washing Machine', emoji: '🧺', watts: 500, hoursPerDay: 1 },
  { id: 'water_heater', name: 'Water Heater', emoji: '♨️', watts: 2000, hoursPerDay: 1 },
];

const STEP2_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'tv_32', name: 'TV (32")', emoji: '📺', watts: 60, hoursPerDay: 6 },
  { id: 'tv_55', name: 'TV (55"+)', emoji: '🖥️', watts: 150, hoursPerDay: 6 },
  { id: 'laptop', name: 'Laptop', emoji: '💻', watts: 65, hoursPerDay: 8 },
  { id: 'desktop_pc', name: 'Desktop PC', emoji: '🖨️', watts: 200, hoursPerDay: 8 },
  { id: 'microwave', name: 'Microwave', emoji: '📦', watts: 1000, hoursPerDay: 0.5 },
  { id: 'standing_fan', name: 'Standing Fan', emoji: '🌀', watts: 75, hoursPerDay: 8 },
  { id: 'decoder', name: 'DSTV/Decoder', emoji: '📡', watts: 25, hoursPerDay: 6 },
];

const STEP3_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'led_bulb', name: 'LED Bulb', emoji: '💡', watts: 10, hoursPerDay: 8 },
  { id: 'phone_charger', name: 'Phone Charger', emoji: '📱', watts: 15, hoursPerDay: 4 },
  { id: 'wifi_router', name: 'WiFi Router', emoji: '📻', watts: 15, hoursPerDay: 24 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', emoji: '🌬️', watts: 70, hoursPerDay: 8 },
  { id: 'security_light', name: 'Security Light', emoji: '💡', watts: 30, hoursPerDay: 12 },
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
  const dailyKwh = appliances.filter(a => a.qty > 0).reduce((sum, a) => sum + (a.watts * a.qty * a.hoursPerDay) / 1000, 0);

  const budgetWatts = totalWatts * 0.6;
  const budgetKva = roundUpKva(budgetWatts);
  const budgetBatteries = Math.max(2, Math.ceil((budgetWatts * 4) / (24 * 0.5 * 0.8 * 200)));
  const budgetPanels = Math.max(2, Math.ceil((dailyKwh * 0.6 * 1000) / (6 * 0.8 * 400)));

  const stdKva = roundUpKva(totalWatts * 1.2);
  const stdBatteries = Math.max(4, Math.ceil((totalWatts * 8) / (24 * 0.5 * 0.8 * 200)));
  const stdPanels = Math.max(4, Math.ceil((dailyKwh * 1000) / (6 * 0.8 * 400)));

  const premKva = roundUpKva(totalWatts * 1.5);
  const premBatteries = Math.max(6, Math.ceil((totalWatts * 12) / (24 * 0.8 * 0.8 * 200)));
  const premPanels = Math.max(6, Math.ceil((dailyKwh * 1.5 * 1000) / (6 * 0.8 * 400)));

  return {
    totalWatts,
    dailyKwh,
    budget: { label: 'Budget', emoji: '💰', kva: budgetKva, batteries: budgetBatteries, panels: budgetPanels, panelWatts: 250, minCost: 350000, maxCost: 600000, coverage: 60, note: 'Covers essentials (lights, fans, fridge). Not suitable for AC.' },
    standard: { label: 'Standard', emoji: '⚡', kva: stdKva, batteries: stdBatteries, panels: stdPanels, panelWatts: 300, minCost: 600000, maxCost: 1200000, coverage: 100, note: 'Runs everything on your list comfortably.' },
    premium: { label: 'Premium', emoji: '👑', kva: premKva, batteries: premBatteries, panels: premPanels, panelWatts: 400, minCost: 1200000, maxCost: 2500000, coverage: 120, note: 'Everything + future expansion headroom. Lithium batteries.' },
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
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors font-bold text-lg ${
          qty === 0
            ? 'opacity-30 cursor-not-allowed text-[#64748B]'
            : 'bg-[#0A0F1E] text-white hover:bg-[#1E293B]'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-heading font-bold text-lg text-[#0A0F1E] min-w-[28px] text-center">{qty}</span>
      <button
        onClick={onIncrement}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#0A0F1E] text-white hover:bg-[#1E293B] transition-colors"
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
  const [hours, setHours] = useState<Record<string, number>>({});
  const [customAppliances, setCustomAppliances] = useState<ApplianceItem[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState('');
  const [customHours, setCustomHours] = useState('4');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sb_calculator');
      if (saved) {
        const data = JSON.parse(saved);
        setQuantities(data.quantities || {});
        setHours(data.hours || {});
        setCustomAppliances(data.customAppliances || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sb_calculator', JSON.stringify({ quantities, hours, customAppliances }));
    } catch {}
  }, [quantities, hours, customAppliances]);

  const setQty = (id: string, qty: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(0, qty) }));
  };

  const getHours = (id: string, defaultHours: number) => hours[id] ?? defaultHours;
  const setItemHours = (id: string, h: number) => {
    setHours(prev => ({ ...prev, [id]: Math.max(1, Math.min(24, h)) }));
  };

  const addCustomAppliance = () => {
    if (!customName.trim() || !customWatts) return;
    const newItem: ApplianceItem = {
      id: `custom_${Date.now()}`,
      name: customName.trim(),
      emoji: '⚙️',
      watts: Number(customWatts),
      qty: 1,
      hoursPerDay: Number(customHours) || 4,
    };
    setCustomAppliances(prev => [...prev, newItem]);
    setCustomName('');
    setCustomWatts('');
    setCustomHours('4');
    setShowCustomForm(false);
  };

  const removeCustomAppliance = (id: string) => {
    setCustomAppliances(prev => prev.filter(a => a.id !== id));
  };

  const applyTypicalHome = () => {
    const preset: Record<string, number> = {};
    TYPICAL_HOME_PRESET.forEach(item => { preset[item.id] = item.qty; });
    setQuantities(prev => ({ ...prev, ...preset }));
  };

  const allAppliances: ApplianceItem[] = [
    ...STEP1_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0, hoursPerDay: getHours(a.id, a.hoursPerDay) })),
    ...STEP2_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0, hoursPerDay: getHours(a.id, a.hoursPerDay) })),
    ...STEP3_APPLIANCES.map(a => ({ ...a, qty: quantities[a.id] || 0, hoursPerDay: getHours(a.id, a.hoursPerDay) })),
    ...customAppliances,
  ];

  const selectedAppliances = allAppliances.filter(a => a.qty > 0);
  const totalWatts = selectedAppliances.reduce((sum, a) => sum + a.watts * a.qty, 0);
  const currentStepAppliances = step === 1 ? STEP1_APPLIANCES : step === 2 ? STEP2_APPLIANCES : STEP3_APPLIANCES;

  const stepTitles: Record<number, string> = {
    1: 'Heavy Appliances',
    2: 'Medium Appliances',
    3: 'Light Appliances',
  };

  if (showResults) {
    const result = calculateSystem(selectedAppliances);

    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-8 pb-16">
          <button onClick={() => setShowResults(false)} className="text-[#64748B] hover:text-[#0A0F1E] flex items-center gap-1 text-sm mb-6 font-medium">
            <ArrowLeft className="w-4 h-4" /> Recalculate
          </button>

          <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="font-heading font-semibold text-[#0A0F1E]">Your system estimate is ready</p>
              <p className="text-[#64748B] text-sm">{selectedAppliances.length} appliances · {(totalWatts / 1000).toFixed(1)}kW total load · ~{result.dailyKwh.toFixed(1)} kWh/day</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* Budget */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <h3 className="font-heading font-bold text-[#0A0F1E] text-lg">Budget System</h3>
                </div>
                <span className="text-xs bg-[#F8FAFC] text-[#64748B] px-3 py-1 rounded-full border border-[#E2E8F0]">~{result.budget.coverage}% coverage</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Inverter', value: `${result.budget.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.budget.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.budget.panels}× ${result.budget.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.budget.minCost)}–${formatNaira(result.budget.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#94A3B8] mb-0.5">{item.label}</p>
                    <p className="font-heading font-bold text-[#0A0F1E]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#64748B] text-sm">⚠️ {result.budget.note}</p>
            </div>

            {/* Standard — Recommended */}
            <div className="bg-white rounded-2xl border-2 border-[#F59E0B] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-heading font-bold text-[#0A0F1E] text-xl">Standard System</h3>
                </div>
                <span className="bg-[#F59E0B] text-[#0A0F1E] text-xs font-heading font-bold px-3 py-1 rounded-full">★ Recommended</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Inverter', value: `${result.standard.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.standard.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.standard.panels}× ${result.standard.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.standard.minCost)}–${formatNaira(result.standard.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#94A3B8] mb-0.5">{item.label}</p>
                    <p className="font-heading font-bold text-[#0A0F1E] text-lg">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#059669] text-sm font-medium">✅ {result.standard.note}</p>
            </div>

            {/* Premium */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">👑</span>
                  <h3 className="font-heading font-bold text-[#0A0F1E] text-lg">Premium System</h3>
                </div>
                <span className="text-xs bg-[#F8FAFC] text-[#64748B] px-3 py-1 rounded-full border border-[#E2E8F0]">Max headroom</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {[
                  { label: 'Inverter', value: `${result.premium.kva}kVA` },
                  { label: 'Battery Bank', value: `${result.premium.batteries}× 200Ah` },
                  { label: 'Solar Panels', value: `${result.premium.panels}× ${result.premium.panelWatts}W` },
                  { label: 'Est. Cost', value: `${formatNaira(result.premium.minCost)}–${formatNaira(result.premium.maxCost)}` },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs text-[#94A3B8] mb-0.5">{item.label}</p>
                    <p className="font-heading font-bold text-[#0A0F1E]">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[#059669] text-sm font-medium">✅ {result.premium.note}</p>
            </div>
          </div>

          {selectedAppliances.length > 0 && (
            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] p-6 mb-6">
              <h3 className="font-heading font-semibold text-[#64748B] text-xs uppercase tracking-widest mb-4">Your appliances</h3>
              <div className="space-y-2">
                {selectedAppliances.map(appliance => (
                  <div key={appliance.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                    <span className="text-[#0A0F1E] text-sm">{appliance.qty}× {appliance.name}</span>
                    <button onClick={() => setQty(appliance.id, 0)} className="text-[#94A3B8] hover:text-red-500 transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/marketplace"
            className="w-full bg-[#F59E0B] text-[#0A0F1E] py-5 rounded-full font-heading font-bold text-xl text-center flex items-center justify-center gap-2 hover:bg-[#D97706] transition-colors"
          >
            Ready to get quotes? Browse matched builders →
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-heading font-bold text-[#0A0F1E] text-sm">
              Step {step} of 3 — {stepTitles[step]}
            </span>
            <span className="text-[#94A3B8] text-sm">{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F59E0B] rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Typical home preset */}
        {step === 1 && (
          <button
            onClick={applyTypicalHome}
            className="mb-6 bg-[#0A0F1E] text-white text-sm font-heading font-semibold px-5 py-2.5 rounded-full hover:bg-[#1E293B] transition-colors"
          >
            🏠 Load typical 3-bedroom home
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
                className={`bg-white rounded-2xl p-5 transition-all ${
                  isSelected
                    ? 'border-2 border-[#F59E0B] bg-[#FEF3C7]'
                    : 'border-2 border-[#E2E8F0] hover:border-[#F59E0B]/50'
                }`}
              >
                <div className="text-3xl text-center mb-2">{appliance.emoji}</div>
                <p className="font-heading font-semibold text-[#0A0F1E] text-sm text-center leading-tight">{appliance.name}</p>
                <p className="text-[#94A3B8] text-xs text-center mb-1">{appliance.watts}W</p>
                <Stepper
                  qty={qty}
                  onDecrement={() => setQty(appliance.id, qty - 1)}
                  onIncrement={() => setQty(appliance.id, qty + 1)}
                />
                {qty > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <button
                      onClick={() => setItemHours(appliance.id, getHours(appliance.id, appliance.hoursPerDay) - 1)}
                      className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold hover:bg-amber-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-amber-600 text-xs font-semibold min-w-[52px] text-center">
                      ⏱ {getHours(appliance.id, appliance.hoursPerDay)}h/day
                    </span>
                    <button
                      onClick={() => setItemHours(appliance.id, getHours(appliance.id, appliance.hoursPerDay) + 1)}
                      className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold hover:bg-amber-200 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {step === 3 && (
          <div className="mb-8">
            <h3 className="font-heading font-semibold text-[#0A0F1E] text-sm mb-3">Custom Appliances</h3>
            {customAppliances.length > 0 && (
              <div className="space-y-2 mb-3">
                {customAppliances.map(ca => (
                  <div key={ca.id} className="flex items-center justify-between bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#0A0F1E]">⚙️ {ca.name}</span>
                      <span className="text-xs text-[#64748B] ml-2">{ca.watts}W · {ca.hoursPerDay}h/day</span>
                    </div>
                    <button onClick={() => removeCustomAppliance(ca.id)} className="text-[#94A3B8] hover:text-red-500 transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {showCustomForm ? (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 space-y-3">
                <input
                  type="text"
                  placeholder="Appliance name"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Watts"
                    value={customWatts}
                    onChange={e => setCustomWatts(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                  />
                  <input
                    type="number"
                    placeholder="Hours/day"
                    value={customHours}
                    onChange={e => setCustomHours(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addCustomAppliance}
                    className="flex-1 bg-[#F59E0B] text-[#0A0F1E] py-2 rounded-full font-heading font-semibold text-sm hover:bg-[#D97706] transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowCustomForm(false)}
                    className="px-4 py-2 text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomForm(true)}
                className="text-sm font-semibold text-[#F59E0B] hover:text-[#D97706] transition-colors"
              >
                ＋ Add custom appliance
              </button>
            )}
          </div>
        )}

        {/* Live load summary */}
        {totalWatts > 0 && (
          <div className="bg-[#0A0F1E] rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-xs mb-1">Current load estimate</p>
              <p className="font-heading font-extrabold text-[#F59E0B] text-2xl">{(totalWatts / 1000).toFixed(2)} kW</p>
              <p className="text-[#64748B] text-xs">{selectedAppliances.length} appliance{selectedAppliances.length !== 1 ? 's' : ''} · Add more to refine</p>
            </div>
            <Zap className="w-8 h-8 text-[#F59E0B]" fill="currentColor" />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-[#64748B] hover:text-[#0A0F1E] font-semibold py-4 px-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 bg-[#F59E0B] text-[#0A0F1E] py-4 rounded-full font-heading font-bold text-base hover:bg-[#D97706] transition-colors flex items-center justify-center gap-2"
            >
              Next: {step === 1 ? 'Medium Appliances' : 'Light Appliances'}
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={() => setShowResults(true)}
              disabled={selectedAppliances.length === 0}
              className={`flex-1 py-4 rounded-full font-heading font-bold text-base flex items-center justify-center gap-2 transition-colors ${
                selectedAppliances.length > 0
                  ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]'
                  : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
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
