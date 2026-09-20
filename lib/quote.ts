/**
 * SolarBuilders.ng — Quote engine
 *
 * Takes the appliances a user selected and returns three itemised system
 * quotes (Budget / Standard / Premium), each with a real bill of materials
 * priced from lib/prices.ts, plus a short quote code that encodes the input
 * so we can rebuild the exact quote from the code alone.
 *
 * Sizing assumptions (see VL-001 for the bugs this replaces):
 *  - Inverter: peak load × 1.25 headroom → next standard kVA. All tiers size
 *    from the FULL peak load (an undersized inverter trips; batteries handle
 *    the "not everything is on at once" factor, not the inverter).
 *  - Battery: lithium LiFePO4 48V modules of 5.12 kWh, 90% usable DoD.
 *    Backup energy = average load (60% of peak) × autonomy hours.
 *    Budget 4h · Standard 6h · Premium 10h. Nigerian solar is supplemental to
 *    grid — 6h overnight is what the market actually installs (5kVA/10kWh).
 *  - Panels: daily kWh ÷ (5.5 peak-sun-hours × 0.78 system efficiency),
 *    rounded up to 550W panels. Premium adds 25% for cloudy-day recharge.
 *  - Fridge/freezer daily hours already reflect compressor duty cycle (8h),
 *    set in the calculator page's appliance list.
 */

import {
  BOS_FRACTION,
  INVERTER_BRANDS,
  INVERTER_PER_KVA,
  LABOUR_FLOOR,
  LABOUR_PER_KVA,
  LITHIUM_BRANDS,
  LITHIUM_MODULE_KWH,
  LITHIUM_PER_KWH,
  PANEL_BRANDS,
  PANEL_PER_WP,
  PANEL_WATTS,
  PRICES_LAST_UPDATED,
  TUBULAR_200AH,
  type InverterTier,
  type PriceRange,
} from "./prices";

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface QuoteAppliance {
  id: string;
  name: string;
  watts: number;
  qty: number;
  hoursPerDay: number;
}

export type TierKey = "budget" | "standard" | "premium";
export type BatteryType = "lithium" | "tubular";

/** Per-tier user overrides from the quote card's picker */
export interface TierOptions {
  inverterTier?: InverterTier;
  battery?: BatteryType;
}
export type QuoteOptions = Partial<Record<TierKey, TierOptions>>;

export const INVERTER_TIER_LABEL: Record<InverterTier, string> = {
  budget: "Budget class",
  mid: "Mid class",
  premium: "Premium class",
};

export interface BomLine {
  key: string;
  item: string; // "Hybrid inverter"
  spec: string; // "5kVA 48V hybrid — Growatt / Luxpower / Must" (plain text, for export)
  specBase?: string; // "5kVA 48V hybrid" — UI renders specBase + linked brands
  brands?: string[]; // brand names, resolvable to /brands/<slug>
  qty: number;
  unit: string; // "unit", "panel", "kWh", "lot"
  unitCost: PriceRange; // per unit
  lineCost: PriceRange; // qty × unit
}

export interface TierQuote {
  key: TierKey;
  label: string;
  emoji: string;
  tagline: string;
  inverterKva: number;
  inverterTier: InverterTier;
  inverterBrands: string[];
  batteryKwh: number; // nominal installed
  batteryModules: number; // lithium modules or tubular units
  batteryType: BatteryType;
  batteryBrands: string[];
  options: TierOptions; // what the user overrode (empty = defaults)
  panelCount: number;
  panelWatts: number;
  arrayKwp: number;
  autonomyHours: number;
  coveragePct: number; // % of the user's appliances this tier is designed to run at once
  bom: BomLine[];
  equipment: PriceRange;
  bos: PriceRange;
  labour: PriceRange;
  total: PriceRange;
  note: string;
}

export interface Quote {
  code: string; // "SB-S5K-7F3A2Q"
  payload: string; // base64url of QuoteInput — put in ?q= to rebuild
  generatedAt: string; // ISO date
  pricesAsOf: string;
  appliances: QuoteAppliance[];
  peakWatts: number;
  dailyKwh: number;
  options: QuoteOptions;
  tiers: Record<TierKey, TierQuote>;
}

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const PEAK_SUN_HOURS = 5.5;
const SYSTEM_EFFICIENCY = 0.78;
const LITHIUM_USABLE = 0.9;
const TUBULAR_KWH = 2.4; // 12V × 200Ah
const TUBULAR_USABLE = 0.5; // lead-acid DoD
const TUBULAR_BRANDS = ["Luminous", "Quanta", "Felicity"];
const LOAD_FACTOR = 0.6; // average running load vs peak
const INVERTER_HEADROOM = 1.25;

/**
 * Motor startup surge.
 *
 * Compressors and pumps draw several times their running watts for the first
 * second or two. Sizing on running watts alone is how people end up with an
 * inverter that trips every time the AC kicks in — a 1.2kW AC on a "1.5kVA"
 * inverter is the classic Nigerian complaint.
 *
 * We assume only the largest motor starts under load at any moment (starting
 * two compressors on the same half-second is bad luck, not a design case), and
 * that a hybrid inverter can carry roughly 2× its continuous rating for the
 * duration of a start.
 */
const MOTOR_SURGE: Record<string, number> = {
  ac_1hp: 3,
  ac_1_5hp: 3,
  ac_2hp: 3,
  water_pump: 3.5,
  refrigerator: 3,
  deep_freezer: 3,
  chest_freezer: 3,
  washing_machine: 2,
};
const INVERTER_SURGE_CAPABILITY = 2;

/** Extra watts the biggest motor adds at the instant it starts. */
function startingSurgeWatts(appliances: QuoteAppliance[]): number {
  let worst = 0;
  for (const a of appliances) {
    const factor = MOTOR_SURGE[a.id];
    if (!factor || a.qty < 1) continue;
    worst = Math.max(worst, a.watts * (factor - 1));
  }
  return worst;
}
const STANDARD_KVA = [1.5, 2.5, 3.5, 5, 6, 8, 10, 12, 16, 20];

const TIER_CONFIG: Record<
  TierKey,
  {
    label: string;
    emoji: string;
    tagline: string;
    inverterTier: InverterTier;
    autonomyHours: number;
    coveragePct: number;
    panelFactor: number;
    note: string;
  }
> = {
  budget: {
    label: "Budget",
    emoji: "💰",
    tagline: "Essentials, lowest cost",
    inverterTier: "budget",
    autonomyHours: 4,
    coveragePct: 60,
    panelFactor: 0.7,
    note: "Runs your essentials (lights, fans, fridge, TV) with ~4h of night backup. Heavy loads like AC only while the sun is up.",
  },
  standard: {
    label: "Standard",
    emoji: "⚡",
    tagline: "What most Nigerian homes install",
    inverterTier: "mid",
    autonomyHours: 6,
    coveragePct: 100,
    panelFactor: 1.0,
    note: "Runs everything on your list with ~6h of overnight backup. Grid or generator tops up on very cloudy days.",
  },
  premium: {
    label: "Premium",
    emoji: "👑",
    tagline: "Deye-class, full independence",
    inverterTier: "premium",
    autonomyHours: 10,
    coveragePct: 120,
    panelFactor: 1.25,
    note: "Everything on your list plus headroom to add more, ~10h backup, premium inverter with app monitoring and 5–10yr warranty.",
  },
};

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function scale(r: PriceRange, k: number): PriceRange {
  return { low: Math.round(r.low * k), best: Math.round(r.best * k), high: Math.round(r.high * k) };
}

function add(...rs: PriceRange[]): PriceRange {
  return rs.reduce((a, b) => ({ low: a.low + b.low, best: a.best + b.best, high: a.high + b.high }), {
    low: 0,
    best: 0,
    high: 0,
  });
}

function pickKva(peakWatts: number, surgeWatts = 0): number {
  // Continuous requirement, and the requirement implied by the worst start.
  const continuous = peakWatts * INVERTER_HEADROOM;
  const forStart = (peakWatts + surgeWatts) / INVERTER_SURGE_CAPABILITY;
  const required = Math.max(continuous, forStart) / 1000;
  return STANDARD_KVA.find((k) => k >= required) ?? 20;
}

/** FNV-1a 32-bit → 6 base36 chars. Stable, short, good enough for a human-readable code. */
function shortHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).toUpperCase().padStart(7, "0").slice(-6);
}

function toBase64Url(s: string): string {
  const b64 =
    typeof window === "undefined"
      ? Buffer.from(s, "utf8").toString("base64")
      : btoa(unescape(encodeURIComponent(s)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  return typeof window === "undefined"
    ? Buffer.from(b64, "base64").toString("utf8")
    : decodeURIComponent(escape(atob(b64)));
}

// ─────────────────────────────────────────────────────────
// ENGINE
// ─────────────────────────────────────────────────────────

function buildTier(key: TierKey, peakWatts: number, dailyKwh: number, surgeWatts: number, opts: TierOptions = {}): TierQuote {
  const cfg = TIER_CONFIG[key];
  const inverterTier = opts.inverterTier ?? cfg.inverterTier;
  const batteryType: BatteryType = opts.battery ?? "lithium";

  // Inverter — always from full peak (VL-001 BUG-3)
  const inverterKvaRaw = pickKva(peakWatts * (key === "premium" ? 1.2 : 1), surgeWatts);

  // Battery — average load × autonomy, then lithium modules
  const coveredPeak = peakWatts * Math.min(cfg.coveragePct, 100) / 100;
  const usableKwh = (coveredPeak * LOAD_FACTOR * cfg.autonomyHours) / 1000;
  let batteryModules: number;
  let batteryKwh: number;
  let inverterKva: number;
  if (batteryType === "tubular") {
    // 12V 200Ah units in series strings: 2 for 24V (<5kVA), 4 for 48V
    const series = inverterKvaRaw >= 5 ? 4 : 2;
    const perUnitUsable = TUBULAR_KWH * TUBULAR_USABLE;
    batteryModules = Math.max(series, Math.ceil(usableKwh / perUnitUsable / series) * series);
    batteryKwh = Math.round(batteryModules * TUBULAR_KWH * 100) / 100;
    inverterKva = batteryModules > 8 ? Math.max(inverterKvaRaw, 5) : inverterKvaRaw;
  } else {
    const nominalKwh = usableKwh / LITHIUM_USABLE;
    batteryModules = Math.max(1, Math.ceil(nominalKwh / LITHIUM_MODULE_KWH));
    batteryKwh = Math.round(batteryModules * LITHIUM_MODULE_KWH * 100) / 100;
    // Banks above 2 modules (>10kWh) belong on a 48V system — installers move to
    // 5kVA/48V rather than paralleling many 24V modules on a small inverter.
    inverterKva = batteryModules > 2 ? Math.max(inverterKvaRaw, 5) : inverterKvaRaw;
  }

  // Panels — cover daily consumption (lead-acid charges ~15% less efficiently)
  const targetKwh = dailyKwh * cfg.panelFactor * (batteryType === "tubular" ? 1.15 : 1);
  const requiredWp = (targetKwh * 1000) / (PEAK_SUN_HOURS * SYSTEM_EFFICIENCY);
  const panelCount = Math.max(2, Math.ceil(requiredWp / PANEL_WATTS));
  const arrayKwp = Math.round((panelCount * PANEL_WATTS) / 10) / 100;

  // BOM
  const invUnit = scale(INVERTER_PER_KVA[inverterTier], inverterKva);
  const batUnit = batteryType === "tubular" ? TUBULAR_200AH : scale(LITHIUM_PER_KWH[inverterTier], LITHIUM_MODULE_KWH);
  const panUnit = scale(PANEL_PER_WP, PANEL_WATTS);
  const batteryBrands = batteryType === "tubular" ? TUBULAR_BRANDS : LITHIUM_BRANDS[inverterTier];
  const panelBrands = PANEL_BRANDS.slice(0, 3);

  const invSpec = `${inverterKva}kVA ${inverterKva >= 5 ? "48V" : "24V"} hybrid`;
  const batSpec =
    batteryType === "tubular"
      ? `200Ah 12V tubular deep-cycle · 2–4 yr life`
      : `${LITHIUM_MODULE_KWH}kWh ${inverterKva >= 5 ? "48V 100Ah" : "24V 200Ah"} module · 10+ yr life`;
  const panSpec = `${PANEL_WATTS}W mono/bifacial`;

  const bom: BomLine[] = [
    {
      key: "inverter",
      item: "Hybrid inverter",
      spec: `${invSpec} — ${INVERTER_BRANDS[inverterTier].join(" / ")}`,
      specBase: invSpec,
      brands: INVERTER_BRANDS[inverterTier],
      qty: 1,
      unit: "unit",
      unitCost: invUnit,
      lineCost: invUnit,
    },
    {
      key: "battery",
      item: batteryType === "tubular" ? "Tubular battery (lead-acid)" : "Lithium battery (LiFePO4)",
      spec: `${batSpec} — ${batteryBrands.join(" / ")}`,
      specBase: batSpec,
      brands: batteryBrands,
      qty: batteryModules,
      unit: batteryType === "tubular" ? "battery" : "module",
      unitCost: batUnit,
      lineCost: scale(batUnit, batteryModules),
    },
    {
      key: "panels",
      item: "Solar panels",
      spec: `${panSpec} — ${panelBrands.join(" / ")}`,
      specBase: panSpec,
      brands: panelBrands,
      qty: panelCount,
      unit: "panel",
      unitCost: panUnit,
      lineCost: scale(panUnit, panelCount),
    },
  ];

  const equipment = add(...bom.map((l) => l.lineCost));
  const bos: PriceRange = {
    low: Math.round(equipment.low * BOS_FRACTION.low),
    best: Math.round(equipment.best * BOS_FRACTION.best),
    high: Math.round(equipment.high * BOS_FRACTION.high),
  };
  const labour: PriceRange = {
    low: Math.max(LABOUR_FLOOR * 0.8, LABOUR_PER_KVA.low * inverterKva),
    best: Math.max(LABOUR_FLOOR, LABOUR_PER_KVA.best * inverterKva),
    high: Math.max(LABOUR_FLOOR * 1.5, LABOUR_PER_KVA.high * inverterKva),
  };

  bom.push(
    {
      key: "bos",
      item: "Mounting, cables & protection",
      spec: "Rails, DC/AC cable, breakers, surge protector, combiner, earthing, changeover",
      qty: 1,
      unit: "lot",
      unitCost: bos,
      lineCost: bos,
    },
    {
      key: "labour",
      item: "Installation & commissioning",
      spec: "Lagos / Abuja / PH roof-mount labour (transport outside city extra)",
      qty: 1,
      unit: "lot",
      unitCost: labour,
      lineCost: labour,
    },
  );

  return {
    key,
    label: cfg.label,
    emoji: cfg.emoji,
    tagline: cfg.tagline,
    inverterKva,
    inverterTier,
    inverterBrands: INVERTER_BRANDS[inverterTier],
    batteryKwh,
    batteryModules,
    batteryType,
    batteryBrands,
    options: opts,
    panelCount,
    panelWatts: PANEL_WATTS,
    arrayKwp,
    autonomyHours: cfg.autonomyHours,
    coveragePct: cfg.coveragePct,
    bom,
    equipment,
    bos,
    labour,
    total: add(equipment, bos, labour),
    note: cfg.note,
  };
}

/** Compact serialisable input: [id, name, watts, qty, hours][] */
type QuoteInput = Array<[string, string, number, number, number]>;

export function buildQuote(appliances: QuoteAppliance[], options: QuoteOptions = {}): Quote {
  // Sort so the same appliances always produce the same code, regardless of
  // the order the UI hands them over (URL restore vs fresh selection).
  const selected = appliances
    // hoursPerDay was not guarded here, so a NaN from a corrupted ?q= payload
    // propagated into dailyKwh, then battery sizing, then every figure on the
    // card — the quote rendered as NaN rather than refusing to be built.
    .filter(
      (a) =>
        Number.isFinite(a.qty) &&
        a.qty > 0 &&
        Number.isFinite(a.watts) &&
        a.watts > 0 &&
        Number.isFinite(a.hoursPerDay) &&
        a.hoursPerDay >= 0,
    )
    .slice()
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const peakWatts = selected.reduce((s, a) => s + a.watts * a.qty, 0);
  const dailyKwh = selected.reduce((s, a) => s + (a.watts * a.qty * a.hoursPerDay) / 1000, 0);

  const input: QuoteInput = selected.map((a) => [a.id, a.name, a.watts, a.qty, a.hoursPerDay]);
  const json = JSON.stringify(input);
  const payload = toBase64Url(json);
  const surgeWatts = startingSurgeWatts(selected);
  const tiers = {
    budget: buildTier("budget", peakWatts, dailyKwh, surgeWatts, options.budget),
    standard: buildTier("standard", peakWatts, dailyKwh, surgeWatts, options.standard),
    premium: buildTier("premium", peakWatts, dailyKwh, surgeWatts, options.premium),
  };
  const code = `SB-${tiers.standard.inverterKva}K-${shortHash(json)}`;

  return {
    code,
    payload,
    generatedAt: new Date().toISOString().slice(0, 10),
    pricesAsOf: PRICES_LAST_UPDATED,
    appliances: selected,
    peakWatts,
    dailyKwh: Math.round(dailyKwh * 10) / 10,
    options,
    tiers,
  };
}

/** Above any real household; a longer payload is not a home we are sizing. */
const MAX_PAYLOAD_APPLIANCES = 50;
const MAX_PAYLOAD_WATTS = 20_000;

/**
 * Rebuild appliances from a ?q= payload. Returns null if it can't be parsed.
 *
 * Every number is bounds-checked, not just coerced. `Number("abc")` is NaN and
 * NaN passed straight through here into the pricing engine, so a truncated or
 * hand-edited share link produced a confidently-rendered quote full of NaN.
 * One bad row now invalidates the whole payload rather than half-decoding it:
 * a partially restored quote is worse than none, because it still looks right.
 */
export function decodeQuotePayload(payload: string): QuoteAppliance[] | null {
  try {
    const arr = JSON.parse(fromBase64Url(payload)) as QuoteInput;
    if (!Array.isArray(arr)) return null;
    if (arr.length === 0 || arr.length > MAX_PAYLOAD_APPLIANCES) return null;

    const out: QuoteAppliance[] = [];
    for (const row of arr) {
      if (!Array.isArray(row) || row.length !== 5) return null;
      const [id, name, watts, qty, hoursPerDay] = row;
      const w = Number(watts);
      const q = Number(qty);
      const h = Number(hoursPerDay);
      if (typeof id !== "string" || !id) return null;
      if (!Number.isFinite(w) || w <= 0 || w > MAX_PAYLOAD_WATTS) return null;
      if (!Number.isFinite(q) || q <= 0 || q > 99) return null;
      if (!Number.isFinite(h) || h < 0 || h > 24) return null;
      out.push({
        id,
        name: String(name ?? "").slice(0, 60),
        watts: Math.round(w),
        qty: Math.round(q),
        hoursPerDay: h,
      });
    }
    return out;
  } catch {
    return null;
  }
}

export function quoteUrl(quote: Quote, tier: TierKey, base: string): string {
  const o = quote.tiers[tier].options;
  const extra = [o.inverterTier ? `inv=${o.inverterTier}` : "", o.battery ? `bat=${o.battery}` : ""].filter(Boolean).join("&");
  return `${base}/calculator?q=${quote.payload}&tier=${tier}${extra ? `&${extra}` : ""}`;
}

/** Parse ?inv= / ?bat= URL params into TierOptions (ignores junk) */
export function parseTierOptions(inv: string | null, bat: string | null): TierOptions {
  const o: TierOptions = {};
  if (inv === "budget" || inv === "mid" || inv === "premium") o.inverterTier = inv;
  if (bat === "lithium" || bat === "tubular") o.battery = bat;
  return o;
}

// ─────────────────────────────────────────────────────────
// FORMATTING
// ─────────────────────────────────────────────────────────

export function formatNaira(amount: number): string {
  return "₦" + Math.round(amount).toLocaleString("en-NG");
}

export function formatNairaShort(amount: number): string {
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(amount >= 10_000_000 ? 1 : 2).replace(/\.?0+$/, "")}M`;
  return `₦${Math.round(amount / 1000)}k`;
}

export function formatRange(r: PriceRange): string {
  return `${formatNairaShort(r.low)} – ${formatNairaShort(r.high)}`;
}

/** Plain-text version of a tier quote — used for WhatsApp / email / share */
export function quoteToText(quote: Quote, tier: TierKey, base: string): string {
  const t = quote.tiers[tier];
  const lines = [
    `SolarBuilders.ng quote ${quote.code} (${t.label})`,
    `Load: ${(quote.peakWatts / 1000).toFixed(1)}kW peak · ${quote.dailyKwh}kWh/day`,
    ``,
    ...t.bom.map(
      (l) => `• ${l.qty > 1 ? `${l.qty}× ` : ""}${l.item} — ${l.spec}: ${formatNaira(l.lineCost.best)}`,
    ),
    ``,
    `Estimated total: ${formatNaira(t.total.best)} (range ${formatRange(t.total)})`,
    `Prices as of ${quote.pricesAsOf} — may have changed.`,
    `Rebuild this quote: ${quoteUrl(quote, tier, base)}`,
  ];
  return lines.join("\n");
}
