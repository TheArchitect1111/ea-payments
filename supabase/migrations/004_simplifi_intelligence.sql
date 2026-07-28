-- Simplifi OS — Intelligence runs + object score cache

alter table simplifi_objects
  add column if not exists opportunity_score numeric(6,2),
  add column if not exists score_factors jsonb,
  add column if not exists context_summary text,
  add column if not exists next_best_action text,
  add column if not exists last_intelligence_at timestamptz;

create table if not exists simplifi_intelligence_runs (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  run_at timestamptz not null default now(),
  findings jsonb not null default '[]'::jsonb,
  brief_items jsonb not null default '[]'::jsonb,
  ambient_items jsonb not null default '[]'::jsonb,
  status text not null default 'ok'
);

create index if not exists simplifi_intelligence_runs_portal_idx
  on simplifi_intelligence_runs (portal_slug, run_at desc);
