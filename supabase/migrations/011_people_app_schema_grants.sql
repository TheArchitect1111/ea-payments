-- Phase 2D: idempotent people_app schema grants for production.
-- Re-asserts USAGE + DML + RPC EXECUTE from 008–010 without recreating schema.
-- Safe to re-run. Does not enable UNIVERSAL_PEOPLE* application flags.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_app') THEN
    ALTER ROLE people_app WITH NOLOGIN NOINHERIT;
  ELSE
    CREATE ROLE people_app NOLOGIN NOINHERIT;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'could not alter/create people_app role';
END $$;

DO $$
BEGIN
  GRANT people_app TO authenticator;
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'authenticator role missing — skip GRANT people_app';
WHEN insufficient_privilege THEN
  RAISE NOTICE 'cannot GRANT people_app TO authenticator';
WHEN duplicate_object THEN
  NULL;
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
  GRANT EXECUTE ON FUNCTION people.get_person(text) TO people_app;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'people.get_person missing — apply 010 first';
END $$;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION people.upsert_relationship(text, text, text, text, text, text, timestamptz, text) TO people_app;
EXCEPTION WHEN undefined_function THEN
  RAISE NOTICE 'people.upsert_relationship missing — apply 009 first';
END $$;

DO $$
BEGIN
  GRANT EXECUTE ON FUNCTION people.pre_request() TO authenticator;
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'authenticator not present';
WHEN insufficient_privilege THEN
  RAISE NOTICE 'cannot GRANT pre_request TO authenticator';
END $$;

-- Keep broad roles revoked from people schema
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON SCHEMA people FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA people FROM anon, authenticated, service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
