/**
 * SolarBuilders.ng — Solar Calculator Engine
 * Author: Forge 🔨
 *
 * Electrical engineering assumptions:
 *  - Peak sun hours in Nigeria: 6 hrs/day (conservative average)
 *  - System efficiency factor: 0.80 (accounting for inverter losses, wiring, temperature derating)
 *  - Battery depth of discharge (DoD): 0.50 for lead-acid, 0.80 for lithium
 *    → We use 0.50 conservatively (most Nigerian systems use lead-acid)
 *  - Battery voltage: 24V system (standard for mid-range residential)
 *  - Battery autonomy: 8 hours of backup at average load
 *  - Average load assumption: 60% of peak load (not everything runs simultaneously)
 *  - Panel sizing: sized to charge batteries + run daytime load
 *  - Inverter sizing: sized to handle peak load with 20% headroom
 */

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface Appliance {
  id: string;
  name: string;
  category: "cooling" | "kitchen" | "entertainment" | "lighting" | "office" | "other";
  wattage_min: number; // watts, minimum/efficient model
  wattage_max: number; // watts, maximum/older/inefficient model
  typical_hours_per_day: number; // typical daily usage hours
}

export interface ApplianceInput {
  id: string;
  quantity: number;
}

export interface LoadResult {
  totalWatts_min: number;
  totalWatts_max: number;
  totalWatts_avg: number;
  dailyKwh_min: number;
  dailyKwh_max: number;
  appliances: Array<{
    appliance: Appliance;
    quantity: number;
    watts_min: number;
    watts_max: number;
  }>;
}

export interface SystemSpec {
  tier: "budget" | "standard" | "premium";
  inverter_kva: number;
  battery_ah: number;
  battery_count: number;
  battery_voltage: number; // per battery
  panel_count: number;
  panel_watts: number;
  total_panel_watts: number;
  estimated_cost_naira_min: number;
  estimated_cost_naira_max: number;
  autonomy_hours: number; // backup hours without sun
  notes: string;
}

export interface SystemRecommendation {
  load: LoadResult;
  budget: SystemSpec;
  standard: SystemSpec;
  premium: SystemSpec;
}

// ─────────────────────────────────────────────────────────
// APPLIANCE DATABASE (~30 common Nigerian appliances)
// ─────────────────────────────────────────────────────────

export const APPLIANCES: Record<string, Appliance> = {
  // COOLING
  ac_1hp: {
    id: "ac_1hp",
    name: "Air Conditioner (1HP)",
    category: "cooling",
    wattage_min: 700,
    wattage_max: 1100,
    typical_hours_per_day: 8,
  },
  ac_1_5hp: {
    id: "ac_1_5hp",
    name: "Air Conditioner (1.5HP)",
    category: "cooling",
    wattage_min: 1000,
    wattage_max: 1500,
    typical_hours_per_day: 8,
  },
  ac_2hp: {
    id: "ac_2hp",
    name: "Air Conditioner (2HP)",
    category: "cooling",
    wattage_min: 1500,
    wattage_max: 2200,
    typical_hours_per_day: 8,
  },
  ceiling_fan: {
    id: "ceiling_fan",
    name: "Ceiling Fan",
    category: "cooling",
    wattage_min: 55,
    wattage_max: 90,
    typical_hours_per_day: 12,
  },
  standing_fan: {
    id: "standing_fan",
    name: "Standing/Table Fan",
    category: "cooling",
    wattage_min: 40,
    wattage_max: 70,
    typical_hours_per_day: 10,
  },

  // KITCHEN
  refrigerator: {
    id: "refrigerator",
    name: "Refrigerator",
    category: "kitchen",
    wattage_min: 100,
    wattage_max: 200,
    typical_hours_per_day: 24, // runs 24/7, but cycles ~30-50%
  },
  deep_freezer: {
    id: "deep_freezer",
    name: "Deep Freezer",
    category: "kitchen",
    wattage_min: 100,
    wattage_max: 300,
    typical_hours_per_day: 24,
  },
  chest_freezer: {
    id: "chest_freezer",
    name: "Chest Freezer",
    category: "kitchen",
    wattage_min: 150,
    wattage_max: 350,
    typical_hours_per_day: 24,
  },
  microwave: {
    id: "microwave",
    name: "Microwave Oven",
    category: "kitchen",
    wattage_min: 700,
    wattage_max: 1200,
    typical_hours_per_day: 1,
  },
  blender: {
    id: "blender",
    name: "Blender/Mixer",
    category: "kitchen",
    wattage_min: 300,
    wattage_max: 800,
    typical_hours_per_day: 0.5,
  },
  electric_kettle: {
    id: "electric_kettle",
    name: "Electric Kettle",
    category: "kitchen",
    wattage_min: 1000,
    wattage_max: 2000,
    typical_hours_per_day: 0.5,
  },
  toaster: {
    id: "toaster",
    name: "Toaster",
    category: "kitchen",
    wattage_min: 800,
    wattage_max: 1500,
    typical_hours_per_day: 0.3,
  },
  washing_machine: {
    id: "washing_machine",
    name: "Washing Machine",
    category: "kitchen",
    wattage_min: 300,
    wattage_max: 600,
    typical_hours_per_day: 1,
  },

  // ENTERTAINMENT
  tv_32: {
    id: "tv_32",
    name: 'TV (32" LED)',
    category: "entertainment",
    wattage_min: 30,
    wattage_max: 60,
    typical_hours_per_day: 6,
  },
  tv_43: {
    id: "tv_43",
    name: 'TV (43" LED)',
    category: "entertainment",
    wattage_min: 50,
    wattage_max: 100,
    typical_hours_per_day: 6,
  },
  tv_55: {
    id: "tv_55",
    name: 'TV (55" LED/OLED)',
    category: "entertainment",
    wattage_min: 80,
    wattage_max: 150,
    typical_hours_per_day: 6,
  },
  decoder: {
    id: "decoder",
    name: "DStv / Cable Decoder",
    category: "entertainment",
    wattage_min: 15,
    wattage_max: 25,
    typical_hours_per_day: 6,
  },
  sound_system: {
    id: "sound_system",
    name: "Sound System / Home Theatre",
    category: "entertainment",
    wattage_min: 50,
    wattage_max: 300,
    typical_hours_per_day: 4,
  },

  // LIGHTING
  led_bulb: {
    id: "led_bulb",
    name: "LED Bulb (9W)",
    category: "lighting",
    wattage_min: 7,
    wattage_max: 12,
    typical_hours_per_day: 8,
  },
  fluorescent_tube: {
    id: "fluorescent_tube",
    name: "Fluorescent Tube",
    category: "lighting",
    wattage_min: 18,
    wattage_max: 40,
    typical_hours_per_day: 8,
  },
  security_light: {
    id: "security_light",
    name: "Security/Floodlight",
    category: "lighting",
    wattage_min: 30,
    wattage_max: 100,
    typical_hours_per_day: 12,
  },

  // OFFICE / WORK
  laptop: {
    id: "laptop",
    name: "Laptop",
    category: "office",
    wattage_min: 45,
    wattage_max: 90,
    typical_hours_per_day: 8,
  },
  desktop_pc: {
    id: "desktop_pc",
    name: "Desktop PC + Monitor",
    category: "office",
    wattage_min: 150,
    wattage_max: 350,
    typical_hours_per_day: 8,
  },
  phone_charger: {
    id: "phone_charger",
    name: "Phone Charger",
    category: "office",
    wattage_min: 15,
    wattage_max: 30,
    typical_hours_per_day: 4,
  },
  wifi_router: {
    id: "wifi_router",
    name: "WiFi Router",
    category: "office",
    wattage_min: 5,
    wattage_max: 20,
    typical_hours_per_day: 24,
  },
  printer: {
    id: "printer",
    name: "Printer",
    category: "office",
    wattage_min: 50,
    wattage_max: 200,
    typical_hours_per_day: 1,
  },

  // OTHER
  water_pump: {
    id: "water_pump",
    name: "Water Pump / Borehole",
    category: "other",
    wattage_min: 370,
    wattage_max: 750,
    typical_hours_per_day: 2,
  },
  electric_iron: {
    id: "electric_iron",
    name: "Electric Iron",
    category: "other",
    wattage_min: 1000,
    wattage_max: 2000,
    typical_hours_per_day: 0.5,
  },
  hair_dryer: {
    id: "hair_dryer",
    name: "Hair Dryer",
    category: "other",
    wattage_min: 800,
    wattage_max: 1800,
    typical_hours_per_day: 0.5,
  },
  security_camera: {
    id: "security_camera",
    name: "CCTV / Security Camera System",
    category: "other",
    wattage_min: 30,
    wattage_max: 80,
    typical_hours_per_day: 24,
  },
};

// ─────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────

const PEAK_SUN_HOURS = 6; // Nigeria average
const SYSTEM_EFFICIENCY = 0.80; // inverter + wiring losses
const BATTERY_DOD = 0.50; // depth of discharge (lead-acid conservative)
const BATTERY_VOLTAGE = 24; // 24V system
const AUTONOMY_HOURS = 8; // hours of battery backup
const LOAD_FACTOR = 0.60; // average load = 60% of peak (not everything on at once)
const INVERTER_HEADROOM = 1.25; // 25% overhead on inverter sizing

// Nigerian market price ranges (₦, approximate 2024)
const PRICES = {
  inverter_per_kva: { min: 150_000, max: 250_000 },
  battery_100ah_12v: { min: 80_000, max: 130_000 },
  battery_200ah_12v: { min: 150_000, max: 220_000 },
  panel_400w: { min: 120_000, max: 180_000 },
  installation: { min: 80_000, max: 150_000 },
};

// ─────────────────────────────────────────────────────────
// CORE FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Calculate total load from a list of appliances and quantities.
 * Returns peak (simultaneous) load in watts.
 */
export function calculateLoad(appliances: ApplianceInput[]): LoadResult {
  const breakdown: LoadResult["appliances"] = [];
  let totalMin = 0;
  let totalMax = 0;

  for (const { id, quantity } of appliances) {
    if (quantity <= 0) continue;
    const appliance = APPLIANCES[id];
    if (!appliance) continue;

    const watts_min = appliance.wattage_min * quantity;
    const watts_max = appliance.wattage_max * quantity;

    totalMin += watts_min;
    totalMax += watts_max;

    breakdown.push({ appliance, quantity, watts_min, watts_max });
  }

  const totalAvg = (totalMin + totalMax) / 2;

  // Daily energy: sum of (watts × typical_hours) for each appliance
  // This estimates daily kWh consumption
  let dailyKwh_min = 0;
  let dailyKwh_max = 0;

  for (const item of breakdown) {
    const hours = item.appliance.typical_hours_per_day;
    dailyKwh_min += (item.watts_min * hours) / 1000;
    dailyKwh_max += (item.watts_max * hours) / 1000;
  }

  return {
    totalWatts_min: Math.round(totalMin),
    totalWatts_max: Math.round(totalMax),
    totalWatts_avg: Math.round(totalAvg),
    dailyKwh_min: Math.round(dailyKwh_min * 10) / 10,
    dailyKwh_max: Math.round(dailyKwh_max * 10) / 10,
    appliances: breakdown,
  };
}

/**
 * Given a load result, recommend 3 system tiers.
 *
 * FORMULAS:
 *
 * Inverter size:
 *   inverter_kva = (peak_load_watts × headroom) / 1000
 *   → Round up to nearest standard KVA (1, 1.5, 2, 2.5, 3, 3.5, 5, 7.5, 10)
 *
 * Battery capacity:
 *   Required Ah = (avg_load_watts × LOAD_FACTOR × AUTONOMY_HOURS) / (BATTERY_VOLTAGE × DOD × EFFICIENCY)
 *   → Divide by 100Ah per battery at 12V in 24V bank (2 × 100Ah 12V = 200Ah 24V)
 *
 * Panel sizing:
 *   Daily energy to generate = daily_kwh + battery_recharge_kwh
 *   battery_recharge_kwh = (avg_load × LOAD_FACTOR × AUTONOMY_HOURS) / 1000
 *   Required panel watts = (daily_energy_kwh × 1000) / (PEAK_SUN_HOURS × SYSTEM_EFFICIENCY)
 *   → Round up to nearest 400W panel
 */
export function recommendSystem(load: LoadResult): SystemRecommendation {
  const peakWatts_avg = load.totalWatts_avg;
  const avgLoadWatts = peakWatts_avg * LOAD_FACTOR;

  // ── INVERTER ──────────────────────────────────────────
  const STANDARD_KVA = [1, 1.5, 2, 2.5, 3, 3.5, 5, 7.5, 10, 15, 20];

  function pickInverterKva(peakWatts: number, scale: number = 1): number {
    const requiredKva = (peakWatts * scale * INVERTER_HEADROOM) / 1000;
    return STANDARD_KVA.find((k) => k >= requiredKva) ?? 20;
  }

  // ── BATTERY ───────────────────────────────────────────
  // Formula: Ah = (watts × hours) / (volts × DoD × efficiency)
  function calcBatteryAh(loadWatts: number, hours: number): number {
    return (loadWatts * hours) / (BATTERY_VOLTAGE * BATTERY_DOD * SYSTEM_EFFICIENCY);
  }

  // We spec as number of 200Ah 12V batteries in a 24V bank
  // A 24V bank uses 2× 12V batteries in series = 200Ah capacity each pair
  function batteryConfig(requiredAh: number): {
    battery_ah: number;
    battery_count: number;
    battery_voltage: number;
  } {
    // Standard battery: 200Ah 12V (common in Nigerian market)
    // In a 24V system, 2× 200Ah 12V in series = 200Ah at 24V
    const pairs = Math.ceil(requiredAh / 200);
    const count = pairs * 2; // 2 batteries per pair
    return { battery_ah: 200, battery_count: count, battery_voltage: 12 };
  }

  // ── PANELS ────────────────────────────────────────────
  function calcPanels(
    dailyKwh: number,
    batteryAh: number,
    batteryCount: number
  ): { panel_count: number; panel_watts: number; total_panel_watts: number } {
    // Energy needed to recharge batteries (at 80% discharge assumed in worst case)
    const batteryKwh = (batteryAh * batteryCount * 12 * BATTERY_DOD) / 1000;
    const totalEnergyNeeded = dailyKwh + batteryKwh * 0.5; // 50% avg battery use

    // Panel watts needed
    const requiredPanelWatts = (totalEnergyNeeded * 1000) / (PEAK_SUN_HOURS * SYSTEM_EFFICIENCY);

    const PANEL_WATTS = 400; // standard monocrystalline panel
    const panel_count = Math.max(2, Math.ceil(requiredPanelWatts / PANEL_WATTS));

    return {
      panel_count,
      panel_watts: PANEL_WATTS,
      total_panel_watts: panel_count * PANEL_WATTS,
    };
  }

  // ── COST ESTIMATE ─────────────────────────────────────
  function estimateCost(
    inverter_kva: number,
    battery_count: number,
    panel_count: number
  ): { min: number; max: number } {
    const inv_min = inverter_kva * PRICES.inverter_per_kva.min;
    const inv_max = inverter_kva * PRICES.inverter_per_kva.max;

    // Pair of 200Ah 12V batteries
    const bat_min = battery_count * PRICES.battery_200ah_12v.min;
    const bat_max = battery_count * PRICES.battery_200ah_12v.max;

    const pan_min = panel_count * PRICES.panel_400w.min;
    const pan_max = panel_count * PRICES.panel_400w.max;

    return {
      min: inv_min + bat_min + pan_min + PRICES.installation.min,
      max: inv_max + bat_max + pan_max + PRICES.installation.max,
    };
  }

  const dailyKwh_avg = (load.dailyKwh_min + load.dailyKwh_max) / 2;

  // ── BUDGET TIER ───────────────────────────────────────
  // Covers ~50% of load, reduced autonomy (4hrs)
  const budgetPeakWatts = load.totalWatts_min;
  const budgetAvgWatts = budgetPeakWatts * LOAD_FACTOR;
  const budgetAutonomy = 4;
  const budgetAh = calcBatteryAh(budgetAvgWatts, budgetAutonomy);
  const budgetBat = batteryConfig(budgetAh);
  const budgetKva = pickInverterKva(budgetPeakWatts);
  const budgetPanels = calcPanels(load.dailyKwh_min * 0.7, budgetBat.battery_ah, budgetBat.battery_count);
  const budgetCost = estimateCost(budgetKva, budgetBat.battery_count, budgetPanels.panel_count);

  // ── STANDARD TIER ────────────────────────────────────
  // Covers average load, 8hrs autonomy
  const stdPeakWatts = load.totalWatts_avg;
  const stdAvgWatts = stdPeakWatts * LOAD_FACTOR;
  const stdAh = calcBatteryAh(stdAvgWatts, AUTONOMY_HOURS);
  const stdBat = batteryConfig(stdAh);
  const stdKva = pickInverterKva(stdPeakWatts);
  const stdPanels = calcPanels(dailyKwh_avg, stdBat.battery_ah, stdBat.battery_count);
  const stdCost = estimateCost(stdKva, stdBat.battery_count, stdPanels.panel_count);

  // ── PREMIUM TIER ─────────────────────────────────────
  // Covers max load, 12hrs autonomy, 20% extra capacity buffer
  const premPeakWatts = load.totalWatts_max;
  const premAvgWatts = premPeakWatts * LOAD_FACTOR;
  const premAutonomy = 12;
  const premAh = calcBatteryAh(premAvgWatts, premAutonomy);
  const premBat = batteryConfig(premAh);
  const premKva = pickInverterKva(premPeakWatts, 1.2); // 20% future expansion headroom
  const premPanels = calcPanels(load.dailyKwh_max * 1.2, premBat.battery_ah, premBat.battery_count);
  const premCost = estimateCost(premKva, premBat.battery_count, premPanels.panel_count);

  return {
    load,
    budget: {
      tier: "budget",
      inverter_kva: budgetKva,
      battery_ah: budgetBat.battery_ah,
      battery_count: budgetBat.battery_count,
      battery_voltage: budgetBat.battery_voltage,
      ...budgetPanels,
      estimated_cost_naira_min: budgetCost.min,
      estimated_cost_naira_max: budgetCost.max,
      autonomy_hours: budgetAutonomy,
      notes:
        "Entry-level system. Covers essential loads (lights, fans, TV, fridge). Not suitable for AC or heavy loads.",
    },
    standard: {
      tier: "standard",
      inverter_kva: stdKva,
      battery_ah: stdBat.battery_ah,
      battery_count: stdBat.battery_count,
      battery_voltage: stdBat.battery_voltage,
      ...stdPanels,
      estimated_cost_naira_min: stdCost.min,
      estimated_cost_naira_max: stdCost.max,
      autonomy_hours: AUTONOMY_HOURS,
      notes:
        "Balanced system for most homes. Handles average load comfortably with a full day of backup.",
    },
    premium: {
      tier: "premium",
      inverter_kva: premKva,
      battery_ah: premBat.battery_ah,
      battery_count: premBat.battery_count,
      battery_voltage: premBat.battery_voltage,
      ...premPanels,
      estimated_cost_naira_min: premCost.min,
      estimated_cost_naira_max: premCost.max,
      autonomy_hours: premAutonomy,
      notes:
        "High-capacity system for maximum load including AC. 12hrs backup. Built with expansion room.",
    },
  };
}

/**
 * Convenience: one-shot calculate + recommend
 */
export function calculateAndRecommend(appliances: ApplianceInput[]): SystemRecommendation {
  const load = calculateLoad(appliances);
  return recommendSystem(load);
}

/**
 * Get all appliances as a sorted array (for UI rendering)
 */
export function getApplianceList(): Appliance[] {
  return Object.values(APPLIANCES).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}

/**
 * Format naira amount for display
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
