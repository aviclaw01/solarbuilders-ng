-- Outreach mailer behind /admin/mailer. One draft per brand slug.
-- A brand with no row here still shows a draft, built from the template in
-- lib/brand-outreach.ts; a row is written only when a draft is edited, sent
-- or marked sent. Service-role only.

create table if not exists public.outreach_drafts (
  slug        text primary key,
  channel     text not null,             -- email | whatsapp | instagram | facebook | linkedin | x | phone
  to_addr     text,
  subject     text,
  body        text not null,
  status      text not null default 'draft',  -- draft | sent | failed
  error       text,
  sent_at     timestamptz,
  updated_at  timestamptz not null default now()
);

alter table public.outreach_drafts enable row level security;
