-- Order requests from the shop cart (/shop → /cart).
-- NOT orders: we take no payment. This is "here is what I want, confirm the
-- price and come back to me". Run once in the Supabase SQL editor; safe to re-run.

create table if not exists public.order_requests (
  id           bigint generated always as identity primary key,
  created_at   timestamptz not null default now(),
  reference    text not null,               -- SB-ORD-XXXXXX, given to the customer
  name         text not null,
  phone        text not null,
  email        text,
  location     text not null,
  note         text,
  -- [{ brandSlug, brandName, model, spec, qty, unitLow, unitHigh, lineBest }]
  lines        jsonb not null,
  item_count   integer not null,
  total_low    integer not null,
  total_best   integer not null,
  total_high   integer not null,
  quote_code   text,                        -- set when the cart was filled from a quote
  needs_install boolean not null default true,
  status       text not null default 'new'  -- new | confirming | quoted | won | lost
);

create index if not exists order_requests_created_at_idx on public.order_requests (created_at desc);
create index if not exists order_requests_reference_idx on public.order_requests (reference);
create index if not exists order_requests_status_idx on public.order_requests (status);

alter table public.order_requests enable row level security;
