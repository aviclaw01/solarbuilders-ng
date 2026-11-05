#!/usr/bin/env node
/**
 * env-audit — which env vars does the code read, and which do we have?
 * Never prints a value. Zero dependencies (Node 18+).
 *
 * CLI (migration time):
 *   node scripts/cloudflare/env-audit.mjs [--root .] [--out .migration] [env files…]
 *   → .migration/.env.merged             every non-empty value found (git-ignored)
 *     .migration/.env.production.missing template for what is still blank
 *     .migration/env-audit.json          name → { status, class, source, usedIn }
 *
 * Module (cf-check uses it):
 *   import { audit } from "./env-audit.mjs"
 *   audit({ root, files, extraNames }) → { report, have }
 *
 * status: ok | empty (present but blank, e.g. Vercel "Sensitive" pulls as "")
 *         missing (read by code, found nowhere) | unused (in a file, never read)
 * class (a hint; read the code before acting):
 *   platform    injected by the old host (VERCEL_*, TURBO_*, NX_*): drop or map
 *   public      NEXT_PUBLIC_* / VITE_* / PUBLIC_*: baked in at build time
 *   regenerate  internal shared secret: safe to mint new (update every caller)
 *   rotate-risk new value logs users out or breaks stored data / DB access
 *   provider    comes from a third-party dashboard
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKIP_DIRS = new Set([
  ".claude", "worktrees", ".worktrees", "node_modules", ".next", ".open-next", ".wrangler",
  ".git", "dist", "build", ".vercel", "coverage", ".turbo", ".migration", ".cf-check",
]);
const SRC_EXT = /\.(m?[jt]sx?|cjs|mts|cts|vue|svelte|astro)$/;
// Read by tooling or tests, not by the deployed app.
const SKIP_FILES = /(^|\/)(tests?|__tests__|e2e|scripts|\.github)\/|\.(test|spec)\.[cm]?[jt]sx?$|(^|\/)(playwright|vitest|jest)\.config\./;
const RUNTIME = /^(NODE_ENV|NEXT_RUNTIME|NEXT_PHASE|PORT|HOSTNAME|CI|TZ|PWD|HOME|DEBUG|ANALYZE)$/;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

export function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/^\s*export\s+/, "");
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if (/^".*"$|^'.*'$/.test(v)) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    out[m[1]] = v;
  }
  return out;
}

function parseCompose(text) {
  const out = {};
  for (const m of text.matchAll(/^\s*-?\s*([A-Z][A-Z0-9_]+)\s*[:=]\s*["']?([^"'\n#]*)["']?\s*$/gm)) out[m[1]] = m[2].trim();
  return out;
}

export function classify(n) {
  if (/^(VERCEL|TURBO|NX)_/.test(n) || n === "VERCEL") return "platform";
  if (/^(NEXT_PUBLIC|VITE|PUBLIC)_/.test(n)) return "public";
  if (/CRON_SECRET|HEALTH.*TOKEN|INTERNAL.*(SECRET|TOKEN)|REVALIDATE.*(SECRET|TOKEN)|^SMOKE_/.test(n)) return "regenerate";
  if (/(ENCRYPT|CIPHER|SESSION|JWT|NEXTAUTH_SECRET|AUTH_SECRET|COOKIE|SIGNING_KEY$|TOKEN_SECRET|PASSWORD|DATABASE_URL|POSTGRES|^PG(HOST|USER|PASSWORD|DATABASE)$|_DSN$)/.test(n)) return "rotate-risk";
  return "provider";
}

/** Names the deployed app reads → files that read them. */
export function scanCode(root) {
  const used = new Map();
  const patterns = [
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\[\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\]/g,
    /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    /\benv\.([A-Z][A-Z0-9_]{2,})\b/g,
  ];
  for (const f of walk(root)) {
    const rel = path.relative(root, f);
    if (!SRC_EXT.test(f) || SKIP_FILES.test(rel)) continue;
    let src;
    try {
      src = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const re of patterns) {
      for (const m of src.matchAll(re)) {
        if (RUNTIME.test(m[1])) continue;
        if (!used.has(m[1])) used.set(m[1], new Set());
        used.get(m[1]).add(rel);
      }
    }
  }
  return used;
}

/**
 * files: env files in priority order (first non-empty value wins).
 * discover: also read .env*, .dev.vars and docker-compose files under root.
 * extraNames: names known to exist elsewhere (e.g. `wrangler secret list`).
 */
export function audit({ root = ".", files = [], discover = true, extraNames = [] } = {}) {
  root = path.resolve(root);
  const used = scanCode(root);
  const found = discover
    ? walk(root).filter(
        (f) =>
          /(^|\/)\.env(\.[\w.-]+)?$|(^|\/)\.dev\.vars$|docker-compose[^/]*\.ya?ml$/.test(f) &&
          !/\.(example|sample|template|missing|merged)$/.test(f),
      )
    : [];
  const explicit = files.map((f) => path.resolve(f));
  const envFiles = [...explicit, ...found.filter((f) => !explicit.includes(f))];

  const have = {};
  const blank = {};
  for (const f of envFiles) {
    let text;
    try {
      text = fs.readFileSync(f, "utf8");
    } catch {
      continue;
    }
    const vars = /docker-compose/.test(f) ? parseCompose(text) : parseEnv(text);
    const rel = path.relative(root, f) || f;
    for (const [k, v] of Object.entries(vars)) {
      if (v && !have[k]) have[k] = { value: v, source: rel };
      else if (!v && !blank[k]) blank[k] = rel;
    }
  }
  for (const n of extraNames) if (!have[n]) have[n] = { value: null, source: "remote" };

  const report = {};
  for (const n of [...new Set([...used.keys(), ...Object.keys(have), ...Object.keys(blank)])].sort()) {
    if (RUNTIME.test(n)) continue;
    const inCode = used.has(n);
    const status = have[n] ? (inCode ? "ok" : "unused") : blank[n] ? (inCode ? "empty" : "unused") : "missing";
    report[n] = {
      status,
      class: classify(n),
      source: have[n]?.source ?? blank[n] ?? null,
      usedIn: inCode ? [...used.get(n)].slice(0, 5) : [],
    };
  }
  return { report, have, envFiles: envFiles.map((f) => path.relative(root, f) || f) };
}

// ── CLI ─────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (k, d) => {
    const i = args.indexOf(k);
    if (i === -1) return d;
    const v = args[i + 1];
    args.splice(i, 2);
    return v;
  };
  const root = path.resolve(opt("--root", "."));
  const outDir = path.resolve(opt("--out", path.join(root, ".migration")));
  const { report, have, envFiles } = audit({ root, files: args });

  fs.mkdirSync(outDir, { recursive: true });
  const quote = (v) => (/[\s#"'$`\\]/.test(v) ? JSON.stringify(v) : v);
  fs.writeFileSync(
    path.join(outDir, ".env.merged"),
    Object.entries(have)
      .filter(([k, v]) => v.value && classify(k) !== "platform")
      .map(([k, v]) => `${k}=${quote(v.value)}`)
      .join("\n") + "\n",
    { mode: 0o600 },
  );
  const need = Object.entries(report).filter(([, r]) => (r.status === "empty" || r.status === "missing") && r.class !== "platform");
  fs.writeFileSync(
    path.join(outDir, ".env.production.missing"),
    [
      "# Fill in each value in your editor, save, and tell the agent. Never paste values into chat.",
      "# Leave a line blank if the app does not need it.",
      "",
      ...need.flatMap(([k, r]) => [`# ${k} (${r.class})${r.usedIn.length ? `, read in ${r.usedIn.join(", ")}` : ""}`, `${k}=`, ""]),
    ].join("\n"),
    { mode: 0o600 },
  );
  fs.writeFileSync(path.join(outDir, "env-audit.json"), JSON.stringify(report, null, 2));

  const pad = (s, n) => String(s).padEnd(n);
  console.log(`env files read: ${envFiles.join(", ") || "(none)"}`);
  console.log(pad("NAME", 38) + pad("STATUS", 9) + pad("CLASS", 12) + "SOURCE");
  for (const [k, r] of Object.entries(report)) console.log(pad(k, 38) + pad(r.status, 9) + pad(r.class, 12) + (r.source ?? ""));
  const count = (s) => Object.values(report).filter((r) => r.status === s).length;
  console.log(`\nok ${count("ok")} · empty ${count("empty")} · missing ${count("missing")} · unused ${count("unused")}`);
  console.log(`wrote ${path.relative(process.cwd(), outDir) || "."}/{.env.merged,.env.production.missing,env-audit.json}. Values are never printed.`);
}
