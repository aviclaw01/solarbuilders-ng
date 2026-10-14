/**
 * SolarBuilders.ng — the preset appliance list.
 *
 * One list, shared by the calculator (app/calculator) and the kit finder
 * (/find, lib/find-personas.ts). Both send these ids, names, watts and hours
 * to lib/quote.ts, so a /find result opened in the calculator rebuilds the
 * same quote code. Edit a wattage here and both paths move together.
 */

export interface PresetAppliance {
  id: string;
  name: string;
  emoji: string;
  watts: number;
  hoursPerDay: number;
}

// hoursPerDay = effective running hours. Fridge/freezer compressors cycle ~35%,
// so 8h ≈ a full day of cooling (VL-001 BUG-4).
export const STEP1_APPLIANCES: PresetAppliance[] = [
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

export const STEP2_APPLIANCES: PresetAppliance[] = [
  { id: 'tv_32', name: 'TV (32")', emoji: '📺', watts: 60, hoursPerDay: 6 },
  { id: 'tv_55', name: 'TV (55"+)', emoji: '🖥️', watts: 150, hoursPerDay: 6 },
  { id: 'laptop', name: 'Laptop', emoji: '💻', watts: 65, hoursPerDay: 8 },
  { id: 'desktop_pc', name: 'Desktop PC', emoji: '🖨️', watts: 200, hoursPerDay: 8 },
  { id: 'microwave', name: 'Microwave', emoji: '📦', watts: 1000, hoursPerDay: 0.5 },
  { id: 'blender', name: 'Blender', emoji: '🥤', watts: 500, hoursPerDay: 0.3 },
  { id: 'standing_fan', name: 'Standing Fan', emoji: '🌀', watts: 75, hoursPerDay: 8 },
  { id: 'decoder', name: 'DSTV/Decoder', emoji: '📡', watts: 25, hoursPerDay: 6 },
];

export const STEP3_APPLIANCES: PresetAppliance[] = [
  { id: 'led_bulb', name: 'LED Bulb', emoji: '💡', watts: 10, hoursPerDay: 8 },
  { id: 'phone_charger', name: 'Phone Charger', emoji: '📱', watts: 15, hoursPerDay: 4 },
  { id: 'wifi_router', name: 'WiFi Router', emoji: '📻', watts: 15, hoursPerDay: 24 },
  { id: 'ceiling_fan', name: 'Ceiling Fan', emoji: '🌬️', watts: 70, hoursPerDay: 8 },
  { id: 'security_light', name: 'Security Light', emoji: '💡', watts: 30, hoursPerDay: 12 },
  { id: 'cctv', name: 'CCTV System', emoji: '📷', watts: 50, hoursPerDay: 24 },
];

export const ALL_PRESET_APPLIANCES: PresetAppliance[] = [...STEP1_APPLIANCES, ...STEP2_APPLIANCES, ...STEP3_APPLIANCES];

export function presetAppliance(id: string): PresetAppliance | undefined {
  return ALL_PRESET_APPLIANCES.find((a) => a.id === id);
}
