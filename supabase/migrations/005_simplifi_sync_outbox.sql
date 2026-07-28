-- Simplifi OS — Cross-device sync outbox (Phase 2; schema ready in Foundation)

create table if not exists simplifi_sync_outbox (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  device_id text not null,
  client_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  applied_at timestamptz,
  conflict_resolution text,
  created_at timestamptz not null default now(),
  unique (portal_slug, device_id, client_event_id)
);

create index if not exists simplifi_sync_outbox_pending_idx
  on simplifi_sync_outbox (portal_slug, applied_at)
  where applied_at is null;
