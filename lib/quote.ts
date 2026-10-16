/**
 * SolarBuilders.ng — Quote engine
 *
 * Takes the appliances a user selected and returns three itemised system
 * quotes (Budget / Standard / Premium), each with a real bill of materials
 * priced from lib/prices.ts, plus a short quote code that encodes the input
 * so we can rebuild the exact quote from the code alone.
 *
 * Engineering basis — the stated load is treated as a MINIMUM, the way an
 * installer's engineer would, not as the exact design point:
 *  - Growth allowance: every load figure × 1.25 (the appliance you forgot, the
 *    second fridge next year, nameplate optimism).
 *  - Inverter: never loaded above 80% continuous → design peak ÷ 0.8, and it
 *    must also carry the largest motor start at ~2× its rating. Next standard
 *    size up. All tiers size from the FULL load (VL-001 BUG-3).
 *  - Battery: LiFePO4 48V modules of 5.12kWh, 80% usable (90% DoD × inverter
 *    losses and ageing). Usable storage = design daily kWh × the share used at
 *    night / without grid (30% good grid … 90% off-grid), × 0.6 budget / 1.5
 *    premium. A Band-A home needs far less storage than an off-grid one.
 *  - Panels: share of daily energy that must come from the sun (again by grid
 *    supply) ÷ (4.5 peak-sun-hours — southern Nigeria, rainy-season safe — ×
 *    0.75 system efficiency), rounded up to pairs of 550W panels.
 *  - BOS is priced line by line (breakers, SPDs, changeover, earthing, rack,
 *    extinguisher …), plus a contingency line.
 *  - Installation labour is NOT in the total. We do not employ installers; the
 *    installer prices their own work. A typical range is shown for reference.
 *  - Fridge/freezer daily hours already reflect compressor duty cycle (8h),
 *    set in the calculator page's appliance list.
 */

import {
  BOS_ITEMS,
  CONTINGENCY_FRACTION,
  withSourcingMargin,
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
  inverterSizeFactor,
  TUBULAR_200AH,
  type InverterTier,
  type PriceRange,
} from "./prices";
import { acOutputBreaker, batteryBreaker, batteryCableMm2, pvStrings } from "./electrical";
import type { LiteCatalogue, LiteProduct } from "./catalogue-lite";

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

/** How much grid power the home gets — drives battery hours and panel share. */
export type GridSupply = "good" | "some" | "poor" | "none";

export const GRID_SUPPLY: { key: GridSupply; label: string; hint: string }[] = [
  { key: "good", label: "Good grid", hint: "16h+ a day (Band A/B)" },
  { key: "some", label: "Some grid", hint: "6–16h a day" },
  { key: "poor", label: "Little grid", hint: "under 6h a day" },
  { key: "none", label: "No grid", hint: "off-grid / generator only" },
];
export const DEFAULT_GRID: GridSupply = "some";

/** "How long must it run with no grid?" — the calculator's backup-hours choices. */
export const BACKUP_HOURS = [4, 6, 8, 12, 24] as const;

export function parseBackupHours(v: string | null | undefined): number | undefined {
  const n = Number(v);
  return (BACKUP_HOURS as readonly number[]).includes(n) ? n : undefined;
}

/**
 * Grid band implied by a backup-hours answer — drives the panel share, so a
 * home that must ride 24h without grid gets the off-grid array.
 */
function gridForBackupHours(h: number): GridSupply {
  return h <= 4 ? "good" : h <= 10 ? "some" : h <= 16 ? "poor" : "none";
}

export function parseGrid(v: string | null | undefined): GridSupply {
  return v === "good" || v === "some" || v === "poor" || v === "none" ? v : DEFAULT_GRID;
}

/** Per-tier user overrides from the quote card's picker */
export interface TierOptions {
  inverterTier?: InverterTier;
  battery?: BatteryType;
  /** The buyer's own sizes — the rest of the system re-sizes around them */
  inverterKva?: number;
  batteryModules?: number;
  panelCount?: number;
  /** Brand slugs from lib/brands.ts; priced off that brand's live listings */
  inverterBrand?: string;
  batteryBrand?: string;
  panelBrand?: string;
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
  group: "equipment" | "bos" | "contingency" | "excluded";
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
  contingency: PriceRange;
  /** Typical installer labour — reference only, NOT in total */
  labourRef: PriceRange;
  /** Equipment + BOS + contingency. Excludes installation. */
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
  /** Load the system is designed for: stated × growth allowance */
  designPeakWatts: number;
  designDailyKwh: number;
  grid: GridSupply;
  /** Hours the system must run the list with no grid; unset = sized by grid band */
  backupHours?: number;
  /** Extra watts the largest motor draws while starting */
  surgeWatts: number;
  options: QuoteOptions;
  tiers: Record<TierKey, TierQuote>;
}

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const PEAK_SUN_HOURS = 4.5;
const SYSTEM_EFFICIENCY = 0.75;
const LITHIUM_USABLE = 0.8;
/**
 * Stated load is a minimum — design for 25% more (engineering rule: headroom for
 * overload and the appliance the client forgot). With INVERTER_MAX_LOADING the
 * inverter ends up ~1.56× the stated running load.
 */
export const GROWTH_ALLOWANCE = 1.25;
/** Inverters are not run above 80% of rating continuously. */
const INVERTER_MAX_LOADING = 0.8;

/**
 * Share of the day's energy the battery must hold, by grid supply — what is
 * used after dark or while the grid is off. Daytime use runs off the panels.
 */
const NIGHT_SHARE: Record<GridSupply, number> = { good: 0.3, some: 0.5, poor: 0.7, none: 0.9 };
/** Battery multiplier per tier: budget carries essentials, premium rides through a cloudy day. */
const BATTERY_TIER_FACTOR: Record<TierKey, number> = { budget: 0.6, standard: 1, premium: 1.5 };
/** Share of daily energy the panels must supply, by grid supply. */
const SOLAR_SHARE: Record<GridSupply, number> = { good: 0.6, some: 0.85, poor: 1.0, none: 1.15 };
const TUBULAR_KWH = 2.4; // 12V × 200Ah
const TUBULAR_USABLE = 0.5; // lead-acid DoD
const TUBULAR_BRANDS = ["Luminous", "Quanta", "Felicity"];
const LOAD_FACTOR = 0.6; // average running load vs peak

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
    coveragePct: 60,
    panelFactor: 0.7,
    note: "Runs your essentials (lights, fans, fridge, TV) through the evening. Heavy loads like AC only while the sun is up or the grid is on.",
  },
  standard: {
    label: "Standard",
    emoji: "⚡",
    tagline: "What most Nigerian homes install",
    inverterTier: "mid",
    coveragePct: 100,
    panelFactor: 1.0,
    note: "Runs everything on your list, with 20% headroom for what you add later. Grid or generator tops up on very cloudy days.",
  },
  premium: {
    label: "Premium",
    emoji: "👑",
    tagline: "Deye-class, full independence",
    inverterTier: "premium",
    coveragePct: 120,
    panelFactor: 1.25,
    note: "Everything on your list with extra room to grow, the longest backup, and a premium inverter with app monitoring and 5–10yr warranty.",
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

function pickKva(designPeakWatts: number, surgeWatts = 0): number {
  // Continuous requirement at ≤80% loading, and the worst motor start.
  const continuous = designPeakWatts / INVERTER_MAX_LOADING;
  const forStart = (designPeakWatts + surgeWatts) / INVERTER_SURGE_CAPABILITY;
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

function line(
  key: string,
  item: string,
  spec: string,
  qty: number,
  unit: string,
  unitCost: PriceRange,
  group: BomLine["group"] = "bos",
  /** catalogue listings already include the sourcing fee */
  feeIncluded = false,
): BomLine {
  // Equipment and BOS are bought from third-party sellers, so they carry the
  // sourcing fee. Contingency is derived from these lines and already scales.
  if (!feeIncluded && (group === "equipment" || group === "bos")) {
    unitCost = {
      low: withSourcingMargin(unitCost.low),
      best: withSourcingMargin(unitCost.best),
      high: withSourcingMargin(unitCost.high),
    };
  }
  return { key, item, spec, qty, unit, unitCost, lineCost: scale(unitCost, qty), group };
}

/** A catalogue listing as a price range: the spread sellers showed, midpoint as "best". */
function listing(p: LiteProduct): PriceRange {
  return { low: p.low, best: Math.round((p.low + p.high) / 2 / 100) * 100, high: p.high };
}

/**
 * That brand's smallest inverter that covers the size; else its largest. The
 * line is a hybrid inverter, so at each size a model sold as a hybrid beats a
 * cheaper plain off-grid one; those are used only when the brand lists no hybrid.
 */
function pickInverter(c: LiteCatalogue, slug: string, kva: number): LiteProduct | null {
  const all = c.inverter.filter((p) => p.slug === slug);
  const hybrids = all.filter((p) => /hybrid/i.test(p.spec));
  const own = (hybrids.length ? hybrids : all).sort((a, b) => a.size - b.size || a.low - b.low);
  return own.find((p) => p.size >= kva) ?? own[own.length - 1] ?? null;
}

/** That brand's module nearest a 5kWh home module, on the bank's voltage. */
function pickModule(c: LiteCatalogue, slug: string, volts: 24 | 48): LiteProduct | null {
  const own = c.battery.filter(
    (p) => p.slug === slug && !/high.voltage/i.test(p.spec) && (volts === 24 ? /\b24V\b/.test(p.spec) : !/\b24V\b/.test(p.spec)),
  );
  own.sort((a, b) => Math.abs(a.size - LITHIUM_MODULE_KWH) - Math.abs(b.size - LITHIUM_MODULE_KWH) || a.low - b.low);
  return own[0] ?? null;
}

/** That brand's panel nearest the 600W modules retail now sells. */
function pickPanel(c: LiteCatalogue, slug: string): LiteProduct | null {
  const own = c.panel.filter((p) => p.slug === slug);
  own.sort((a, b) => Math.abs(a.size - PANEL_WATTS) - Math.abs(b.size - PANEL_WATTS) || a.low - b.low);
  return own[0] ?? null;
}

function buildTier(
  key: TierKey,
  designPeakWatts: number,
  designDailyKwh: number,
  surgeWatts: number,
  grid: GridSupply,
  opts: TierOptions = {},
  backup?: { hours: number; kwh: number },
  catalogue?: LiteCatalogue,
): TierQuote {
  const cfg = TIER_CONFIG[key];
  const inverterTier = opts.inverterTier ?? cfg.inverterTier;
  const batteryType: BatteryType = opts.battery ?? "lithium";

  // Inverter — always from the full design peak (VL-001 BUG-3); premium gets a further 20% room to grow
  const inverterKvaRaw = pickKva(designPeakWatts * (key === "premium" ? 1.2 : 1), surgeWatts);

  // Battery — the night/no-grid share of daily energy
  const coveredPeak = (designPeakWatts * Math.min(cfg.coveragePct, 100)) / 100;
  // Backup hours, when given, replace the grid-band estimate: the energy the
  // list uses over that many hours, budget/premium scaled as before.
  const usableKwh = Math.max(
    1,
    (backup ? backup.kwh : designDailyKwh * NIGHT_SHARE[grid]) * BATTERY_TIER_FACTOR[key],
  );
  let batteryModules: number;
  let batteryKwh: number;
  let inverterKva: number;
  let moduleKwh = LITHIUM_MODULE_KWH;
  let invPick: LiteProduct | null = null;
  let batPick: LiteProduct | null = null;
  const nominalKwh = usableKwh / LITHIUM_USABLE;
  if (batteryType === "tubular") {
    // 12V 200Ah units in series strings: 2 for 24V (<5kVA), 4 for 48V
    const series = inverterKvaRaw >= 5 ? 4 : 2;
    const perUnitUsable = TUBULAR_KWH * TUBULAR_USABLE;
    batteryModules = Math.max(series, Math.ceil(usableKwh / perUnitUsable / series) * series);
    inverterKva = batteryModules > 8 ? Math.max(inverterKvaRaw, 5) : inverterKvaRaw;
  } else {
    batteryModules = Math.max(1, Math.ceil(nominalKwh / LITHIUM_MODULE_KWH));
    // Banks above 2 modules (>10kWh) belong on a 48V system — installers move to
    // 5kVA/48V rather than paralleling many 24V modules on a small inverter.
    inverterKva = batteryModules > 2 ? Math.max(inverterKvaRaw, 5) : inverterKvaRaw;
  }

  // The buyer's own choices win; everything after this sizes around them.
  if (opts.inverterKva) inverterKva = opts.inverterKva;
  if (opts.inverterBrand && catalogue) {
    invPick = pickInverter(catalogue, opts.inverterBrand, inverterKva);
    if (invPick) inverterKva = invPick.size;
  }
  if (batteryType === "lithium") {
    if (opts.batteryBrand && catalogue) {
      batPick = pickModule(catalogue, opts.batteryBrand, inverterKva >= 5 ? 48 : 24);
      if (batPick) {
        moduleKwh = batPick.size;
        batteryModules = Math.max(1, Math.ceil(nominalKwh / moduleKwh));
      }
    }
    if (opts.batteryModules) batteryModules = opts.batteryModules;
    batteryKwh = Math.round(batteryModules * moduleKwh * 100) / 100;
  } else {
    if (opts.batteryModules) {
      const series = inverterKva >= 5 ? 4 : 2;
      batteryModules = Math.max(series, Math.ceil(opts.batteryModules / series) * series);
    }
    batteryKwh = Math.round(batteryModules * TUBULAR_KWH * 100) / 100;
  }

  // Backup hours with everything covered running at the average load — a conservative figure
  const usableInstalled = batteryKwh * (batteryType === "tubular" ? TUBULAR_USABLE : LITHIUM_USABLE);
  // With backup hours chosen, a bank that holds the list's energy for that time
  // covers it; a smaller (budget) bank covers that share of it. Never more than
  // asked: appliances that stop after their daily hours would inflate the figure.
  const autonomyHours = backup
    ? Math.max(1, Math.round(backup.hours * Math.min(1, usableInstalled / Math.max(0.1, backup.kwh))))
    : Math.max(1, Math.round((usableInstalled * 1000) / Math.max(1, coveredPeak * LOAD_FACTOR)));

  // Panels — the solar share of daily energy (lead-acid charges ~15% less efficiently),
  // rounded up to pairs so the array splits into equal strings
  const targetKwh = designDailyKwh * SOLAR_SHARE[grid] * cfg.panelFactor * (batteryType === "tubular" ? 1.15 : 1);
  const requiredWp = (targetKwh * 1000) / (PEAK_SUN_HOURS * SYSTEM_EFFICIENCY);
  const panPick = opts.panelBrand && catalogue ? pickPanel(catalogue, opts.panelBrand) : null;
  const panelWatts = panPick?.size ?? PANEL_WATTS;
  const panelCount = opts.panelCount ?? Math.max(2, Math.ceil(requiredWp / panelWatts / 2) * 2);
  const arrayKwp = Math.round((panelCount * panelWatts) / 10) / 100;

  // ── Major equipment. A chosen brand is priced off its own catalogue listing,
  // which already carries the sourcing fee; otherwise the class price applies.
  const invUnit = invPick ? listing(invPick) : scale(INVERTER_PER_KVA[inverterTier], inverterKva * inverterSizeFactor(inverterKva));
  const batUnit =
    batteryType === "tubular" ? TUBULAR_200AH : batPick ? listing(batPick) : scale(LITHIUM_PER_KWH[inverterTier], LITHIUM_MODULE_KWH);
  const panUnit = panPick ? listing(panPick) : scale(PANEL_PER_WP, PANEL_WATTS);
  const inverterBrands = invPick ? [invPick.brand] : INVERTER_BRANDS[inverterTier];
  const batteryBrands = batteryType === "tubular" ? TUBULAR_BRANDS : batPick ? [batPick.brand] : LITHIUM_BRANDS[inverterTier];
  const panelBrands = panPick ? [panPick.brand] : PANEL_BRANDS.slice(0, 3);

  const invSpec = invPick
    ? `${invPick.model} · ${inverterKva}kVA ${inverterKva >= 5 ? "48V" : "24V"}`
    : `${inverterKva}kVA ${inverterKva >= 5 ? "48V" : "24V"} hybrid`;
  const batSpec =
    batteryType === "tubular"
      ? `200Ah 12V tubular deep-cycle · 2–4 yr life`
      : batPick
        ? `${batPick.model} · ${batPick.size}kWh module`
        : `${LITHIUM_MODULE_KWH}kWh ${inverterKva >= 5 ? "48V 100Ah" : "24V 200Ah"} module · 10+ yr life`;
  const panSpec = panPick ? `${panPick.model} · ${panelWatts}W` : `${PANEL_WATTS}W mono/bifacial`;

  const equipmentLines: BomLine[] = [
    {
      ...line("inverter", "Hybrid inverter", `${invSpec} — ${inverterBrands.join(" / ")}`, 1, "unit", invUnit, "equipment", !!invPick),
      specBase: invSpec,
      brands: inverterBrands,
    },
    {
      ...line(
        "battery",
        batteryType === "tubular" ? "Tubular battery (lead-acid)" : "Lithium battery (LiFePO4)",
        `${batSpec} — ${batteryBrands.join(" / ")}`,
        batteryModules,
        batteryType === "tubular" ? "battery" : "module",
        batUnit,
        "equipment",
        !!batPick,
      ),
      specBase: batSpec,
      brands: batteryBrands,
    },
    {
      ...line("panels", "Solar panels", `${panSpec} — ${panelBrands.join(" / ")}`, panelCount, "panel", panUnit, "equipment", !!panPick),
      specBase: panSpec,
      brands: panelBrands,
    },
  ];

  // ── Balance of system, itemised
  const { strings } = pvStrings(panelCount);
  const pvCableM = 20 + panelCount * 2; // roof → inverter run + inter-row jumpers
  const bigSystem = inverterKva > 5;
  // Breaker and cable from lib/electrical.ts, so the BOM matches the sizing sheet.
  const batt = batteryBreaker(inverterKva);
  const heavyBattery = batt.breakerA > 125;
  const bosLines: BomLine[] = [
    line("mounting", "Panel mounting", "Aluminium rails, mid/end clamps, roof hooks", panelCount, "panel", BOS_ITEMS.mounting_per_panel),
    line("pv_cable", "DC solar cable", "6mm² twin-core PV cable, roof to inverter", pvCableM, "m", BOS_ITEMS.pv_cable_per_m),
    line("mc4", "MC4 connectors", "Panel string connectors (pairs)", strings * 2 + 2, "pair", BOS_ITEMS.mc4_pair),
    line(
      "pv_combiner",
      "PV combiner / isolator box",
      "DC breaker + 1000V DC surge protector per string",
      Math.ceil(strings / 2),
      "box",
      BOS_ITEMS.pv_combiner,
    ),
    line(
      "battery_protection",
      "Battery breaker & cables",
      `${batt.breakerA}A DC ${heavyBattery ? "MCCB" : "breaker"}, fuse, ${batteryCableMm2(inverterKva)}mm² battery cable, lugs`,
      1,
      "set",
      heavyBattery ? BOS_ITEMS.battery_protection_large : BOS_ITEMS.battery_protection,
    ),
    line("ac_protection", "AC breakers & surge protection", `${acOutputBreaker(inverterKva).breakerA}A inverter-output and ${bigSystem ? 100 : 63}A grid-input 2-pole breakers, 4–6 way DB, AC surge protector`, 1, "set", BOS_ITEMS.ac_protection),
    line(
      "changeover",
      "Changeover switch",
      bigSystem ? "100A, inverter ⇄ grid/generator" : "63A, inverter ⇄ grid/generator",
      1,
      "unit",
      bigSystem ? BOS_ITEMS.changeover_100a : BOS_ITEMS.changeover_63a,
    ),
    line("earthing", "Earthing kit", "Copper earth rod, clamp, 16mm² earth cable", 1, "set", BOS_ITEMS.earthing_kit),
  ];
  if (batteryType === "lithium" && batteryModules > 2) {
    bosLines.push(line("rack", "Battery rack / cabinet", `Holds ${batteryModules} modules, ventilated`, 1, "unit", BOS_ITEMS.battery_rack));
  }
  bosLines.push(
    line(
      "extinguisher",
      "Fire extinguisher",
      "5kg CO₂ / DCP, mounted beside the battery bank",
      batteryKwh > 20 ? 2 : 1,
      "unit",
      BOS_ITEMS.fire_extinguisher,
    ),
    line("sundries", "Trunking, conduit & accessories", "Trunking, conduit, glands, lugs, ties, AC flex", inverterKva, "kVA", BOS_ITEMS.sundries_per_kva),
  );

  const equipment = add(...equipmentLines.map((l) => l.lineCost));
  const bos = add(...bosLines.map((l) => l.lineCost));
  const base = add(equipment, bos);
  const contingency: PriceRange = {
    low: Math.round(base.low * CONTINGENCY_FRACTION.low),
    best: Math.round(base.best * CONTINGENCY_FRACTION.best),
    high: Math.round(base.high * CONTINGENCY_FRACTION.high),
  };
  const labourRef: PriceRange = {
    low: Math.max(LABOUR_FLOOR * 0.8, LABOUR_PER_KVA.low * inverterKva),
    best: Math.max(LABOUR_FLOOR, LABOUR_PER_KVA.best * inverterKva),
    high: Math.max(LABOUR_FLOOR * 1.5, LABOUR_PER_KVA.high * inverterKva),
  };
  const ZERO: PriceRange = { low: 0, best: 0, high: 0 };

  const bom: BomLine[] = [
    ...equipmentLines,
    ...bosLines,
    line(
      "contingency",
      "Contingency",
      "Items a site survey usually adds, and price movement since our last check",
      1,
      "lot",
      contingency,
      "contingency",
    ),
    line(
      "installation",
      "Installation & workmanship",
      "Charged by your installer — not included in this total",
      1,
      "lot",
      ZERO,
      "excluded",
    ),
  ];

  return {
    key,
    label: cfg.label,
    emoji: cfg.emoji,
    tagline: cfg.tagline,
    inverterKva,
    inverterTier,
    inverterBrands,
    batteryKwh,
    batteryModules,
    batteryType,
    batteryBrands,
    options: opts,
    panelCount,
    panelWatts,
    arrayKwp,
    autonomyHours,
    coveragePct: cfg.coveragePct,
    bom,
    equipment,
    bos,
    contingency,
    labourRef,
    total: add(base, contingency),
    note: cfg.note,
  };
}

/** Compact serialisable input: [id, name, watts, qty, hours][] */
type QuoteInput = Array<[string, string, number, number, number]>;

export function buildQuote(
  appliances: QuoteAppliance[],
  options: QuoteOptions = {},
  grid: GridSupply = DEFAULT_GRID,
  backupHours?: number,
  catalogue?: LiteCatalogue,
): Quote {
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
  const designPeakWatts = peakWatts * GROWTH_ALLOWANCE;
  const designDailyKwh = dailyKwh * GROWTH_ALLOWANCE;
  // Each appliance runs for its own daily hours or the outage, whichever is shorter.
  const bh = backupHours !== undefined && Number.isFinite(backupHours) && backupHours > 0 ? backupHours : undefined;
  const backup = bh
    ? {
        hours: bh,
        kwh: (selected.reduce((s, a) => s + a.watts * a.qty * Math.min(a.hoursPerDay, bh), 0) / 1000) * GROWTH_ALLOWANCE,
      }
    : undefined;
  const g = bh ? gridForBackupHours(bh) : grid;
  const tiers = {
    budget: buildTier("budget", designPeakWatts, designDailyKwh, surgeWatts, g, options.budget, backup, catalogue),
    standard: buildTier("standard", designPeakWatts, designDailyKwh, surgeWatts, g, options.standard, backup, catalogue),
    premium: buildTier("premium", designPeakWatts, designDailyKwh, surgeWatts, g, options.premium, backup, catalogue),
  };
  // Default grid keeps the hash of the appliance list alone, so a code still
  // identifies the same load it did before grid supply was an input.
  const variant = bh ? `|bh${bh}` : grid === DEFAULT_GRID ? "" : `|${grid}`;
  const code = `SB-${tiers.standard.inverterKva}K-${shortHash(`${json}${variant}`)}`;

  return {
    code,
    payload,
    generatedAt: new Date().toISOString().slice(0, 10),
    pricesAsOf: PRICES_LAST_UPDATED,
    appliances: selected,
    peakWatts,
    dailyKwh: Math.round(dailyKwh * 10) / 10,
    designPeakWatts: Math.round(designPeakWatts),
    designDailyKwh: Math.round(designDailyKwh * 10) / 10,
    grid: g,
    backupHours: bh,
    surgeWatts: Math.round(surgeWatts),
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
  const extra = [
    o.inverterTier ? `inv=${o.inverterTier}` : "",
    o.battery ? `bat=${o.battery}` : "",
    o.inverterKva ? `kva=${o.inverterKva}` : "",
    o.batteryModules ? `bm=${o.batteryModules}` : "",
    o.panelCount ? `pc=${o.panelCount}` : "",
    o.inverterBrand ? `ib=${o.inverterBrand}` : "",
    o.batteryBrand ? `bb=${o.batteryBrand}` : "",
    o.panelBrand ? `pb=${o.panelBrand}` : "",
    quote.backupHours ? `bh=${quote.backupHours}` : quote.grid !== DEFAULT_GRID ? `grid=${quote.grid}` : "",
  ]
    .filter(Boolean)
    .join("&");
  return `${base}/calculator?q=${quote.payload}&tier=${tier}${extra ? `&${extra}` : ""}`;
}

/** Inverter sizes a buyer can pick; the engine's own steps plus 3kVA. */
export const INVERTER_SIZES = [1.5, 2.5, 3, 3.5, 5, 6, 8, 10, 12, 16, 20] as const;

const SLUG = /^[a-z0-9-]{2,40}$/;
function intIn(v: string | null, min: number, max: number): number | undefined {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : undefined;
}

/** Every per-tier option a quote link can carry (?inv ?bat ?kva ?bm ?pc ?ib ?bb ?pb); junk is ignored. */
export function parseTierOptionsFrom(sp: { get(k: string): string | null }): TierOptions {
  const o = parseTierOptions(sp.get("inv"), sp.get("bat"));
  const kva = Number(sp.get("kva"));
  if ((INVERTER_SIZES as readonly number[]).includes(kva)) o.inverterKva = kva;
  const bm = intIn(sp.get("bm"), 1, 40);
  if (bm) o.batteryModules = bm;
  const pc = intIn(sp.get("pc"), 1, 100);
  if (pc) o.panelCount = pc;
  for (const [k, field] of [["ib", "inverterBrand"], ["bb", "batteryBrand"], ["pb", "panelBrand"]] as const) {
    const v = sp.get(k);
    if (v && SLUG.test(v)) o[field] = v;
  }
  return o;
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
    ...t.bom
      .filter((l) => l.group !== "excluded")
      .map((l) => `• ${l.qty > 1 ? `${l.qty}× ` : ""}${l.item} — ${l.spec}: ${formatNaira(l.lineCost.best)}`),
    ``,
    `Estimated total (equipment & materials): ${formatNaira(t.total.best)} (range ${formatRange(t.total)})`,
    `Installation is NOT included — your installer quotes it (typically ${formatRange(t.labourRef)}).`,
    `Prices as of ${quote.pricesAsOf} — they move often, so an installer's figure may be higher or lower.`,
    `Rebuild this quote: ${quoteUrl(quote, tier, base)}`,
  ];
  return lines.join("\n");
}
