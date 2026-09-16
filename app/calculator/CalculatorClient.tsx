'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Minus, Plus, X, Zap, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import QuoteResults from '@/components/ui/QuoteResults';
import { buildQuote, decodeQuotePayload, parseTierOptions, type QuoteOptions, type TierKey } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';

interface ApplianceItem {
  id: string;
  name: string;
  emoji: string;
  watts: number;
  qty: number;
  hoursPerDay: number;
}

// hoursPerDay = effective running hours. Fridge/freezer compressors cycle ~35%,
// so 8h ≈ a full day of cooling (VL-001 BUG-4).
const STEP1_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'ac_1hp', name: 'Air Con (1HP)', emoji: '🌬️', watts: 900, hoursPerDay: 4 },
  { id: 'ac_1_5hp', name: 'Air Con (1.5HP)', emoji: '🌬️', watts: 1200, hoursPerDay: 4 },
  { id: 'ac_2hp', name: 'Air Con (2HP)', emoji: '🌬️', watts: 1800, hoursPerDay: 4 },
  { id: 'deep_freezer', name: 'Deep Freezer', emoji: '❄️', watts: 250, hoursPerDay: 8 },
  { id: 'refrigerator', name: 'Refrigerator', emoji: '🧊', watts: 200, hoursPerDay: 8 },
  { id: 'water_pump', name: 'Water Pump', emoji: '🚿', watts: 750, hoursPerDay: 2 },
  { id: 'washing_machine', name: 'Washing Machine', emoji: '🧺', watts: 600, hoursPerDay: 1 },
  { id: 'water_heater', name: 'Water Heater', emoji: '♨️', watts: 2000, hoursPerDay: 1 },
  { id: 'electric_iron', name: 'Electric Iron', emoji: '👔', watts: 1200, hoursPerDay: 0.5 },
];

const STEP2_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'tv_32', name: 'TV (32")', emoji: '📺', watts: 60, hoursPerDay: 6 },
  { id: 'tv_55', name: 'TV (55"+)', emoji: '🖥️', watts: 150, hoursPerDay: 6 },
  { id: 'laptop', name: 'Laptop', emoji: '💻', watts: 65, hoursPerDay: 8 },
  { id: 'desktop_pc', name: 'Desktop PC', emoji: '🖨️', watts: 200, hoursPerDay: 8 },
  { id: 'microwave', name: 'Microwave', emoji: '📦', watts: 1000, hoursPerDay: 0.5 },
  { id: 'blender', name: 'Blender', emoji: '🥤', watts: 500, hoursPerDay: 0.3 },
  { id: 'standing_fan', name: 'Standing Fan', emoji: '🌀', watts: 75, hoursPerDay: 8 },
  { id: 'decoder', name: 'DSTV/Decoder', emoji: '📡', watts: 25, hoursPerDay: 6 },
];

const STEP3_APPLIANCES: Omit<ApplianceItem, 'qty'>[] = [
  { id: 'led_bulb', name: 'LED Bulb', emoji: '💡', watts: 10, hoursPerDay: 8 },
  { id: 'phone_charger', name: 'Phone Charger', emoji: '📱', watts: 15, hoursPerDay: 4 },
  { id: 'wifi_router', name: 'WiFi Router', emoji: '📻', watts: 15, hoursPerDay: 24 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', emoji: '🌬️', watts: 70, hoursPerDay: 8 },
  { id: 'security_light', name: 'Security Light', emoji: '💡', watts: 30, hoursPerDay: 12 },
  { id: 'cctv', name: 'CCTV System', emoji: '📷', watts: 50, hoursPerDay: 24 },
];

const ALL_PRESETS = [...STEP1_APPLIANCES, ...STEP2_APPLIANCES, ...STEP3_APPLIANCES];
const PRESET_IDS = new Set(ALL_PRESETS.map((a) => a.id));

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

function Stepper({ qty, onDecrement, onIncrement }: { qty: number; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <div className="flex items-center justify-center gap-1 mt-3">
      <button
        onClick={onDecrement}
        disabled={qty === 0}
        aria-label="Remove one"
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors font-bold text-lg ${
          qty === 0 ? 'opacity-30 cursor-not-allowed text-[#64748B]' : 'bg-[#0A0F1E] text-white hover:bg-[#1E293B]'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-heading font-bold text-lg text-[#0A0F1E] min-w-[28px] text-center">{qty}</span>
      <button
        onClick={onIncrement}
        aria-label="Add one"
        className="w-9 h-9 rounded-full flex items-center justify-center bg-[#0A0F1E] text-white hover:bg-[#1E293B] transition-colors"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

function CalculatorInner({ navbar, footer }: { navbar: React.ReactNode; footer: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [initialTier, setInitialTier] = useState<TierKey>('standard');
  const [initialOptions, setInitialOptions] = useState<QuoteOptions>({});
  const [hours, setHours] = useState<Record<string, number>>({});
  const [customAppliances, setCustomAppliances] = useState<ApplianceItem[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState('');
  const [customHours, setCustomHours] = useState('4');
  const [appliancesOpen, setAppliancesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Restore: ?q=<payload> (a shared / saved quote) wins over localStorage.
  useEffect(() => {
    const q = searchParams.get('q');
    const tierParam = searchParams.get('tier') as TierKey | null;
    if (tierParam && ['budget', 'standard', 'premium'].includes(tierParam)) {
      setInitialTier(tierParam);
      const o = parseTierOptions(searchParams.get('inv'), searchParams.get('bat'));
      if (Object.keys(o).length) setInitialOptions({ [tierParam]: o });
    }

    const fromUrl = q ? decodeQuotePayload(q) : null;
    if (fromUrl && fromUrl.length > 0) {
      const qs: Record<string, number> = {};
      const hs: Record<string, number> = {};
      const customs: ApplianceItem[] = [];
      for (const a of fromUrl) {
        if (PRESET_IDS.has(a.id)) {
          qs[a.id] = a.qty;
          hs[a.id] = a.hoursPerDay;
        } else {
          customs.push({ ...a, emoji: '⚙️' });
        }
      }
      setQuantities(qs);
      setHours(hs);
      setCustomAppliances(customs);
      setShowResults(true);
      setHydrated(true);
      return;
    }

    try {
      const saved = localStorage.getItem('sb_calculator');
      if (saved) {
        const data = JSON.parse(saved);
        setQuantities(data.quantities || {});
        setHours(data.hours || {});
        setCustomAppliances(data.customAppliances || []);
      }
    } catch {}
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem('sb_calculator', JSON.stringify({ quantities, hours, customAppliances }));
    } catch {}
  }, [quantities, hours, customAppliances, hydrated]);

  const setQty = (id: string, qty: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  const getHours = (id: string, defaultHours: number) => hours[id] ?? defaultHours;
  const setItemHours = (id: string, h: number) =>
    setHours((prev) => ({ ...prev, [id]: Math.max(0.5, Math.min(24, Math.round(h * 2) / 2)) }));

  const addCustomAppliance = () => {
    if (!customName.trim() || !customWatts) return;
    setCustomAppliances((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        emoji: '⚙️',
        watts: Number(customWatts),
        qty: 1,
        hoursPerDay: Number(customHours) || 4,
      },
    ]);
    setCustomName('');
    setCustomWatts('');
    setCustomHours('4');
    setShowCustomForm(false);
  };

  const removeCustomAppliance = (id: string) => setCustomAppliances((prev) => prev.filter((a) => a.id !== id));

  const applyTypicalHome = () => {
    const preset: Record<string, number> = {};
    TYPICAL_HOME_PRESET.forEach((item) => { preset[item.id] = item.qty; });
    setQuantities((prev) => ({ ...prev, ...preset }));
  };

  const allAppliances: ApplianceItem[] = [
    ...ALL_PRESETS.map((a) => ({ ...a, qty: quantities[a.id] || 0, hoursPerDay: getHours(a.id, a.hoursPerDay) })),
    ...customAppliances,
  ];
  const selectedAppliances = allAppliances.filter((a) => a.qty > 0);
  const totalWatts = selectedAppliances.reduce((sum, a) => sum + a.watts * a.qty, 0);
  const currentStepAppliances = step === 1 ? STEP1_APPLIANCES : step === 2 ? STEP2_APPLIANCES : STEP3_APPLIANCES;

  if (showResults && selectedAppliances.length > 0) {
    const quote = buildQuote(selectedAppliances);

    return (
      <div className="min-h-screen bg-white">
        {navbar}
        <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
          <h1 className="sr-only">Your solar system estimate, itemised and priced</h1>
          <button
            onClick={() => setShowResults(false)}
            className="text-[#64748B] hover:text-[#0A0F1E] flex items-center gap-1 text-sm mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Edit appliances
          </button>

          <div className="bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="font-heading font-semibold text-[#0A0F1E]">Your itemised estimate is ready</p>
              <p className="text-[#64748B] text-sm">
                {selectedAppliances.length} appliance types · {(totalWatts / 1000).toFixed(1)}kW peak · ~{quote.dailyKwh} kWh/day ·
                prices as of {PRICES_LAST_UPDATED_LABEL}
              </p>
            </div>
          </div>

          <QuoteResults key={quote.code} appliances={selectedAppliances} initialTier={initialTier} initialOptions={initialOptions} />

          <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] mt-8">
            <button onClick={() => setAppliancesOpen(!appliancesOpen)} className="w-full flex items-center justify-between p-5">
              <h2 className="font-heading font-semibold text-[#64748B] text-xs uppercase tracking-widest">
                Your selected appliances ({selectedAppliances.length})
              </h2>
              <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform ${appliancesOpen ? 'rotate-180' : ''}`} />
            </button>
            {appliancesOpen && (
              <div className="px-5 pb-5 space-y-2">
                {selectedAppliances.map((appliance) => (
                  <div key={appliance.id} className="flex items-center justify-between py-2 border-b border-[#E2E8F0] last:border-0">
                    <span className="text-[#0A0F1E] text-sm">
                      {appliance.qty}× {appliance.name}{' '}
                      <span className="text-[#64748B] text-xs">· {appliance.watts}W · {appliance.hoursPerDay}h/day</span>
                    </span>
                    <button
                      onClick={() =>
                        appliance.id.startsWith('custom_') ? removeCustomAppliance(appliance.id) : setQty(appliance.id, 0)
                      }
                      className="text-[#64748B] hover:text-red-500 transition-colors p-1"
                      aria-label={`Remove ${appliance.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        {footer}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {navbar}

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="sr-only">Solar system size calculator for Nigerian homes and businesses</h1>
        {/* Step progress indicator */}
        <div className="mb-8">
          <div className="flex items-center gap-0 mb-5">
            {[
              { n: 1, label: 'Heavy Appliances', emoji: '⚡' },
              { n: 2, label: 'Medium Appliances', emoji: '📺' },
              { n: 3, label: 'Light Appliances', emoji: '💡' },
            ].map((s, i) => (
              <div key={s.n} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 flex-1 transition-all duration-300 ${step >= s.n ? 'opacity-100' : 'opacity-40'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-heading font-bold flex-shrink-0 transition-all duration-300 ${
                      step > s.n ? 'bg-[#10B981] text-white' : step === s.n ? 'bg-[#F59E0B] text-[#0F172A] shadow-md' : 'bg-[#E2E8F0] text-[#64748B]'
                    }`}
                  >
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-xs font-heading font-semibold leading-tight ${step === s.n ? 'text-[#0F172A]' : 'text-[#64748B]'}`}>
                      {s.emoji} {s.label}
                    </p>
                  </div>
                </div>
                {i < 2 && <div className={`h-0.5 w-4 flex-shrink-0 mx-1 transition-all duration-500 ${step > s.n ? 'bg-[#10B981]' : 'bg-[#E2E8F0]'}`} />}
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
            <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <button
            onClick={applyTypicalHome}
            className="mb-6 bg-[#0A0F1E] text-white text-sm font-heading font-semibold px-5 py-2.5 rounded-full hover:bg-[#1E293B] transition-colors"
          >
            🏠 Load typical 3-bedroom home
          </button>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {currentStepAppliances.map((appliance) => {
            const qty = quantities[appliance.id] || 0;
            const isSelected = qty > 0;
            return (
              <div
                key={appliance.id}
                className={`bg-white rounded-2xl p-5 transition-all ${
                  isSelected ? 'border-2 border-[#F59E0B] bg-[#FEF3C7]' : 'border-2 border-[#E2E8F0] hover:border-[#F59E0B]/50'
                }`}
              >
                <div className="text-3xl text-center mb-2">{appliance.emoji}</div>
                <p className="font-heading font-semibold text-[#0A0F1E] text-sm text-center leading-tight">{appliance.name}</p>
                <p className="text-[#64748B] text-xs text-center mb-1">{appliance.watts}W</p>
                <Stepper qty={qty} onDecrement={() => setQty(appliance.id, qty - 1)} onIncrement={() => setQty(appliance.id, qty + 1)} />
                {qty > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <button
                      onClick={() => setItemHours(appliance.id, getHours(appliance.id, appliance.hoursPerDay) - 1)}
                      aria-label="Fewer hours"
                      className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold hover:bg-amber-200 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-amber-700 text-xs font-semibold min-w-[52px] text-center">
                      ⏱ {getHours(appliance.id, appliance.hoursPerDay)}h/day
                    </span>
                    <button
                      onClick={() => setItemHours(appliance.id, getHours(appliance.id, appliance.hoursPerDay) + 1)}
                      aria-label="More hours"
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
            <h2 className="font-heading font-semibold text-[#0A0F1E] text-sm mb-3">Custom Appliances</h2>
            {customAppliances.length > 0 && (
              <div className="space-y-2 mb-3">
                {customAppliances.map((ca) => (
                  <div key={ca.id} className="flex items-center justify-between bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-xl px-4 py-3">
                    <div>
                      <span className="text-sm font-medium text-[#0A0F1E]">⚙️ {ca.name}</span>
                      <span className="text-xs text-[#64748B] ml-2">{ca.watts}W · {ca.hoursPerDay}h/day</span>
                    </div>
                    <button onClick={() => removeCustomAppliance(ca.id)} className="text-[#64748B] hover:text-red-500 transition-colors p-1" aria-label={`Remove ${ca.name}`}>
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
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Watts"
                    value={customWatts}
                    onChange={(e) => setCustomWatts(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                  />
                  <input
                    type="number"
                    placeholder="Hours/day"
                    value={customHours}
                    onChange={(e) => setCustomHours(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#F59E0B]"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={addCustomAppliance} className="flex-1 bg-[#F59E0B] text-[#0A0F1E] py-2 rounded-full font-heading font-semibold text-sm hover:bg-[#D97706] transition-colors">
                    Add
                  </button>
                  <button onClick={() => setShowCustomForm(false)} className="px-4 py-2 text-[#64748B] text-sm hover:text-[#0A0F1E] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowCustomForm(true)} className="text-sm font-semibold text-[#B45309] hover:text-[#D97706] transition-colors">
                ＋ Add custom appliance
              </button>
            )}
          </div>
        )}

        {totalWatts > 0 && (
          <div className="bg-[#0A0F1E] rounded-2xl p-5 mb-6 flex items-center justify-between">
            <div>
              <p className="text-[#94A3B8] text-xs mb-1">Current load estimate</p>
              <p className="font-heading font-extrabold text-[#F59E0B] text-2xl">{(totalWatts / 1000).toFixed(2)} kW</p>
              <p className="text-[#94A3B8] text-xs">
                {selectedAppliances.length} appliance{selectedAppliances.length !== 1 ? 's' : ''} · Add more to refine
              </p>
            </div>
            <Zap className="w-8 h-8 text-[#F59E0B]" fill="currentColor" />
          </div>
        )}

        <div className="flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 text-[#64748B] hover:text-[#0A0F1E] font-semibold py-4 px-4 transition-colors">
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
                selectedAppliances.length > 0 ? 'bg-[#F59E0B] text-[#0A0F1E] hover:bg-[#D97706]' : 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
              }`}
            >
              <Zap className="w-5 h-5" fill={selectedAppliances.length > 0 ? 'currentColor' : 'none'} />
              Calculate My System
            </button>
          )}
        </div>
      </main>
      {footer}
    </div>
  );
}

/**
 * `navbar` and `footer` are handed down from the server page. Both derive their
 * copy from the price/brand/sizing tables, so importing them here would pull all
 * of those tables into this route's client bundle a second time.
 */
export default function CalculatorClient({ navbar, footer }: { navbar: React.ReactNode; footer: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white">{navbar}</div>}>
      <CalculatorInner navbar={navbar} footer={footer} />
    </Suspense>
  );
}
