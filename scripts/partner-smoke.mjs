#!/usr/bin/env node
/**
 * Smoke test for the verified-partner programme, against a RUNNING site.
 *
 *   node scripts/partner-smoke.mjs [--write] [--base=http://localhost:3000]
 *
 * Talks to the network: it sends HTTP requests to --base (default
 * http://localhost:3000). Point it at a local `next dev` / `next start`, not at
 * production, unless you mean it.
 *
 * Read-only by default. It checks that:
 *   - /admin/partners and /admin/routing refuse anonymous requests (401), refuse
 *     the plain admin login (403), and open for the superadmin (200) — or answer
 *     503 when the superadmin credential is not configured;
 *   - /api/partner-apply and /api/partner-status are closed (503) when
 *     PARTNER_APPLICATIONS_OPEN is off, and validate / swallow honeypots when on.
 *
 * `--write` additionally submits a TEST application through POST
 * /api/partner-apply and looks it up via /api/partner-status. That INSERTS A ROW
 * into Supabase and SENDS REAL EMAILS (to SMOKE_EMAIL and the team inbox), so it
 * is opt-in and requires SMOKE_EMAIL to be set explicitly.
 *
 * Credentials come only from the environment of the shell running the script
 * (ADMIN_USER / ADMIN_PASSWORD / ADMIN_SUPER_USER / ADMIN_SUPER_PASSWORD). It
 * never reads .env files and never prints a password.
 */

import { Buffer } from "node:buffer";

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const baseArg = args.find((a) => a.startsWith("--base="));
const BASE = (baseArg ? baseArg.slice(7) : process.env.SMOKE_BASE || "http://localhost:3000").replace(/\/$/, "");

const { ADMIN_USER, ADMIN_PASSWORD, ADMIN_SUPER_USER, ADMIN_SUPER_PASSWORD, SMOKE_EMAIL } = process.env;

let passed = 0;
const failures = [];
const notes = [];

function record(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push({ name, detail });
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function basic(user, password) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

async function get(pathname, headers = {}) {
  const res = await fetch(`${BASE}${pathname}`, { headers, redirect: "manual" });
  return { status: res.status, body: await res.text() };
}

async function postJson(pathname, payload) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, json, text };
}

async function step(name, fn) {
  try {
    await fn();
  } catch (err) {
    record(name, false, err.message);
  }
}

console.log(`SolarBuilders partner smoke test → ${BASE}\n`);

// ── 1. access control ───────────────────────────────────────────────────────
console.log("access control");
const superConfigured = Boolean(ADMIN_SUPER_USER && ADMIN_SUPER_PASSWORD);
for (const path of ["/admin/partners", "/admin/routing", "/admin/%70artners"]) {
  await step(`GET ${path} anonymous`, async () => {
    const anon = await get(path);
    record(`GET ${path} without credentials → 401`, anon.status === 401, `status ${anon.status}`);
  });

  if (ADMIN_USER && ADMIN_PASSWORD) {
    await step(`GET ${path} as admin`, async () => {
      const asAdmin = await get(path, { Authorization: basic(ADMIN_USER, ADMIN_PASSWORD) });
      const expected = superConfigured ? 403 : 503;
      record(`GET ${path} as plain admin → ${expected}`, asAdmin.status === expected, `status ${asAdmin.status}`);
    });
  } else {
    notes.push(`${path}: plain-admin check skipped (ADMIN_USER / ADMIN_PASSWORD not exported).`);
  }

  if (superConfigured && !path.includes("%")) {
    await step(`GET ${path} as superadmin`, async () => {
      const asSuper = await get(path, { Authorization: basic(ADMIN_SUPER_USER, ADMIN_SUPER_PASSWORD) });
      record(`GET ${path} as superadmin → 200`, asSuper.status === 200, `status ${asSuper.status}`);
    });
  }
}

// ── 2. public API ───────────────────────────────────────────────────────────
console.log("\npublic partner API");
let applicationsOpen = false;
await step("POST /api/partner-apply empty form", async () => {
  const bad = await postJson("/api/partner-apply", { kind: "installer" });
  if (bad.status === 503) {
    notes.push("Partner endpoints are closed (PARTNER_APPLICATIONS_OPEN is not 1 on the target). Skipping the rest.");
    record("POST /api/partner-apply is closed → 503", true);
    return;
  }
  applicationsOpen = true;
  record(
    "POST /api/partner-apply with an incomplete form → 400 + field list",
    bad.status === 400 && Array.isArray(bad.json?.fields) && bad.json.fields.length > 0,
    `status ${bad.status}, body ${bad.text.slice(0, 120)}`,
  );
});

const testPayload = (email) => ({
  kind: "installer",
  businessName: "TEST — pipeline check (delete me)",
  contactName: "Smoke test",
  email,
  whatsapp: "+234 800 000 0000",
  city: "Gbagada",
  state: "Lagos",
  yearsInBusiness: 5,
  services: ["full_install"],
  systemSizes: ["3–5kVA"],
  coverageStates: ["Lagos"],
  coverageCities: ["Gbagada"],
  cacNumber: "RC-TEST-000123",
  installs: [1, 2, 3].map((n) => ({
    site: `Test install ${n}`,
    city: "Lagos",
    size: "3–5kVA",
    year: "2025",
    photoUrl: `https://example.com/test-install-${n}.jpg`,
  })),
  refs: [1, 2].map((n) => ({ name: `Test reference ${n}`, phone: `+23480000000${n}`, project: "test" })),
  warrantyMonths: 12,
  warrantyTerms: "Test warranty terms.",
  agreeVerification: true,
  agreeCommission: true,
  agreeNonCircumvention: true,
  agreeData: true,
  note: "Automated smoke-test submission. Safe to reject.",
});

if (applicationsOpen) {
  await step("honeypot", async () => {
    const bot = await postJson("/api/partner-apply", { ...testPayload("bot@example.com"), hp: "robot" });
    record(
      "honeypot submission is swallowed silently",
      bot.status === 200 && bot.json?.ok === true && bot.json?.stored === false,
      `status ${bot.status}`,
    );
  });

  await step("status lookup miss", async () => {
    const miss = await postJson("/api/partner-status", { ref: "SB-PTR-ZZZZZZ", email: "nobody@example.com" });
    record("unknown ref/email → 404 with no data", miss.status === 404 && !miss.json?.data, `status ${miss.status}`);
  });

  if (WRITE && SMOKE_EMAIL) {
    await step("write", async () => {
      const res = await postJson("/api/partner-apply", testPayload(SMOKE_EMAIL));
      const ref = res.json?.ref ?? null;
      record(
        "complete application → 200 + reference",
        res.status === 200 && res.json?.ok === true && (res.json?.duplicate || /^SB-PTR-/.test(ref || "")),
        `status ${res.status}, body ${res.text.slice(0, 200)}`,
      );
      if (res.json?.duplicate) notes.push("An open TEST application already exists for SMOKE_EMAIL; no new row.");
      if (ref) {
        const lookup = await postJson("/api/partner-status", { ref, email: SMOKE_EMAIL });
        record(`status lookup finds ${ref}`, lookup.status === 200 && lookup.json?.data?.ref === ref, `status ${lookup.status}`);
        const wrong = await postJson("/api/partner-status", { ref, email: "nobody@example.com" });
        record("right ref, wrong email → 404", wrong.status === 404, `status ${wrong.status}`);
        notes.push(`A TEST application ${ref} now exists. Reject it on /admin/partners.`);
      }
    });
  } else if (WRITE) {
    notes.push("--write needs SMOKE_EMAIL set explicitly; skipped the live submission.");
  } else {
    notes.push("Skipped the live submission. Re-run with --write and SMOKE_EMAIL to test it end to end.");
  }
}

// ── report ─────────────────────────────────────────────────────────────────
console.log(`\n${passed} passed, ${failures.length} failed`);
if (notes.length) {
  console.log("\nNotes:");
  for (const n of notes) console.log(`  · ${n}`);
}
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("Partner smoke test passed.");
