-- ────────────────────────────────────────────────────────────────────────────
-- Verified partner pipeline.
--
-- Four tables, in the order a partner moves through them:
--   partners         — the applicant, then the verified partner (the record of truth)
--   partner_jobs     — one row per job we offer a partner, and its commission
--   partner_payments — the commission the partner says they paid us, and our verdict
--   partner_events   — append-only audit trail (who did what, when)
--
-- Written 2026-09-16. Idempotent: safe to re-run. NOT applied automatically by any
-- deploy: a human runs it once in the Supabase SQL editor (or with psql) before
-- enabling the partner pages.
--
-- RLS is ON with no policies on every table, and table privileges are revoked from
-- the `anon` and `authenticated` roles as a second lock: all reads and writes go
-- through the service-role key from server code. Contact details, CAC documents,
-- reference phone numbers and bank details live here and must never be reachable
-- with the public anon key.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.partners (
  id                        bigint generated always as identity primary key,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  -- identity
  ref                       text not null unique,          -- SB-PTR-XXXXXX, given to the applicant
  slug                      text unique,                   -- public profile path, set at approval
  kind                      text not null
                            check (kind in ('installer', 'vendor', 'manufacturer', 'both')),
  business_name             text not null,
  contact_name              text not null,
  email                     text not null,
  whatsapp                  text not null,
  city                      text not null,
  state                     text not null,
  years_in_business         integer,
  website                   text,                          -- INTERNAL: never rendered publicly
  instagram                 text,
  applicant_note            text,

  -- capability
  services                  jsonb not null default '[]'::jsonb,
  system_sizes              jsonb not null default '[]'::jsonb,
  coverage_states           jsonb not null default '[]'::jsonb,
  coverage_cities           jsonb not null default '[]'::jsonb,
  brands_carried            text,
  monthly_capacity          integer,
  max_travel_km             integer,

  -- vetting: what the applicant claims
  cac_number                text,                          -- INTERNAL
  cac_doc_url               text,                          -- INTERNAL
  installs                  jsonb not null default '[]'::jsonb,  -- [{site,city,size,year,photoUrl}]
  refs                      jsonb not null default '[]'::jsonb,  -- [{name,phone,project}] INTERNAL
  references_redacted_at    timestamptz,                   -- set when the reviewer has called them (L14)
  warranty_months           integer,
  warranty_terms            text,

  -- vetting: what WE actually checked (L1) — the badge states exactly these
  check_cac                 boolean not null default false,
  check_installs            boolean not null default false,
  check_references          boolean not null default false,
  check_warranty            boolean not null default false,

  -- commercial terms (vendors / distributors / manufacturers)
  price_list_url            text,
  trade_terms               text,
  lead_time_days            integer,
  moq                       integer,
  rma_terms                 text,

  -- review pipeline
  status                    text not null default 'submitted'
                            check (status in ('submitted', 'under_review', 'info_requested', 'approved', 'rejected', 'suspended')),
  tier                      text not null default 'partner'   -- partner | tracked (L3)
                            check (tier in ('partner', 'tracked')),
  status_note               text,                             -- applicant-facing (returned by /api/partner-status)
  review_notes              text,                             -- INTERNAL
  rejected_reason           text,
  suspended_reason          text,
  suspended_at              timestamptz,

  -- verification
  verified                  boolean not null default false,
  verified_at               timestamptz,
  verified_until            timestamptz,                    -- re-verify after 12 months (L1)
  verified_by               text,                           -- admin user name
  verification_scope        text,                           -- what the tick means, in words (L2)
  commission_rate           numeric(5,2) not null default 5.00
                            check (commission_rate between 0 and 25),  -- MIN/MAX_COMMISSION_RATE

  -- routing state
  availability              text not null default 'available'
                            check (availability in ('available', 'busy', 'paused')),
  jobs_per_month_cap        integer default 4,
  availability_confirmed_at timestamptz,

  -- commission banking: the PARTNER's own account (future payouts). Never public.
  bank_name                 text,
  account_name              text,
  account_number            text,

  -- partner portal (not built yet). Only HMAC-SHA256(PARTNER_TOKEN_SECRET, token) is stored.
  portal_token_hash         text,
  portal_token_issued_at    timestamptz,
  portal_last_seen_at       timestamptz,

  -- the "we need more from you" loop
  info_requested            jsonb,                          -- [{key,label,reason}]
  info_requested_at         timestamptz,
  info_response             jsonb,
  info_responded_at         timestamptz,

  -- public listing (L11: built from a fixed field set, no HTML)
  listed                    boolean not null default false,
  public_blurb              text,
  public_highlights         jsonb not null default '[]'::jsonb,

  -- agreed terms at submission time
  agreements                jsonb not null default '{}'::jsonb
);

create index if not exists partners_status_idx       on public.partners (status);
create index if not exists partners_created_at_idx   on public.partners (created_at desc);
create index if not exists partners_email_idx        on public.partners (lower(email));
create index if not exists partners_state_status_idx on public.partners (state, status);
create index if not exists partners_listed_idx       on public.partners (listed) where verified;
create unique index if not exists partners_portal_token_idx
  on public.partners (portal_token_hash) where portal_token_hash is not null;

alter table public.partners enable row level security;
revoke all on table public.partners from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- JOB ROUTING
--
-- A job is *offered*, not broadcast for action (L9). The partial unique index
-- below is the real rule: at most one live accepted/completed job per source
-- request, so two partners can never both be working the same job.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.partner_jobs (
  id                    bigint generated always as identity primary key,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  partner_id            bigint not null references public.partners(id) on delete cascade,
  source                text not null,             -- quote_request | order_request
  source_id             bigint not null,           -- quote_requests.id / order_requests.id
  reference             text not null unique,      -- SB-JOB-XXXXXX, shown to both sides

  -- the job as the partner needs to see it (INTERNAL: customer contact)
  customer_name         text,
  customer_phone        text,
  customer_email        text,
  customer_ref          text,                      -- our quote code / order reference (L8d)
  title                 text not null,
  location              text,
  detail                text,                      -- itemised summary, plain text
  budget_best           integer,                   -- customer's own budget figure
  install_fee           integer,                   -- what we offer for the work, when agreed

  -- our money (L6: our numbers, never theirs)
  commission_rate       numeric(5,2),
  commission_amount     integer,
  commission_status     text not null default 'none'
                        check (commission_status in ('none', 'due', 'receipt_uploaded', 'confirmed', 'overdue', 'waived')),
  commission_due_at     timestamptz,
  commission_cleared_at timestamptz,

  status                text not null default 'offered'
                        check (status in ('offered', 'accepted', 'declined', 'completed', 'cancelled', 'expired')),
  offered_at            timestamptz not null default now(),
  offer_expires_at      timestamptz not null,      -- 24h (L9); an expired offer frees the job
  responded_at          timestamptz,
  decline_reason        text,
  started_at            timestamptz,
  completed_at          timestamptz,
  customer_confirmed_at timestamptz,               -- L16: "completed" needs the customer's word
  note                  text,
  routed_by             text                       -- admin user, or 'auto'
);

create index if not exists partner_jobs_partner_idx   on public.partner_jobs (partner_id, created_at desc);
create index if not exists partner_jobs_source_idx    on public.partner_jobs (source, source_id);
create index if not exists partner_jobs_status_idx    on public.partner_jobs (status);
create index if not exists partner_jobs_commission_idx on public.partner_jobs (partner_id, commission_status);

-- L9: one live job per request, enforced by the database rather than by us remembering.
create unique index if not exists partner_jobs_one_live_per_source_idx
  on public.partner_jobs (source, source_id)
  where status in ('accepted', 'completed');

alter table public.partner_jobs enable row level security;
revoke all on table public.partner_jobs from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMISSION PAYMENTS (L7)
--
-- A receipt upload is a *claim*, not proof. `status` stays 'submitted' until a
-- human has matched the bank/NIP reference against our own account statement.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.partner_payments (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),

  partner_id       bigint not null references public.partners(id) on delete cascade,
  job_id           bigint references public.partner_jobs(id) on delete set null,
  invoice_ref      text not null,                 -- SB-INV-<job ref> (L13)
  amount_expected  integer not null,              -- our figure (L6)
  amount_paid      integer,                       -- what the partner says they sent
  method           text,                          -- bank_transfer | cash | pos | other
  bank_ref         text,                          -- NIP / transaction reference we verify
  paid_on          date,
  receipt_url      text,                          -- partner-supplied link, if any
  receipt_path     text,                          -- private bucket object path, if uploaded
  note             text,
  status           text not null default 'submitted'
                   check (status in ('submitted', 'confirmed', 'rejected')),
  confirmed_at     timestamptz,
  confirmed_by     text,
  reject_reason    text
);

create index if not exists partner_payments_partner_idx on public.partner_payments (partner_id, created_at desc);
create index if not exists partner_payments_status_idx  on public.partner_payments (status);
create index if not exists partner_payments_job_idx     on public.partner_payments (job_id);
create index if not exists partner_payments_invoice_idx on public.partner_payments (invoice_ref);

alter table public.partner_payments enable row level security;
revoke all on table public.partner_payments from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT TRAIL
--
-- Append-only. Every approval, rejection, routing decision, receipt confirmation
-- and de-listing notice lands here, so "who approved this vendor, and when?"
-- always has an answer.
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.partner_events (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  partner_id bigint not null references public.partners(id) on delete cascade,
  job_id     bigint references public.partner_jobs(id) on delete set null,
  actor      text not null,        -- 'system' | 'partner' | the admin user name
  action     text not null,        -- application_received | approved | info_requested | ...
  detail     text
);

create index if not exists partner_events_partner_idx on public.partner_events (partner_id, created_at desc);
create index if not exists partner_events_action_idx  on public.partner_events (action);

alter table public.partner_events enable row level security;
revoke all on table public.partner_events from anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance (otherwise the column would only ever hold the insert time)
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.partners_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.partners_touch_updated_at() from public, anon, authenticated;

drop trigger if exists partners_touch_updated_at on public.partners;
create trigger partners_touch_updated_at
  before update on public.partners
  for each row execute function public.partners_touch_updated_at();

drop trigger if exists partner_jobs_touch_updated_at on public.partner_jobs;
create trigger partner_jobs_touch_updated_at
  before update on public.partner_jobs
  for each row execute function public.partners_touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- STORAGE: commission receipts
--
-- Private bucket, used once the partner portal exists. Uploads go through server
-- code with the service role; reads are 5-minute signed URLs. No storage policies,
-- so the anon key can neither list, read nor write it. The bucket itself also
-- enforces the same 5MB / type limits as lib/partner-storage.ts.
-- If this insert fails on your Supabase project (the storage schema is owned by
-- supabase_storage_admin), create the bucket in Dashboard → Storage instead:
-- name `partner-receipts`, public = OFF, 5MB limit, JPG/PNG/WebP/PDF only.
-- ────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'partner-receipts',
  'partner-receipts',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;