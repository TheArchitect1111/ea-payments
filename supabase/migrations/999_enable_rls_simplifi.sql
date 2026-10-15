-- Lock Simplifi storage to trusted server-side service_role access.
-- All in-repository callers use the server-only PostgREST client in
-- lib/simplifi-os/supabase.ts; no browser/anon access is required.

-- Remove any pre-existing policies on these tables so only the explicitly
-- scoped service_role policies below can authorize row access.
do $$
declare
  target_table text;
  existing_policy record;
begin
  foreach target_table in array array[
    'simplifi_embeddings',
    'simplifi_intelligence_items',
    'simplifi_job_runs',
    'simplifi_intelligence_runs',
    'simplifi_memory_assets',
    'simplifi_objects',
    'simplifi_relationships',
    'simplifi_memory_events',
    'simplifi_sync_outbox'
  ] loop
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy %I on public.%I', existing_policy.policyname, target_table);
    end loop;
  end loop;
end
$$;

alter table public.simplifi_embeddings enable row level security;
alter table public.simplifi_intelligence_items enable row level security;
alter table public.simplifi_job_runs enable row level security;
alter table public.simplifi_intelligence_runs enable row level security;
alter table public.simplifi_memory_assets enable row level security;
alter table public.simplifi_objects enable row level security;
alter table public.simplifi_relationships enable row level security;
alter table public.simplifi_memory_events enable row level security;
alter table public.simplifi_sync_outbox enable row level security;

revoke all on table
  public.simplifi_embeddings,
  public.simplifi_intelligence_items,
  public.simplifi_job_runs,
  public.simplifi_intelligence_runs,
  public.simplifi_memory_assets,
  public.simplifi_objects,
  public.simplifi_relationships,
  public.simplifi_memory_events,
  public.simplifi_sync_outbox
from public, anon, authenticated;

grant select, insert, update, delete on table
  public.simplifi_embeddings,
  public.simplifi_intelligence_items,
  public.simplifi_job_runs,
  public.simplifi_intelligence_runs,
  public.simplifi_memory_assets,
  public.simplifi_objects,
  public.simplifi_relationships,
  public.simplifi_memory_events,
  public.simplifi_sync_outbox
to service_role;

create policy simplifi_embeddings_service_all
  on public.simplifi_embeddings for all to service_role
  using (true) with check (true);
create policy simplifi_intelligence_items_service_all
  on public.simplifi_intelligence_items for all to service_role
  using (true) with check (true);
create policy simplifi_job_runs_service_all
  on public.simplifi_job_runs for all to service_role
  using (true) with check (true);
create policy simplifi_intelligence_runs_service_all
  on public.simplifi_intelligence_runs for all to service_role
  using (true) with check (true);
create policy simplifi_memory_assets_service_all
  on public.simplifi_memory_assets for all to service_role
  using (true) with check (true);
create policy simplifi_objects_service_all
  on public.simplifi_objects for all to service_role
  using (true) with check (true);
create policy simplifi_relationships_service_all
  on public.simplifi_relationships for all to service_role
  using (true) with check (true);
create policy simplifi_memory_events_service_all
  on public.simplifi_memory_events for all to service_role
  using (true) with check (true);
create policy simplifi_sync_outbox_service_all
  on public.simplifi_sync_outbox for all to service_role
  using (true) with check (true);

-- The vector search RPC is server-only too; callers authenticate with service_role.
revoke execute on function public.match_simplifi_embeddings(vector, text, integer, double precision)
  from public, anon, authenticated;
grant execute on function public.match_simplifi_embeddings(vector, text, integer, double precision)
  to service_role;
