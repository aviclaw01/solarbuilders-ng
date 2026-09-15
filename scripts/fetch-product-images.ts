#!/usr/bin/env node
/**
 * scripts/fetch-product-images.ts — re-runnable product photo pipeline.
 *
 * Fetch once → convert to WebP → store under public/products/ → serve from our
 * own domain. We never hotlink vendor images: their sites have bot protection,
 * and a shop whose photos break at random is worse than one with none.
 *
 * Run (Node 22+, native TS type stripping — no build step):
 *
 *   node scripts/fetch-product-images.ts
 *   node scripts/fetch-product-images.ts --only=deye
 *   node scripts/fetch-product-images.ts --dry-run
 *
 * Politeness: robots.txt is honoured per host, requests to the same host are
 * spaced by at least 1.5s, every request has a 10s timeout, and a 403/429 makes
 * us give up on that host for the rest of the run rather than retry into a ban.
 *
 * Correctness over coverage: a wrong photo is far worse than the category
 * illustration ProductImage falls back to. Most catalogue rows share a source
 * page with several other models (a category or listing page), so on those
 * pages an image is only accepted when its filename or alt text identifies the
 * model — never the page-level og:image, which would hand five models the same
 * picture. Anything we are not confident about is skipped and reported.
 *
 * Output:
 *   public/products/<brand-slug>--<model-slug>.webp
 *   public/products/manifest.json     (provenance: source page, original image
 *                                      URL, fetch date, bytes — so any image
 *                                      can be traced or removed on request)
 *   public/products/attribution.json  (path → source site, imported by
 *                                      components/ui/ProductImage.tsx)
 *
 * After a run, copy the manifest onto the catalogue: every entry's `path`,
 * `sourceUrl` and `fetchedOn` belong on that product as `image`, `imageSource`
 * and `imageFetchedOn` in lib/brands.ts. Products with no entry keep the
 * category illustration — never fill one in by hand.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// ── Config ───────────────────────────────────────────────────────────────────

/** Identifies us honestly while still being a real browser UA string. */
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/125.0.0.0 Safari/537.36 SolarBuildersBot/1.0 (+https://solarbuilders.ng)";
/** Token we look for in robots.txt groups, besides `*`. */
const ROBOTS_TOKEN = "solarbuildersbot";

const REQUEST_TIMEOUT_MS = 10_000;
const MIN_HOST_DELAY_MS = 1_500;
const MAX_EDGE = 800;
const WEBP_QUALITY = 80;
const WEBP_RETRY_QUALITY = 62;
const TARGET_BYTES = 80 * 1024;
const MIN_SOURCE_EDGE = 200;
const MAX_DOWNLOAD_BYTES = 12 * 1024 * 1024;
/** How many hosts we work through at once (each host stays strictly serial). */
const HOST_CONCURRENCY = 4;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(HERE, "..");
const OUT_DIR = path.join(APP_ROOT, "public", "products");
const MANIFEST_PATH = path.join(OUT_DIR, "manifest.json");
const ATTRIBUTION_PATH = path.join(OUT_DIR, "attribution.json");

// ── Catalogue types (structural — the catalogue is imported at runtime) ───────

interface CatalogueProduct {
  category: string;
  model: string;
  spec: string;
  kva?: number;
  kwh?: number;
  watts?: number;
  sourceUrl: string;
}
interface CatalogueBrand {
  slug: string;
  name: string;
  kind?: string;
  products: CatalogueProduct[];
}

interface Job {
  brandSlug: string;
  brandName: string;
  model: string;
  spec: string;
  category: string;
  sourceUrl: string;
  kva?: number;
  kwh?: number;
  watts?: number;
  /** public path, e.g. /products/deye--sun-5k-sg-1-phase.webp */
  publicPath: string;
  fileName: string;
  /** true when this job is the only catalogue row pointing at sourceUrl */
  ownsPage: boolean;
  /** identifying tokens of OTHER models by the same brand — a photo naming one
   *  of these is that model's photo, not ours */
  rivalTokens: string[];
}

interface ManifestEntry {
  brand: string;
  model: string;
  path: string;
  sourceUrl: string;
  imageUrl: string;
  imageHost: string;
  fetchedOn: string;
  bytes: number;
  width: number;
  height: number;
  confidence: "page" | "high" | "medium";
  matchedOn: string;
}

interface Failure {
  brand: string;
  model: string;
  sourceUrl: string;
  reason: string;
}

// ── Small utilities ──────────────────────────────────────────────────────────

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Lowercased, punctuation → single spaces. Token-boundary friendly. */
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Same, with every separator removed — for concatenated filenames. */
function compact(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Whole-token search: "8kw" matches "deye 8kw hybrid" but not "18kw". */
function hasToken(haystackNorm: string, token: string): boolean {
  const t = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^| )${t}( |$)`).test(haystackNorm);
}

// ── robots.txt ───────────────────────────────────────────────────────────────

interface RobotsRule {
  pattern: string;
  re: RegExp;
  allow: boolean;
}

interface Robots {
  /** null = no applicable group, everything allowed */
  rules: RobotsRule[] | null;
  note: string;
}

function ruleToRegex(pattern: string): RegExp {
  let out = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*") out += ".*";
    else if (ch === "$" && i === pattern.length - 1) out += "$";
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp("^" + out);
}

function parseRobots(text: string): Robots {
  interface Group {
    agents: string[];
    rules: { pattern: string; allow: boolean }[];
  }
  const groups: Group[] = [];
  let current: Group | null = null;
  let lastLineWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep < 0) continue;
    const field = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();

    if (field === "user-agent") {
      if (!current || !lastLineWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastLineWasAgent = true;
      continue;
    }
    lastLineWasAgent = false;
    if (field !== "allow" && field !== "disallow") continue;
    if (!current) {
      current = { agents: ["*"], rules: [] };
      groups.push(current);
    }
    // `Disallow:` with an empty value means "nothing is disallowed".
    if (field === "disallow" && value === "") continue;
    if (!value.startsWith("/")) continue;
    current.rules.push({ pattern: value, allow: field === "allow" });
  }

  const named = groups.find((g) => g.agents.some((a) => a.includes(ROBOTS_TOKEN)));
  const star = groups.find((g) => g.agents.includes("*"));
  const chosen = named ?? star;
  if (!chosen) return { rules: null, note: "no applicable group" };
  return {
    rules: chosen.rules.map((r) => ({ pattern: r.pattern, re: ruleToRegex(r.pattern), allow: r.allow })),
    note: named ? `group for ${ROBOTS_TOKEN}` : "group for *",
  };
}

/** Longest matching rule wins; Allow wins a tie (standard robots semantics). */
function robotsAllows(robots: Robots, url: URL): boolean {
  if (!robots.rules) return true;
  const target = url.pathname + url.search;
  let best: RobotsRule | null = null;
  for (const rule of robots.rules) {
    if (!rule.re.test(target)) continue;
    if (!best || rule.pattern.length > best.pattern.length || (rule.pattern.length === best.pattern.length && rule.allow)) {
      best = rule;
    }
  }
  return best ? best.allow : true;
}

// ── Polite fetching ──────────────────────────────────────────────────────────

const lastHitAt = new Map<string, number>();
const blockedHosts = new Map<string, string>();
const robotsCache = new Map<string, Promise<Robots>>();

class HostBlocked extends Error {}

async function hostGate(host: string): Promise<void> {
  const last = lastHitAt.get(host);
  if (last !== undefined) {
    const wait = MIN_HOST_DELAY_MS - (Date.now() - last);
    if (wait > 0) await sleep(wait);
  }
  lastHitAt.set(host, Date.now());
}

async function rawFetch(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: accept,
        "Accept-Language": "en-NG,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function getRobots(origin: string): Promise<Robots> {
  const cached = robotsCache.get(origin);
  if (cached) return cached;
  const p = (async (): Promise<Robots> => {
    const host = new URL(origin).host;
    try {
      await hostGate(host);
      const res = await rawFetch(`${origin}/robots.txt`, "text/plain,*/*");
      // RFC 9309: 429 or 5xx means "unavailable" — assume we are not welcome.
      // Any other 4xx means there simply is no robots.txt (a CDN answering 403
      // for a missing object is the common case), which allows everything.
      if (res.status === 429) {
        blockedHosts.set(host, "robots.txt returned 429");
        return { rules: [{ pattern: "/", re: ruleToRegex("/"), allow: false }], note: "rate-limited (429)" };
      }
      if (res.status >= 500) {
        return { rules: [{ pattern: "/", re: ruleToRegex("/"), allow: false }], note: `robots.txt server error (${res.status})` };
      }
      if (!res.ok) return { rules: null, note: `no robots.txt (${res.status})` };
      const ct = res.headers.get("content-type") ?? "";
      const body = await res.text();
      // Some hosts answer /robots.txt with their HTML 404 page.
      if (ct.includes("html") || /^\s*</.test(body)) return { rules: null, note: "robots.txt not served as text" };
      return parseRobots(body);
    } catch (err) {
      return { rules: null, note: `robots.txt unreachable (${(err as Error).message})` };
    }
  })();
  robotsCache.set(origin, p);
  return p;
}

/** Robots-checked, rate-limited, timed-out fetch. Throws HostBlocked on 403/429. */
async function politeFetch(url: string, accept: string): Promise<Response> {
  const u = new URL(url);
  const blocked = blockedHosts.get(u.host);
  if (blocked) throw new HostBlocked(`host given up on: ${blocked}`);

  const robots = await getRobots(u.origin);
  if (!robotsAllows(robots, u)) throw new Error(`robots-disallowed:${u.host}${u.pathname}`);
  if (blockedHosts.has(u.host)) throw new HostBlocked(`host given up on: ${blockedHosts.get(u.host)}`);

  await hostGate(u.host);
  const res = await rawFetch(url, accept);
  if (res.status === 403 || res.status === 429) {
    blockedHosts.set(u.host, `HTTP ${res.status} on ${u.pathname}`);
    throw new HostBlocked(`HTTP ${res.status} — giving up on ${u.host}`);
  }
  return res;
}

// ── HTML scraping ────────────────────────────────────────────────────────────

interface Candidate {
  url: string;
  /** alternative URL to try if `url` 404s (e.g. the resized original) */
  fallbackUrl?: string;
  alt: string;
  gallery: boolean;
  origin: "og" | "jsonld" | "img";
  index: number;
  widthAttr?: number;
  heightAttr?: number;
}

const JUNK_RE =
  /(^|[^a-z0-9])(logo|icon|sprite|favicon|placeholder|avatar|banner|badge|spinner|loading|loader|blank|dummy|no[-_]?image|noimage|flag|payment|paystack|visa|mastercard|whatsapp|social|arrow|star|rating|cart|search|menu|close|play|watermark|footer|header|captcha|pixel)([^a-z0-9]|$)/i;

const GALLERY_RE =
  /(gallery|product[-_]?(image|photo|media|gal)|woocommerce-product-gallery|main[-_]?image|featured[-_]?image|swiper|slick|flickity|fancybox|zoom|carousel|thumbnails?)/i;

function tagAttrs(tag: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tag))) {
    out[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? "");
  }
  return out;
}

function biggestFromSrcset(srcset: string): string | undefined {
  let best: { url: string; weight: number } | undefined;
  for (const part of srcset.split(",")) {
    const bits = part.trim().split(/\s+/);
    if (!bits[0]) continue;
    const d = bits[1] ?? "";
    const weight = d.endsWith("w") ? Number(d.slice(0, -1)) : d.endsWith("x") ? Number(d.slice(0, -1)) * 1000 : 1;
    if (!best || weight > best.weight) best = { url: bits[0], weight: Number.isFinite(weight) ? weight : 1 };
  }
  return best?.url;
}

function absolute(raw: string, base: string): string | undefined {
  const value = raw.trim();
  if (!value || value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("#")) return undefined;
  try {
    const u = new URL(value, base);
    if (u.protocol !== "http:" && u.protocol !== "https:") return undefined;
    u.hash = "";
    return u.href;
  } catch {
    return undefined;
  }
}

/** WordPress/Shopify resize suffixes hide the full-size original. */
function fullSizeVariant(url: string): string | undefined {
  const stripped = url
    .replace(/[-_](\d{2,4})x(\d{2,4})(?=\.(?:jpe?g|png|webp)(?:$|\?))/i, "")
    .replace(/(\.(?:jpe?g|png|webp))_\d{2,4}x\d{2,4}(?=$|\?)/i, "$1");
  return stripped !== url ? stripped : undefined;
}

function looksTooSmall(url: string, attrsWidth?: number, attrsHeight?: number): boolean {
  if (attrsWidth !== undefined && attrsWidth > 0 && attrsWidth < MIN_SOURCE_EDGE) return true;
  if (attrsHeight !== undefined && attrsHeight > 0 && attrsHeight < MIN_SOURCE_EDGE) return true;
  const m = /[-_](\d{2,4})x(\d{2,4})\.(?:jpe?g|png|webp)(?:$|\?)/i.exec(url);
  if (m && Number(m[1]) < MIN_SOURCE_EDGE && Number(m[2]) < MIN_SOURCE_EDGE) return true;
  return false;
}

function extractCandidates(html: string, pageUrl: string): Candidate[] {
  const out: Candidate[] = [];
  let index = 0;

  const push = (rawUrl: string | undefined, c: Omit<Candidate, "url" | "index">) => {
    if (!rawUrl) return;
    const abs = absolute(rawUrl, pageUrl);
    if (!abs) return;
    const clean = abs.split("?")[0];
    if (/\.(svg|gif|ico|bmp|tiff?)(?:$|\?)/i.test(clean)) return;
    if (JUNK_RE.test(decodeURIComponent(clean))) return;
    const full = fullSizeVariant(abs);
    out.push({ ...c, url: full ?? abs, fallbackUrl: full ? abs : undefined, index: index++ });
  };

  // 1. og:image / twitter:image
  const metaRe = /<meta\b[^>]*>/gi;
  let meta: RegExpExecArray | null;
  while ((meta = metaRe.exec(html))) {
    const a = tagAttrs(meta[0]);
    const key = (a.property ?? a.name ?? "").toLowerCase();
    if (key === "og:image" || key === "og:image:secure_url" || key === "twitter:image" || key === "twitter:image:src") {
      push(a.content, { alt: "", gallery: false, origin: "og" });
    }
  }

  // 2. JSON-LD Product images (often the cleanest, model-accurate source)
  const ldRe = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let ld: RegExpExecArray | null;
  while ((ld = ldRe.exec(html))) {
    let data: unknown;
    try {
      data = JSON.parse(ld[1].trim());
    } catch {
      continue;
    }
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(walk);
        return;
      }
      if (!node || typeof node !== "object") return;
      const obj = node as Record<string, unknown>;
      const type = String(obj["@type"] ?? "");
      if (/product/i.test(type)) {
        const name = typeof obj.name === "string" ? obj.name : "";
        const images = Array.isArray(obj.image) ? obj.image : obj.image ? [obj.image] : [];
        for (const img of images) {
          const src = typeof img === "string" ? img : (img as Record<string, unknown>)?.url;
          if (typeof src === "string") push(src, { alt: name, gallery: true, origin: "jsonld" });
        }
      }
      for (const v of Object.values(obj)) walk(v);
    };
    walk(data);
  }

  // 3. <img> tags, with a peek at the preceding markup to spot galleries
  const imgRe = /<img\b[^>]*>/gi;
  let img: RegExpExecArray | null;
  while ((img = imgRe.exec(html))) {
    const a = tagAttrs(img[0]);
    const context = html.slice(Math.max(0, img.index - 400), img.index);
    const gallery =
      GALLERY_RE.test(context) ||
      GALLERY_RE.test(`${a.class ?? ""} ${a.id ?? ""}`) ||
      "data-large_image" in a ||
      "data-zoom-image" in a;

    const src =
      a["data-large_image"] ??
      a["data-zoom-image"] ??
      a["data-full-url"] ??
      (a.srcset ? biggestFromSrcset(a.srcset) : undefined) ??
      (a["data-srcset"] ? biggestFromSrcset(a["data-srcset"]) : undefined) ??
      a.src ??
      a["data-src"] ??
      a["data-lazy-src"] ??
      a["data-original"];

    const width = Number(a.width);
    const height = Number(a.height);
    const widthAttr = Number.isFinite(width) && width > 0 ? width : undefined;
    const heightAttr = Number.isFinite(height) && height > 0 ? height : undefined;
    if (src && looksTooSmall(src, widthAttr, heightAttr)) continue;

    push(src, { alt: a.alt ?? a.title ?? "", gallery, origin: "img", widthAttr, heightAttr });
  }

  // de-duplicate by URL, keeping the richest record
  const seen = new Map<string, Candidate>();
  for (const c of out) {
    const prev = seen.get(c.url);
    if (!prev || (!prev.alt && c.alt) || (!prev.gallery && c.gallery)) seen.set(c.url, prev ? { ...prev, ...c } : c);
  }
  return [...seen.values()];
}

function pageTitle(html: string): string {
  const t = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return t ? decodeEntities(t[1]).trim() : "";
}

// ── Matching a candidate to a model ──────────────────────────────────────────

const MODEL_STOPWORDS = new Set([
  "solar", "inverter", "inverters", "battery", "batteries", "panel", "panels", "hybrid", "pure", "sine",
  "wave", "with", "and", "for", "the", "kva", "kwh", "phase", "single", "lithium", "lifepo4", "mppt",
  "charge", "controller", "package", "packages", "system", "all", "black", "frame", "cells", "cell",
  "mono", "perc", "bifacial", "new", "gen", "off", "grid", "wall", "mount", "standing", "warranty",
  "years", "year", "pack", "bms", "volt", "volts", "deep", "cycle", "power", "energy", "lv", "hv",
  "eu", "ii", "pro", "plus", "series", "line", "kit", "bundle", "one", "two",
]);

const SPEC_TOKEN_RE = /^\d+(?:\.\d+)?(?:kva|kw|kwh|v|ah|w|a)$/;

/**
 * Other manufacturers in our own catalogue. If a photo's URL or alt text names
 * one of them, it is not this brand's product — reject it. This is what stops a
 * Dyness PowerBrick being filed under Deye on a shared listing page.
 */
let COMPETING_BRANDS: { slug: string; name: string; tokens: string[] }[] = [];

const GENERIC_BRAND_TOKENS = new Set([
  "solar", "energy", "power", "group", "technologies", "technology", "nigeria", "limited", "ltd",
  "must", "blue", "green", "sun", "new", "max", "pro", "store", "depot", "mart", "electric",
]);

function buildBrandIndex(brands: CatalogueBrand[]): void {
  COMPETING_BRANDS = brands
    .filter((b) => (b.kind ?? "manufacturer") === "manufacturer")
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      tokens: normalize(b.name)
        .split(" ")
        .filter((t) => t.length >= 4 && !GENERIC_BRAND_TOKENS.has(t)),
    }))
    .filter((b) => b.tokens.length > 0);
}

interface ModelKeys {
  /** part-number-ish tokens: LPBF48200, SG04LP3, 5048 — these identify a model */
  part: string[];
  /** family/product-line words: IVEM, Quattro, HiKu, SunVault — supporting only */
  family: string[];
  /** capacity tokens derived from the structured fields (8kw, 5.12kwh, 600w) */
  capacity: string[];
  /** the numbers behind those, used to spot a contradicting rating */
  powerNumbers: number[];
  watts?: number;
  brandTokens: string[];
}

function modelKeys(job: Job): ModelKeys {
  const part: string[] = [];
  const family: string[] = [];
  for (const token of normalize(job.model).split(" ")) {
    if (!token || MODEL_STOPWORDS.has(token)) continue;
    if (SPEC_TOKEN_RE.test(token)) continue;
    const hasDigit = /\d/.test(token);
    const hasAlpha = /[a-z]/.test(token);
    if (hasDigit && hasAlpha && token.length >= 4) part.push(token);
    else if (hasDigit && !hasAlpha && token.length >= 4) part.push(token);
    else if (!hasDigit && token.length >= 4) family.push(token);
  }
  // "IVEM 5048" in a model name is one part number split by a space.
  const raw = normalize(job.model).split(" ").filter(Boolean);
  for (let i = 0; i < raw.length - 1; i++) {
    if (/^[a-z]+$/.test(raw[i]) && /^\d{3,}$/.test(raw[i + 1])) part.push(raw[i] + raw[i + 1]);
  }

  const capacity: string[] = [];
  const powerNumbers: number[] = [];
  if (job.kva !== undefined) {
    capacity.push(`${job.kva}kva`, `${job.kva}kw`);
    powerNumbers.push(job.kva);
  }
  if (job.kwh !== undefined) {
    capacity.push(`${job.kwh}kwh`, `${job.kwh}kw`);
    powerNumbers.push(job.kwh);
  }
  if (job.watts !== undefined) capacity.push(`${job.watts}w`, `${job.watts}watt`, `${job.watts}watts`);

  const brandTokens = normalize(job.brandName)
    .split(" ")
    .filter((t) => t.length >= 3 && !MODEL_STOPWORDS.has(t));

  return { part, family, capacity, powerNumbers, watts: job.watts, brandTokens };
}

/** Tokens of a string, plus alpha+digit pairs rejoined ("lpbf 48100" → lpbf48100). */
function tokenSet(normalized: string): Set<string> {
  const parts = normalized.split(" ").filter(Boolean);
  const set = new Set(parts);
  for (let i = 0; i < parts.length - 1; i++) {
    if (/^[a-z]+$/.test(parts[i]) && /^\d+$/.test(parts[i + 1])) set.add(parts[i] + parts[i + 1]);
  }
  return set;
}

const UNIT_TOKEN_RE = /^(\d+(?:\.\d+)?)(kva|kwh|kw|watts|watt|w)$/;

/** A rating in the filename/alt that the model does not have → not this model. */
function capacityConflict(tokens: Set<string>, keys: ModelKeys): string | null {
  for (const token of tokens) {
    const m = UNIT_TOKEN_RE.exec(token);
    if (!m) continue;
    const value = Number(m[1]);
    const isWatt = m[2] === "w" || m[2].startsWith("watt");
    if (isWatt) {
      if (keys.watts === undefined) continue;
      // Panel wattages are exact — 590W and 600W are different products.
      if (value !== keys.watts) return token;
    } else {
      if (!keys.powerNumbers.length) continue;
      // 3% tolerance so "5kWh" and "5.12kWh" are the same battery.
      if (!keys.powerNumbers.some((p) => Math.abs(p - value) <= Math.max(p, value) * 0.03)) return token;
    }
  }
  return null;
}

/** LPBF48100 is not LPBF48200: same part family, different unit. */
function partConflict(tokens: Set<string>, keys: ModelKeys): string | null {
  for (const modelToken of keys.part) {
    const m = /^([a-z]{3,})(\d+)/.exec(modelToken);
    if (!m) continue;
    for (const token of tokens) {
      const h = /^([a-z]{3,})(\d+)/.exec(token);
      if (h && h[1] === m[1] && h[2] !== m[2]) return token;
    }
  }
  return null;
}

function conflictingBrand(tokens: Set<string>, compacted: string, ownSlug: string): string | null {
  for (const brand of COMPETING_BRANDS) {
    if (brand.slug === ownSlug) continue;
    for (const t of brand.tokens) {
      if (tokens.has(t) || compacted.includes(t)) return brand.name;
    }
  }
  return null;
}

interface Match {
  score: number;
  confidence: "page" | "high" | "medium";
  matchedOn: string;
}

/**
 * Decide whether `candidate` is confidently THIS model's photo.
 *
 * On a page that belongs to a single catalogue row we can trust the page's own
 * primary image. On a listing page shared by several models we cannot — there
 * the image URL or alt text has to identify the model (a part number, or the
 * brand plus the exact rating) before we will use it.
 *
 * Whatever the evidence for, the evidence against wins: a competing brand name,
 * a different kW/kWh rating or a neighbouring part number all veto the match.
 * A wrong photo is worse than the category illustration we fall back to.
 */
function matchCandidate(candidate: Candidate, job: Job, keys: ModelKeys, title: string, ownsPage: boolean): Match | null {
  let urlPath = "";
  try {
    urlPath = decodeURIComponent(new URL(candidate.url).pathname);
  } catch {
    urlPath = candidate.url;
  }
  const hayNorm = normalize(`${candidate.alt} ${urlPath}`);
  const hayCompact = compact(`${candidate.alt} ${urlPath}`);
  const hayTokens = tokenSet(hayNorm);
  const unitTokens = tokenSet(hayNorm.replace(/(\d) (?=\d)/g, "$1."));
  const titleNorm = normalize(title);

  // ── vetoes ──
  const rival = conflictingBrand(hayTokens, hayCompact, job.brandSlug);
  if (rival) return null;
  if (job.rivalTokens.some((t) => hayTokens.has(t))) return null;
  if (capacityConflict(unitTokens, keys)) return null;
  if (partConflict(hayTokens, keys)) return null;

  // ── evidence ──
  const partHits = keys.part.filter((t) => hayTokens.has(t) || (t.length >= 5 && hayCompact.includes(compact(t))));
  const familyHits = keys.family.filter((t) => hayTokens.has(t) || hayCompact.includes(t));
  const capacityHits = keys.capacity.filter((t) => hayTokens.has(t) || unitTokens.has(t));
  const brandHit = keys.brandTokens.some((t) => hayTokens.has(t) || hayCompact.includes(t));
  const brandInTitle = keys.brandTokens.some((t) => hasToken(titleNorm, t));

  const reasons: string[] = [];
  if (partHits.length) reasons.push(`part:${partHits.join("+")}`);
  if (familyHits.length) reasons.push(`family:${familyHits.join("+")}`);
  if (capacityHits.length) reasons.push(`capacity:${capacityHits[0]}`);
  if (brandHit) reasons.push("brand-named");

  // Strongest: the image names a part number of this model.
  if (partHits.length >= 2 || partHits.some((t) => t.length >= 5) || (partHits.length && (brandHit || capacityHits.length))) {
    return {
      score: 100 + partHits.length * 10 + (brandHit ? 5 : 0) + (capacityHits.length ? 3 : 0),
      confidence: "high",
      matchedOn: reasons.join(", "),
    };
  }
  // Good enough on a listing page: the right brand (or product line) with this
  // exact rating, and nothing contradicting it.
  if (capacityHits.length && (brandHit || familyHits.length)) {
    return {
      score: 70 + capacityHits.length + (familyHits.length ? 5 : 0),
      confidence: "medium",
      matchedOn: reasons.join(", "),
    };
  }
  // A page dedicated to this single product: its primary image is the product,
  // as long as the page really is about this brand/model.
  if (ownsPage && (candidate.origin === "og" || candidate.origin === "jsonld" || candidate.gallery)) {
    const pageIsAboutModel =
      brandInTitle ||
      keys.part.some((t) => hasToken(titleNorm, t) || compact(title).includes(compact(t))) ||
      keys.brandTokens.some((t) => compact(job.sourceUrl).includes(t));
    if (pageIsAboutModel) {
      const base = candidate.origin === "og" ? 50 : candidate.origin === "jsonld" ? 48 : 40;
      return {
        score: base + (capacityHits.length ? 5 : 0) + (partHits.length ? 5 : 0) + (brandHit ? 2 : 0),
        confidence: "page",
        matchedOn: `dedicated page (${candidate.origin})${reasons.length ? ", " + reasons.join(", ") : ""}`,
      };
    }
  }
  return null;
}

// ── Image download + conversion ──────────────────────────────────────────────

interface Converted {
  bytes: number;
  width: number;
  height: number;
  buffer: Buffer;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await politeFetch(url, "image/avif,image/webp,image/jpeg,image/png,*/*");
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const type = res.headers.get("content-type") ?? "";
  if (type && !type.startsWith("image/")) throw new Error(`not an image (${type})`);
  const length = Number(res.headers.get("content-length") ?? 0);
  if (length > MAX_DOWNLOAD_BYTES) throw new Error(`image too large (${length} bytes)`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_DOWNLOAD_BYTES) throw new Error(`image too large (${buf.byteLength} bytes)`);
  if (buf.byteLength < 1024) throw new Error(`image suspiciously small (${buf.byteLength} bytes)`);
  return buf;
}

async function convert(input: Buffer): Promise<Converted> {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < MIN_SOURCE_EDGE || h < MIN_SOURCE_EDGE) throw new Error(`source too small (${w}x${h})`);

  const render = async (quality: number): Promise<Converted> => {
    const pipeline = sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .webp({ quality, effort: 5 });
    const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
    return { buffer: data, bytes: data.byteLength, width: info.width, height: info.height };
  };

  let result = await render(WEBP_QUALITY);
  if (result.bytes > TARGET_BYTES) {
    const smaller = await render(WEBP_RETRY_QUALITY);
    if (smaller.bytes < result.bytes) result = smaller;
  }
  return result;
}

// ── Run ──────────────────────────────────────────────────────────────────────

interface Args {
  only: string[];
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const only: string[] = [];
  let dryRun = false;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--only=")) only.push(...arg.slice(7).split(",").map((s) => s.trim()).filter(Boolean));
    else if (arg.startsWith("--")) throw new Error(`unknown flag: ${arg} (supported: --only=<brand-slug>, --dry-run)`);
  }
  return { only, dryRun };
}

async function loadCatalogue(): Promise<CatalogueBrand[]> {
  // Imported by URL so `tsc` does not need allowImportingTsExtensions while
  // Node still resolves the real .ts module (native type stripping).
  const specifier = new URL("../lib/brands.ts", import.meta.url).href;
  const mod = await import(specifier);
  return mod.BRANDS as CatalogueBrand[];
}

function buildJobs(brands: CatalogueBrand[], only: string[]): Job[] {
  const perUrl = new Map<string, number>();
  for (const brand of brands) {
    for (const product of brand.products) {
      if (!product.sourceUrl) continue;
      perUrl.set(product.sourceUrl, (perUrl.get(product.sourceUrl) ?? 0) + 1);
    }
  }
  const jobs: Job[] = [];
  const used = new Set<string>();
  for (const brand of brands) {
    if (only.length && !only.includes(brand.slug)) continue;
    for (const product of brand.products) {
      if (!product.sourceUrl) continue;
      let fileName = `${brand.slug}--${slug(product.model)}.webp`;
      let n = 2;
      while (used.has(fileName)) fileName = `${brand.slug}--${slug(product.model)}-${n++}.webp`;
      used.add(fileName);
      jobs.push({
        brandSlug: brand.slug,
        brandName: brand.name,
        model: product.model,
        spec: product.spec,
        category: product.category,
        sourceUrl: product.sourceUrl,
        kva: product.kva,
        kwh: product.kwh,
        watts: product.watts,
        publicPath: `/products/${fileName}`,
        fileName,
        ownsPage: (perUrl.get(product.sourceUrl) ?? 0) === 1,
        rivalTokens: [],
      });
    }
  }

  // Sibling models of the same brand: their part numbers and product-line names
  // are exactly what tells "MultiPlus-II 48/10000" apart from "Quattro 48/10000"
  // on a page that lists both.
  const ownTokens = new Map<Job, Set<string>>();
  for (const job of jobs) {
    const keys = modelKeys(job);
    ownTokens.set(job, new Set([...keys.part, ...keys.family]));
  }
  for (const job of jobs) {
    const mine = ownTokens.get(job) as Set<string>;
    const rivals = new Set<string>();
    for (const other of jobs) {
      if (other === job || other.brandSlug !== job.brandSlug) continue;
      for (const token of ownTokens.get(other) as Set<string>) {
        if (token.length >= 4 && !mine.has(token)) rivals.add(token);
      }
    }
    job.rivalTokens = [...rivals];
  }
  return jobs;
}

interface PageResult {
  candidates: Candidate[];
  title: string;
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const brands = await loadCatalogue();
  buildBrandIndex(brands);
  const jobs = buildJobs(brands, args.only);
  if (!jobs.length) {
    console.error(`No products matched${args.only.length ? ` --only=${args.only.join(",")}` : ""}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`${jobs.length} products to attempt${args.dryRun ? " (dry run — nothing will be written)" : ""}.`);
  if (!args.dryRun) await mkdir(OUT_DIR, { recursive: true });

  const entries: ManifestEntry[] = [];
  const failures: Failure[] = [];
  const robotsSkips: Failure[] = [];
  const perHost = new Map<string, { attempted: number; succeeded: number; failed: number }>();
  /** an original image URL is only ever used for one product */
  const claimedImages = new Map<string, string>();

  const hostOf = (url: string): string => {
    try {
      return new URL(url).host;
    } catch {
      return "invalid-url";
    }
  };

  // Group by host so we can run hosts in parallel while each host stays serial.
  const byHost = new Map<string, Job[]>();
  for (const job of jobs) {
    const host = hostOf(job.sourceUrl);
    const list = byHost.get(host);
    if (list) list.push(job);
    else byHost.set(host, [job]);
  }

  const note = (host: string, key: "attempted" | "succeeded" | "failed") => {
    const s = perHost.get(host) ?? { attempted: 0, succeeded: 0, failed: 0 };
    s[key]++;
    perHost.set(host, s);
  };

  const processHost = async (host: string, hostJobs: Job[]): Promise<void> => {
    const pages = new Map<string, PageResult | Error>();

    for (const job of hostJobs) {
      note(host, "attempted");
      const label = `${job.brandSlug} · ${job.model}`;
      try {
        let page = pages.get(job.sourceUrl);
        if (page === undefined) {
          try {
            const res = await politeFetch(job.sourceUrl, "text/html,application/xhtml+xml,*/*");
            if (!res.ok) throw new Error(`page HTTP ${res.status}`);
            const html = await res.text();
            page = { candidates: extractCandidates(html, res.url || job.sourceUrl), title: pageTitle(html) };
          } catch (err) {
            page = err as Error;
          }
          pages.set(job.sourceUrl, page);
        }
        if (page instanceof Error) throw page;

        const keys = modelKeys(job);
        const scored = page.candidates
          .map((candidate) => ({ candidate, match: matchCandidate(candidate, job, keys, page.title, job.ownsPage) }))
          .filter((x): x is { candidate: Candidate; match: Match } => x.match !== null)
          .sort((a, b) => b.match.score - a.match.score || a.candidate.index - b.candidate.index);

        if (!scored.length) {
          failures.push({
            brand: job.brandSlug,
            model: job.model,
            sourceUrl: job.sourceUrl,
            reason: job.ownsPage ? "no confident image on page" : "listing page — no image identifies this model",
          });
          note(host, "failed");
          console.log(`  skip  ${label} — no confident match`);
          continue;
        }

        const { candidate, match } = scored[0];
        const owner = claimedImages.get(candidate.url);
        if (owner && owner !== `${job.brandSlug}/${job.model}`) {
          failures.push({
            brand: job.brandSlug,
            model: job.model,
            sourceUrl: job.sourceUrl,
            reason: `image already used for ${owner} — refusing to reuse one photo for two models`,
          });
          note(host, "failed");
          console.log(`  skip  ${label} — duplicate of ${owner}`);
          continue;
        }

        if (args.dryRun) {
          claimedImages.set(candidate.url, `${job.brandSlug}/${job.model}`);
          note(host, "succeeded");
          console.log(`  would fetch ${label} [${match.confidence}] ${candidate.url} (${match.matchedOn})`);
          continue;
        }

        let raw: Buffer;
        try {
          raw = await downloadImage(candidate.url);
        } catch (err) {
          if (!candidate.fallbackUrl || err instanceof HostBlocked) throw err;
          raw = await downloadImage(candidate.fallbackUrl);
        }
        const converted = await convert(raw);
        await writeFile(path.join(OUT_DIR, job.fileName), converted.buffer);
        claimedImages.set(candidate.url, `${job.brandSlug}/${job.model}`);
        entries.push({
          brand: job.brandSlug,
          model: job.model,
          path: job.publicPath,
          sourceUrl: job.sourceUrl,
          imageUrl: candidate.url,
          imageHost: hostOf(candidate.url),
          fetchedOn: new Date().toISOString().slice(0, 10),
          bytes: converted.bytes,
          width: converted.width,
          height: converted.height,
          confidence: match.confidence,
          matchedOn: match.matchedOn,
        });
        note(host, "succeeded");
        console.log(`  ok    ${label} [${match.confidence}] ${converted.width}x${converted.height} ${(converted.bytes / 1024).toFixed(0)}KB`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const record = { brand: job.brandSlug, model: job.model, sourceUrl: job.sourceUrl, reason: message };
        if (message.startsWith("robots-disallowed")) {
          robotsSkips.push(record);
          console.log(`  robots ${label} — disallowed`);
        } else {
          failures.push(record);
          note(host, "failed");
          console.log(`  fail  ${label} — ${message}`);
        }
        // A blocked host fails fast for every remaining product on it.
        if (err instanceof HostBlocked) continue;
      }
    }
  };

  const hostQueue = [...byHost.entries()];
  const workers = Array.from({ length: Math.min(HOST_CONCURRENCY, hostQueue.length) }, async () => {
    for (;;) {
      const next = hostQueue.shift();
      if (!next) return;
      console.log(`\n${next[0]} (${next[1].length} products)`);
      await processHost(next[0], next[1]);
    }
  });
  await Promise.all(workers);

  const summary = {
    generatedOn: new Date().toISOString(),
    /** brands this run covered — the rest of the manifest is carried forward */
    only: args.only.length ? args.only : "all",
    attempted: jobs.length,
    succeeded: args.dryRun ? 0 : entries.length,
    skippedByRobots: robotsSkips.length,
    failed: failures.length,
    totalBytes: entries.reduce((sum, e) => sum + e.bytes, 0),
    hostsGivenUpOn: Object.fromEntries(blockedHosts),
    robots: Object.fromEntries(
      await Promise.all([...robotsCache.entries()].map(async ([origin, p]) => [origin, (await p).note] as const)),
    ),
    perHost: Object.fromEntries([...perHost.entries()].sort()),
    failures,
    robotsSkips,
  };

  console.log("\n─── summary ───────────────────────────────────────────");
  console.log(`attempted            ${summary.attempted}`);
  console.log(`succeeded            ${summary.succeeded}`);
  console.log(`skipped by robots    ${summary.skippedByRobots}`);
  console.log(`failed / skipped     ${summary.failed}`);
  for (const [host, stats] of [...perHost.entries()].sort()) {
    const blocked = blockedHosts.get(host);
    console.log(`  ${host.padEnd(34)} ${stats.succeeded}/${stats.attempted} ok${blocked ? `  — ${blocked}` : ""}`);
  }

  if (args.dryRun) {
    console.log("\nDry run — manifest not written.");
    return;
  }

  // A narrow re-run (--only=deye) must not erase the provenance of everything
  // else: merge this run's entries over whatever the manifest already records.
  const merged = new Map<string, ManifestEntry>();
  try {
    const previous = JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as { images?: ManifestEntry[] };
    for (const entry of previous.images ?? []) merged.set(`${entry.brand}|${entry.model}`, entry);
  } catch {
    // no manifest yet — first run
  }
  for (const entry of entries) merged.set(`${entry.brand}|${entry.model}`, entry);
  const allEntries = [...merged.values()].sort((a, b) => a.path.localeCompare(b.path));

  entries.sort((a, b) => a.path.localeCompare(b.path));
  await writeFile(MANIFEST_PATH, JSON.stringify({ summary, images: allEntries }, null, 2) + "\n");
  // Tiny path → source-host map. ProductImage imports this to credit the site a
  // photo came from (the page we found it on, not its CDN); the full provenance
  // record stays in manifest.json.
  await writeFile(
    ATTRIBUTION_PATH,
    JSON.stringify(
      Object.fromEntries(allEntries.map((e) => [e.path, hostOf(e.sourceUrl).replace(/^www\./, "")])),
      null,
      2,
    ) + "\n",
  );
  console.log(
    `\nmanifest → ${path.relative(APP_ROOT, MANIFEST_PATH)} (${allEntries.length} images on record, ${entries.length} written this run)`,
  );
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
