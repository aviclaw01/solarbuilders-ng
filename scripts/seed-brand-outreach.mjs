/**
 * Loads scripts/data/brand-contacts.json (contacts read off each brand's own
 * site) into Supabase `brand_outreach`. Upserts contact fields only, so a
 * re-run never resets a status or note set on /admin/suppliers.
 *
 *   node --env-file=.env.local scripts/seed-brand-outreach.mjs
 */
import { readFileSync } from "node:fs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");

const data = JSON.parse(readFileSync(new URL("./data/brand-contacts.json", import.meta.url), "utf8"));
const rows = data.map((r) => ({
  slug: r.slug,
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
console.log(`brand_outreach: upserted ${rows.length} rows`);
