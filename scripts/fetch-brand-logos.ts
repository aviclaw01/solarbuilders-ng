#!/usr/bin/env node
/**
 * scripts/fetch-brand-logos.ts — brand logo pipeline for /brands, /shop, /cart,
 * /compare and every BrandMark placeholder.
 *
 * Fetch once → normalise to WebP → store under public/brands/ → serve from our
 * own domain. Same rules as fetch-product-images.ts: never hotlink, record
 * provenance, correctness over coverage.
 *
 * Run (Node 22+, native TS type stripping — no build step):
 *
 *   node scripts/fetch-brand-logos.ts
 *   node scripts/fetch-brand-logos.ts --only=deye,growatt
 *   node scripts/fetch-brand-logos.ts --dry-run
 *   node scripts/fetch-brand-logos.ts --force   (refetch, replacing manifest)
 *   node scripts/fetch-brand-logos.ts --rebuild (re-render from recorded URLs —
 *        no crawling; use after changing the renderer or canvas constants)
 *
 * Candidate priority per brand (from the brand's own website, never a
 * third-party logo CDN):
 *   1. <img> whose src, alt or class names a logo (nav/header marks)
 *   2. <link rel="apple-touch-icon"> (large, square, usually full mark)
 *   3. <link rel="icon"> / /favicon.ico (last resort)
 *
 * Everything is rasterised to a padded, transparent-margined 512px WebP so the
 * mark sits cleanly inside BrandMark's rounded tile at any size. SVG sources
 * are rasterised via sharp, which also sidesteps next/image's SVG limits. A
 * favicon-sized find is still better than a monogram: BrandMark renders it,
 * we just note the lower confidence in the manifest.
 *
 * Output:
 *   public/brands/<slug>.webp
 *   public/brands/manifest.json  (provenance: source page, original URL, fetch
 *                                 date, bytes — so any logo can be traced or
 *                                 removed on request)
 *
 * After a run, copy each entry's `path` onto that brand as `logo` in
 * lib/brands.ts (the manifest tells you which slugs succeeded).
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// ── Config ───────────────────────────────────────────────────────────────────

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/125.0.0.0 Safari/537.36 SolarBuildersBot/1.0 (+https://solarbuilders.ng)";

const REQUEST_TIMEOUT_MS = 15_000;
const MIN_HOST_DELAY_MS = 1_500;
/** Raster canvas the mark is centred on. */
const CANVAS = 512;
/** Mark is scaled to fit inside this edge, then centred on the canvas. */
const MAX_EDGE = 400;
/** Reject sources smaller than this — a 16px favicon renders as mush at 56px. */
const MIN_SOURCE_EDGE = 48;
const MAX_DOWNLOAD_BYTES = 8 * 1024 * 1024;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(APP_ROOT, "public", "brands");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");

// ── Catalogue types (structural — the catalogue is imported at runtime) ──────

interface CatalogueBrand {
  slug: string;
  name: string;
  kind?: string;
  website?: string;
  logo?: string;
}

interface ManifestEntry {
  brand: string;
  name: string;
  path: string;
  sourceUrl: string;
  imageUrl: string;
  imageHost: string;
  fetchedOn: string;
  bytes: number;
  width: number;
  height: number;
  /**
   * How the image was identified — a rough trust ranking:
   * - "manual": hand-verified URL from OVERRIDES (best)
   * - "logo": an <img> that names itself a logo
   * - "social": og:image / twitter:image — the site's own brand card image
   * - "touch-icon": 180px apple-touch-icon
   * - "favicon": the fallback icon (worst — often small, sometimes generic)
   */
  confidence: "manual" | "logo" | "social" | "touch-icon" | "favicon";
}

interface Failure {
  brand: string;
  website?: string;
  reason: string;
}

// ── Small utilities ──────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(bad url)";
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39);/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function resolveUrl(base: string, candidate: string): string | undefined {
  try {
    return new URL(decodeEntities(candidate.trim()), base).toString();
  } catch {
    return undefined;
  }
}
/**
 * Matches a brand's name/slug in an image filename, e.g. "must" in must.png or
 * "sakopower" in sakopower.com_logo_new.webp. Multi-word names match on any
 * significant word (min 4 chars) so "Solar Depot" still matches solar-depot.
 */
export function buildBrandKey(brand: CatalogueBrand): RegExp {
  const words = `${brand.slug} ${brand.name}`.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const parts = [...new Set(words)];
  return parts.length ? new RegExp(`(?:${parts.join("|")})`, "i") : /$^/;
}


/** Part numbers, WhatsApp buttons, flags — the same junk the product pipeline rejects. */
const JUNK_RE =
  /(^|[^a-z0-9])(sprite|placeholder|avatar|banner|spinner|loading|loader|blank|dummy|no[-_]?image|noimage|flag|payment|paystack|visa|mastercard|whatsapp|social|arrow|star|rating|cart|search|menu|close|play|watermark|captcha|pixel|slider|hero|slide)([^a-z0-9]|$)/i;

const LAST_SEEN = new Date().toISOString().slice(0, 10);

// ── Polite fetching (mirrors fetch-product-images.ts) ────────────────────────

const lastHit = new Map<string, number>();

async function rawFetch(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: accept, "Accept-Language": "en-NG,en;q=0.9" },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function politeFetch(url: string, accept: string): Promise<Response> {
  const host = hostOf(url);
  const prev = lastHit.get(host) ?? 0;
  const wait = prev + MIN_HOST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());
  const res = await rawFetch(url, accept);
  if (res.status === 403 || res.status === 429) throw new Error(`HTTP ${res.status} from ${host}`);
  return res;
}


// ── Curated overrides ────────────────────────────────────────────────────────

/**
 * Hand-picked logo sources for brands where crawling the homepage gives the
 * wrong or no answer. Checked before any crawling happens.
 *
 * - string → fetch and render this exact URL (confidence "manual")
 * - { skip, reason } → never fetch; BrandMark keeps the monogram and the
 *   manifest carries no entry for the brand.
 */
const OVERRIDES: Record<string, string | { skip: true; reason: string }> = {
  // The homepage <img> has alt="Solar Depot" (no word "logo"), so the crawler
  // misses it; this is the actual brand mark from the same site.
  "solar-depot-ng": "https://www.solardepotng.com/image/catalog/solar-logoi.png",
  // zit.ng publishes only a white logo (invisible on light tiles); its favicon
  // is a generic shopping-bag icon, not a brand mark. Monogram reads better.
  zit: { skip: true, reason: "only a white logo published; favicon is a cart icon, not a mark" },
};

// ── Candidate discovery ──────────────────────────────────────────────────────

interface Candidate {
  url: string;
  confidence: ManifestEntry["confidence"];
}

/** All logo-bearing <img>s, then og:image, in try order (best first). */
function collectCandidates(html: string, pageUrl: string, brandKey: RegExp): Candidate[] {
  const out: Candidate[] = [];
  const push = (url: string | undefined, confidence: ManifestEntry["confidence"]) => {
    if (!url || /^data:/i.test(url)) return;
    out.push({ url, confidence });
  };

  // 1. <img> whose src/alt/class names a logo — the real brand marks. Link
  //    icons (tried later) are theme chrome (e.g. Cartzilla's generic cart
  //    favicon) and often worse than the site's own header logo.
  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = tag[0];
    const src =
      /(?:^|\s)(?:data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i.exec(t)?.[1] ??
      /(?:^|\s)srcset\s*=\s*["']([^"'\s]+)/i.exec(t)?.[1];
    const alt = /alt\s*=\s*["']([^"']*)["']/i.exec(t)?.[1] ?? "";
    const cls = /class\s*=\s*["']([^"']*)["']/i.exec(t)?.[1] ?? "";
    if (!src) continue;
    if (JUNK_RE.test(t)) continue;
    const decoded = decodeEntities(alt);
    const namesLogo =
      /logo/i.test(decoded) ||
      /logo/i.test(cls) ||
      /logo/i.test(src) ||
      /\bbrand(-|_)?mark\b/i.test(cls);
    if (!namesLogo) continue;
    push(resolveUrl(pageUrl, src), "logo");
  }

  // 2. <img> whose URL filename carries the brand name — catches WordPress
  //    headers like must.png or sakopower.com_logo_new.webp (fixes must, sako).
  for (const tag of html.matchAll(/<img\b[^>]*>/gi)) {
    const t = tag[0];
    if (JUNK_RE.test(t)) continue;
    const src = /(?:^|\s)src\s*=\s*["']([^"']+)["']/i.exec(t)?.[1];
    if (!src) continue;
    const base = (src.split("?")[0].split("/").pop() ?? "").toLowerCase();
    if (!base || !brandKey.test(base.replace(/\.[a-z0-9]+$/, ""))) continue;
    push(resolveUrl(pageUrl, src), "logo");
  }

  // 3. og:image / twitter:image — the site's own brand card, present on most
  //    corporate sites (fixes longi). Ranked below named <img>s because it is
  //    sometimes a lifestyle photo rather than the mark.
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const t = tag[0];
    const prop = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(t)?.[1]?.toLowerCase() ?? "";
    const content = /content\s*=\s*["']([^"']+)["']/i.exec(t)?.[1];
    if (!content) continue;
    if (prop === "og:image" || prop === "og:image:secure_url" || prop === "twitter:image" || prop === "twitter:image:src") {
      push(resolveUrl(pageUrl, content), "social");
    }
  }

  // 2. <link rel="apple-touch-icon" href> / <link rel="icon" href>
  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const t = tag[0];
    const rel = /rel\s*=\s*["']?([^"'>\s]+)/i.exec(t)?.[1]?.toLowerCase() ?? "";
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(t)?.[1];
    const sizes = /sizes\s*=\s*["']([^"']+)["']/i.exec(t)?.[1] ?? "";
    if (!href) continue;
    if (/apple-touch-icon/.test(rel)) push(resolveUrl(pageUrl, href), "touch-icon");
    else if (/\bicon\b/.test(rel) && !/mask-icon|shortcut/i.test(rel)) {
      // Prefer larger declared sizes; a 16px favicon renders as mush at 56px.
      const m = /(\d+)x(\d+)/i.exec(sizes);
      if (m && Number(m[1]) < MIN_SOURCE_EDGE) continue;
      push(resolveUrl(pageUrl, href), "favicon");
    }
  }

  return out;
}

/** Favicon fallbacks when the homepage markup yields nothing usable. */
function faviconFallbacks(origin: string): Candidate[] {
  return [
    { url: `${origin}/apple-touch-icon.png`, confidence: "touch-icon" },
    { url: `${origin}/favicon.ico`, confidence: "favicon" },
  ];
}

// ── Download & render ────────────────────────────────────────────────────────

async function download(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  const res = await politeFetch(url, "image/avif,image/webp,image/png,image/svg+xml,image/*,*/*");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const len = Number(res.headers.get("content-length") ?? 0);
  if (len > MAX_DOWNLOAD_BYTES) throw new Error(`too large (${len} bytes)`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength > MAX_DOWNLOAD_BYTES) throw new Error(`too large (${buffer.byteLength} bytes)`);
  if (buffer.byteLength < 256) throw new Error(`too small (${buffer.byteLength} bytes) — not an image`);
  return { buffer, contentType: res.headers.get("content-type") ?? "" };
}

async function renderLogo(input: Buffer, contentType: string) {
  const isSvg = contentType.includes("svg") || /^\s*<\?xml|^\s*<svg/i.test(input.toString("utf8", 0, 200));
  // Sharp needs a raster density to rasterise SVG crisply.
  const meta = await sharp(input, { density: isSvg ? 300 : undefined }).metadata();
  if (!meta.width || !meta.height) throw new Error("unreadable image dimensions");
  // A 16px favicon blown up to tile size is mush; below MIN_SOURCE_EDGE keep
  // the monogram instead.
  if (!isSvg && Math.max(meta.width, meta.height) < MIN_SOURCE_EDGE) throw new Error(`source too small (${meta.width}x${meta.height})`);

  // Trim uniform borders (white/transparent margins) so the mark — not its
  // letterbox — defines the crop. Without this a small logo inside a large
  // canvas renders as a speck in the middle of the tile.
  const trimmed = await sharp(input, { density: isSvg ? 300 : undefined })
    .trim({ threshold: 10 })
    .png()
    .toBuffer();
  const tmeta = await sharp(trimmed).metadata();
  if (!tmeta.width || !tmeta.height) throw new Error("trim produced an empty image");

  // Scale the mark to fill the tile. Rasters may be enlarged, but never more
  // than 8×: BrandMark displays at ~56px, so even a 32px source renders at
  // roughly native resolution on screen — the cap only guards against
  // absurd blowups of a 16px favicon, which are rejected above anyway.
  const longEdge = Math.max(tmeta.width, tmeta.height);
  const scale = Math.min(MAX_EDGE / longEdge, isSvg ? 10 : 8);
  const targetW = Math.max(1, Math.round(tmeta.width * scale));
  const targetH = Math.max(1, Math.round(tmeta.height * scale));
  const resized = await sharp(trimmed)
    .resize(targetW, targetH, { fit: "fill" })
    .png()
    .toBuffer();

  // Centre on a square canvas so every logo fills its BrandMark tile the same
  // way, regardless of aspect ratio.
  const out = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 0 } },
  })
    .composite([{ input: resized, gravity: "centre" }])
    .webp({ quality: 90, effort: 5 })
    .toBuffer({ resolveWithObject: true });

  return { buffer: out.data, width: out.info.width, height: out.info.height };
}



// ── Catalogue ────────────────────────────────────────────────────────────────

interface CatalogueModule {
  BRANDS: CatalogueBrand[];
}

/**
 * Read the catalogue statically rather than importing it: lib/brands.ts
 * imports "./brand-slugs" without an extension, which Node's ESM resolver
 * refuses (this is why scripts/fetch-product-images.ts currently fails the
 * same way). The fields we need sit at fixed positions in each brand block,
 * so a slice-per-slug parse is dependable — and it cannot break at runtime on
 * anything the catalogue imports.
 */
async function loadCatalogue(): Promise<CatalogueModule> {
  const source = await readFile(path.join(APP_ROOT, "lib", "brands.ts"), "utf8");
  const marks = [...source.matchAll(/\bslug:\s*"([^"]+)"/g)];
  const brands: CatalogueBrand[] = [];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index ?? 0;
    const end = i + 1 < marks.length ? (marks[i + 1].index ?? source.length) : source.length;
    const seg = source.slice(start, end);
    brands.push({
      slug: marks[i][1],
      name: /name:\s*"([^"]+)"/.exec(seg)?.[1] ?? marks[i][1],
      kind: /kind:\s*"([^"]+)"/.exec(seg)?.[1],
      website: /website:\s*"([^"]+)"/.exec(seg)?.[1],
    });
  }
  return { BRANDS: brands };
}


// ── Per-brand attempt ────────────────────────────────────────────────────────

async function tryBrand(
  brand: CatalogueBrand,
  dryRun: boolean,
): Promise<{ entry?: ManifestEntry; failure?: Failure }> {
  if (!brand.website) return { failure: { brand: brand.slug, reason: "no website in catalogue" } };

  // Curated override beats everything, including a previously recorded entry.
  const override = OVERRIDES[brand.slug];
  if (typeof override === "string") {
    try {
      const { buffer, contentType } = await download(override);
      const rendered = await renderLogo(buffer, contentType);
      if (!dryRun) await writeFile(path.join(OUT_DIR, `${brand.slug}.webp`), rendered.buffer);
      return {
        entry: {
          brand: brand.slug,
          name: brand.name,
          path: `/brands/${brand.slug}.webp`,
          sourceUrl: brand.website,
          imageUrl: override,
          imageHost: hostOf(override),
          fetchedOn: LAST_SEEN,
          bytes: rendered.buffer.byteLength,
          width: rendered.width,
          height: rendered.height,
          confidence: "manual",
        },
      };
    } catch (err) {
      // Fall through to crawling; note why the curated source failed.
      console.log(`  note   ${brand.slug} — override failed (${(err as Error).message}), crawling instead`);
    }
  }

  let html: string;
  try {
    const res = await politeFetch(brand.website, "text/html,*/*");
    if (!res.ok) throw new Error(`HTTP ${res.status} on homepage`);
    html = await res.text();
  } catch (err) {
    return { failure: { brand: brand.slug, website: brand.website, reason: `homepage: ${(err as Error).message}` } };
  }

  const origin = new URL(brand.website).origin;
  const candidates = [...collectCandidates(html, brand.website, buildBrandKey(brand)), ...faviconFallbacks(origin)];

  for (const candidate of candidates) {
    try {
      const { buffer, contentType } = await download(candidate.url);
      if (contentType.includes("html")) throw new Error("got an HTML page, not an image");
      const rendered = await renderLogo(buffer, contentType);
      if (!dryRun) await writeFile(path.join(OUT_DIR, `${brand.slug}.webp`), rendered.buffer);
      return {
        entry: {
          brand: brand.slug,
          name: brand.name,
          path: `/brands/${brand.slug}.webp`,
          sourceUrl: brand.website,
          imageUrl: candidate.url,
          imageHost: hostOf(candidate.url),
          fetchedOn: LAST_SEEN,
          bytes: rendered.buffer.byteLength,
          width: rendered.width,
          height: rendered.height,
          confidence: candidate.confidence,
        },
      };
    } catch {
      // Try the next candidate; report only if everything fails.
      continue;
    }
  }
  return { failure: { brand: brand.slug, website: brand.website, reason: "no usable logo candidate" } };
}


// ── Run ──────────────────────────────────────────────────────────────────────

interface Args {
  only: string[];
  dryRun: boolean;
  force: boolean;
  rebuild: boolean;
}

function parseArgs(argv: string[]): Args {
  const only: string[] = [];
  let dryRun = false;
  let force = false;
  let rebuild = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--force") force = true;
    else if (arg === "--rebuild") rebuild = true;
    else if (arg.startsWith("--only=")) only.push(...arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean));
    else if (arg.startsWith("--"))
      throw new Error(`unknown flag: ${arg} (supported: --only=<slug>, --dry-run, --force, --rebuild)`);
  }
  return { only, dryRun, force, rebuild };
}

/** Re-render every recorded logo from its recorded source URL (no crawling). */
async function rebuildFromManifest(
  dryRun: boolean,
  only: string[],
): Promise<{ entries: ManifestEntry[]; failures: Failure[] }> {
  const old = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as { logos?: ManifestEntry[] };
  const entries: ManifestEntry[] = [];
  const failures: Failure[] = [];
  for (const prior of old.logos ?? []) {
    // Entries outside --only are carried over untouched, so a targeted rebuild
    // never drops the rest of the record.
    if (only.length && !only.includes(prior.brand)) {
      entries.push(prior);
      continue;
    }
    try {
      const { buffer, contentType } = await download(prior.imageUrl);
      const rendered = await renderLogo(buffer, contentType);
      if (!dryRun) await writeFile(path.join(OUT_DIR, `${prior.brand}.webp`), rendered.buffer);
      entries.push({ ...prior, bytes: rendered.buffer.byteLength, fetchedOn: LAST_SEEN });
      console.log(`  rebuilt ${prior.brand} — ${rendered.buffer.byteLength} bytes`);
    } catch (err) {
      entries.push(prior); // keep the old provenance and file
      failures.push({ brand: prior.brand, reason: `kept existing file (${(err as Error).message})` });
      console.log(`  kept    ${prior.brand} — ${(err as Error).message}`);
    }
  }
  return { entries, failures };
}



async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(OUT_DIR, { recursive: true });

  // --rebuild: re-render from recorded URLs, no crawling. Used after changing
  // the renderer (or CANVAS/MAX_EDGE) to refresh files without re-visiting
  // every brand's homepage.
  if (args.rebuild) {
    console.log(`rebuilding from ${path.relative(APP_ROOT, MANIFEST_PATH)}\n`);
    const { entries, failures } = await rebuildFromManifest(args.dryRun, args.only);
    console.log(`\nrebuilt ${entries.length - failures.length}, kept ${failures.length}`);
    if (args.dryRun) return;
    entries.sort((a, b) => a.brand.localeCompare(b.brand));
    await writeFile(
      MANIFEST_PATH,
      JSON.stringify({ generatedOn: new Date().toISOString(), logos: entries }, null, 2) + "\n",
    );
    return;
  }

  const { BRANDS } = await loadCatalogue();
  const targets = BRANDS.filter((b) => (args.only.length ? args.only.includes(b.slug) : true));
  console.log(
    `${targets.length} brands${args.only.length ? " (--only)" : ""}, ${args.dryRun ? "dry run" : "writing to public/brands/"}\n`,
  );

  // Carry provenance forward across runs. Entries for brands outside the
  // current target set (a --only run) are always carried over untouched, so a
  // one-brand refetch can never clobber the rest of the manifest. --force
  // still replaces entries for the targeted brands themselves.
  const previous = new Map<string, ManifestEntry>();
  const carried: ManifestEntry[] = [];
  try {
    const old = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as { logos?: ManifestEntry[] };
    for (const e of old.logos ?? []) {
      if (targets.some((b) => b.slug === e.brand)) previous.set(e.brand, e);
      else carried.push(e);
    }
  } catch {
    // no manifest yet — first run
  }

  const entries: ManifestEntry[] = [];
  const failures: Failure[] = [];

  for (const brand of targets) {
    // Curated skip: this brand never gets a fetched logo (see OVERRIDES).
    const skip = OVERRIDES[brand.slug];
    if (skip && typeof skip === "object") {
      if (previous.has(brand.slug)) await rm(path.join(OUT_DIR, `${brand.slug}.webp`), { force: true });
      console.log(`  skip   ${brand.slug} — ${skip.reason}`);
      continue;
    }
    const prior = previous.get(brand.slug);
    if (prior && !args.force) {
      entries.push(prior);
      console.log(`  keep   ${brand.slug} — already on record (${prior.imageUrl})`);
      continue;
    }
    const { entry, failure } = await tryBrand(brand, args.dryRun);
    if (entry) {
      entries.push(entry);
      console.log(`  ok     ${brand.slug} — ${entry.confidence} from ${entry.imageHost}`);
    } else {
      failures.push(failure as Failure);
      console.log(`  fail   ${brand.slug} — ${(failure as Failure).reason}`);
    }
  }

  console.log("\n─── summary ───────────────────────────────────────────");
  console.log(`brands           ${targets.length}`);
  console.log(`logos on record  ${entries.length}`);
  console.log(`failed           ${failures.length}`);
  if (failures.length) {
    console.log("\nFailures (these keep their monogram in BrandMark):");
    for (const f of failures) console.log(`  ${f.brand.padEnd(20)} ${f.reason}`);
  }

  if (args.dryRun) {
    console.log("\nDry run — manifest not written.");
    return;
  }

  entries.sort((a, b) => a.brand.localeCompare(b.brand));
  const final = [...carried, ...entries].sort((a, b) => a.brand.localeCompare(b.brand));
  await writeFile(
    MANIFEST_PATH,
    JSON.stringify({ generatedOn: new Date().toISOString(), logos: final }, null, 2) + "\n",
  );
  console.log(`\nmanifest → ${path.relative(APP_ROOT, MANIFEST_PATH)} (${final.length} logos on record)`);
  console.log('\nNext: set `logo: "/brands/<slug>.webp"` on each brand in lib/brands.ts.');
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
