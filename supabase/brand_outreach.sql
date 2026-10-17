-- Brand / supplier outreach tracker behind /admin/suppliers.
-- One row per brand slug in lib/brands.ts: the contacts we found for it and
-- where the catalogue-request conversation stands. Seeded by
-- scripts/seed-brand-outreach.mjs; the admin page edits status and notes.
-- Service-role only, so RLS stays on with no public policies.

create table if not exists public.brand_outreach (
  slug          text primary key,
  email         text,
  phone         text,
  whatsapp      text,
  instagram     text,
  linkedin      text,
  facebook      text,
  x             text,
  contact_page  text,
  source        text,                  -- page the contact details were read from
  research_note text,
  status        text not null default 'to_contact',
                -- to_contact | emailed | replied | catalogue_in | deal | no_reply | declined
  notes         text,
  contacted_at  timestamptz,
  updated_at    timestamptz not null default now()
);

alter table public.brand_outreach enable row level security;
