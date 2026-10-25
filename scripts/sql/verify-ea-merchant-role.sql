-- Read-only verification for the merchant-only login.
-- Run in Supabase Primary Database SQL Editor. Does not reveal credentials.
select rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole
from pg_roles where rolname = 'ea_merchant_api';

select table_name, privilege_type
from information_schema.role_table_grants
where grantee = 'ea_merchant_api' and table_schema='public'
order by table_name, privilege_type;

select table_name, column_name, privilege_type
from information_schema.column_privileges
where grantee='ea_merchant_api' and table_schema='public'
order by table_name, column_name, privilege_type;

select policyname, cmd, roles
from pg_policies
where schemaname='public' and tablename='ea_merchant_connections'
order by policyname;
