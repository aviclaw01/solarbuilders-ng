-- Inbound contact that is not a priced request.
--
--   lead_capture  ← POST /api/lead-capture   (homepage "size it for me" modal)
--   contact       ← POST /api/contact        (the contact form)
--
-- Priced requests have their own tables because they carry a quote and a
-- total: quote_requests and order_requests. These two do not — they are
-- somebody asking us to get in touch. One table with a `kind` keeps them in
-- one queue, which is what the leads desk needs; the shape that differs
-- between them lives in `payload`.
--
-- Run once in the Supabase SQL editor. Safe to re-run.

create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),

  kind        text not null,                 -- lead_capture | contact
  name        text,                          -- lead_capture does not collect one
  phone       text,
  email       text,
  location    text,
  message     text,

  -- Kind-specific fields, kept out of the columns so adding a form does not
  -- need a migration: lead_capture stores { state, systemSize }.
  payload     jsonb not null default '{}'::jsonb,

  status      text not null default 'new'    -- new | contacted | quoted | won | lost
);

-- THE POINT OF THIS TABLE. A lead we cannot contact is not a lead, it is a
-- row. quote_requests enforces the same thing with `name` and `phone` NOT
-- NULL; here the channels differ per form — the contact form takes an email
-- and the homepage modal takes a WhatsApp number — so the guarantee is that
-- at least one of them is present, rather than any particular one.
alter table public.leads drop constraint if exists leads_reachable;
alter table public.leads add constraint leads_reachable
  check (coalesce(phone, '') <> '' or coalesce(email, '') <> '');

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_status_created_at_idx on public.leads (status, created_at desc);
create index if not exists leads_kind_idx on public.leads (kind);

-- Same posture as every other table here: service-role writes only from server
-- code, no public policies, so the anon key can never read somebody's number.
alter table public.leads enable row level security;
