#!/usr/bin/env node
/**
 * cf-check: one gate for a Next.js app on Cloudflare Workers (OpenNext).
 * The SAME script runs on your machine, on every PR, and on deploy, so
 * "passes locally" means "passes in CI". Zero dependencies (Node 18.17+).
 *
 *   node scripts/cloudflare/cf-check.mjs            full check (≈ what CI runs)
 *   node scripts/cloudflare/cf-check.mjs --quick    lockfile, types, lint, tests, env (seconds; pre-push)
 *   node scripts/cloudflare/cf-check.mjs --deploy   full build → migrate → deploy → live smoke → auto-rollback
 *   node scripts/cloudflare/cf-check.mjs --smoke-only --base https://example.com
 *   node scripts/cloudflare/cf-check.mjs --preview pr-12   upload a preview version (CI uses this)
 *   flags: --ci  --verbose  --skip-build  --skip-smoke
 *
 * Steps (full): lockfile · typecheck · lint · test · project checks · env ·
 *   build (OpenNext) · bundle size vs plan · LOCAL RUNTIME SMOKE: boots the built
 *   Worker in workerd (the real Cloudflare runtime) and GETs your key pages plus a
 *   sample of the sitemap. That last step catches what a green `next build` hides:
 *   Node-only APIs, missing env at runtime, crashes that only happen on Workers.
 *
 * Config: cloudflare.config.json (all optional):
 *   { "plan": "free" | "paid",
 *     "checks": ["node scripts/my-test.mjs"],      extra commands, run after tests
 *     "requiredEnv": ["DATABASE_URL"],             fail if missing (others only warn)
 *     "optionalEnv": ["SENTRY_DSN"],               known-optional: don't warn
 *     "smoke": { "paths": ["/"], "sitemap": true, "maxPages": 30,
 *                "expect": { "/admin": [401] }, "timeoutMs": 20000 },
 *     "siteUrl": "https://example.com",            live smoke target after deploy
 *     "migrate": "npx prisma migrate deploy",      runs before deploy
 *     "previews": false }                          PR preview URLs (they share prod secrets/data!)
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { audit } from "./env-audit.mjs";

const ROOT = findRoot(process.cwd());
process.chdir(ROOT);

// ── args & config ───────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (f) => argv.includes(f);
const val = (f) => {
  const i = argv.indexOf(f);
  return i === -1 ? undefined : argv[i + 1];
};
const CI = flag("--ci") || !!process.env.GITHUB_ACTIONS;
const VERBOSE = flag("--verbose") || CI;
const MODE = flag("--deploy") ? "deploy" : flag("--smoke-only") ? "smoke" : val("--preview") ? "preview" : flag("--quick") ? "quick" : "full";

const DEFAULTS = {
  plan: "free",
  checks: [],
  requiredEnv: [],
  optionalEnv: [],
  smoke: { paths: ["/"], sitemap: true, maxPages: 30, expect: {}, timeoutMs: 20000 },
  siteUrl: null,
  migrate: null,
  previews: false,
};
const userCfg = readJson("cloudflare.config.json") ?? {};
const cfg = { ...DEFAULTS, ...userCfg, smoke: { ...DEFAULTS.smoke, ...(userCfg.smoke ?? {}) } };
const LIMIT_KIB = cfg.plan === "paid" ? 10240 : 3072;

const pkg = readJson("package.json") ?? {};
const PM = fs.existsSync("pnpm-lock.yaml") ? "pnpm" : fs.existsSync("yarn.lock") ? "yarn" : fs.existsSync("bun.lockb") || fs.existsSync("bun.lock") ? "bun" : "npm";
const EXEC = { npm: ["npx"], pnpm: ["pnpm", "exec"], yarn: ["yarn"], bun: ["bunx"] }[PM];

// ── output ──────────────────────────────────────────────────────────────
const results = [];
const tty = process.stdout.isTTY && !CI;
const c = (code, s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const ICON = { pass: c(32, "✓"), fail: c(31, "✗"), warn: c(33, "!"), skip: c(90, "–") };
function record(step, status, note = "", ms = 0) {
  results.push({ step, status, note, ms });
  const t = ms ? c(90, ` ${(ms / 1000).toFixed(1)}s`) : "";
  console.log(`${ICON[status]} ${step}${t}${note ? `  ${c(90, note)}` : ""}`);
  if (CI && (status === "fail" || status === "warn")) {
    console.log(`::${status === "fail" ? "error" : "warning"} title=cf-check ${step}::${note.replace(/\n/g, "%0A")}`);
  }
}
const failed = () => results.some((r) => r.status === "fail");

// ── helpers ─────────────────────────────────────────────────────────────
function findRoot(dir) {
  for (let d = dir; ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, "package.json"))) return d;
    if (path.dirname(d) === d) return dir;
  }
}
function readJson(f) {
  try {
    return JSON.parse(fs.readFileSync(f, "utf8").replace(/^\s*\/\/.*$/gm, ""));
  } catch {
    return null;
  }
}
function run(label, cmd, args, { allowFail = false, env = {}, shell = false } = {}) {
  const t0 = Date.now();
  if (VERBOSE) console.log(c(90, `$ ${[cmd, ...args].join(" ")}`));
  const r = spawnSync(cmd, args, {
    stdio: VERBOSE ? "inherit" : "pipe",
    encoding: "utf8",
    shell,
    env: { ...process.env, FORCE_COLOR: "0", ...env },
    maxBuffer: 64 * 1024 * 1024,
  });
  const ms = Date.now() - t0;
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  if (r.status === 0) {
    if (label) record(label, "pass", "", ms);
    return { ok: true, out, ms };
  }
  if (label && !allowFail) {
    const tail = out.trim().split("\n").slice(-25).join("\n");
    record(label, "fail", VERBOSE ? `exit ${r.status}` : `exit ${r.status}\n${tail}`, ms);
  }
  return { ok: false, out, ms };
}
const exec = (label, args, o) => run(label, EXEC[0], [...EXEC.slice(1), ...args], o);
const hasScript = (s) => typeof pkg.scripts?.[s] === "string" && !/no test specified/.test(pkg.scripts[s]);

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.unref();
    s.on("error", rej);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function get(url, timeoutMs) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(timeoutMs), headers: { "user-agent": "cf-check" } });
    const body = r.status >= 500 ? (await r.text()).slice(0, 300) : (await r.arrayBuffer(), "");
    return { status: r.status, ms: Date.now() - t0, body };
  } catch (e) {
    return { status: 0, ms: Date.now() - t0, body: String(e.cause?.code ?? e.name ?? e) };
  }
}

// ── steps ───────────────────────────────────────────────────────────────
function stepLockfile() {
  const cmds = {
    npm: ["npm", ["ci", "--dry-run", "--ignore-scripts", "--no-audit", "--no-fund"]],
    pnpm: ["pnpm", ["install", "--frozen-lockfile", "--lockfile-only", "--ignore-scripts"]],
    yarn: ["yarn", ["install", "--immutable", "--mode=skip-build"]],
  };
  if (!cmds[PM]) return record("lockfile in sync", "skip", `${PM}: not checked`);
  const r = run(null, cmds[PM][0], cmds[PM][1]);
  if (r.ok) record("lockfile in sync", "pass", "", r.ms);
  else record("lockfile in sync", "fail", `package.json and the lockfile disagree. CI's clean install will fail. Run \`${PM} install\` and commit the lockfile.`, r.ms);
}

function stepTypes() {
  if (!fs.existsSync("tsconfig.json")) return record("typecheck", "skip", "no tsconfig.json");
  // Regenerate Next's route types first: stale .next/types (a deleted page, a renamed
  // route) fail locally but not on CI's clean checkout, and vice versa.
  const t0 = Date.now();
  const gen = exec(null, ["next", "typegen"]);
  if (!gen.ok && !/unknown command|Invalid command|not a next command/i.test(gen.out)) {
    return record("typecheck", "fail", `next typegen failed\n${gen.out.trim().split("\n").slice(-10).join("\n")}`, Date.now() - t0);
  }
  const r = exec(null, ["tsc", "--noEmit"]);
  if (r.ok) record("typecheck", "pass", "", Date.now() - t0);
  else record("typecheck", "fail", VERBOSE ? "see output above" : r.out.trim().split("\n").slice(-25).join("\n"), Date.now() - t0);
}
function stepLint() {
  if (!hasScript("lint")) return record("lint", "skip", "no lint script");
  run("lint", PM, ["run", "lint"]);
}
function stepTest() {
  if (!hasScript("test")) return record("tests", "skip", "no test script");
  run("tests", PM, ["run", "test"]);
}
function stepChecks() {
  for (const cmd of cfg.checks ?? []) run(`check: ${cmd}`, cmd, [], { shell: true });
}

function remoteSecretNames() {
  const canAuth = process.env.CLOUDFLARE_API_TOKEN || fs.existsSync(path.join(process.env.HOME ?? "", ".config/.wrangler/config/default.toml"));
  if (!canAuth) return null;
  const r = spawnSync(EXEC[0], [...EXEC.slice(1), "wrangler", "secret", "list", "--format", "json"], { encoding: "utf8", timeout: 30000 });
  try {
    const list = JSON.parse(r.stdout);
    return Array.isArray(list) ? list.map((s) => s.name) : null;
  } catch {
    return null;
  }
}

function stepEnv() {
  const t0 = Date.now();
  const secretNames = remoteSecretNames();
  // What production gets: the env files `next build` reads, wrangler "vars", and Worker
  // secrets (.dev.vars stands in for them locally).
  const wrangler = readJson("wrangler.jsonc") ?? readJson("wrangler.json") ?? {};
  const varNames = Object.keys(wrangler.vars ?? {});
  const { report } = audit({
    root: ROOT,
    files: [".env.production.local", ".env.local", ".env.production", ".env", ".dev.vars"],
    discover: false,
    extraNames: [...(secretNames ?? []), ...varNames],
  });
  const optional = new Set(cfg.optionalEnv ?? []);
  const gaps = Object.entries(report).filter(([k, r]) => (r.status === "missing" || r.status === "empty") && r.usedIn.length && !optional.has(k));
  const required = new Set(cfg.requiredEnv ?? []);
  const hardMissing = gaps.filter(([k]) => required.has(k)).map(([k]) => k);
  const publicGaps = gaps.filter(([, r]) => r.class === "public").map(([k]) => k);
  // Host-injected vars (VERCEL_ENV, VERCEL_URL…) never exist on Cloudflare, even if a
  // pulled .env file lists them, so flag every one the code reads.
  const platform = Object.entries(report).filter(([k, r]) => r.class === "platform" && r.usedIn.length && !varNames.includes(k)).map(([k, r]) => `${k} (${r.usedIn[0]})`);
  const other = gaps.filter(([k, r]) => !required.has(k) && r.class !== "public" && r.class !== "platform").map(([k]) => k);
  const src = `env files, ${varNames.length} wrangler vars, ` + (secretNames ? `${secretNames.length} Worker secrets` : "Worker secrets not checked (not logged in to Cloudflare)");
  const ms = Date.now() - t0;
  if (hardMissing.length) record("env", "fail", `required but not set: ${hardMissing.join(", ")}. Sources: ${src}`, ms);
  const notes = [];
  if (publicGaps.length) notes.push(`browser vars missing from .env.production (undefined in the client): ${publicGaps.join(", ")}`);
  if (platform.length) notes.push(`host-injected vars read by code, which Cloudflare never sets. Map them to your own var, e.g. APP_ENV in wrangler "vars": ${platform.join(", ")}`);
  if (other.length) notes.push(`read by code but not set: ${other.join(", ")}. If optional, list them in "optionalEnv" in cloudflare.config.json to silence this.`);
  if (!hardMissing.length) record("env", notes.length ? "warn" : "pass", notes.length ? notes.join("\n") : `sources: ${src}`, ms);
}

function stepBuild() {
  if (!fs.existsSync("open-next.config.ts") && !fs.existsSync("open-next.config.mjs")) {
    return record("build (OpenNext)", "fail", "no open-next.config.ts. Run the setup script first.");
  }
  exec("build (OpenNext)", ["opennextjs-cloudflare", "build"]);
}

function stepSize() {
  const r = exec(null, ["wrangler", "deploy", "--dry-run", "--outdir", ".cf-check/dry"]);
  const m = r.out.match(/gzip:\s*([\d.]+)\s*KiB/i);
  if (!r.ok || !m) return record("bundle size", "fail", `wrangler dry-run failed\n${r.out.trim().split("\n").slice(-15).join("\n")}`, r.ms);
  const kib = Number(m[1]);
  const pct = Math.round((kib / LIMIT_KIB) * 100);
  const note = `${(kib / 1024).toFixed(2)} MB gzip of ${LIMIT_KIB / 1024} MB (${cfg.plan} plan), ${pct}%`;
  record("bundle size", kib > LIMIT_KIB ? "fail" : pct >= 85 ? "warn" : "pass", kib > LIMIT_KIB ? `${note}. Over the limit: deploy will be rejected.` : note, r.ms);
}

async function smokePaths(base, timeoutMs, max) {
  const paths = [...(cfg.smoke.paths ?? ["/"])];
  if (cfg.smoke.sitemap && max > 0) {
    const sm = await get(new URL("/sitemap.xml", base), timeoutMs);
    if (sm.status === 200) {
      let xml = await (await fetch(new URL("/sitemap.xml", base))).text();
      const child = xml.includes("<sitemapindex") && xml.match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
      if (child) xml = await (await fetch(new URL(new URL(child).pathname, base))).text();
      const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => {
        try {
          const u = new URL(m[1]);
          return u.pathname + u.search;
        } catch {
          return null;
        }
      });
      const uniq = [...new Set(locs.filter(Boolean))].filter((p) => !paths.includes(p));
      const step = Math.max(1, Math.ceil(uniq.length / max));
      for (let i = 0; i < uniq.length && paths.length < max + (cfg.smoke.paths?.length ?? 1); i += step) paths.push(uniq[i]);
    }
  }
  return paths;
}

const ANSI = /\x1b\[[0-9;]*m/g;
const RUNTIME_ERROR = /\b(Uncaught|Unhandled|TypeError|ReferenceError|SyntaxError|RangeError|is not a function|is not defined|not implemented|ERR_[A-Z_]{3,}|\[ERROR\]|✘)/;

async function smoke(base, label, { retries = 0, max = cfg.smoke.maxPages, log = null } = {}) {
  const t0 = Date.now();
  const timeoutMs = cfg.smoke.timeoutMs ?? 20000;
  const paths = await smokePaths(base, timeoutMs, max);
  const bad = [];
  let slowest = { p: "", ms: 0 };
  for (const p of paths) {
    const mark = log ? log().length : 0;
    let r;
    for (let a = 0; a <= retries; a++) {
      r = await get(new URL(p, base), timeoutMs);
      if (r.status && r.status < 500) break;
      if (a < retries) await sleep(3000);
    }
    // A crash Next catches with its error page can still answer 200, so a runtime
    // error logged while this path rendered fails it, whatever the status.
    let crash = "";
    if (log) {
      await sleep(250);
      crash = log().slice(mark).replace(ANSI, "").split("\n").find((l) => RUNTIME_ERROR.test(l)) ?? "";
    }
    const expect = cfg.smoke.expect?.[p];
    const ok = !crash && (expect ? expect.includes(r.status) : r.status > 0 && r.status < 500);
    if (crash) bad.push(`${p} → ${r.status}, but the Worker logged: ${crash.trim().slice(0, 200)}`);
    else if (!ok) bad.push(`${p} → ${r.status || "no response"}${expect ? ` (expected ${expect.join("/")})` : ""}${r.body ? `: ${r.body.replace(/\s+/g, " ").slice(0, 160)}` : ""}`);
    if (r.ms > slowest.ms) slowest = { p, ms: r.ms };
  }
  const ms = Date.now() - t0;
  if (bad.length) record(label, "fail", `${bad.length}/${paths.length} paths failed\n${bad.join("\n")}`, ms);
  else record(label, "pass", `${paths.length} paths OK, slowest ${slowest.p} ${(slowest.ms / 1000).toFixed(1)}s`, ms);
  return !bad.length;
}

async function stepLocalSmoke() {
  if (!fs.existsSync(".open-next/worker.js")) return record("runtime smoke (local workerd)", "fail", "no .open-next/worker.js. The build didn't produce a worker.");
  if (!fs.existsSync(".dev.vars")) record("runtime smoke (local workerd)", "warn", "no .dev.vars: the local Worker has no server secrets, so pages that need them may 500. Copy your production env to .dev.vars (git-ignored).");
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(EXEC[0], [...EXEC.slice(1), "wrangler", "dev", "--port", String(port), "--ip", "127.0.0.1", "--local", "--log-level", "warn"], {
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, CI: "1", NO_COLOR: "1", WRANGLER_SEND_METRICS: "false" },
  });
  let log = "";
  let exited = null;
  child.stdout.on("data", (d) => (log += d));
  child.stderr.on("data", (d) => (log += d));
  child.on("exit", (code) => (exited = code));
  const kill = async () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {}
    await sleep(1500);
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {}
  };
  try {
    const deadline = Date.now() + 120000;
    let up = false;
    while (Date.now() < deadline && exited === null) {
      const r = await get(base + "/", 5000);
      if (r.status) {
        up = true;
        break;
      }
      await sleep(1000);
    }
    if (!up) {
      record("runtime smoke (local workerd)", "fail", `the Worker didn't start${exited !== null ? ` (exit ${exited})` : " within 120s"}\n${log.trim().split("\n").slice(-25).join("\n")}`);
      return;
    }
    const bootLog = log.length;
    await smoke(base, "runtime smoke (local workerd)", { log: () => log });
    const stray = log.slice(0, bootLog).replace(ANSI, "").split("\n").filter((l) => RUNTIME_ERROR.test(l));
    if (stray.length) record("worker startup errors", "warn", [...new Set(stray)].slice(0, 8).join("\n"));
  } finally {
    await kill();
  }
}

function writeSummary() {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (!file) return;
  const rows = results.map((r) => `| ${{ pass: "✅", fail: "❌", warn: "⚠️", skip: "➖" }[r.status]} | ${r.step} | ${r.ms ? (r.ms / 1000).toFixed(1) + "s" : ""} | ${r.note.split("\n")[0].replace(/\|/g, "\\|").slice(0, 200)} |`);
  fs.appendFileSync(file, `### cf-check (${MODE})\n\n| | step | time | note |\n|---|---|---|---|\n${rows.join("\n")}\n`);
}

function setOutput(k, v) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${k}=${v}\n`);
}

// ── modes ───────────────────────────────────────────────────────────────
async function main() {
  console.log(c(1, `cf-check · ${MODE} · ${pkg.name ?? path.basename(ROOT)} · ${PM}`));

  if (MODE === "smoke") {
    const base = val("--base") ?? cfg.siteUrl;
    if (!base) return record("live smoke", "fail", "pass --base https://… or set siteUrl in cloudflare.config.json");
    await smoke(base, `live smoke ${base}`, { retries: 2 });
    return;
  }

  if (MODE === "preview") {
    if (!cfg.previews) return console.log('previews are off ("previews": false in cloudflare.config.json); skipping');
    if (!fs.existsSync(".open-next/worker.js")) stepBuild();
    if (failed()) return;
    const alias = val("--preview").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
    const r = exec("upload preview version", ["wrangler", "versions", "upload", "--preview-alias", alias, "--message", `preview ${alias}`]);
    const url = r.out.match(/https:\/\/[^\s]+workers\.dev[^\s]*/g)?.find((u) => u.includes(alias)) ?? r.out.match(/https:\/\/[^\s]+workers\.dev[^\s]*/)?.[0];
    if (url) {
      console.log(`preview: ${url}`);
      setOutput("url", url);
    }
    return;
  }

  // Fast steps (also the pre-push hook)
  stepLockfile();
  stepTypes();
  stepLint();
  stepTest();
  stepChecks();
  stepEnv();
  if (MODE === "quick") return;
  // Code failures stop here. A missing env doesn't hide the build and size results,
  // but it does block the smoke test (pages would fail for lack of secrets) and deploy.
  const codeFailed = () => results.some((r) => r.status === "fail" && r.step !== "env");
  const envFailed = () => results.some((r) => r.status === "fail" && r.step === "env");
  if (codeFailed() && !flag("--keep-going")) return record("build, size, smoke", "skip", "fix the failures above first");

  if (!flag("--skip-build")) stepBuild();
  if (codeFailed()) return;
  stepSize();
  if (codeFailed()) return;
  if (MODE === "full" && !flag("--skip-smoke")) {
    if (envFailed()) record("runtime smoke (local workerd)", "skip", "required env missing (see env above)");
    else await stepLocalSmoke();
  }
  if (MODE !== "deploy" || failed()) return;

  // ── deploy ────────────────────────────────────────────────────────────
  if (cfg.migrate) {
    run(`migrate: ${cfg.migrate}`, cfg.migrate, [], { shell: true });
    if (failed()) return;
  }
  const d = exec("deploy", ["wrangler", "deploy"]);
  if (!d.ok) return;
  const workersDev = d.out.match(/https:\/\/[^\s]+\.workers\.dev/)?.[0];
  const base = cfg.siteUrl ?? workersDev;
  if (!base) return record("live smoke", "warn", "no siteUrl in cloudflare.config.json and no workers.dev URL. Live check skipped.");
  await sleep(5000);
  const ok = await smoke(base, `live smoke ${base}`, { retries: 2, max: Math.min(10, cfg.smoke.maxPages) });
  if (!ok) {
    const rb = exec("rollback to previous version", ["wrangler", "rollback", "--message", "cf-check: live smoke failed", "--yes"]);
    if (rb.ok) console.log(c(33, "Rolled back. The previous version is live again. Database migrations, if any, were NOT reverted."));
  }
}

const started = Date.now();
main()
  .catch((e) => record("cf-check crashed", "fail", e.stack ?? String(e)))
  .finally(() => {
    writeSummary();
    const n = (s) => results.filter((r) => r.status === s).length;
    console.log(
      `\n${failed() ? c(31, "FAILED") : c(32, "PASSED")}  ${n("pass")} passed · ${n("warn")} warnings · ${n("fail")} failed · ${((Date.now() - started) / 1000).toFixed(0)}s`,
    );
    process.exitCode = failed() ? 1 : 0;
  });
