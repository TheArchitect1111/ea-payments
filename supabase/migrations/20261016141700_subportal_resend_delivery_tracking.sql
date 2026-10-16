-- Add proof of delivery, separate from Resend API acceptance.
begin;
alter table public.subportal_deliveries
  add column if not exists delivery_status text not null default 'accepted'
    check(delivery_status in ('accepted','sent','delivered','bounced','complained','failed')),
  add column if not exists delivered_at timestamptz,
  add column if not exists delivery_event_id text;
commit;
