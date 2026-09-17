#!/usr/bin/env node
/**
 * Smoke test for the verified-partner pipeline.
 *
 *   node scripts/partner-smoke.mjs [--write] [--base=http://localhost:3000]
 *
 * Read-only by default: it checks that every new surface renders and that the
 * private ones are actually private. `--write` additionally submits a real
 * application through POST /api/partner-apply and looks it up again on
 * /partners/status — which inserts a row and sends two real emails, so it is
 * opt-in and the row is clearly labelled TEST.
 *
 * Credentials for the authenticated checks come from app/.env.local
 * (ADMIN_USER / ADMIN_PASSWORD / optional ADMIN_SUPER_*). Nothing here prints a
 * password.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const WRITE = args.includes("--write");
const baseArg = args.find((a) => a.startsWith("--base="));
const BASE = (baseArg ? baseArg.slice(7) : process.env.SMOKE_BASE || "http://localhost:3000").replace(/\/$/, "");

/** Minimal .env.local reader — the smoke script is dev-only tooling. */
function loadEnv() {
  const out = {};
  for (const file of [".env.local", ".env"]) {
    try {
      const text = readFileSync(path.join(APP_DIR, file), "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {
      /* file may not exist */
    }
  }
  return out;
}

const env = loadEnv();
const ADMIN_USER = process.env.ADMIN_USER || env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || env.ADMIN_PASSWORD;
const SUPER_USER = process.env.ADMIN_SUPER_USER || env.ADMIN_SUPER_USER;
const SUPER_PASSWORD = process.env.ADMIN_SUPER_PASSWORD || env.ADMIN_SUPER_PASSWORD;

let passed = 0;
const failures = [];
const notes = [];

function record(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push({ name, detail });
    console.log(`   ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

function basic(user, password) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

async function get(pathname, headers = {}) {
  const res = await fetch(`${BASE}${pathname}`, { headers, redirect: "manual" });
  const body = await res.text();
  return { status: res.status, location: res.headers.get("location"), body };
}

async function postJson(pathname, payload) {
  const res = await fetch(`${BASE}${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  let json = null;
  const text = await res.text();
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, json, text };
}

const lower = (s) => (s || "").toLowerCase();
/** Every one of these must appear somewhere in the HTML. */
function expectAll(body, needles) {
  return needles.filter((n) => !lower(body).includes(lower(n)));
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. PUBLIC SURFACES
// ────────────────────────────────────────────────────────────────────────────

const PAGES = [
  { path: "/", must: ["SolarBuilders"] },
  { path: "/partners", must: ["partner"] },
  { path: "/partners/status", must: ["reference"] },
  { path: "/for-builders", must: ["CAC"] },
  { path: "/verified", must: ["vet"] },
  { path: "/changelog", must: ["commission"] },
  { path: "/sitemap.xml", must: ["/partners", "/changelog"] },
];

console.log(`SolarBuilders smoke test → ${BASE}\n`);
console.log("public pages");
for (const page of PAGES) {
  try {
    const { status, body } = await get(page.path);
    const missing = expectAll(body, page.must);
    record(
      `GET ${page.path} → 200`,
      status === 200 && missing.length === 0,
      status !== 200 ? `status ${status}` : `missing from HTML: ${missing.join(", ")}`,
    );
  } catch (err) {
    record(`GET ${page.path} → 200`, false, err.message);
  }
}

try {
  const { status } = await get("/partners/definitely-not-a-partner-9x8y7z");
  record("GET /partners/<unknown> → 404", status === 404, `status ${status}`);
} catch (err) {
  record("GET /partners/<unknown> → 404", false, err.message);
}

// ────────────────────────────────────────────────────────────────────────────
// 2. THE ADMIN AREA MUST BE CLOSED
// ─────────────────────────────────────────────────────────────────────────────

console.log("\naccess control");
for (const path of ["/admin/partners", "/admin/routing"]) {
  try {
    const anon = await get(path);
    record(`GET ${path} without credentials → 401`, anon.status === 401, `status ${anon.status}`);
  } catch (err) {
    record(`GET ${path} without credentials → 401`, false, err.message);
  }

  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    notes.push(`${path}: skipped the authenticated check — ADMIN_USER/ADMIN_PASSWORD not found in .env.local`);
    continue;
  }

  try {
    const asAdmin = await get(path, { Authorization: basic(ADMIN_USER, ADMIN_PASSWORD) });
    const superConfigured = Boolean(SUPER_USER && SUPER_PASSWORD);
    if (superConfigured) {
      record(
        `GET ${path} as plain admin → 403 (superadmin tier required)`,
        asAdmin.status === 403,
        `status ${asAdmin.status}`,
      );
      const asSuper = await get(path, { Authorization: basic(SUPER_USER, SUPER_PASSWORD) });
      record(`GET ${path} as superadmin → 200`, asSuper.status === 200, `status ${asSuper.status}`);
    } else {
      record(
        `GET ${path} as admin → 200 (super tier not configured)`,
        asAdmin.status === 200,
        `status ${asAdmin.status}`,
      );
      notes.push(
        `${path}: ADMIN_SUPER_USER/ADMIN_SUPER_PASSWORD are not set, so the single admin credential opens it. Set them in Vercel to require a senior login for approvals.`,
      );
    }
  } catch (err) {
    record(`GET ${path} authenticated`, false, err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. THE PARTNER PORTAL DOOR (L12)
// ────────────────────────────────────────────────────────────────────────────

console.log("\npartner portal");
try {
  const bad = await get("/partner/login?t=definitely-not-a-real-token");
  record(
    "GET /partner/login with a dead token → redirected to /partner?error=link",
    bad.status === 303 && (bad.location || "").includes("error=link"),
    `status ${bad.status}, location ${bad.location ?? "—"}`,
  );
} catch (err) {
  record("GET /partner/login with a dead token", false, err.message);
}

try {
  const bare = await get("/partner");
  // Without a session the page must explain the private link, not show data.
  record(
    "GET /partner without a session → 200 and no partner data",
    bare.status === 200 && lower(bare.body).includes("link"),
    `status ${bare.status}`,
  );
} catch (err) {
  record("GET /partner without a session", false, err.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. THE APPLY API
// ─────────────────────────────────────────────────────────────────────────────

console.log("\napply api");
const validPayload = {
  kind: "installer",
  businessName: "TEST — Pipeline check (delete me)",
  contactName: "Avi (test submission)",
  email: process.env.SMOKE_EMAIL || "solar@nexprove.com",
  whatsapp: "+2349168394923",
  city: "Gbagada",
  state: "Lagos",
  yearsInBusiness: 5,
  services: ["full_install"],
  systemSizes: ["3–5kVA"],
  coverageStates: ["Lagos"],
  coverageCities: ["Gbagada", "Yaba"],
  cacNumber: "RC-TEST-000123",
  cacDocUrl: "https://example.com/cac-test.pdf",
  installs: [1, 2, 3].map((n) => ({
    site: `Test install ${n}`,
    city: "Lagos",
    size: "3–5kVA",
    year: "2025",
    photoUrl: `https://example.com/test-install-${n}.jpg`,
  })),
  refs: [1, 2].map((n) => ({
    name: `Test reference ${n}`,
    phone: "+234803000000" + n,
    project: `3.5kVA hybrid, test ${n}`,
  })),
  warrantyMonths: 12,
  warrantyTerms: "Workmanship warrantied for 12 months from commissioning, in writing.",
  agreeVerification: true,
  agreeCommission: true,
  agreeNonCircumvention: true,
  agreeData: true,
  note: "Automated smoke-test submission. Safe to reject or delete.",
};

try {
  const bad = await postJson("/api/partner-apply", { kind: "installer" });
  record(
    "POST /api/partner-apply with an empty form → 400 + field list",
    bad.status === 400 && Array.isArray(bad.json?.fields) && bad.json.fields.length > 0,
    `status ${bad.status}, body ${bad.text.slice(0, 120)}`,
  );
} catch (err) {
  record("POST /api/partner-apply validation", false, err.message);
}

try {
  const bot = await postJson("/api/partner-apply", { ...validPayload, hp: "i am a robot" });
  record(
    "honeypot submission is swallowed silently (L17)",
    bot.status === 200 && bot.json?.ok === true && bot.json?.stored === false,
    `status ${bot.status}, body ${bot.text.slice(0, 120)}`,
  );
} catch (err) {
  record("honeypot submission", false, err.message);
}

let createdRef = null;
if (WRITE) {
  try {
    const res = await postJson("/api/partner-apply", validPayload);
    createdRef = res.json?.ref ?? null;
    record(
      "POST /api/partner-apply with a complete application → 200 + reference",
      res.status === 200 && res.json?.ok === true && /^SB-PTR-/.test(createdRef || ""),
      `status ${res.status}, body ${res.text.slice(0, 200)}`,
    );
    if (res.json?.stored === false) {
      notes.push("The application was emailed but NOT stored — Supabase env is missing on this deployment.");
    }

    if (createdRef) {
      const lookup = await postJson("/api/partner-status", { ref: createdRef, email: validPayload.email });
      record(
        `POST /api/partner-status finds ${createdRef} as submitted`,
        lookup.status === 200 && lookup.json?.data?.status === "submitted",
        `status ${lookup.status}, body ${lookup.text.slice(0, 160)}`,
      );

      const wrong = await postJson("/api/partner-status", { ref: createdRef, email: "nobody@example.com" });
      record(
        "a wrong email gets no data back (no enumeration)",
        wrong.status === 404,
        `status ${wrong.status}`,
      );

      if (ADMIN_USER && ADMIN_PASSWORD) {
        const queue = await get("/admin/partners", { Authorization: basic(ADMIN_USER, ADMIN_PASSWORD) });
        record(
          "the new application appears in the assessment queue",
          queue.status === 200 && queue.body.includes(createdRef),
          `status ${queue.status}`,
        );
      }
    }
  } catch (err) {
    record("POST /api/partner-apply (write)", false, err.message);
  }
} else {
  notes.push("Skipped the live submission and status lookup. Re-run with --write to test them end to end.");
}

// ────────────────────────────────────────────────────────────────────────────
// REPORT
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\n${passed} passed, ${failures.length} failed`);
if (notes.length) {
  console.log("\nNotes:");
  for (const n of notes) console.log(`  · ${n}`);
}
if (createdRef) {
  console.log(
    `\nOne TEST application is now in the database as ${createdRef}.\n` +
      `Delete it with:\n` +
      `  psql "$POSTGRES_URL" -c "delete from public.partners where ref = '${createdRef}';"`,
  );
}
if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  - ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("Partner pipeline smoke test passed.");