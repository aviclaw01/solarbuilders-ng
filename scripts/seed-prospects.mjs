/**
 * Loads scripts/data/prospect-contacts.json (brands we don't list yet but want
 * to feature, with contacts read off their own sites) into Supabase
 * `brand_outreach` as `prospect = true` rows. They show up on
 * /admin/suppliers and as "want to be featured?" drafts on /admin/mailer.
 *
 * Upserts identity and contact fields only, so a re-run never resets a status
 * or note. A slug that is already a listed brand is skipped, never turned into
 * a prospect.
 *
 *   node --env-file=.env.local scripts/seed-prospects.mjs
 */
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");

const listed = new Set(
  [...readFileSync(new URL("../lib/brand-slugs.ts", import.meta.url), "utf8").matchAll(/:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]),
);
const data = JSON.parse(readFileSync(new URL("./data/prospect-contacts.json", import.meta.url), "utf8"));

const skipped = data.filter((r) => listed.has(r.slug)).map((r) => r.slug);
const rows = data
  .filter((r) => !listed.has(r.slug) && /^[a-z0-9-]{2,60}$/.test(r.slug))
  .map((r) => ({
    slug: r.slug,
    prospect: true,
    name: r.name,
    kind: r.kind === "vendor" ? "vendor" : "manufacturer",
    category: [r.category, r.city].filter(Boolean).join(" · ") || null,
    website: r.website,
    email: r.email,
    phone: r.phone,
    whatsapp: r.whatsapp,
    instagram: r.instagram,
    linkedin: r.linkedin,
    facebook: r.facebook,
    x: r.x,
    contact_page: r.contact_page,
    source: r.source,
    research_note: r.notes,
    updated_at: new Date().toISOString(),
  }));

const res = await fetch(`${url}/rest/v1/brand_outreach?on_conflict=slug`, {
  method: "POST",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  },
  body: JSON.stringify(rows),
});
if (!res.ok) throw new Error(`upsert failed: ${res.status} ${await res.text()}`);
console.log(`brand_outreach: upserted ${rows.length} prospects${skipped.length ? `; skipped listed: ${skipped.join(", ")}` : ""}`);
