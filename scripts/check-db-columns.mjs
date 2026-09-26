/**
 * Build guard: every column any API route INSERTs must exist in the migration
 * for that table.
 *
 * This replaces scripts/check-event-columns.mjs, which only watched
 * site_events. The same bug has now appeared three times:
 *
 *   site_events.item          added to the route, never to the migration (#10)
 *   quote_requests.reference  added by #21's fix, never to the migration
 *   order_requests.quote_code in the migration, never applied to the live table
 *
 * Each one silently drops the ENTIRE row: PostgREST validates a payload's keys
 * against its schema cache and rejects the whole request when one is unknown.
 * A route that answers `stored: false` and carries on looks like a database
 * hiccup, not a bug, so these survive until somebody counts rows.
 *
 * TypeScript cannot see it — an untyped object literal on one side of a fetch,
 * a string on the other.
 *
 * TWO EXIT CODES, deliberately:
 *   1  real drift — a named column the migration does not declare. Fail.
 *   0  + a loud warning — a payload this script could not parse confidently.
 *      A lint that cannot read its input must not take production down with
 *      it; the failure it guards is recoverable and visible in the row counts.
 *
 * This checks the REPO against ITSELF. It cannot see the live database, which
 * is where order_requests.quote_code actually drifted. Run
 * `node scripts/check-db-columns.mjs --live` to check the real thing too; it
 * needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = process.argv.includes("--live");
const warnings = [];
const problems = [];

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");

/**
 * Every file that might insert. Routes under app/api, plus lib/ and the server
 * actions under app/ — an insert does not have to live in a route handler, and
 * scoping this to route.ts was itself a blind spot: lib/leads.ts writes the
 * `leads` table and the first version of this guard could not see it.
 */
function sourceFiles(out = []) {
  const roots = [path.join(APP_DIR, "app"), path.join(APP_DIR, "lib")];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        walk(p);
      } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
        out.push(p);
      }
    }
  };
  roots.forEach(walk);
  return out;
}

/** Top-level keys of the object literal starting at `start`. Brace-depth aware. */
function topLevelKeys(src, start) {
  const keys = [];
  let depth = 0, buf = "", spread = false;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === "{" || c === "[" || c === "(") { depth++; if (depth === 1) buf = ""; continue; }
    if (c === "}" || c === "]" || c === ")") { depth--; if (depth === 0) { flush(); break; } continue; }
    if (depth === 1) { if (c === ",") flush(); else buf += c; }
  }
  function flush() {
    const t = buf.trim(); buf = "";
    if (!t) return;
    if (t.startsWith("...")) { spread = true; return; }
    const m = t.match(/^["']?([A-Za-z_][A-Za-z0-9_]*)["']?\s*(:|$)/);
    if (m) keys.push(m[1]);
  }
  return { keys, spread };
}

/** Columns a migration declares for one table. */
function migrationColumns(table) {
  const file = path.join(APP_DIR, "supabase", `${table}.sql`);
  if (!existsSync(file)) {
    // Several tables share one migration file (the partner pipeline).
    for (const f of readdirSync(path.join(APP_DIR, "supabase"))) {
      const sql = stripComments(readFileSync(path.join(APP_DIR, "supabase", f), "utf8"));
      if (new RegExp(`create table[^(]*?\\b${table}\\s*\\(`, "i").test(sql)) return parse(sql, table);
    }
    return null;
  }
  return parse(stripComments(readFileSync(file, "utf8")), table);
}

function parse(sql, table) {
  const cols = new Set();
  const create = sql.match(new RegExp(`create\\s+table[^(]*?\\b${table}\\s*\\(([\\s\\S]*?)\\n\\s*\\)\\s*;`, "i"));
  if (!create) return null;
  const NOT_A_COLUMN = new Set(["primary", "unique", "constraint", "check", "foreign", "exclude", "like"]);
  for (const line of create[1].split("\n")) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s+/);
    if (m && !NOT_A_COLUMN.has(m[1].toLowerCase())) cols.add(m[1]);
  }
  for (const m of sql.matchAll(
    new RegExp(`alter\\s+table[^;]*?\\b${table}\\s+add\\s+column(?:\\s+if\\s+not\\s+exists)?\\s+([A-Za-z_][A-Za-z0-9_]*)`, "gi"),
  )) cols.add(m[1]);
  return cols;
}

/** Ask the live database whether a column exists. */
async function liveHas(table, column, env) {
  const res = await fetch(`${env.url}/rest/v1/${table}?select=${column}&limit=1`, {
    headers: { apikey: env.key, Authorization: `Bearer ${env.key}` },
  });
  return res.ok;
}

const env =
  LIVE && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? { url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
    : null;
if (LIVE && !env) warnings.push("--live requested but Supabase env is not set; checked the repo only.");

let checked = 0;
for (const file of sourceFiles()) {
  const src = stripComments(readFileSync(file, "utf8"));
  const rel = path.relative(APP_DIR, file);
  for (const m of src.matchAll(/rest\/v1\/([a-z_]+)`[\s\S]{0,400}?body:\s*JSON\.stringify\(\s*\{/g)) {
    const table = m[1];
    const { keys, spread } = topLevelKeys(src, src.indexOf("{", m.index + m[0].length - 1));
    if (spread) warnings.push(`${rel}: the ${table} insert spreads an object; its keys cannot be checked.`);
    if (keys.length === 0) { warnings.push(`${rel}: could not read the ${table} insert payload.`); continue; }

    const declared = migrationColumns(table);
    if (!declared) { warnings.push(`${rel}: no migration found declaring \`${table}\`.`); continue; }
    checked++;

    const missing = keys.filter((k) => !declared.has(k));
    if (missing.length) problems.push({ rel, table, missing, where: "supabase/*.sql" });

    if (env) {
      const liveMissing = [];
      for (const k of keys) if (!(await liveHas(table, k, env))) liveMissing.push(k);
      if (liveMissing.length) problems.push({ rel, table, missing: liveMissing, where: "the LIVE database" });
    }
  }
}

if (problems.length) {
  console.error("\nSchema drift — PostgREST rejects these inserts in full, dropping the whole row:\n");
  for (const { rel, table, missing, where } of problems) {
    console.error(`  ${rel} writes ${table}.{${missing.join(", ")}} — not in ${where}`);
  }
  console.error("");
  process.exit(1);
}
if (warnings.length) {
  console.warn("\n[check-db-columns] could not fully verify. NOT failing the build:\n");
  for (const w of warnings) console.warn(`  - ${w}`);
  console.warn("");
}
console.log(`Checked ${checked} insert${checked === 1 ? "" : "s"} against ${LIVE && env ? "the migrations and the live database" : "the migrations"}; every column is declared.`);
