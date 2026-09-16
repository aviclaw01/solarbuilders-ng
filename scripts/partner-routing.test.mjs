#!/usr/bin/env node
/**
 * Unit test for the job-routing engine (lib/routing.ts).
 *
 * There is no test framework in this repo, and adding one to check one pure
 * module would be the tail wagging the dog. Instead this compiles the module on
 * its own with `tsc` and exercises it directly — which works precisely because
 * lib/routing.ts imports nothing.
 *
 *   node scripts/partner-routing.test.mjs
 *
 * It is the routing decision that decides who gets our customers' jobs and who
 * is blocked for unpaid commission, so it is the one part of the partner
 * pipeline that absolutely must not be wrong quietly.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = mkdtempSync(path.join(tmpdir(), "sb-routing-"));

execFileSync(
  "npx",
  [
    "tsc",
    "lib/routing.ts",
    "lib/partners.ts",
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
const R = require(path.join(outDir, "routing.js"));
const P = require(path.join(outDir, "partners.js"));

// ── tiny harness ────────────────────────────────────────────────────────────
let passed = 0;
const failures = [];

function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failures.push({ name, message: err.message });
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function eq(actual, expected, label = "") {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${label}expected ${b}, got ${a}`);
}

function ok(value, label = "expected truthy") {
  if (!value) throw new Error(label);
}

/** A deliberately well-behaved Lagos installer. Individual tests break one thing. */
function partner(overrides = {}) {
  return {
    id: 1,
    name: "Alpha Solar",
    city: "Lekki",
    state: "Lagos",
    coverageStates: ["Lagos"],
    coverageCities: ["Lekki", "Ikoyi"],
    services: ["full_install"],
    systemSizes: ["3–5kVA"],
    availability: "available",
    jobsPerMonthCap: 4,
    openJobs: 0,
    completedJobs: 0,
    hasDueCommission: false,
    commissionOverdueDays: null,
    availabilityConfirmedAt: new Date(NOW.getTime() - 2 * 86_400_000).toISOString(),
    ...overrides,
  };
}

const NOW = new Date("2026-09-16T09:00:00Z");
const request = (overrides = {}) => ({
  state: "Lagos",
  city: "Lekki",
  services: ["full_install"],
  systemSize: "3–5kVA",
  needsInstall: true,
  now: NOW,
  ...overrides,
});

console.log("lib/routing.ts — routing engine\n");

// ── 1. the happy path ──────────────────────────────────────────────────────
console.log("eligibility");
check("a covered, available, cleared partner is eligible", () => {
  const v = R.scorePartner(partner(), request());
  ok(v.eligible, `blockers: ${v.blockers.join("; ")}`);
  ok(v.score > 50, `score too low: ${v.score}`);
  ok(v.reasons.some((r) => r.includes("Covers Lagos")), "no coverage reason");
  ok(v.reasons.some((r) => r.includes("Lekki")), "no city reason");
});

check("state not covered is a hard blocker (L15)", () => {
  const v = R.scorePartner(partner({ coverageStates: ["Lagos"], state: "Lagos" }), request({ state: "Kano", city: "Kano" }));
  ok(!v.eligible, "should not be eligible");
  eq(v.score, 0, "ineligible partners must not score: ");
  ok(v.blockers.some((b) => b.includes("Does not cover Kano")), v.blockers.join("; "));
});

check("base state counts as coverage even if coverageStates is empty", () => {
  const v = R.scorePartner(partner({ coverageStates: [] }), request());
  ok(v.eligible, v.blockers.join("; "));
});

check("a missing service blocks the job", () => {
  const v = R.scorePartner(partner({ services: ["repair"] }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("Missing service: full_install")), v.blockers.join("; "));
});

check("a size they do not declare blocks the job", () => {
  const v = R.scorePartner(partner({ systemSizes: ["10kVA+"] }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("Does not declare 3–5kVA")), v.blockers.join("; "));
});

check("size is not checked when the request does not state one", () => {
  const v = R.scorePartner(partner({ systemSizes: [] }), request({ systemSize: null }));
  ok(v.eligible, v.blockers.join("; "));
});

check("paused partners never get work", () => {
  const v = R.scorePartner(partner({ availability: "paused" }), request());
  ok(!v.eligible);
  ok(v.blockers.includes("Availability is paused"));
});

check("busy partners are not offered work", () => {
  const v = R.scorePartner(partner({ availability: "busy" }), request());
  ok(!v.eligible);
});

check("an unknown availability string fails closed", () => {
  const v = R.scorePartner(partner({ availability: "whatever" }), request());
  ok(!v.eligible);
});

// ── 2. the commission gate (L5) — the reason manual payment works at all ───
console.log("\ncommission gate");
check("any unpaid commission blocks new work", () => {
  const v = R.scorePartner(partner({ hasDueCommission: true, commissionOverdueDays: 2 }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("not settled")), v.blockers.join("; "));
});

check("14 days overdue is stated as paused", () => {
  const v = R.scorePartner(partner({ hasDueCommission: true, commissionOverdueDays: 14 }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("paused until paid")), v.blockers.join("; "));
});

check("30 days overdue is stated as suspended", () => {
  const v = R.scorePartner(partner({ hasDueCommission: true, commissionOverdueDays: 41 }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("suspended pending settlement")), v.blockers.join("; "));
  ok(v.blockers.some((b) => b.includes("41 days")), "should name the age");
});

check("a cleared partner is offered work again", () => {
  const v = R.scorePartner(partner({ hasDueCommission: false, commissionOverdueDays: null }), request());
  ok(v.eligible, v.blockers.join("; "));
});

// ── 3. capacity and freshness (L10) ────────────────────────────────────────
console.log("\ncapacity and availability freshness");
check("a partner at their declared cap is skipped", () => {
  const v = R.scorePartner(partner({ jobsPerMonthCap: 2, openJobs: 2 }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("At capacity (2/2 open)")), v.blockers.join("; "));
});

check("free capacity raises the score", () => {
  const tight = R.scorePartner(partner({ jobsPerMonthCap: 2, openJobs: 1 }), request());
  const loose = R.scorePartner(partner({ jobsPerMonthCap: 6, openJobs: 0 }), request());
  ok(loose.score > tight.score, `expected ${loose.score} > ${tight.score}`);
});

check("a partner who never confirmed availability is not offered work", () => {
  const v = R.scorePartner(partner({ availabilityConfirmedAt: null }), request());
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("Never confirmed")), v.blockers.join("; "));
});

check("a stale confirmation (15 days) blocks the offer", () => {
  const v = R.scorePartner(
    partner({ availabilityConfirmedAt: new Date(NOW.getTime() - 15 * 86_400_000).toISOString() }),
    request(),
  );
  ok(!v.eligible);
  ok(v.blockers.some((b) => b.includes("not confirmed for 15 days")), v.blockers.join("; "));
});

check("a confirmation exactly at the 14-day boundary still counts", () => {
  const v = R.scorePartner(
    partner({ availabilityConfirmedAt: new Date(NOW.getTime() - 14 * 86_400_000).toISOString() }),
    request(),
  );
  ok(v.eligible, v.blockers.join("; "));
});

// ── 4. ranking ─────────────────────────────────────────────────────────────
console.log("\nranking");
check("eligible partners rank above ineligible ones", () => {
  const ranked = R.rankPartners(
    [partner({ id: 1, name: "Zeta", availability: "paused" }), partner({ id: 2, name: "Beta" })],
    request(),
  );
  eq(ranked.map((r) => r.name), ["Beta", "Zeta"]);
  eq(ranked.map((r) => r.eligible), [true, false]);
});

check("the better-placed partner wins", () => {
  const ranked = R.rankPartners(
    [
      // Based in Ibadan, and honest about only covering Ibadan — it will travel
      // to Lagos for this job but it is not based there.
      partner({ id: 1, name: "Ibadan Based", city: "Ibadan", coverageStates: ["Lagos", "Oyo"], coverageCities: ["Ibadan"] }),
      partner({ id: 2, name: "Lekki Based", city: "Lekki" }),
    ],
    request(),
  );
  eq(ranked[0].name, "Lekki Based", "city match should outrank state-only coverage: ");
});

check("a partner that covers the customer's town gets the city bonus even if based elsewhere", () => {
  const travelling = R.scorePartner(
    partner({ city: "Ibadan", coverageStates: ["Oyo", "Lagos"], coverageCities: ["Lekki"] }),
    request(),
  );
  const stateOnly = R.scorePartner(
    partner({ city: "Ibadan", coverageStates: ["Oyo", "Lagos"], coverageCities: ["Ibadan"] }),
    request(),
  );
  ok(travelling.score > stateOnly.score, `${travelling.score} should beat ${stateOnly.score}`);
});

check("experience with us counts, and is capped", () => {
  const fresh = R.scorePartner(partner({ completedJobs: 0 }), request());
  const proven = R.scorePartner(partner({ completedJobs: 5 }), request());
  const veteran = R.scorePartner(partner({ completedJobs: 50 }), request());
  ok(proven.score > fresh.score, "experience should raise the score");
  eq(veteran.score, R.scorePartner(partner({ completedJobs: 10 }), request()).score, "experience cap: ");
});

check("equal partners are ordered alphabetically, not randomly", () => {
  const a = partner({ id: 3, name: "Aardvark" });
  const b = partner({ id: 4, name: "Bumblebee" });
  eq(R.rankPartners([b, a], request()).map((r) => r.name), ["Aardvark", "Bumblebee"]);
  eq(R.rankPartners([a, b], request()).map((r) => r.name), ["Aardvark", "Bumblebee"]);
});

check("malformed capability data fails closed rather than open", () => {
  const v = R.scorePartner(
    partner({ coverageStates: undefined, services: undefined, systemSizes: undefined }),
    request(),
  );
  // state still matches via `partner.state`, but the missing services array must block it.
  ok(!v.eligible, "missing arrays should not produce an eligible partner");
  ok(v.blockers.some((b) => b.includes("Missing service")), v.blockers.join("; "));
});

// ── 5. offers and the commission clock (L5, L9) ────────────────────────────
console.log("\noffers and commission");
check("an offer made now expires 24 hours later", () => {
  const expiry = R.offerExpiry(NOW);
  eq(expiry.toISOString(), "2026-09-17T09:00:00.000Z");
  eq(R.OFFER_WINDOW_HOURS, 24);
});

check("expiry is judged on the server clock, and missing dates read as expired", () => {
  eq(R.isOfferExpired("2026-09-16T08:59:59Z", NOW), true);
  eq(R.isOfferExpired("2026-09-16T09:00:01Z", NOW), false);
  eq(R.isOfferExpired(null, NOW), true);
  eq(R.isOfferExpired("not a date", NOW), true);
});

check("a receipt-uploaded commission becomes overdue once its window passes", () => {
  eq(R.commissionStatusFor("2026-09-23T09:00:00Z", NOW, "receipt_uploaded"), "receipt_uploaded");
  eq(R.commissionStatusFor("2026-09-10T09:00:00Z", NOW, "receipt_uploaded"), "overdue");
});

check("a settled commission never drifts back to overdue", () => {
  eq(R.commissionStatusFor("2026-09-10T09:00:00Z", NOW, "confirmed"), "confirmed");
  eq(R.commissionStatusFor("2026-09-10T09:00:00Z", NOW, "waived"), "waived");
  eq(R.commissionStatusFor(null, NOW, "none"), "none");
});

check("a fresh due date reads as due, not overdue", () => {
  eq(R.commissionStatusFor("2026-09-20T09:00:00Z", NOW, "due"), "due");
  eq(R.commissionStatusFor(null, NOW, "due"), "due");
});

check("commission is our number, on our basis (L6)", () => {
  eq(R.commissionAmount({ budgetBest: 4_000_000, ratePercent: 5 }), 200_000);
  eq(R.commissionAmount({ budgetBest: 4_000_000, installFee: 250_000, ratePercent: 10 }), 425_000);
  eq(R.commissionAmount({ budgetBest: null, ratePercent: 5 }), 0);
  eq(R.commissionAmount({ budgetBest: -5_000_000, ratePercent: 5 }), 0, "negative base: ");
});

check("an absurd rate is clamped instead of trusted", () => {
  eq(R.commissionAmount({ budgetBest: 1_000_000, ratePercent: 900 }), 250_000);
  eq(R.commissionAmount({ budgetBest: 1_000_000, ratePercent: -20 }), 0);
  eq(R.commissionAmount({ budgetBest: 1_000_000, ratePercent: NaN }), 0);
});

check("invoice references are deterministic and printable (L13)", () => {
  eq(R.invoiceRef("SB-JOB-K3F9A2"), "SB-INV-K3F9A2");
  eq(R.invoiceRef("ODD"), "SB-INV-ODD");
});

check("the two commission bands agree (drift guard)", () => {
  // lib/partners.ts clamps what the admin can type; lib/routing.ts clamps what we
  // compute. If those two ever disagree, a rate the reviewer sets is silently
  // changed when the commission is worked out.
  eq(P.MIN_COMMISSION_RATE, R.MIN_COMMISSION_RATE, "MIN_COMMISSION_RATE: ");
  eq(P.MAX_COMMISSION_RATE, R.MAX_COMMISSION_RATE, "MAX_COMMISSION_RATE: ");
});

check("commissionRateOf clamps a stored rate into the band", () => {
  eq(P.commissionRateOf({ commission_rate: 500 }), 25);
  eq(P.commissionRateOf({ commission_rate: -4 }), 0);
  eq(P.commissionRateOf({ commission_rate: "7.5" }), 7.5);
  eq(P.commissionRateOf({ commission_rate: null }), P.DEFAULT_COMMISSION_RATE);
  eq(P.commissionRateOf({ commission_rate: "nonsense" }), P.DEFAULT_COMMISSION_RATE);
});

// ── 6. reading a customer's free-text location (L15) ───────────────────────
console.log("\nreading a customer request");
check("town names resolve to the right state", () => {
  eq(R.guessState("Lekki, Lagos"), "Lagos");
  eq(R.guessState("Kado, FCT (Abuja)"), "FCT (Abuja)");
  eq(R.guessState("Port Harcourt, Rivers"), "Rivers");
  eq(R.guessState("Ibadan, Oyo State"), "Oyo");
  eq(R.guessState("PH"), "Rivers");
});

check("an unplaceable location returns null instead of a guess", () => {
  eq(R.guessState("Nowhere in particular"), null);
  eq(R.guessState(""), null);
  eq(R.guessState(null), null);
});

check("the city part is the first comma segment", () => {
  eq(R.guessCity("Lekki, Lagos"), "Lekki");
  eq(R.guessCity("Gbagada, Lagos"), "Gbagada");
  eq(R.guessCity(null), null);
});

check("size buckets come from the quote summary", () => {
  eq(R.sizeBucketFromText("Standard · 3.5kVA · 10.24kWh"), "3–5kVA");
  eq(R.sizeBucketFromText("2kVA starter"), "1–2kVA");
  eq(R.sizeBucketFromText("16kVA 3-phase"), "10kVA+");
  eq(R.sizeBucketFromText("no size mentioned"), null);
});

// ── report ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.name}: ${f.message}`);
  process.exit(1);
}
console.log("Routing engine behaves as designed.");