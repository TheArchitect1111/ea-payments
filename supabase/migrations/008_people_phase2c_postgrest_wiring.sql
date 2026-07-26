-- Phase 2C local/cert wiring: JWT-usable people_app + PostgREST pre-request.
-- Safe on isolated local Supabase; do not apply to production without owner review.

DO $$
BEGIN
  -- Prefer NOLOGIN JWT role for PostgREST (authenticator SET ROLE).
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_app') THEN
    ALTER ROLE people_app WITH NOLOGIN;
  ELSE
    CREATE ROLE people_app NOLOGIN NOINHERIT;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'could not alter people_app role';
END $$;

DO $$
BEGIN
  GRANT people_app TO authenticator;
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'authenticator role missing — skip GRANT people_app';
WHEN insufficient_privilege THEN
  RAISE NOTICE 'cannot GRANT people_app TO authenticator';
END $$;

GRANT USAGE ON SCHEMA people TO people_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA people TO people_app;
REVOKE UPDATE, DELETE ON people.audit_events FROM people_app;
GRANT INSERT ON people.audit_events TO people_app;

GRANT EXECUTE ON FUNCTION people.ensure_person(text, text, text, text, text, text, text) TO people_app;
GRANT EXECUTE ON FUNCTION people.merge_finalize(text, text, text, text) TO people_app;
GRANT EXECUTE ON FUNCTION people.update_person(text, text, timestamptz, jsonb) TO people_app;
GRANT EXECUTE ON FUNCTION people.pre_request() TO people_app;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION people.pre_request() TO authenticator;
  ALTER ROLE authenticator SET pgrst.db_pre_request = 'people.pre_request';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'authenticator not present — configure db-pre-request manually';
WHEN insufficient_privilege THEN
  RAISE NOTICE 'cannot set pgrst.db_pre_request on authenticator';
END $$;

-- Ensure broad roles stay revoked from people schema (INV-29 / ADV-P-12)
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON SCHEMA people FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA people FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.ensure_person(text, text, text, text, text, text, text) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.merge_finalize(text, text, text, text) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.update_person(text, text, timestamptz, jsonb) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.pre_request() FROM anon, authenticated, service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
