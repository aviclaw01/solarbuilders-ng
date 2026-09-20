/**
 * Build guard: every column /api/track writes, and every column /admin/funnel
 * reads, must exist in supabase/site_events.sql.
 *
 * Why this exists. PostgREST validates a payload's keys against its schema
 * cache and rejects the WHOLE request when one is unknown — it does not ignore
 * the stray field. So one column that lives in the route but not in the
 * migration does not lose one value, it loses every event. `item` drifted that
 * way: added to the route and to the live database by hand, never to the
 * migration, so a rebuild from this repo would have shipped a dead tracker.
 *
 * TypeScript cannot see this — the payload is an untyped object literal on one
 * side of a fetch and a string on the other — so it is checked here, from the
 * build, the way scripts/check-content-prices.mjs guards prices.
 *
 * TWO EXIT CODES, ON PURPOSE.
 *   1 — real drift. A named column is written or read and the migration does
 *       not declare it. Fail the build.
 *   0 + a loud warning — the guard could not read the files confidently
 *       (someone refactored the payload into a variable, spread an object in,
 *       reformatted the select list). A lint that cannot parse its input must
 *       not take production down with it: the condition it guards against is
 *       recoverable and already visible, because app/admin/funnel/page.tsx
 *       renders the PostgREST error verbatim. Failing deploys on regex luck
 *       would be a bigger outage than the bug.
 *
 * A guard that goes quiet when reformatted decays into decoration, so silence
 * is not an option either. Hence the plausibility check: the parse must find
 * `event` and at least MIN_KEYS keys, or it does not believe itself.
 *
 * Run: node scripts/check-event-columns.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(APP_DIR, p), "utf8");

const SQL_FILE = "supabase/site_events.sql";
const ROUTE_FILE = "app/api/track/route.ts";
const FUNNEL_FILE = "app/admin/funnel/page.tsx";

/** The insert names this many columns today. A parse finding fewer is a bad parse. */
const MIN_KEYS = 13;
/** Must always be present: the only `not null` column on the table. */
const REQUIRED_KEY = "event";

const warnings = [];

/** Strip // and /* *\/ so a column name in a comment is never counted. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/**
 * Top-level keys of the object literal at `start` (the index of its `{`).
 * Brace-depth aware, so a nested `context: { browser }` contributes `context`
 * and not `browser`. Handles shorthand (`event,`) as well as `key: value` —
 * the first version of this guard required a colon and therefore never saw
 * `event`, which is exactly the column whose loss would break every insert.
 */
function topLevelKeys(src, start) {
  const keys = [];
  let depth = 0;
  let i = start;
  let sawSpread = false;
  let sawComputed = false;
  let buf = "";

  for (; i < src.length; i++) {
    const c = src[i];
    if (c === "{" || c === "[" || c === "(") {
      depth++;
      if (depth === 1) buf = "";
      continue;
    }
    if (c === "}" || c === "]" || c === ")") {
      depth--;
      if (depth === 0) {
        flush();
        break;
      }
      continue;
    }
    if (depth === 1) {
      if (c === ",") flush();
      else buf += c;
    }
  }

  function flush() {
    const t = buf.trim();
    buf = "";
    if (!t) return;
    if (t.startsWith("...")) {
      sawSpread = true;
      return;
    }
    if (t.startsWith("[")) {
      sawComputed = true;
      return;
    }
    const m = t.match(/^["']?([A-Za-z_][A-Za-z0-9_]*)["']?\s*(:|$)/);
    if (m) keys.push(m[1]);
    else if (t) sawComputed = true;
  }

  return { keys, sawSpread, sawComputed, end: i };
}

/** Columns the table has: the create-table body plus any add-column. */
function schemaColumns(sql) {
  const cols = new Set();
  const src = stripComments(sql);

  const create = src.match(/create\s+table[^(]*?site_events\s*\(([\s\S]*?)\n\s*\)\s*;/i);
  if (!create) return null;

  // Words that begin a table constraint, not a column.
  const NOT_A_COLUMN = new Set(["primary", "unique", "constraint", "check", "foreign", "exclude", "like"]);
  for (const line of create[1].split("\n")) {
    const m = line.trim().match(/^([A-Za-z_][A-Za-z0-9_]*)\s+/);
    if (m && !NOT_A_COLUMN.has(m[1].toLowerCase())) cols.add(m[1]);
  }

  for (const m of src.matchAll(
    /alter\s+table[^;]*?site_events\s+add\s+column(?:\s+if\s+not\s+exists)?\s+([A-Za-z_][A-Za-z0-9_]*)/gi,
  )) {
    cols.add(m[1]);
  }
  return cols;
}

/** Keys the route sends in the insert body. */
function insertedKeys(route) {
  const src = stripComments(route);
  const at = src.search(/body:\s*JSON\.stringify\(\s*\{/);
  if (at === -1) {
    warnings.push(
      `${ROUTE_FILE}: could not find the \`body: JSON.stringify({ … })\` insert. ` +
        `If the payload was moved into a variable or reshaped, update this guard.`,
    );
    return null;
  }
  const brace = src.indexOf("{", at);
  const { keys, sawSpread, sawComputed } = topLevelKeys(src, brace);

  if (sawSpread) warnings.push(`${ROUTE_FILE}: the insert spreads an object, whose keys this guard cannot see.`);
  if (sawComputed) warnings.push(`${ROUTE_FILE}: the insert has a computed key, which this guard cannot resolve.`);

  if (!keys.includes(REQUIRED_KEY) || keys.length < MIN_KEYS) {
    warnings.push(
      `${ROUTE_FILE}: parsed only ${keys.length} keys${keys.includes(REQUIRED_KEY) ? "" : ` and no \`${REQUIRED_KEY}\``} ` +
        `(expected at least ${MIN_KEYS}). Treating the parse as unreliable rather than reporting a false pass.`,
    );
    return null;
  }
  return new Set(keys);
}

/** Columns the dashboard names in its PostgREST select list. */
function selectedColumns(funnel) {
  const src = stripComments(funnel);
  // Anchor on the site_events query's params, not merely the first `select:`
  // in a 600-line file — a UI state object with a `select:` would hijack it.
  const block = src.match(/new URLSearchParams\(\{([\s\S]*?)\n\s*\}\)/);
  const scope = block ? block[1] : src;
  const m = scope.match(/select:\s*\n?\s*["'`]([^"'`]+)["'`]/);
  if (!m) {
    warnings.push(`${FUNNEL_FILE}: could not find the site_events \`select:\` list.`);
    return null;
  }

  const cols = new Set();
  for (const raw of m[1].split(",")) {
    const t = raw.trim();
    if (!t || t === "*") continue;
    if (t.includes("(")) continue; // count(), avg() and friends
    // PostgREST alias syntax `alias:column` — the column is the right-hand side.
    const name = t.includes(":") ? t.split(":").pop().trim() : t;
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) cols.add(name);
  }
  return cols;
}

// ─────────────────────────────────────────────────────────────

const columns = schemaColumns(read(SQL_FILE));
if (!columns) {
  console.warn(`\n[check-event-columns] could not parse the create-table block in ${SQL_FILE} — skipping.\n`);
  process.exit(0);
}

const written = insertedKeys(read(ROUTE_FILE));
const selected = selectedColumns(read(FUNNEL_FILE));

const problems = [];
for (const [label, file, names] of [
  ["writes", ROUTE_FILE, written],
  ["reads", FUNNEL_FILE, selected],
]) {
  if (!names) continue;
  const missing = [...names].filter((n) => !columns.has(n)).sort();
  if (missing.length) problems.push({ label, file, missing });
}

if (problems.length > 0) {
  console.error("\nsite_events schema drift — PostgREST will reject these requests in full:\n");
  for (const { label, file, missing } of problems) {
    console.error(`  ${file} ${label} a column that ${SQL_FILE} does not declare:`);
    for (const name of missing) console.error(`    - ${name}`);
    console.error("");
  }
  console.error(`Add the column to ${SQL_FILE} (and to the live database), or stop using it.\n`);
  process.exit(1);
}

if (warnings.length > 0) {
  console.warn("\n[check-event-columns] could not fully verify site_events. NOT failing the build:\n");
  for (const w of warnings) console.warn(`  - ${w}`);
  console.warn("");
  process.exit(0);
}

console.log(
  `site_events: ${columns.size} columns; ${written.size} written and ${selected.size} read, all declared.`,
);
