-- TB3 v2.2.1 production-readiness workspace activation.
-- Adds an isolated empty production workspace and extends people_app RLS to exactly
-- the preview + production TB3 workspaces. Does not copy preview/test records.
begin;

insert into public.tb3_workspaces(workspace_key,organization_id,portal_slug,environment)
values ('tb3-production','recxUohHc16hPk1T3','tarris','production')
on conflict (workspace_key) do update set
  organization_id=excluded.organization_id,
  portal_slug=excluded.portal_slug,
  environment=excluded.environment;

do $$ declare t text; begin
  foreach t in array array[
    'tb3_workspaces','tb3_opportunities','tb3_calendar_events','tb3_activity_logs',
    'tb3_documents','tb3_tutor_contacts','tb3_academic_status','tb3_notifications'
  ] loop
    execute format('drop policy if exists tb3_preview_read on public.%I',t);
    execute format(
      'create policy tb3_workspace_read on public.%I for select to people_app using (workspace_key in (%L,%L))',
      t,'tb3-preview-20261005','tb3-production'
    );
    if t <> 'tb3_workspaces' then
      execute format('drop policy if exists tb3_preview_write on public.%I',t);
      execute format(
        'create policy tb3_workspace_write on public.%I for all to people_app using (workspace_key in (%L,%L)) with check (workspace_key in (%L,%L))',
        t,'tb3-preview-20261005','tb3-production','tb3-preview-20261005','tb3-production'
      );
    end if;
  end loop;
end $$;

commit;
