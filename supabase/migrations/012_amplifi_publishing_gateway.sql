-- Allow Amplifi's provider-agnostic publishing gateway to store one encrypted
-- tenant profile key alongside the existing native OAuth connections.

alter table amplifi_social_connections
  drop constraint if exists amplifi_social_connections_provider_check;

alter table amplifi_social_connections
  add constraint amplifi_social_connections_provider_check
  check (provider in ('meta', 'linkedin', 'tiktok', 'x', 'gateway'));
