'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Minus, Plus, X, Zap, ArrowRight, ArrowLeft, ChevronDown, ListChecks, Wallet, Clock } from 'lucide-react';
import QuoteResults from '@/components/ui/QuoteResults';
import {
  buildQuote,
  decodeQuotePayload,
  formatNairaShort,
  parseGrid,
  parseTierOptions,
  type GridSupply,
  type QuoteOptions,
  type TierKey,
} from '@/lib/quote';
import { canSeePrices } from '@/lib/quote-access';
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

/**
 * Bounds for a hand-entered appliance.
 *
 * These are the same limits the preset editor already enforces (setItemHours
 * clamps 0.5-24). The custom form used to enforce nothing, so a negative
 * wattage was accepted, stored, and then silently dropped by buildQuote's
 * `watts > 0` filter — the appliance simply vanished from the quote with no
 * explanation. 20kW is well above any single domestic load; anything larger is
 * a typo, and a typo that lands in a price we put our name to.
 */
const WATTS_MIN = 1;
const WATTS_MAX = 20_000;
const HOURS_MIN = 0;
const HOURS_MAX = 24;
/** Well above a real home; a payload larger than this is not a household. */
const MAX_APPLIANCES = 50;

/** Snap to the half hour, the same granularity the preset sliders use. */
function clampHours(h: number): number {
  return Math.max(HOURS_MIN, Math.min(HOURS_MAX, Math.round(h * 2) / 2));
}

/**
 * Validate one appliance coming back from storage.
 *
 * lib/cartStorage.ts validates every field it reads back; this did not, so a
 * corrupt entry reached the quote engine unchecked. Anything that fails is
 * dropped rather than repaired — a silently "fixed" wattage is a wrong price.
 */
function validAppliance(raw: unknown): ApplianceItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const a = raw as Record<string, unknown>;
  const id = typeof a.id === 'string' ? a.id : '';
  const name = typeof a.name === 'string' ? a.name.trim() : '';
  const watts = Number(a.watts);
  const qty = Number(a.qty);
  const hoursPerDay = Number(a.hoursPerDay);
  if (!id || !name) return null;
  if (!Number.isFinite(watts) || watts < WATTS_MIN || watts > WATTS_MAX) return null;
  if (!Number.isFinite(qty) || qty < 1 || qty > 99) return null;
  if (!Number.isFinite(hoursPerDay) || hoursPerDay < HOURS_MIN || hoursPerDay > HOURS_MAX) return null;
  return {
    id,
    name: name.slice(0, 60),
    emoji: typeof a.emoji === 'string' && a.emoji ? a.emoji : '\u2699\ufe0f',
    watts: Math.round(watts),
    qty: Math.round(qty),
    hoursPerDay: clampHours(hoursPerDay),
  };
}

/** Everything localStorage gives back, filtered to what we can price. */
function readSaved(data: unknown): {
  quantities: Record<string, number>;
  hours: Record<string, number>;
  customAppliances: ApplianceItem[];
} {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;

  const quantities: Record<string, number> = {};
  if (d.quantities && typeof d.quantities === 'object') {
    for (const [id, v] of Object.entries(d.quantities as Record<string, unknown>)) {
      const n = Number(v);
      if (PRESET_IDS.has(id) && Number.isFinite(n) && n > 0) quantities[id] = Math.min(99, Math.round(n));
    }
  }

  const hours: Record<string, number> = {};
  if (d.hours && typeof d.hours === 'object') {
    for (const [id, v] of Object.entries(d.hours as Record<string, unknown>)) {
      const n = Number(v);
      if (PRESET_IDS.has(id) && Number.isFinite(n)) hours[id] = clampHours(n);
    }
  }

  const customAppliances = (Array.isArray(d.customAppliances) ? d.customAppliances : [])
    .map(validAppliance)
    .filter((a): a is ApplianceItem => a !== null)
    .slice(0, MAX_APPLIANCES);

  return { quantities, hours, customAppliances };
}

const ALL_PRESETS = [...STEP1_APPLIANCES, ...STEP2_APPLIANCES, ...STEP3_APPLIANCES];
const PRESET_IDS = new Set(ALL_PRESETS.map((a) => a.id));

/** One tap fills a whole home — most visitors never need to touch a single stepper. */
const QUICK_STARTS: { key: string; label: string; hint: string; items: { id: string; qty: number }[] }[] = [
  {
    key: 'flat',
    label: '1–2 bed flat',
    hint: 'No AC',
    items: [
      { id: 'refrigerator', qty: 1 },
      { id: 'tv_32', qty: 1 },
      { id: 'standing_fan', qty: 2 },
      { id: 'led_bulb', qty: 6 },
      { id: 'phone_charger', qty: 3 },
      { id: 'wifi_router', qty: 1 },
      { id: 'laptop', qty: 1 },
    ],
  },
  {
    key: 'family',
    label: '3-bed home',
    hint: '1 AC',
    items: [
      { id: 'ac_1_5hp', qty: 1 },
      { id: 'refrigerator', qty: 1 },
      { id: 'deep_freezer', qty: 1 },
      { id: 'tv_32', qty: 2 },
      { id: 'standing_fan', qty: 2 },
      { id: 'ceiling_fan', qty: 2 },
      { id: 'led_bulb', qty: 8 },
      { id: 'phone_charger', qty: 4 },
      { id: 'wifi_router', qty: 1 },
    ],
  },
  {
    key: 'large',
    label: 'Large home',
    hint: '2–3 ACs',
    items: [
      { id: 'ac_1_5hp', qty: 2 },
      { id: 'ac_1hp', qty: 1 },
      { id: 'refrigerator', qty: 1 },
      { id: 'deep_freezer', qty: 1 },
      { id: 'water_pump', qty: 1 },
      { id: 'washing_machine', qty: 1 },
      { id: 'tv_55', qty: 1 },
      { id: 'tv_32', qty: 2 },
      { id: 'ceiling_fan', qty: 4 },
      { id: 'led_bulb', qty: 15 },
      { id: 'security_light', qty: 4 },
      { id: 'phone_charger', qty: 5 },
      { id: 'wifi_router', qty: 1 },
      { id: 'cctv', qty: 1 },
    ],
  },
  {
    key: 'office',
    label: 'Shop / office',
    hint: 'Daytime use',
    items: [
      { id: 'ac_1_5hp', qty: 1 },
      { id: 'desktop_pc', qty: 3 },
      { id: 'laptop', qty: 2 },
      { id: 'led_bulb', qty: 10 },
      { id: 'ceiling_fan', qty: 2 },
      { id: 'wifi_router', qty: 1 },
      { id: 'refrigerator', qty: 1 },
      { id: 'cctv', qty: 1 },
    ],
  },
];

const SECTIONS: { title: string; items: Omit<ApplianceItem, 'qty'>[] }[] = [
  { title: 'Cooling & heavy appliances', items: STEP1_APPLIANCES },
  { title: 'Everyday electronics', items: STEP2_APPLIANCES },
  { title: 'Lights & small loads', items: STEP3_APPLIANCES },
];

function Stepper({ qty, name, onDecrement, onIncrement }: { qty: number; name: string; onDecrement: () => void; onIncrement: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onDecrement}
        disabled={qty === 0}
        aria-label={`One fewer ${name}`}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          qty === 0 ? 'opacity-30 cursor-not-allowed text-slate-500 border border-slate-200' : 'border border-slate-300 text-slate-900 hover:border-slate-900'
        }`}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className="font-heading font-bold text-base text-slate-900 min-w-[24px] text-center tabular-nums" aria-live="polite">
        {qty}
      </span>
      <button
        onClick={onIncrement}
        aria-label={`One more ${name}`}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-900 text-white hover:bg-slate-700 transition-colors"
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [initialTier, setInitialTier] = useState<TierKey>('standard');
  const [initialOptions, setInitialOptions] = useState<QuoteOptions>({});
  const [grid, setGrid] = useState<GridSupply>('some');
  const [hours, setHours] = useState<Record<string, number>>({});
  const [customAppliances, setCustomAppliances] = useState<ApplianceItem[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customWatts, setCustomWatts] = useState('');
  const [customHours, setCustomHours] = useState('4');
  const [customErrors, setCustomErrors] = useState<{ name?: string; watts?: string; hours?: string }>({});
  const [appliancesOpen, setAppliancesOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  /**
   * True when this view was rebuilt from a ?q= link rather than the visitor's
   * own saved work. Someone else's quote must never be written over the
   * visitor's saved calculator — opening a shared link used to silently
   * replace it, custom appliances and all, with no undo.
   */
  const [fromSharedLink, setFromSharedLink] = useState(false);
  /** ?view=brief — show the installer brief even to someone allowed to see prices */
  const [briefRequested, setBriefRequested] = useState(false);

  // Restore: ?q=<payload> (a shared / saved quote) wins over localStorage.
  useEffect(() => {
    const q = searchParams.get('q');
    const tierParam = searchParams.get('tier') as TierKey | null;
    if (tierParam && ['budget', 'standard', 'premium'].includes(tierParam)) {
      setInitialTier(tierParam);
      const o = parseTierOptions(searchParams.get('inv'), searchParams.get('bat'));
      if (Object.keys(o).length) setInitialOptions({ [tierParam]: o });
    }
    setGrid(parseGrid(searchParams.get('grid')));
    setBriefRequested(searchParams.get('view') === 'brief');

    // ?budget=<naira> opens budget mode pre-filled. A ?q= quote still wins.
    const budget = searchParams.get('budget')?.replace(/\D/g, '').replace(/^0+/, '').slice(0, 11);
    if (!q && budget) {
      setMode('budget');
      setBudgetDigits(budget);
      setShowResults(false);
    }

    const fromUrl = q ? decodeQuotePayload(q) : null;
    if (fromUrl && fromUrl.length > 0) {
      setFromSharedLink(true);
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

    setFromSharedLink(false);
    try {
      const saved = localStorage.getItem('sb_calculator');
      if (saved) {
        const data = JSON.parse(saved) as unknown;
        const restored = readSaved(data);
        setQuantities(restored.quantities);
        setHours(restored.hours);
        setCustomAppliances(restored.customAppliances);
      }
    } catch {
      /* corrupt or unreadable — start empty rather than throw mid-render */
    }
    setHydrated(true);
  }, [searchParams]);

  useEffect(() => {
    if (!hydrated) return;
    // A ?q= view is read-only with respect to the visitor's own saved state.
    // They are looking at someone else's build; it is not their work in
    // progress, and overwriting the real one would be silent data loss.
    if (fromSharedLink) return;
    try {
      localStorage.setItem('sb_calculator', JSON.stringify({ quantities, hours, customAppliances }));
    } catch {
      /* private mode / storage disabled — the calculator just won't persist */
    }
  }, [quantities, hours, customAppliances, hydrated, fromSharedLink]);

  const setQty = (id: string, qty: number) => setQuantities((prev) => ({ ...prev, [id]: Math.max(0, qty) }));
  const getHours = (id: string, defaultHours: number) => hours[id] ?? defaultHours;
  const setItemHours = (id: string, h: number) =>
    setHours((prev) => ({ ...prev, [id]: Math.max(0.5, Math.min(24, Math.round(h * 2) / 2)) }));

  /**
   * Add a hand-entered appliance, or say why not.
   *
   * This used to `return` silently on empty input and accept anything numeric
   * otherwise: negative watts were stored and then dropped by the quote engine
   * without a word, `0` hours became 4, and there was no upper bound at all.
   */
  const addCustomAppliance = () => {
    if (customAppliances.length >= MAX_APPLIANCES) {
      setCustomErrors({ name: `That is ${MAX_APPLIANCES} custom appliances — remove one before adding another.` });
      return;
    }

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

  const applyQuickStart = (items: { id: string; qty: number }[]) => {
    const preset: Record<string, number> = {};
    items.forEach((item) => {
      preset[item.id] = item.qty;
    });
    setQuantities(preset);
  };

  /** Leave a shared link for your own calculator — the quote is now yours. */
  const editAsMine = () => {
    setShowResults(false);
    setReturnBudget(null);
    if (fromSharedLink) {
      setFromSharedLink(false);
      setBriefRequested(false);
      window.history.replaceState(null, '', '/calculator');
    }
  };

  const allAppliances: ApplianceItem[] = [
    ...ALL_PRESETS.map((a) => ({ ...a, qty: quantities[a.id] || 0, hoursPerDay: getHours(a.id, a.hoursPerDay) })),
    ...customAppliances,
  ];
  const selectedAppliances = allAppliances.filter((a) => a.qty > 0);
  const totalWatts = selectedAppliances.reduce((sum, a) => sum + a.watts * a.qty, 0);

  if (showResults && selectedAppliances.length > 0) {
    const quote = buildQuote(selectedAppliances, initialOptions, grid);
    // Prices: always for your own fresh quote; on a shared link only for the
    // browser that generated it or an admin. Everyone else gets the brief.
    const mayPrice = !fromSharedLink || canSeePrices(quote.code);
    const priced = mayPrice && !briefRequested;

    return (
      <div className="min-h-screen bg-slate-50">
        {navbar}
        <main className="max-w-3xl mx-auto px-4 py-8 pb-16">
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            {priced ? 'Your solar system, itemised' : 'Solar job brief'}
          </h1>
          <p className="text-slate-500 text-sm mt-1 mb-5">
            {selectedAppliances.length} appliance types · {(totalWatts / 1000).toFixed(1)}kW peak · ~{quote.dailyKwh}kWh/day
            {priced ? ` · prices as of ${PRICES_LAST_UPDATED_LABEL}` : ''}
          </p>
          {priced && (
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-5">
              <button onClick={editAsMine} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium">
                <ArrowLeft className="w-4 h-4" /> Edit appliances
              </button>
              {returnBudget && (
                <button
                  onClick={() => router.push(`/calculator?budget=${returnBudget}`)}
                  className="text-slate-600 hover:text-slate-900 flex items-center gap-1 text-sm font-medium"
                >
                  <Wallet className="w-4 h-4" /> Back to my {formatNairaShort(Number(returnBudget))} budget
                </button>
              )}
            </div>
          )}

          <QuoteResults
            key={String(priced)}
            appliances={selectedAppliances}
            initialTier={initialTier}
            initialOptions={initialOptions}
            grid={grid}
            onGridChange={setGrid}
            priced={priced}
            owner={!fromSharedLink}
            onShowPrices={mayPrice && briefRequested ? () => setBriefRequested(false) : undefined}
          />

          {priced && (
            <div className="bg-white rounded-2xl border border-slate-200 mt-6">
              <button onClick={() => setAppliancesOpen(!appliancesOpen)} className="w-full flex items-center justify-between p-5">
                <h2 className="font-heading font-semibold text-slate-500 text-xs uppercase tracking-widest">
                  Your appliances ({selectedAppliances.length})
                </h2>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${appliancesOpen ? 'rotate-180' : ''}`} />
              </button>
              {appliancesOpen && (
                <div className="px-5 pb-5 space-y-2">
                  {selectedAppliances.map((appliance) => (
                    <div key={appliance.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-900 text-sm">
                        {appliance.qty}× {appliance.name}{' '}
                        <span className="text-slate-500 text-xs">· {appliance.watts}W · {appliance.hoursPerDay}h/day</span>
                      </span>
                      <button
                        onClick={() =>
                          appliance.id.startsWith('custom_') ? removeCustomAppliance(appliance.id) : setQty(appliance.id, 0)
                        }
                        className="text-slate-500 hover:text-red-600 transition-colors p-1"
                        aria-label={`Remove ${appliance.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        {footer}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {navbar}

      <main className="max-w-2xl mx-auto px-4 pt-8 pb-32">
        <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">What do you want to power?</h1>
        <p className="text-slate-500 text-sm mt-1 mb-6">
          Pick a starting point, adjust if you like, and we&apos;ll size and price the whole system — breakers and all.
        </p>

        {/* Native radios: arrow keys, focus and announcement come for free. */}
        <fieldset className="mb-6">
          <legend className="sr-only">How do you want to start?</legend>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-200/60 rounded-full">
            {MODES.map(({ key, label, icon: Icon }) => {
              const active = mode === key;
              return (
                <label
                  key={key}
                  className={`flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-heading font-semibold text-center cursor-pointer transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-slate-900 has-[:focus-visible]:ring-offset-2 ${
                    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
            <section className="mb-8">
              <h2 className="text-sm font-heading font-semibold text-slate-900 mb-2">Quick start</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_STARTS.map((q) => (
                  <button
                    key={q.key}
                    onClick={() => applyQuickStart(q.items)}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:border-amber-400 hover:shadow-sm transition"
                  >
                    <span className="block text-sm font-semibold text-slate-900">{q.label}</span>
                    <span className="block text-xs text-slate-500">{q.hint}</span>
                  </button>
                ))}
              </div>
            </section>

            {SECTIONS.map((section) => (
              <section key={section.title} className="mb-6">
                <h2 className="text-xs font-heading font-semibold text-slate-500 uppercase tracking-widest mb-2">{section.title}</h2>
                <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
                  {section.items.map((appliance) => {
                    const qty = quantities[appliance.id] || 0;
                    const h = getHours(appliance.id, appliance.hoursPerDay);
                    return (
                      <li key={appliance.id} className={`px-4 py-3 ${qty > 0 ? 'bg-amber-50/60' : ''}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              <span aria-hidden="true" className="mr-1.5">{appliance.emoji}</span>
                              {appliance.name}
                            </p>
                            <p className="text-xs text-slate-500">{appliance.watts}W</p>
                          </div>
                          <Stepper
                            qty={qty}
                            name={appliance.name}
                            onDecrement={() => setQty(appliance.id, qty - 1)}
                            onIncrement={() => setQty(appliance.id, qty + 1)}
                          />
                        </div>
                        {qty > 0 && (
                          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Hours a day</span>
                            <button
                              onClick={() => setItemHours(appliance.id, h - 1)}
                              aria-label={`Fewer hours for ${appliance.name}`}
                              className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-semibold text-slate-900 min-w-[32px] text-center tabular-nums">{h}h</span>
                            <button
                              onClick={() => setItemHours(appliance.id, h + 1)}
                              aria-label={`More hours for ${appliance.name}`}
                              className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center hover:border-slate-900"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <section className="mb-8">
              {customAppliances.length > 0 && (
                <div className="space-y-2 mb-3">
                  {customAppliances.map((ca) => (
                    <div key={ca.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-slate-900">{ca.name}</span>
                        <span className="text-xs text-slate-500 ml-2">{ca.watts}W · {ca.hoursPerDay}h/day</span>
                      </div>
                      <button onClick={() => removeCustomAppliance(ca.id)} className="text-slate-500 hover:text-red-600 transition-colors p-1" aria-label={`Remove ${ca.name}`}>
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {showCustomForm ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
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
                      className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${customErrors.name ? 'border-rose-400' : 'border-slate-200'}`}
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
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${customErrors.watts ? 'border-rose-400' : 'border-slate-200'}`}
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
                        className={`w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:border-amber-500 ${customErrors.hours ? 'border-rose-400' : 'border-slate-200'}`}
                      />
                      {customErrors.hours && <p className="text-rose-600 text-xs mt-1">{customErrors.hours}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={addCustomAppliance} className="flex-1 bg-amber-500 text-slate-900 py-2 rounded-full font-heading font-semibold text-sm hover:bg-amber-600 transition-colors">
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setCustomErrors({});
                        setShowCustomForm(false);
                      }}
                      className="px-4 py-2 text-slate-500 text-sm hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowCustomForm(true)} className="text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors">
                  + Something not listed? Add it
                </button>
              )}
            </section>

            {/* Sticky summary — the one action on this page */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
              <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Your load</p>
                  <p className="font-heading font-extrabold text-slate-900 text-lg leading-tight tabular-nums">
                    {(totalWatts / 1000).toFixed(2)} kW
                    <span className="text-xs font-normal text-slate-500 ml-1.5">
                      {selectedAppliances.length} item{selectedAppliances.length !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowResults(true);
                    window.scrollTo({ top: 0 });
                  }}
                  disabled={selectedAppliances.length === 0}
                  className={`px-6 py-3 rounded-full font-heading font-bold text-sm sm:text-base flex items-center gap-2 transition-colors ${
                    selectedAppliances.length > 0 ? 'bg-amber-500 text-slate-900 hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Zap className="w-4 h-4" fill={selectedAppliances.length > 0 ? 'currentColor' : 'none'} />
                  See my system
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </main>
      {footer}
      {mode === 'appliances' && <div className="h-20" aria-hidden="true" />}
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50">{navbar}</div>}>
      <CalculatorInner navbar={navbar} footer={footer} budgetData={budgetData} />
    </Suspense>
  );
}
