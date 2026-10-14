#!/usr/bin/env node
/**
 * Unit test for the quote engine (lib/quote.ts).
 *
 * Same approach as scripts/partner-routing.test.mjs: no test framework, compile
 * the module on its own with tsc and exercise it directly.
 *
 *   node scripts/quote-engine.test.mjs
 *
 * Why this exists. Every naira the business quotes comes out of this module,
 * and until now it had no tests at all — while the routing engine, which has no
 * UI and has never created a row, had 38. The defects recorded by hand in
 * VL-001-calculator-validation.md had nothing stopping them coming back.
 *
 * The bulk of these cases are about refusing bad input rather than arithmetic:
 * a quote that renders "₦NaN", or silently drops an appliance the visitor
 * entered, is worse than one that declines to build.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(path.join(tmpdir(), "sb-quote-"));

execFileSync(
  "npx",
  ["tsc", "lib/quote.ts", "lib/prices.ts", "--outDir", outDir, "--module", "commonjs", "--target", "es2022", "--skipLibCheck"],
  { cwd: APP_DIR, stdio: "inherit" },
);

const require = createRequire(import.meta.url);
const Q = require(path.join(outDir, "quote.js"));

let passed = 0;
let failed = 0;
const failures = [];

function group(name) {
  console.log(`\n${name}`);
}

function check(what, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ✓ ${what}`);
  } else {
    failed++;
    failures.push(`${what}${detail ? ` — ${detail}` : ""}`);
    console.log(`  ✗ ${what}${detail ? `\n      ${detail}` : ""}`);
  }
}

/** A plain, valid appliance. */
function appliance(over = {}) {
  return { id: "led_bulb", name: "LED Bulb", watts: 10, qty: 1, hoursPerDay: 8, ...over };
}

/** Every number a quote shows must be a real number. */
function allFinite(quote) {
  const nums = [quote.peakWatts, quote.dailyKwh];
  for (const tier of Object.values(quote.tiers)) {
    nums.push(tier.total.low, tier.total.best, tier.total.high, tier.inverterKva);
  }
  return nums.every((n) => typeof n === "number" && Number.isFinite(n));
}

// ─────────────────────────────────────────────────────────────
group("load and totals");

const basic = Q.buildQuote([
  appliance({ id: "led_bulb", watts: 10, qty: 10, hoursPerDay: 5 }),
  appliance({ id: "standing_fan", name: "Standing Fan", watts: 75, qty: 2, hoursPerDay: 8 }),
]);

check("peak watts is the sum of watts x qty", basic.peakWatts === 10 * 10 + 75 * 2, `got ${basic.peakWatts}`);
check(
  "daily kWh is watts x qty x hours / 1000",
  Math.abs(basic.dailyKwh - ((10 * 10 * 5) + (75 * 2 * 8)) / 1000) < 0.05,
  `got ${basic.dailyKwh}`,
);
check("every tier produces finite money", allFinite(basic));
check("tiers are ordered budget <= standard <= premium",
  basic.tiers.budget.total.best <= basic.tiers.standard.total.best &&
  basic.tiers.standard.total.best <= basic.tiers.premium.total.best,
  `${basic.tiers.budget.total.best} / ${basic.tiers.standard.total.best} / ${basic.tiers.premium.total.best}`);
check("low <= best <= high within a tier",
  basic.tiers.standard.total.low <= basic.tiers.standard.total.best &&
  basic.tiers.standard.total.best <= basic.tiers.standard.total.high);
check("an empty appliance list still builds without NaN", allFinite(Q.buildQuote([])));

// ─────────────────────────────────────────────────────────────
group("bad input never reaches the price");

const negWatts = Q.buildQuote([appliance({ watts: -500 })]);
check("a negative wattage is dropped, not subtracted", negWatts.peakWatts === 0, `got ${negWatts.peakWatts}`);
check("a negative wattage leaves the quote finite", allFinite(negWatts));

const nanHours = Q.buildQuote([appliance({ hoursPerDay: Number.NaN })]);
check("NaN hours is dropped rather than poisoning dailyKwh", Number.isFinite(nanHours.dailyKwh), `got ${nanHours.dailyKwh}`);
check("NaN hours leaves every tier finite", allFinite(nanHours));

const nanWatts = Q.buildQuote([appliance({ watts: Number.NaN })]);
check("NaN watts is dropped", nanWatts.peakWatts === 0 && allFinite(nanWatts));

const zeroHours = Q.buildQuote([appliance({ hoursPerDay: 0 })]);
check("zero hours is kept as a real load (peak) with no energy", zeroHours.peakWatts === 10 && zeroHours.dailyKwh === 0);

// ─────────────────────────────────────────────────────────────
group("share links round-trip");

const shared = Q.buildQuote([
  appliance({ id: "ac_1_5hp", name: "Air Con (1.5HP)", watts: 1200, qty: 1, hoursPerDay: 4 }),
  appliance({ id: "refrigerator", name: "Refrigerator", watts: 200, qty: 1, hoursPerDay: 8 }),
]);
const decoded = Q.decodeQuotePayload(shared.payload);
check("a payload decodes back to the same appliance count", decoded !== null && decoded.length === 2);
check(
  "a decoded payload rebuilds the identical quote code",
  decoded !== null && Q.buildQuote(decoded).code === shared.code,
  decoded ? `${Q.buildQuote(decoded).code} vs ${shared.code}` : "decode returned null",
);

// The bug this guards: Number("abc") is NaN, and NaN used to pass straight
// through into the engine and render as ₦NaN on the card.
const bad = (rows) => Q.decodeQuotePayload(Buffer.from(JSON.stringify(rows), "utf8").toString("base64url"));
check("a non-numeric wattage rejects the whole payload", bad([["x", "X", "abc", 1, 4]]) === null);
check("a NaN hours field rejects the whole payload", bad([["x", "X", 100, 1, "abc"]]) === null);
check("a negative wattage rejects the payload", bad([["x", "X", -100, 1, 4]]) === null);
check("hours above 24 rejects the payload", bad([["x", "X", 100, 1, 48]]) === null);
check("an absurd wattage rejects the payload", bad([["x", "X", 9_999_999, 1, 4]]) === null);
check("a short row rejects the payload", bad([["x", "X", 100, 1]]) === null);
check("an empty payload returns null", bad([]) === null);
check(
  "a payload longer than a household returns null",
  bad(Array.from({ length: 51 }, () => ["x", "X", 100, 1, 4])) === null,
);
check("outright garbage returns null rather than throwing", Q.decodeQuotePayload("not-base64-at-all!!") === null);
check("one bad row invalidates the whole payload, not just that row",
  bad([["a", "A", 100, 1, 4], ["b", "B", 100, 1, "abc"]]) === null);

// ─────────────────────────────────────────────────────────────
group("quote codes");

check("the same appliances give the same code", shared.code === Q.buildQuote(decoded).code);
check("the code is printable and prefixed", /^SB-[0-9.]+K-[0-9A-Z]{6}$/.test(shared.code), shared.code);
// Documents today's behaviour, which issue #21 is about changing: the code is a
// content hash, so it identifies a CONFIGURATION and not a customer's request.
const sameLoadDifferentPerson = Q.buildQuote(decoded);
check(
  "KNOWN (#21): two people with the same appliances collide on one code",
  sameLoadDifferentPerson.code === shared.code,
  "this passing is the bug — see issue #21",
);

// ─────────────────────────────────────────────────────────────
group("sizing sanity (VL-001)");

// A fridge and a freezer only: the sizing that VL-001 checked by hand.
const coldOnly = Q.buildQuote([
  appliance({ id: "refrigerator", name: "Refrigerator", watts: 200, qty: 1, hoursPerDay: 8 }),
  appliance({ id: "deep_freezer", name: "Deep Freezer", watts: 250, qty: 1, hoursPerDay: 8 }),
]);
check("a fridge+freezer home gets a small inverter, not an oversized one",
  coldOnly.tiers.standard.inverterKva > 0 && coldOnly.tiers.standard.inverterKva <= 3,
  `${coldOnly.tiers.standard.inverterKva}kVA`);
check("inverter headroom exceeds the running load",
  coldOnly.tiers.standard.inverterKva * 1000 >= coldOnly.peakWatts,
  `${coldOnly.tiers.standard.inverterKva}kVA vs ${coldOnly.peakWatts}W`);

// A 1.5HP AC carries a startup surge; the inverter must not be sized on
// running watts alone.
const withAc = Q.buildQuote([appliance({ id: "ac_1_5hp", name: "Air Con (1.5HP)", watts: 1200, qty: 1, hoursPerDay: 4 })]);
check("an AC sizes a bigger inverter than its running watts alone",
  withAc.tiers.standard.inverterKva * 1000 > 1200,
  `${withAc.tiers.standard.inverterKva}kVA for 1200W`);

check("prices are stamped with the catalogue date", typeof basic.pricesAsOf === "string" && basic.pricesAsOf.length >= 10);

// ─────────────────────────────────────────────────────────────
group("engineering allowances and an honest total");

const home = [
  appliance({ id: "ac_1_5hp", name: "Air Con (1.5HP)", watts: 1200, qty: 1, hoursPerDay: 4 }),
  appliance({ id: "refrigerator", name: "Refrigerator", watts: 200, qty: 1, hoursPerDay: 8 }),
  appliance({ id: "led_bulb", watts: 10, qty: 8, hoursPerDay: 8 }),
];
const hq = Q.buildQuote(home);
const st = hq.tiers.standard;
check("the stated load is a minimum — design load is 25% above it",
  hq.designPeakWatts === Math.round(hq.peakWatts * 1.25), `${hq.designPeakWatts} vs ${hq.peakWatts}`);
check("the inverter is never loaded above 80% of its rating",
  hq.designPeakWatts <= st.inverterKva * 1000 * 0.8, `${hq.designPeakWatts}W on ${st.inverterKva}kVA`);
const installLine = st.bom.find((l) => l.key === "installation");
check("installation is listed but excluded from the total",
  installLine && installLine.group === "excluded" && installLine.lineCost.best === 0);
const sumIncluded = st.bom.filter((l) => l.group !== "excluded").reduce((n, l) => n + l.lineCost.best, 0);
check("the total is exactly the sum of the priced lines", Math.abs(sumIncluded - st.total.best) <= 1, `${sumIncluded} vs ${st.total.best}`);
check("installer labour is shown as a reference range only", st.labourRef.best > 0);
for (const key of ["pv_combiner", "battery_protection", "ac_protection", "changeover", "earthing", "extinguisher"]) {
  check(`BOM carries a ${key} line`, st.bom.some((l) => l.key === key));
}
check("a contingency line is priced", st.contingency.best > 0 && st.bom.some((l) => l.key === "contingency"));
check("panels come in pairs", st.panelCount % 2 === 0, `${st.panelCount}`);

group("grid supply drives storage");
const good = Q.buildQuote(home, {}, "good").tiers.standard;
const none = Q.buildQuote(home, {}, "none").tiers.standard;
check("an off-grid home gets more battery than a Band-A home", none.batteryKwh > good.batteryKwh, `${none.batteryKwh} vs ${good.batteryKwh}`);
check("an off-grid home gets more panels than a Band-A home", none.panelCount > good.panelCount, `${none.panelCount} vs ${good.panelCount}`);
check("the default grid keeps the code of the appliance list alone", Q.buildQuote(home, {}, "some").code === hq.code);
check("a different grid answer gives a different code", Q.buildQuote(home, {}, "none").code !== hq.code);
check("parseGrid rejects junk", Q.parseGrid("lots") === "some" && Q.parseGrid("none") === "none");
check("the share link carries a non-default grid", Q.quoteUrl(Q.buildQuote(home, {}, "poor"), "standard", "https://x").includes("grid=poor"));

// Sourcing fee: third-party equipment and BOS carry it; installation does not.
const P = require(path.join(outDir, "prices.js"));
const panelLine = st.bom.find((l) => l.key === "panels");
check("panel unit price carries the sourcing fee",
  panelLine && panelLine.unitCost.best === P.withSourcingMargin(P.PANEL_PER_WP.best * P.PANEL_WATTS),
  panelLine && `${panelLine.unitCost.best}`);
check("installation is not marked up", installLine.unitCost.best === 0 || installLine.group === "excluded");

// ─────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("Quote engine behaves as designed.");
