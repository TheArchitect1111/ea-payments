-- Simplifi OS — Memory Events (promote pulse_events)
-- Requires 001_simplifi_objects.sql

create extension if not exists "pgcrypto";

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'simplifi_pulse_events'
  ) and not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'simplifi_memory_events'
  ) then
    alter table simplifi_pulse_events rename to simplifi_memory_events;
  end if;
end $$;

create table if not exists simplifi_memory_events (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid references simplifi_objects(id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

alter table simplifi_memory_events
  add column if not exists actor_id text,
  add column if not exists actor_type text not null default 'user',
  add column if not exists client text,
  add column if not exists object_ids uuid[],
  add column if not exists related_object_ids uuid[],
  add column if not exists correlation_id text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists immutable_hash text;

create index if not exists simplifi_memory_events_portal_time_idx
  on simplifi_memory_events (portal_slug, created_at desc);

create index if not exists simplifi_memory_events_type_idx
  on simplifi_memory_events (portal_slug, event_type, created_at desc);

create index if not exists simplifi_memory_events_object_idx
  on simplifi_memory_events (object_id, created_at desc);

comment on table simplifi_memory_events is 'Append-only personal Memory Events for Simplifi Opportunity OS';
