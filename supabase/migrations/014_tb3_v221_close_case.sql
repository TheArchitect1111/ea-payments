-- TB3 v2.2.1 close-case activation checks.
-- This migration is intentionally additive/idempotent after 013_tb3_shared_tracking.sql.
begin;

insert into tb3_workspaces(workspace_key,organization_id,portal_slug,environment)
values ('tb3-preview-20261005','recxUohHc16hPk1T3','tarris','preview')
on conflict (workspace_key) do update set
  organization_id=excluded.organization_id,
  portal_slug=excluded.portal_slug,
  environment=excluded.environment;

-- Impact metrics are derived from activity logs. Ensure the view is queryable for an empty workspace.
-- No synthetic impact row is inserted because the derived view already returns zeros for the workspace.

create index if not exists tb3_opportunities_workspace_created on tb3_opportunities(workspace_key,created_at desc);
create index if not exists tb3_calendar_workspace_start on tb3_calendar_events(workspace_key,start_time);
create index if not exists tb3_activity_workspace_created on tb3_activity_logs(workspace_key,created_at desc);

commit;
