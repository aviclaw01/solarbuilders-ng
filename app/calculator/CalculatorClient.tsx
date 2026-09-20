'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minus, Plus, X, Zap, ArrowRight, ArrowLeft, ChevronDown, ListChecks, Wallet } from 'lucide-react';
import QuoteResults from '@/components/ui/QuoteResults';
import { buildQuote, decodeQuotePayload, formatNairaShort, parseTierOptions, type QuoteOptions, type TierKey } from '@/lib/quote';
import { PRICES_LAST_UPDATED_LABEL } from '@/lib/prices';
import type { BudgetLookupData, LookupBuild } from '@/lib/budget-lookup';
import BudgetMode from './BudgetMode';

type Mode = 'appliances' | 'budget';

const MODES: { key: Mode; label: string; icon: typeof Wallet }[] = [
  { key: 'appliances', label: 'I know my appliances', icon: ListChecks },
  { key: 'budget', label: 'I know my budget', icon: Wallet },
];

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

interface ShellProps {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  budgetData: BudgetLookupData;
}

function CalculatorInner({ navbar, footer, budgetData }: ShellProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('appliances');
  const [budgetDigits, setBudgetDigits] = useState('');
  // Set when a budget build is opened as a quote, so the results view can offer the way back.
  const [returnBudget, setReturnBudget] = useState<string | null>(null);
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
  const [customErrors, setCustomErrors] = useState<{ name?: string; watts?: string; hours?: string }>({});
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

    // ?budget=<naira> opens budget mode pre-filled. A ?q= quote still wins.
    const budget = searchParams.get('budget')?.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
    if (!q && budget) {
      setMode('budget');
      setBudgetDigits(budget);
      setShowResults(false);
    }

    const fromUrl = q ? decodeQuotePayload(q) : null;
    if (fromUrl && fromUrl.length > 0) {
      setMode('appliances');
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
    // #24: bound every input. Watts below 1 are junk (a "0 W" appliance would
    // silently vanish from the quote); above 20,000 W is out of household
    // range and probably a typo (kW entered as W). Hours are clamped to the
    // same 0.5–24 window the preset sliders use — "0 hours" used to fall
    // through `|| 4` and become 4 h/day, silently inflating the quote.
    const name = customName.trim().slice(0, 40);
    const watts = Math.round(Number(customWatts));
    const hours = Math.round(Number(customHours) * 2) / 2;
    const nextErrors: typeof customErrors = {};
    if (!name) nextErrors.name = 'Give it a name.';
    if (!Number.isFinite(watts) || watts < 1) nextErrors.watts = 'Enter the wattage (e.g. 1200).';
    else if (watts > 20000) nextErrors.watts = 'That looks like kW — enter watts (e.g. 1500, not 1.5).';
    if (!Number.isFinite(hours) || hours < 0.5) nextErrors.hours = 'At least half an hour a day.';
    else if (hours > 24) nextErrors.hours = 'At most 24 hours a day.';
    setCustomErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setCustomAppliances((prev) => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name,
        emoji: '⚙️',
        watts,
        qty: 1,
        hoursPerDay: hours,
      },
    ]);
    setCustomName('');
    setCustomWatts('');
    setCustomHours('4');
    setCustomErrors({});
    setShowCustomForm(false);
  };

  // replaceState rather than router.replace: the page is static, so there is
  // nothing to refetch per keystroke, and Next keeps useSearchParams in sync.
  const changeBudget = (digits: string) => {
    setBudgetDigits(digits);
    window.history.replaceState(null, '', digits ? `/calculator?budget=${digits}` : '/calculator');
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    window.history.replaceState(
      null,
      '',
      next === 'budget' && budgetDigits ? `/calculator?budget=${budgetDigits}` : '/calculator',
    );
  };

  /**
   * Hand the build to the ordinary results view through the same ?q= link the
   * /budget pages use, so share, PDF, WhatsApp and ordering all work unchanged
   * and the browser's back button returns to the budget.
   */
  const openBudgetQuote = (build: LookupBuild) => {
    setReturnBudget(budgetDigits);
    router.push(
      `/calculator?q=${budgetData.rungs[build.rung].payload}&tier=${build.tierKey}&inv=${build.inverterClass}&bat=${build.battery}`,
    );
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
            <button
              onClick={() => {
                setShowResults(false);
                setReturnBudget(null);
              }}
              className="text-[#64748B] hover:text-[#0A0F1E] flex items-center gap-1 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Edit appliances
            </button>
            {returnBudget && (
              <button
                onClick={() => router.push(`/calculator?budget=${returnBudget}`)}
                className="text-[#64748B] hover:text-[#0A0F1E] flex items-center gap-1 text-sm font-medium"
              >
                <Wallet className="w-4 h-4" /> Back to my {formatNairaShort(Number(returnBudget))} budget
              </button>
            )}
          </div>

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

          {/* Unique quote ID for lead follow-up */}
          <div className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] mt-3 p-4 flex items-center gap-3">
            <span className="text-sm text-[#64748B]">Quote ID: </span>
            <span className="font-mono font-semibold text-[#1E293B]" id="quote-id">
              {quote.code}
            </span>
          </div>

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

        {/* Native radios: arrow keys, focus and announcement come for free. */}
        <fieldset className="mb-8">
          <legend className="sr-only">How do you want to start?</legend>
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5F9] rounded-full">
            {MODES.map(({ key, label, icon: Icon }) => {
              const active = mode === key;
              return (
                <label
                  key={key}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-heading font-semibold text-center cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#0A0F1E] has-[:focus-visible]:ring-offset-2 ${
                    active ? 'bg-white text-[#0A0F1E] shadow-sm' : 'text-[#64748B] hover:text-[#0A0F1E]'
                  }`}
                >
                  <input
                    type="radio"
                    name="calculator-mode"
                    value={key}
                    checked={active}
                    onChange={() => changeMode(key)}
                    className="sr-only"
                  />
                  <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  {label}
                </label>
              );
            })}
          </div>
        </fieldset>

        {mode === 'budget' ? (
          <BudgetMode data={budgetData} digits={budgetDigits} onDigitsChange={changeBudget} onOpenQuote={openBudgetQuote} />
        ) : (
          <>
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
                  <div>
                    <input
                      type="text"
                      placeholder="Appliance name"
                      aria-label="Appliance name"
                      value={customName}
                      onChange={(e) => {
                        setCustomName(e.target.value);
                        setCustomErrors((p) => (p.name ? { ...p, name: undefined } : p));
                      }}
                      aria-invalid={!!customErrors.name}
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#F59E0B] ${customErrors.name ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
                    />
                    {customErrors.name && <p className="text-rose-600 text-xs mt-1">{customErrors.name}</p>}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Watts"
                        aria-label="Watts"
                        min={1}
                        max={20000}
                        value={customWatts}
                        onChange={(e) => {
                          setCustomWatts(e.target.value);
                          setCustomErrors((p) => (p.watts ? { ...p, watts: undefined } : p));
                        }}
                        aria-invalid={!!customErrors.watts}
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#F59E0B] ${customErrors.watts ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
                      />
                      {customErrors.watts && <p className="text-rose-600 text-xs mt-1">{customErrors.watts}</p>}
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        placeholder="Hours/day"
                        aria-label="Hours per day"
                        min={0.5}
                        max={24}
                        step={0.5}
                        value={customHours}
                        onChange={(e) => {
                          setCustomHours(e.target.value);
                          setCustomErrors((p) => (p.hours ? { ...p, hours: undefined } : p));
                        }}
                        aria-invalid={!!customErrors.hours}
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-[#F59E0B] ${customErrors.hours ? 'border-rose-400' : 'border-[#E2E8F0]'}`}
                      />
                      {customErrors.hours && <p className="text-rose-600 text-xs mt-1">{customErrors.hours}</p>}
                    </div>
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
          </>
        )}
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
export default function CalculatorClient({ navbar, footer, budgetData }: ShellProps) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white">{navbar}</div>}>
      <CalculatorInner navbar={navbar} footer={footer} budgetData={budgetData} />
    </Suspense>
  );
}
