-- Merchant IDs only. Never store bank details or Stripe credentials.
-- Not yet applied: schedule separate reviewed staging migration before live onboarding.
create table if not exists public.ea_merchant_connections (
  tenant_id text primary key,
  stripe_account_id text not null unique,
  created_at timestamptz not null default now(),
  constraint valid_tenant check (tenant_id ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,100}$'),
  constraint valid_stripe_account check (stripe_account_id ~ '^acct_[a-zA-Z0-9]+$')
);
alter table public.ea_merchant_connections enable row level security;
revoke all on public.ea_merchant_connections from anon, authenticated;
-- Only backend service role accesses this table after portal owner authorization.
