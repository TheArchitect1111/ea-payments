-- Simplifi OS — Relationship engine columns + embeddings (pgvector)

create extension if not exists vector;

alter table simplifi_relationships
  add column if not exists strength numeric(4,3) not null default 0.5,
  add column if not exists source text not null default 'heuristic',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists dismissed_at timestamptz;

create index if not exists simplifi_relationships_portal_idx
  on simplifi_relationships (portal_slug);

create table if not exists simplifi_embeddings (
  id uuid primary key default gen_random_uuid(),
  portal_slug text not null,
  object_id uuid not null references simplifi_objects(id) on delete cascade,
  chunk_id text not null default 'primary',
  content_hash text not null,
  embedding vector(1536),
  model text not null,
  created_at timestamptz not null default now(),
  unique (object_id, chunk_id, model)
);

create index if not exists simplifi_embeddings_portal_idx
  on simplifi_embeddings (portal_slug);

-- IVFFlat useful after ~1k vectors/tenant; safe to create empty
create index if not exists simplifi_embeddings_ivfflat
  on simplifi_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
