-- Simplifi object store — Phase 2 Supabase migration (draft)
-- Run when SUPABASE_URL + SUPABASE_SERVICE_KEY are configured.

create extension if not exists "pgcrypto";

create table if not exists simplifi_objects (
  id uuid primary key default gen_random_uuid(),
  airtable_record_id text unique,
  portal_slug text not null,
  title text not null,
  object_type text not null default 'opportunity',
  status text not null default 'active',
  outcome_status text,
  priority_level text,
  priority_score numeric(6,2),
  next_action text,
  due_date timestamptz,
  source_url text,
  consider_slug text,
  share_url text,
  guidance_json jsonb,
  intelligence_json jsonb,
  opportunity_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists simplifi_objects_portal_slug_idx on simplifi_objects (portal_slug);
create index if not exists simplifi_objects_status_idx on simplifi_objects (status);
create index if not exists simplifi_objects_due_date_idx on simplifi_objects (due_date);

create table if not exists simplifi_relationships (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid not null references simplifi_objects(id) on delete cascade,
  related_object_id uuid not null references simplifi_objects(id) on delete cascade,
  relationship_type text not null default 'cluster',
  hint text,
  created_at timestamptz not null default now(),
  unique (object_id, related_object_id, relationship_type)
);

create table if not exists simplifi_memory_assets (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid references simplifi_objects(id) on delete set null,
  asset_type text not null,
  label text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists simplifi_pulse_events (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid references simplifi_objects(id) on delete set null,
  event_type text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists simplifi_pulse_events_portal_idx on simplifi_pulse_events (portal_slug, created_at desc);

comment on table simplifi_objects is 'Canonical Simplifi workspace objects — mirrors Airtable Capture Records during migration';
comment on column simplifi_objects.intelligence_json is 'Decision + Build Intelligence bundle from capture pipeline';
