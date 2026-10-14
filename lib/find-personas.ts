/**
 * SolarBuilders.ng — the /find kit finder's inputs.
 *
 * Nothing here is a price or a size. Each persona is an appliance list built
 * from the calculator's own presets (lib/appliances.ts); the kit, its kVA, kWh
 * and naira figure all come from lib/quote.ts buildQuote(), the same engine
 * the calculator runs. Change a persona and its kit re-sizes itself.
 */

import { ALL_PRESET_APPLIANCES, presetAppliance } from './appliances';
import { generatorCostPerDay } from './energy-costs';
import type { GridSupply, QuoteAppliance, TierKey } from './quote';

export type PersonaKey = 'students' | 'techbros' | 'renters' | 'shops' | 'family' | 'duplex' | 'offices';

export interface PersonaItem {
  id: string;
  qty: number;
  /** what the "Keeps these running" list calls it, when the preset name is too technical */
  label?: string;
}

export interface Persona {
  key: PersonaKey;
  label: string;
  /** one line under the grid when the tile is selected */
  hint: string;
  /** what the matched kit is called */
  kitName: string;
  items: PersonaItem[];
}

export const PERSONAS: Persona[] = [
  {
    key: 'students',
    label: 'Students',
    hint: 'Room or self-con: bulbs, a fan, laptop, phones and Wi-Fi.',
    kitName: 'Hostel Starter',
    items: [
      { id: 'led_bulb', qty: 2, label: 'Bulbs' },
      { id: 'standing_fan', qty: 1, label: 'Fan' },
      { id: 'laptop', qty: 1 },
      { id: 'phone_charger', qty: 2, label: 'Phones' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
    ],
  },
  {
    key: 'techbros',
    label: 'Tech bros',
    hint: 'Laptop and PC on all day, Wi-Fi never off, fridge cold.',
    kitName: 'Remote Work Steady',
    items: [
      { id: 'laptop', qty: 1 },
      { id: 'desktop_pc', qty: 1, label: 'Desktop / monitor setup' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
      { id: 'refrigerator', qty: 1, label: 'Fridge' },
      { id: 'tv_32', qty: 1, label: 'TV' },
      { id: 'standing_fan', qty: 2, label: 'Fans' },
      { id: 'led_bulb', qty: 4, label: 'Bulbs' },
      { id: 'phone_charger', qty: 3, label: 'Phones' },
    ],
  },
  {
    key: 'renters',
    label: 'Renters',
    hint: '1–2 bed flat: fridge, TV, fans and lights. No AC.',
    kitName: 'Flat Basic',
    items: [
      { id: 'refrigerator', qty: 1, label: 'Fridge' },
      { id: 'tv_32', qty: 1, label: 'TV' },
      { id: 'standing_fan', qty: 2, label: 'Fans' },
      { id: 'led_bulb', qty: 6, label: 'Bulbs' },
      { id: 'phone_charger', qty: 3, label: 'Phones' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
      { id: 'laptop', qty: 1 },
    ],
  },
  {
    key: 'shops',
    label: 'Shops & POS',
    hint: 'Lights, fans, a drinks fridge, POS and phones charging.',
    kitName: 'Shop Steady',
    items: [
      { id: 'led_bulb', qty: 6, label: 'Bulbs' },
      { id: 'standing_fan', qty: 2, label: 'Fans' },
      { id: 'refrigerator', qty: 1, label: 'Drinks fridge' },
      { id: 'phone_charger', qty: 4, label: 'POS & phones' },
      { id: 'tv_32', qty: 1, label: 'TV' },
      { id: 'security_light', qty: 2, label: 'Security lights' },
    ],
  },
  {
    key: 'family',
    label: 'Family flats',
    hint: '3-bed home with one AC, a fridge and a freezer.',
    kitName: 'Family Comfort',
    items: [
      { id: 'ac_1_5hp', qty: 1, label: 'AC (1.5HP)' },
      { id: 'refrigerator', qty: 1, label: 'Fridge' },
      { id: 'deep_freezer', qty: 1, label: 'Freezer' },
      { id: 'tv_32', qty: 2, label: 'TVs' },
      { id: 'standing_fan', qty: 2, label: 'Fans' },
      { id: 'ceiling_fan', qty: 2, label: 'Ceiling fans' },
      { id: 'led_bulb', qty: 8, label: 'Bulbs' },
      { id: 'phone_charger', qty: 4, label: 'Phones' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
    ],
  },
  {
    key: 'duplex',
    label: 'Duplex',
    hint: '2–3 ACs, pumping machine, washing machine, the lot.',
    kitName: 'Duplex Full House',
    items: [
      { id: 'ac_1_5hp', qty: 2, label: 'AC (1.5HP)' },
      { id: 'ac_1hp', qty: 1, label: 'AC (1HP)' },
      { id: 'refrigerator', qty: 1, label: 'Fridge' },
      { id: 'deep_freezer', qty: 1, label: 'Freezer' },
      { id: 'water_pump', qty: 1, label: 'Pumping machine' },
      { id: 'washing_machine', qty: 1 },
      { id: 'tv_55', qty: 1, label: 'Big TV' },
      { id: 'tv_32', qty: 2, label: 'TVs' },
      { id: 'ceiling_fan', qty: 4, label: 'Ceiling fans' },
      { id: 'led_bulb', qty: 15, label: 'Bulbs' },
      { id: 'security_light', qty: 4, label: 'Security lights' },
      { id: 'phone_charger', qty: 5, label: 'Phones' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
      { id: 'cctv', qty: 1, label: 'CCTV' },
    ],
  },
  {
    key: 'offices',
    label: 'Offices',
    hint: 'PCs, laptops, Wi-Fi, one AC and lights through work hours.',
    kitName: 'Office Power',
    items: [
      { id: 'ac_1_5hp', qty: 1, label: 'AC (1.5HP)' },
      { id: 'desktop_pc', qty: 3, label: 'Desktop PCs' },
      { id: 'laptop', qty: 2, label: 'Laptops' },
      { id: 'led_bulb', qty: 10, label: 'Bulbs' },
      { id: 'ceiling_fan', qty: 2, label: 'Ceiling fans' },
      { id: 'wifi_router', qty: 1, label: 'Wi-Fi' },
      { id: 'refrigerator', qty: 1, label: 'Fridge' },
      { id: 'cctv', qty: 1, label: 'CCTV' },
    ],
  },
];

/** The "I'll pick appliances" screen — twelve common loads, all calculator presets. */
export const PICK_APPLIANCES: { id: string; label: string }[] = [
  { id: 'led_bulb', label: 'LED bulbs' },
  { id: 'standing_fan', label: 'Fans' },
  { id: 'phone_charger', label: 'Phones / POS' },
  { id: 'laptop', label: 'Laptops' },
  { id: 'desktop_pc', label: 'Desktop PCs' },
  { id: 'wifi_router', label: 'Wi-Fi router' },
  { id: 'tv_32', label: 'TV' },
  { id: 'refrigerator', label: 'Fridge' },
  { id: 'deep_freezer', label: 'Freezer' },
  { id: 'water_pump', label: 'Pumping machine' },
  { id: 'ac_1hp', label: 'AC (1HP)' },
  { id: 'ac_1_5hp', label: 'AC (1.5HP)' },
];

/** Kit name for a hand-picked list: there is no persona to name it after. */
export const CUSTOM_KIT_NAME = 'Your Kit';

/** Persona/picked items → the engine's appliance list (preset watts and hours). */
export function toQuoteAppliances(items: { id: string; qty: number }[]): QuoteAppliance[] {
  return items.flatMap(({ id, qty }) => {
    const p = presetAppliance(id);
    if (!p || qty < 1) return [];
    return [{ id: p.id, name: p.name, watts: p.watts, qty, hoursPerDay: p.hoursPerDay }];
  });
}

export function presetWatts(id: string): number {
  return ALL_PRESET_APPLIANCES.find((a) => a.id === id)?.watts ?? 0;
}

// ─────────────────────────────────────────────────────────
// HOURS WITHOUT LIGHT → ENGINE GRID SUPPLY
// ─────────────────────────────────────────────────────────

/**
 * The engine has no "hours off" input. Battery and panel size are driven by
 * GridSupply (lib/quote.ts: NIGHT_SHARE / SOLAR_SHARE), whose bands are
 * defined by hours of grid a day:
 *
 *   good  16h+ grid   →  off  8h or less
 *   some  6–16h grid  →  off  8–18h
 *   poor  under 6h    →  off  more than 18h
 *   none  no grid     →  off  all day
 *
 * So each tile is "24 − hours off" placed in those bands, nothing more:
 *
 *   4h  → 20h grid → good        16h → 8h grid → some
 *   8h  → 16h grid → good        20h → 4h grid → poor
 *   12h → 12h grid → some        24h → no grid → none
 *
 * The tiles are spaced so every band is reachable; a 4/6/8/10/12/16 ladder
 * would have put five of six tiles into two bands and shown the same kit for
 * most answers. The generator figure uses the hours exactly as tapped.
 */
export const HOURS_OFF: { hours: number; label: string; grid: GridSupply }[] = [
  { hours: 4, label: 'A few hours', grid: 'good' },
  { hours: 8, label: 'Most evenings', grid: 'good' },
  { hours: 12, label: 'Half the day', grid: 'some' },
  { hours: 16, label: 'Most of the day', grid: 'some' },
  { hours: 20, label: 'Almost always', grid: 'poor' },
  { hours: 24, label: 'No grid at all', grid: 'none' },
];
export const DEFAULT_HOURS_OFF = 12;

export function gridForHoursOff(hours: number): GridSupply {
  return HOURS_OFF.find((h) => h.hours === hours)?.grid ?? 'some';
}

/**
 * Petrol a 3kVA generator burns covering those hours, per 30-day month —
 * the midpoint of lib/energy-costs.ts' published range. Rounded to ₦1,000:
 * it is an "about" figure and is labelled so.
 */
export function generatorFuelPerMonth(hoursOff: number): number {
  const d = generatorCostPerDay(hoursOff);
  return Math.round(((d.low + d.high) / 2) * 30 / 1000) * 1000;
}

// ─────────────────────────────────────────────────────────
// KIT NAMES PER TIER
// ─────────────────────────────────────────────────────────

/** The engine's three tiers are the three sizes of one kit. Order: small → big. */
export const SIZE_ORDER: TierKey[] = ['budget', 'standard', 'premium'];

export function kitName(base: string, tier: TierKey): string {
  if (tier === 'budget') return `${base} Lite`;
  if (tier === 'premium') return `${base} Plus`;
  return base;
}
