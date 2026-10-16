-- Journeys: tie events to one visit and one returning browser, and record what
-- was clicked. Ids are random strings made in the browser (lib/track.ts), not
-- linked to a name, phone or device. Safe to run twice.
alter table public.site_events
  add column if not exists visitor_id text,
  add column if not exists session_id text,
  add column if not exists label text,
  add column if not exists target text,
  add column if not exists value integer;

create index if not exists site_events_session_idx on public.site_events (session_id);
