-- Amplifi social OAuth connections are tenant-scoped and durable across devices.
-- OAuth tokens remain encrypted by the application before reaching Postgres.

create table if not exists amplifi_social_connections (
  portal_slug text not null,
  provider text not null check (provider in ('meta', 'linkedin', 'tiktok', 'x')),
  encrypted_accounts text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (portal_slug, provider)
);

create index if not exists amplifi_social_connections_portal_idx
  on amplifi_social_connections (portal_slug);

alter table amplifi_social_connections enable row level security;

-- The application accesses this table only with the server-side service role.
revoke all on table amplifi_social_connections from anon, authenticated;
