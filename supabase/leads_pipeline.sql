-- Leads pipeline tables for the public intake routes. Run once in the
-- Supabase SQL editor when those features go live; safe to re-run.
--
--   contact_messages ← POST /api/contact        (contact page form)
--   lead_capture     ← POST /api/lead-capture   (calculator sizing modal)
--   notify_me        ← POST /api/notify-me      ("tell me when new prices land")
--   reviews          ← POST /api/submit-review  (moderated before publishing)
--
-- Each route now writes here AND emails the team independently — one sink
-- failing never costs the lead. Inserts use the service-role key, and RLS is
-- enabled with no policies, so these rows are readable only by us.

-- ── contact_messages ─────────────────────────────────────────────────────

create table if not exists public.contact_messages (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  status     text not null default 'new'  -- new | contacted | closed
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

-- ── lead_capture ─────────────────────────────────────────────────────────
-- Calculator sizing-modal leads: who to reach on WhatsApp, where they are,
-- and the size bucket they picked.

create table if not exists public.lead_capture (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  whatsapp    text not null,
  state       text not null,
  system_size text not null,
  status      text not null default 'new'  -- new | contacted | won | lost
);

create index if not exists lead_capture_created_at_idx on public.lead_capture (created_at desc);

alter table public.lead_capture enable row level security;

-- ── notify_me ────────────────────────────────────────────────────────────
-- One row per signup. No auth flow; the email is the contact point.

create table if not exists public.notify_me (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  email       text not null,
  location    text,
  -- set once a mail-out actually goes to this address
  notified_at timestamptz,
  source      text  -- e.g. 'shop', 'brands' — where the signup happened
);

create index if not exists notify_me_created_at_idx on public.notify_me (created_at desc);
create unique index if not exists notify_me_email_key on public.notify_me (lower(email));

alter table public.notify_me enable row level security;

-- ── reviews ─────────────────────────────────────────────────────────────
-- Customer reviews of builders, held for moderation. Published rows are what
-- a future /brands/<slug> page would render; the route emails the team either
-- way, so moderation happens in one place.

create table if not exists public.reviews (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  builder_slug text not null,
  builder_name text not null,
  author_name  text not null,
  location     text,
  rating       smallint not null check (rating between 1 and 5),
  body         text not null,
  status       text not null default 'pending'  -- pending | published | rejected
);

create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists reviews_builder_status_idx on public.reviews (builder_slug, status);

alter table public.reviews enable row level security;
