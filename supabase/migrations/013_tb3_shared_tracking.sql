-- TB3 v2.2 additive preview migration; does not modify existing People tables.
-- Run only against a verified database. Provision a preview workspace using a
-- verified persisted EA organization; never seed synthetic org_<slug> identities.
begin;

create table tb3_workspaces (
  workspace_key text primary key,
  organization_id text not null check (organization_id <> '' and organization_id not like 'org\_%' escape '\'),
  portal_slug text not null,
  environment text not null check (environment in ('preview','production')),
  created_at timestamptz not null default now(),
  unique (workspace_key, organization_id)
);

create table tb3_opportunities (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  tenant_id text not null default 'tarris-bouie-iii' check (tenant_id='tarris-bouie-iii'),
  request_id uuid not null,
  company_name text not null check (length(company_name) between 1 and 200),
  contact_name text not null check (length(contact_name) between 1 and 200),
  contact_email text not null check (length(contact_email) between 3 and 320),
  phone text,
  type text not null check (type in ('Speaking','Appearance','Camp/Clinic','Brand Partnership','Community','Other')),
  budget_range text not null check (budget_range in ('$0-1k','$1k-5k','$5k-10k','$10k+','In-Kind Community')),
  date_requested date,
  vision_answer text not null check (length(vision_answer) between 1 and 5000),
  message text not null default '' check (length(message) <= 10000),
  status text not null default 'Inbound' check (status in ('Inbound','Discussion','Contracted','Completed')),
  earnings_amount numeric(12,2) check (earnings_amount >= 0),
  values_check text not null check (values_check in ('Pass','Fail','Review')),
  created_from text not null check (created_from in ('PublicBook','PortalManual')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_key,id),
  unique (workspace_key,request_id),
  check (status not in ('Contracted','Completed') or earnings_amount is not null)
);

create table tb3_calendar_events (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  tenant_id text not null default 'tarris-bouie-iii' check (tenant_id='tarris-bouie-iii'),
  title text not null check (length(title) between 1 and 300),
  type text not null check (type in ('Academics','Training','Opportunity','Community')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  all_day boolean not null default false,
  description text not null default '' check (length(description) <= 10000),
  linked_module text not null check (linked_module in ('Academics','Training','NIL & Brand','Opportunities','Community')),
  linked_opportunity_id uuid,
  state text not null default 'confirmed' check (state in ('tentative','confirmed')),
  completed boolean not null default false,
  earnings_amount numeric(12,2) check (earnings_amount >= 0),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_key,id),
  foreign key (workspace_key,linked_opportunity_id) references tb3_opportunities(workspace_key,id),
  check (end_time > start_time)
);
create unique index tb3_opportunity_hold_once on tb3_calendar_events(workspace_key,linked_opportunity_id) where linked_opportunity_id is not null;

create table tb3_activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  tenant_id text not null default 'tarris-bouie-iii' check (tenant_id='tarris-bouie-iii'),
  request_id uuid not null,
  type text not null check (type in ('Study Hall','Tutor','Workout','Film','Nutrition','Recovery','Community Clinic','Mentorship')),
  module text not null check (module in ('Academics','Training','Community')),
  title text not null check (length(title) between 1 and 300),
  subtype text,
  duration_minutes integer not null check (duration_minutes between 1 and 1440),
  notes text not null default '' check (length(notes) <= 10000),
  kids_impacted integer not null default 0 check (kids_impacted between 0 and 100000),
  calendar_event_id uuid not null,
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_key,calendar_event_id) references tb3_calendar_events(workspace_key,id),
  unique (workspace_key,calendar_event_id)
  ,unique (workspace_key,request_id)
);

-- Derived totals cannot drift from activity logs or be incremented twice.
create view tb3_impact_metrics with (security_invoker=true) as
select w.workspace_key as id, w.workspace_key,
  'tarris-bouie-iii'::text as tenant_id,
  coalesce(sum(a.duration_minutes) filter (where a.module='Community'),0)::numeric / 60 as total_hours,
  coalesce(sum(a.kids_impacted) filter (where a.module='Community'),0) as total_kids_impacted,
  count(a.id) filter (where a.type='Community Clinic') as total_clinics,
  max(a.created_at) as updated_at
from tb3_workspaces w left join tb3_activity_logs a on a.workspace_key=w.workspace_key
group by w.workspace_key;

create table tb3_documents (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  kind text not null check (kind in ('Contract','Transcript')),
  opportunity_id uuid,
  display_name text not null check (length(display_name) between 1 and 200),
  private_storage_path text not null,
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_by text not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_key,opportunity_id) references tb3_opportunities(workspace_key,id)
);
create table tb3_tutor_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  name text not null,
  subject text not null default '',
  email text not null default '',
  phone text not null default '',
  created_by text not null,
  created_at timestamptz not null default now()
);
create table tb3_academic_status (
  workspace_key text primary key references tb3_workspaces(workspace_key),
  eligibility text not null check (eligibility in ('On Track','Review')),
  updated_by text not null,
  updated_at timestamptz not null default now()
);
create table tb3_notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_key text not null references tb3_workspaces(workspace_key),
  opportunity_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (workspace_key,opportunity_id) references tb3_opportunities(workspace_key,id)
  ,unique (workspace_key,opportunity_id)
);

create index tb3_opportunities_workspace_created on tb3_opportunities(workspace_key,created_at desc);
create index tb3_calendar_workspace_start on tb3_calendar_events(workspace_key,start_time);
create index tb3_activity_workspace_created on tb3_activity_logs(workspace_key,created_at desc);

-- Defense in depth: no direct client access, including authenticated users.
-- Private server endpoints MUST additionally verify active EA membership.
-- people_app can access only the named TB3 preview workspace through RLS.
do $$ declare t text; begin
  foreach t in array array['tb3_workspaces','tb3_opportunities','tb3_calendar_events','tb3_activity_logs','tb3_documents','tb3_tutor_contacts','tb3_academic_status','tb3_notifications'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on table public.%I from anon, authenticated',t);
    execute format('grant select, insert, update, delete on table public.%I to service_role',t);
    execute format('grant select on table public.%I to people_app',t);
    execute format('create policy tb3_preview_read on public.%I for select to people_app using (workspace_key = %L)',t,'tb3-preview-20261005');
    if t <> 'tb3_workspaces' then
      execute format('grant insert, update, delete on table public.%I to people_app',t);
      execute format('create policy tb3_preview_write on public.%I for all to people_app using (workspace_key = %L) with check (workspace_key = %L)',t,'tb3-preview-20261005','tb3-preview-20261005');
    end if;
  end loop;
end $$;
revoke all on tb3_impact_metrics from anon, authenticated;
grant select on tb3_impact_metrics to service_role;
grant select on tb3_impact_metrics to people_app;

insert into tb3_workspaces(workspace_key,organization_id,portal_slug,environment)
values ('tb3-preview-20261005','recxUohHc16hPk1T3','tarris','preview');

create function tb3_create_opportunity(p_workspace text,p_record jsonb,p_source text,p_actor text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare opportunity uuid; existing uuid; event uuid; check_text text; outcome text; requested date;
begin
  perform pg_advisory_xact_lock(hashtext(p_workspace || (p_record->>'request_id')));
  select id into existing from tb3_opportunities where workspace_key=p_workspace and request_id=(p_record->>'request_id')::uuid;
  if existing is not null then return existing; end if;
  check_text := concat_ws(' ',p_record->>'company_name',p_record->>'vision_answer',p_record->>'message',p_record->>'type');
  outcome := case when check_text ~* '\y(gambling|betting|casino|alcohol|liquor|beer|wine|spirits|cannabis|marijuana|thc|cbd|vape|vaping)\y' then 'Fail'
    when check_text ~* '\y(youth|education|community|discipline|faith|family)\y' then 'Pass' else 'Review' end;
  requested := nullif(p_record->>'date_requested','')::date;
  insert into tb3_opportunities(workspace_key,request_id,company_name,contact_name,contact_email,phone,type,budget_range,date_requested,vision_answer,message,status,values_check,created_from,created_by)
  values(p_workspace,(p_record->>'request_id')::uuid,p_record->>'company_name',p_record->>'contact_name',p_record->>'contact_email',p_record->>'phone',p_record->>'type',p_record->>'budget_range',requested,p_record->>'vision_answer',coalesce(p_record->>'message',''),'Inbound',outcome,p_source,p_actor) returning id into opportunity;
  if requested is not null then
    insert into tb3_calendar_events(workspace_key,title,type,start_time,end_time,all_day,description,linked_module,linked_opportunity_id,state,created_by)
    values(p_workspace,(p_record->>'company_name')||' · Tentative Hold','Opportunity',requested::timestamp at time zone 'America/New_York',(requested+1)::timestamp at time zone 'America/New_York',true,'Requested date; time to be confirmed.','Opportunities',opportunity,'tentative',p_actor) returning id into event;
  end if;
  insert into tb3_notifications(workspace_key,opportunity_id) values(p_workspace,opportunity);
  return opportunity;
end $$;

create function tb3_change_status(p_workspace text,p_id uuid,p_status text,p_earnings numeric)
returns uuid language plpgsql security invoker set search_path=public as $$
begin
  if p_status in ('Contracted','Completed') and (p_earnings is null or p_earnings<0) then raise exception 'Earnings required'; end if;
  update tb3_opportunities set status=p_status,earnings_amount=case when p_status in ('Contracted','Completed') then p_earnings else null end,updated_at=now()
  where workspace_key=p_workspace and id=p_id;
  if not found then raise exception 'Opportunity not found'; end if;
  update tb3_calendar_events set state=case when p_status in ('Contracted','Completed') then 'confirmed' else 'tentative' end,completed=p_status='Completed',earnings_amount=p_earnings,updated_at=now()
  where workspace_key=p_workspace and linked_opportunity_id=p_id;
  return p_id;
end $$;

create function tb3_log_activity(p_workspace text,p_record jsonb,p_actor text)
returns uuid language plpgsql security invoker set search_path=public as $$
declare event uuid; activity uuid; existing uuid; started timestamptz; duration integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_workspace || (p_record->>'request_id')));
  select id into existing from tb3_activity_logs where workspace_key=p_workspace and request_id=(p_record->>'request_id')::uuid;
  if existing is not null then return existing; end if;
  started := (p_record->>'start_time')::timestamptz; duration := (p_record->>'duration_minutes')::integer;
  insert into tb3_calendar_events(workspace_key,title,type,start_time,end_time,description,linked_module,completed,created_by)
  values(p_workspace,p_record->>'title',p_record->>'module',started,started+duration*interval '1 minute',coalesce(p_record->>'notes',''),p_record->>'module',true,p_actor) returning id into event;
  insert into tb3_activity_logs(workspace_key,request_id,type,module,title,subtype,duration_minutes,notes,kids_impacted,calendar_event_id,created_by)
  values(p_workspace,(p_record->>'request_id')::uuid,p_record->>'type',p_record->>'module',p_record->>'title',p_record->>'subtype',duration,coalesce(p_record->>'notes',''),coalesce((p_record->>'kids_impacted')::integer,0),event,p_actor) returning id into activity;
  return activity;
end $$;

revoke all on function tb3_create_opportunity(text,jsonb,text,text),tb3_change_status(text,uuid,text,numeric),tb3_log_activity(text,jsonb,text) from public,anon,authenticated;
grant execute on function tb3_create_opportunity(text,jsonb,text,text),tb3_change_status(text,uuid,text,numeric),tb3_log_activity(text,jsonb,text) to people_app;

commit;
