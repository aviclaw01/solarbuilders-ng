#!/usr/bin/env node
/**
 * Manual IndexNow ping (Bing, Yandex, Seznam, Naver …; Google ignores IndexNow).
 *
 * Usage:
 *   node scripts/indexnow-ping.mjs                       # every URL in the live sitemap
 *   node scripts/indexnow-ping.mjs --urls=/solar,/brands/deye
 *   node scripts/indexnow-ping.mjs --dry-run             # print the payload, send nothing
 *
 * Only run it AFTER a deploy that serves public/<KEY>.txt at the site root —
 * IndexNow fetches that file to prove we own the host, and rejects the ping
 * (403) if it is missing. Not wired into vercel.json on purpose: pinging every
 * deploy, changed or not, is exactly the noise IndexNow asks sites not to send.
 */

const HOST = 'solarbuildersng.com';
const ORIGIN = `https://${HOST}`;
const KEY = '885e2cfaff6dd146cb227f2721cd539a';
const KEY_LOCATION = `${ORIGIN}/${KEY}.txt`;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10_000; // IndexNow's per-request cap

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const urlsArg = args.find((a) => a.startsWith('--urls='));

function absolute(u) {
  const trimmed = u.trim();
  if (!trimmed) return null;
  const url = new URL(trimmed, ORIGIN);
  if (url.host !== HOST) throw new Error(`Refusing to submit a URL on another host: ${trimmed}`);
  return url.toString();
}

async function sitemapUrls() {
  const res = await fetch(`${ORIGIN}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned HTTP ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const raw = urlsArg ? urlsArg.slice('--urls='.length).split(',') : await sitemapUrls();
  const urlList = [...new Set(raw.map(absolute).filter(Boolean))];
  if (urlList.length === 0) throw new Error('No URLs to submit.');
  if (urlList.length > MAX_URLS) throw new Error(`${urlList.length} URLs is over the ${MAX_URLS} cap; split the run.`);

  const payload = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList };

  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });
  const body = await res.text();
  // 200 = accepted, 202 = accepted, key validation pending.
  console.log(`IndexNow: HTTP ${res.status} for ${urlList.length} URL(s)${body ? ` — ${body}` : ''}`);
  if (res.status !== 200 && res.status !== 202) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
