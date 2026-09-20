#!/usr/bin/env node
/**
 * Regenerate/verify HEADLINE_PACKAGES in lib/prices.ts.
 *
 * HEADLINE_PACKAGES is hand-maintained marketing copy ("5kVA · 10kWh lithium:
 * ₦3.2m–₦4.8m"), but its ranges must track the real quote engine — if the
 * catalogue moves and the headline doesn't, the SEO pages lie. This script
 * rebuilds the ranges by running buildQuote() over typical load profiles for
 * each headline package and compares against what's committed.
 *
 *   node scripts/check-headline-prices.mjs          # verify (exit 1 on drift)
 *   node scripts/check-headline-prices.mjs --write  # print the replacement block
 *
 * Like scripts/partner-routing.test.mjs, it compiles lib/ on its own with tsc
 * — quote.ts and prices.ts import nothing, so that is enough.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(path.join(tmpdir(), "sb-prices-"));

execFileSync(
  "npx",
  [
    "tsc",
    "lib/prices.ts",
    "lib/quote.ts",
    "--outDir",
    outDir,
    "--module",
    "commonjs",
    "--target",
    "es2022",
    "--skipLibCheck",
  ],
  { cwd: APP_DIR, stdio: "inherit" },
);

const require = createRequire(import.meta.url);
const { buildQuote } = require(path.join(outDir, "quote.js"));
const { HEADLINE_PACKAGES } = require(path.join(outDir, "prices.js"));

const r50k = (n) => Math.round(n / 50_000) * 50_000;

/**
 * Typical load profiles behind each headline. Deliberately simple: a headline
 * is a "what does this class of system cost" claim, not a sizing tool.
 */
const PROFILES = {
  "1.5–2.5kVA · 5kWh lithium": [
    { id: "lights", name: "LED lights", watts: 40, qty: 6, hoursPerDay: 5 },
    { id: "fan", name: "Standing fan", watts: 75, qty: 2, hoursPerDay: 6 },
    { id: "tv", name: "TV", watts: 100, qty: 1, hoursPerDay: 5 },
    { id: "fridge", name: "Fridge", watts: 150, qty: 1, hoursPerDay: 8 },
  ],
  "3.5kVA · 5kWh lithium": [
    { id: "lights", name: "LED lights", watts: 40, qty: 8, hoursPerDay: 5 },
    { id: "fan", name: "Standing fan", watts: 75, qty: 2, hoursPerDay: 6 },
    { id: "tv", name: "TV", watts: 100, qty: 1, hoursPerDay: 5 },
    { id: "fridge", name: "Fridge", watts: 150, qty: 1, hoursPerDay: 8 },
    { id: "ac-small", name: "1HP AC", watts: 750, qty: 1, hoursPerDay: 4 },
  ],
  "5kVA · 10kWh lithium": [
    { id: "lights", name: "LED lights", watts: 40, qty: 10, hoursPerDay: 5 },
    { id: "fan", name: "Standing fan", watts: 75, qty: 3, hoursPerDay: 6 },
    { id: "tv", name: "TV", watts: 100, qty: 2, hoursPerDay: 5 },
    { id: "fridge", name: "Fridge", watts: 150, qty: 1, hoursPerDay: 8 },
    { id: "freezer", name: "Chest freezer", watts: 200, qty: 1, hoursPerDay: 8 },
    { id: "ac-1hp", name: "1HP AC", watts: 750, qty: 1, hoursPerDay: 6 },
    { id: "pump", name: "Water pump", watts: 750, qty: 1, hoursPerDay: 1 },
  ],
  "8–10kVA · 15kWh lithium": [
    { id: "lights", name: "LED lights", watts: 40, qty: 14, hoursPerDay: 5 },
    { id: "fan", name: "Standing fan", watts: 75, qty: 4, hoursPerDay: 6 },
    { id: "tv", name: "TV", watts: 100, qty: 2, hoursPerDay: 5 },
    { id: "fridge", name: "Fridge", watts: 150, qty: 2, hoursPerDay: 8 },
    { id: "ac-1hp", name: "1.5HP AC", watts: 1100, qty: 2, hoursPerDay: 6 },
    { id: "pump", name: "Water pump", watts: 750, qty: 1, hoursPerDay: 1 },
    { id: "microwave", name: "Microwave", watts: 1200, qty: 1, hoursPerDay: 0.5 },
  ],
  "15–20kVA · 20–30kWh": [
    { id: "lights", name: "LED lights", watts: 40, qty: 25, hoursPerDay: 6 },
    { id: "ac-1hp", name: "1.5HP AC", watts: 1100, qty: 4, hoursPerDay: 6 },
    { id: "fridge", name: "Fridge", watts: 150, qty: 2, hoursPerDay: 8 },
    { id: "freezer", name: "Chest freezer", watts: 200, qty: 2, hoursPerDay: 8 },
    { id: "pump", name: "Water pump", watts: 750, qty: 2, hoursPerDay: 2 },
    { id: "office", name: "Office PCs", watts: 200, qty: 8, hoursPerDay: 8 },
  ],
};

const fmt = (n) => "₦" + n.toLocaleString("en-NG");

let drift = 0;
const lines = [];

for (const headline of HEADLINE_PACKAGES) {
  const profile = PROFILES[headline.label];
  if (!profile) {
    console.error(`✗ no load profile defined for "${headline.label}" — add one to PROFILES`);
    drift += 1;
    continue;
  }

  // The standard tier is what the headline describes (lithium defaults).
  const quote = buildQuote(profile);
  const total = quote.tiers.standard.total;

  const low = r50k(total.low);
  const high = r50k(total.high);
  const matches = low === headline.low && high === headline.high;
  const status = matches ? "✓" : "✗";
  if (!matches) drift += 1;
  console.log(
    `${status} ${headline.label}: engine says ${fmt(low)}–${fmt(high)}, committed ${fmt(headline.low)}–${fmt(headline.high)}`,
  );
  lines.push(
    `  { label: "${headline.label}", powers: "${headline.powers}", low: ${low.toLocaleString("en-NG").replace(/,/g, "_")}, high: ${high.toLocaleString("en-NG").replace(/,/g, "_")} },`,
  );
}

if (process.argv.includes("--write")) {
  console.log("\n// Replacement block for HEADLINE_PACKAGES in lib/prices.ts:\n");
  console.log("export const HEADLINE_PACKAGES = [");
  for (const l of lines) console.log(l);
  console.log("] as const;");
}

if (drift > 0) {
  console.error(`\n${drift} headline package(s) drifted from the quote engine.`);
  console.error("Update lib/prices.ts (HEADLINE_PACKAGES) — run with --write to see the new block.");
  process.exit(1);
}
console.log("\nAll headline packages match the quote engine.");
