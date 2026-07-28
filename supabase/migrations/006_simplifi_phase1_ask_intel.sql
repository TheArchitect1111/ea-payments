-- Simplifi OS Phase 1 slice — embeddings lifecycle + intelligence items + vector RPC

alter table simplifi_embeddings
  alter column object_id drop not null;

alter table simplifi_embeddings
  drop constraint if exists simplifi_embeddings_object_id_chunk_id_model_key;

alter table simplifi_embeddings
  add column if not exists airtable_record_id text,
  add column if not exists source_object_type text,
  add column if not exists source_text text,
  add column if not exists embedding_version text not null default '1',
  add column if not exists status text not null default 'ready',
  add column if not exists retry_count integer not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists simplifi_embeddings_airtable_idx
  on simplifi_embeddings (portal_slug, airtable_record_id);

create unique index if not exists simplifi_embeddings_portal_airtable_chunk_model_uidx
  on simplifi_embeddings (portal_slug, airtable_record_id, chunk_id, model)
  where airtable_record_id is not null;

-- Durable intelligence recommendations (Airtable object ids in related_object_ids)
create table if not exists simplifi_intelligence_items (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  fingerprint text not null,
  item_type text not null,
  title text not null,
  explanation text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null default 0.5,
  priority text not null default 'medium',
  related_object_ids text[] not null default '{}',
  next_action text,
  why_matters text,
  status text not null default 'active',
  feedback_state text not null default 'none',
  run_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reevaluate_at timestamptz,
  expires_at timestamptz,
  unique (portal_slug, fingerprint)
);

create index if not exists simplifi_intelligence_items_portal_status_idx
  on simplifi_intelligence_items (portal_slug, status, priority);

create table if not exists simplifi_job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  idempotency_key text not null,
  portal_slug text,
  status text not null default 'running',
  result jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (job_name, idempotency_key)
);

-- Vector similarity RPC (service role only in app)
create or replace function match_simplifi_embeddings(
  query_embedding vector(1536),
  match_portal text,
  match_count int default 8,
  match_threshold float default 0.55
)
returns table (
  id uuid,
  object_id uuid,
  airtable_record_id text,
  source_object_type text,
  content_hash text,
  similarity float
)
language sql
stable
as $$
  select
    e.id,
    e.object_id,
    e.airtable_record_id,
    e.source_object_type,
    e.content_hash,
    (1 - (e.embedding <=> query_embedding))::float as similarity
  from simplifi_embeddings e
  where e.portal_slug = match_portal
    and e.status = 'ready'
    and e.embedding is not null
    and (1 - (e.embedding <=> query_embedding)) >= match_threshold
  order by e.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
