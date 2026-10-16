/**
 * Electrical sizing for a quoted system — the part an installer's engineer
 * checks after the inverter, battery and panels are chosen: will the inverter
 * carry the load and the motor starts, what size breakers protect each run,
 * what the built-in charge controller (MPPT) must handle, and which cable size
 * keeps the voltage drop inside the limit.
 *
 * Every figure is derived from the tier lib/quote.ts sized; nothing here is
 * priced. The quote engine reads the battery breaker back from here so the bill
 * of materials and this sheet never disagree.
 *
 * Basis:
 *  - Inverter continuous output = rated kVA × 1000 W (modern hybrids are rated
 *    at unity power factor), run at no more than 80% continuously; surge ≈ 2×
 *    rating for a motor start. Efficiency 94%.
 *  - Breakers: 125% of the maximum continuous current, next standard rating up.
 *    A cable must carry at least the breaker rating, so the breaker protects it.
 *  - Voltage drop: V = 2 × L × I × ρ / A (out-and-back run, copper
 *    ρ = 0.0175 Ω·mm²/m). Limits: battery ≤ 2%, PV and AC ≤ 3%.
 *  - Panels: worst case of the common 600W panels in our catalogue — the higher
 *    current (Isc 18.4A, Imp 17.3A, 210mm-cell type) and the higher voltage
 *    (Voc 53.5V, 182mm-cell type) — so the sheet holds whichever is fitted.
 */

const COPPER_RHO = 0.0175;
const INVERTER_EFFICIENCY = 0.94;
const INVERTER_MAX_LOADING = 0.8;
const INVERTER_SURGE = 2;
const AC_VOLTS = 230;

const PANEL = { isc: 18.4, imp: 17.3, voc: 53.5, vmpLow: 34.8 };
/** Voc rises in the cool of early morning; Nigeria rarely goes below ~15°C. */
const VOC_COLD_FACTOR = 1.05;
const PANELS_PER_STRING_MAX = 6;

const DC_BREAKERS = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
const AC_BREAKERS = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125];

/**
 * Current a copper cable carries continuously (A). Battery runs use flexible
 * 90°C battery cable in free air; PV and AC runs use the 70°C PVC rating
 * clipped direct (BS 7671 reference method C), which is lower.
 */
const BATTERY_CABLE: [mm2: number, amps: number][] = [
  [16, 110], [25, 145], [35, 180], [50, 225], [70, 285], [95, 345], [120, 400],
];
const PVC_CABLE: [mm2: number, amps: number][] = [
  [2.5, 27], [4, 36], [6, 46], [10, 63], [16, 85], [25, 112], [35, 138],
];
/** PV runs start at 6mm² solar cable — what the quote prices and installers stock. */
const PV_CABLE = PVC_CABLE.filter(([mm2]) => mm2 >= 6);

export interface CableRun {
  /** One-way length the sheet assumed, metres */
  lengthM: number;
  amps: number;
  volts: number;
  mm2: number;
  dropVolts: number;
  dropPct: number;
  limitPct: number;
}

export interface ElectricalSheet {
  systemVolts: 24 | 48;
  inverter: {
    kva: number;
    continuousW: number; // usable at 80% loading
    surgeW: number;
    designPeakW: number; // stated load × growth allowance
    startW: number; // design peak + the largest motor's starting surge
    loadingPct: number; // design peak ÷ rating
  };
  battery: { maxAmps: number; breakerA: number; cable: CableRun };
  pv: {
    strings: number;
    panelsPerString: number;
    stringVoc: number;
    stringVmp: number;
    breakerA: number;
    cable: CableRun;
    /** What the hybrid's built-in MPPT charge controller must accept */
    mpptChargeAmps: number;
    arrayW: number;
  };
  ac: { amps: number; breakerA: number; cable: CableRun };
}

export interface RunLengths {
  batteryM?: number;
  pvM?: number;
  acM?: number;
}
export const DEFAULT_RUNS: Required<RunLengths> = { batteryM: 2, pvM: 15, acM: 10 };

function nextUp(list: number[], amps: number): number {
  return list.find((r) => r >= amps) ?? list[list.length - 1];
}

function dropVolts(lengthM: number, amps: number, mm2: number): number {
  return (2 * lengthM * amps * COPPER_RHO) / mm2;
}

/** Smallest cable that carries the breaker rating and keeps the drop inside the limit. */
function sizeCable(
  table: [number, number][],
  lengthM: number,
  amps: number,
  volts: number,
  breakerA: number,
  limitPct: number,
): CableRun {
  const pick =
    table.find(([mm2, rating]) => rating >= breakerA && (dropVolts(lengthM, amps, mm2) / volts) * 100 <= limitPct) ??
    table[table.length - 1];
  const d = dropVolts(lengthM, amps, pick[0]);
  return {
    lengthM,
    amps: Math.round(amps * 10) / 10,
    volts: Math.round(volts),
    mm2: pick[0],
    dropVolts: Math.round(d * 100) / 100,
    dropPct: Math.round((d / volts) * 1000) / 10,
    limitPct,
  };
}

/** Battery-side current and breaker — also used by the quote engine's BOM line. */
export function batteryBreaker(inverterKva: number): { systemVolts: 24 | 48; maxAmps: number; breakerA: number } {
  const systemVolts: 24 | 48 = inverterKva >= 5 ? 48 : 24;
  const maxAmps = (inverterKva * 1000) / (systemVolts * INVERTER_EFFICIENCY);
  return { systemVolts, maxAmps, breakerA: nextUp(DC_BREAKERS, maxAmps * 1.25) };
}

/** Battery cable for the default run — the quote engine's BOM spec reads this. */
export function batteryCableMm2(inverterKva: number): number {
  const { systemVolts, maxAmps, breakerA } = batteryBreaker(inverterKva);
  return sizeCable(BATTERY_CABLE, DEFAULT_RUNS.batteryM, maxAmps, systemVolts, breakerA, 2).mm2;
}

/** Inverter AC output current and its 2-pole breaker. */
export function acOutputBreaker(inverterKva: number): { amps: number; breakerA: number } {
  const amps = (inverterKva * 1000) / AC_VOLTS;
  return { amps, breakerA: nextUp(AC_BREAKERS, amps * 1.25) };
}

/** PV strings for a panel count — at most six panels a string, strings kept equal. */
export function pvStrings(panelCount: number): { strings: number; panelsPerString: number } {
  const strings = Math.max(1, Math.ceil(panelCount / PANELS_PER_STRING_MAX));
  return { strings, panelsPerString: Math.ceil(panelCount / strings) };
}

export function electricalSheet(
  t: { inverterKva: number; panelCount: number; panelWatts: number },
  load: { designPeakWatts: number; surgeWatts: number },
  runs: RunLengths = {},
): ElectricalSheet {
  const len = { ...DEFAULT_RUNS, ...runs };
  const { systemVolts, maxAmps, breakerA } = batteryBreaker(t.inverterKva);
  const ratedW = t.inverterKva * 1000;

  const { strings, panelsPerString } = pvStrings(t.panelCount);
  const stringVoc = Math.round(panelsPerString * PANEL.voc * VOC_COLD_FACTOR);
  const stringVmp = Math.round(panelsPerString * PANEL.vmpLow);
  const pvBreaker = nextUp(DC_BREAKERS, PANEL.isc * 1.25 * 1.25);
  const arrayW = t.panelCount * t.panelWatts;

  const { amps: acAmps, breakerA: acBreaker } = acOutputBreaker(t.inverterKva);

  return {
    systemVolts,
    inverter: {
      kva: t.inverterKva,
      continuousW: Math.round(ratedW * INVERTER_MAX_LOADING),
      surgeW: ratedW * INVERTER_SURGE,
      designPeakW: Math.round(load.designPeakWatts),
      startW: Math.round(load.designPeakWatts + load.surgeWatts),
      loadingPct: Math.round((load.designPeakWatts / ratedW) * 100),
    },
    battery: {
      maxAmps: Math.round(maxAmps),
      breakerA,
      cable: sizeCable(BATTERY_CABLE, len.batteryM, maxAmps, systemVolts, breakerA, 2),
    },
    pv: {
      strings,
      panelsPerString,
      stringVoc,
      stringVmp,
      breakerA: pvBreaker,
      cable: sizeCable(PV_CABLE, len.pvM, PANEL.imp, stringVmp, pvBreaker, 3),
      mpptChargeAmps: Math.ceil(arrayW / systemVolts),
      arrayW,
    },
    ac: {
      amps: Math.round(acAmps * 10) / 10,
      breakerA: acBreaker,
      cable: sizeCable(PVC_CABLE, len.acM, acAmps, AC_VOLTS, acBreaker, 3),
    },
  };
}
