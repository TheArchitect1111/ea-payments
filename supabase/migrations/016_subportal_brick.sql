-- Subportal Brick v1: generic organization-scoped, student-private records.
-- Additive migration. Applies no policies to unrelated tables.
begin;
create table if not exists public.subportal_students (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(trim(email)) and length(email) between 3 and 320),
  name text not null check (length(name) between 1 and 200),
  auth_subject text unique,
  created_at timestamptz not null default now()
);
create table if not exists public.subportal_owner_access (
  organization_id text not null check (organization_id like 'rec%'),
  auth_subject text not null,
  expires_at timestamptz not null default now() + interval '2 minutes',
  primary key (organization_id, auth_subject)
);
create table if not exists public.subportal_enrollments (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null check (organization_id like 'rec%'),
  student_id uuid not null references public.subportal_students(id) on delete restrict,
  offer_id text not null check (length(offer_id) between 1 and 80),
  program_title text not null,
  provider text not null check (provider in ('stripe','square')),
  payment_reference text not null,
  idempotency_key text not null unique,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  first_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider,payment_reference),
  unique(id,student_id,organization_id)
);
create index if not exists subportal_enrollment_student_org_idx
  on public.subportal_enrollments(student_id,organization_id);
create table if not exists public.subportal_progress (
  enrollment_id uuid primary key,
  organization_id text not null,
  student_id uuid not null,
  current_module text,
  completed_modules jsonb not null default '[]'::jsonb
    check (jsonb_typeof(completed_modules)='array'),
  updated_at timestamptz not null default now(),
  foreign key(enrollment_id,student_id,organization_id)
    references public.subportal_enrollments(id,student_id,organization_id) on delete cascade
);
create table if not exists public.subportal_checkout_orders (
  checkout_id text primary key,
  organization_id text not null,
  offer_id text not null,
  provider text not null check (provider in ('stripe','square')),
  buyer_email text not null,
  buyer_name text not null,
  amount_cad_cents integer not null check(amount_cad_cents > 0),
  created_at timestamptz not null default now()
);
create table if not exists public.subportal_deliveries (
  session_id text primary key,
  organization_id text not null,
  provider text not null check (provider in ('stripe','square')),
  student_id uuid not null references public.subportal_students(id),
  enrollment_id uuid not null references public.subportal_enrollments(id),
  email_id text,
  receipt_pdf_base64 text,
  receipt_sha256 text,
  success_page text,
  access_link text,
  next_steps text,
  created_at timestamptz not null default now()
);
alter table public.subportal_students enable row level security;
alter table public.subportal_owner_access enable row level security;
alter table public.subportal_enrollments enable row level security;
alter table public.subportal_progress enable row level security;
alter table public.subportal_checkout_orders enable row level security;
alter table public.subportal_deliveries enable row level security;

revoke all on public.subportal_students,public.subportal_owner_access,
  public.subportal_enrollments,public.subportal_progress,
  public.subportal_checkout_orders,public.subportal_deliveries from anon,authenticated;
grant select on public.subportal_students to authenticated;
grant select on public.subportal_owner_access to authenticated;
grant select on public.subportal_enrollments to authenticated;
grant select,update (current_module,completed_modules) on public.subportal_progress to authenticated;

create policy subportal_student_self on public.subportal_students
  for select to authenticated using (
    auth_subject = (select auth.jwt()->>'sub')
  );
create policy subportal_owner_self on public.subportal_owner_access
  for select to authenticated using (
    auth_subject = (select auth.jwt()->>'sub') and expires_at > now()
  );
create policy subportal_enrollment_private on public.subportal_enrollments
  for select to authenticated using (
    exists(select 1 from public.subportal_students s
      where s.id = student_id and s.auth_subject = (select auth.jwt()->>'sub'))
    or exists(select 1 from public.subportal_owner_access owners
      where owners.organization_id = subportal_enrollments.organization_id
        and owners.auth_subject = (select auth.jwt()->>'sub')
        and owners.expires_at > now())
  );
create policy subportal_progress_private on public.subportal_progress
  for select to authenticated using (
    exists(select 1 from public.subportal_students s
      where s.id = student_id and s.auth_subject = (select auth.jwt()->>'sub'))
    or exists(select 1 from public.subportal_owner_access owners
      where owners.organization_id = subportal_progress.organization_id
        and owners.auth_subject = (select auth.jwt()->>'sub')
        and owners.expires_at > now())
  );
create policy subportal_progress_student_update on public.subportal_progress
  for update to authenticated using (
    exists(select 1 from public.subportal_students s
      join public.subportal_enrollments e on e.student_id=s.id
      where s.id=subportal_progress.student_id
        and e.id=subportal_progress.enrollment_id
        and e.organization_id=subportal_progress.organization_id
        and e.status='active'
        and s.auth_subject=(select auth.jwt()->>'sub'))
  ) with check (
    exists(select 1 from public.subportal_students s
      join public.subportal_enrollments e on e.student_id=s.id
      where s.id=subportal_progress.student_id
        and e.id=subportal_progress.enrollment_id
        and e.organization_id=subportal_progress.organization_id
        and e.status='active'
        and s.auth_subject=(select auth.jwt()->>'sub'))
  );
-- Checkout correlations and receipt deliveries deliberately have NO authenticated policies.
-- Only trusted, server-side service_role may write or read these tables.
grant select,insert,update,delete on
  public.subportal_students,public.subportal_owner_access,
  public.subportal_enrollments,public.subportal_progress,
  public.subportal_checkout_orders,public.subportal_deliveries to service_role;
commit;
