BEGIN;

-- Disposable acceptance fixture. Run as a PostgreSQL administrative test identity.
-- The assertions themselves execute as a non-privileged application role so RLS is real.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fabric_test_app') THEN
    CREATE ROLE fabric_test_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;

GRANT USAGE ON SCHEMA fabric TO fabric_test_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON fabric.memberships TO fabric_test_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON fabric.tenant_records TO fabric_test_app;
GRANT SELECT, INSERT ON fabric.audit_events TO fabric_test_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA fabric TO fabric_test_app;

INSERT INTO fabric.organizations(id, name, slug)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Run0 Org A', 'run0-org-a'),
  ('00000000-0000-0000-0000-0000000000b2', 'Run0 Org B', 'run0-org-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.tenant_records(id, organization_id, record_type, external_key, payload)
VALUES
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'fixture', 'A-only', '{"owner":"A"}'),
  ('10000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'fixture', 'B-only', '{"owner":"B"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.audit_events(organization_id, event_type, entity_type, entity_id, metadata)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'run0.fixture.created', 'fixture', 'A-only', '{"owner":"A"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'run0.fixture.created', 'fixture', 'B-only', '{"owner":"B"}');

SET LOCAL ROLE fabric_test_app;

DO $$
DECLARE n integer;
BEGIN
  PERFORM set_config('app.current_organization_id', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 1 THEN RAISE EXCEPTION 'Org A isolation failed: expected 1 row, got %', n; END IF;
  IF EXISTS (SELECT 1 FROM fabric.tenant_records WHERE external_key = 'B-only') THEN
    RAISE EXCEPTION 'Org A can see Org B data';
  END IF;
  SELECT count(*) INTO n FROM fabric.audit_events;
  IF n <> 1 THEN RAISE EXCEPTION 'Org A audit isolation failed: expected 1 row, got %', n; END IF;

  PERFORM set_config('app.current_organization_id', '00000000-0000-0000-0000-0000000000b2', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 1 THEN RAISE EXCEPTION 'Org B isolation failed: expected 1 row, got %', n; END IF;
  IF EXISTS (SELECT 1 FROM fabric.tenant_records WHERE external_key = 'A-only') THEN
    RAISE EXCEPTION 'Org B can see Org A data';
  END IF;
  SELECT count(*) INTO n FROM fabric.audit_events;
  IF n <> 1 THEN RAISE EXCEPTION 'Org B audit isolation failed: expected 1 row, got %', n; END IF;

  PERFORM set_config('app.current_organization_id', '', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 0 THEN RAISE EXCEPTION 'Fail-closed isolation failed: expected 0 rows without tenant context, got %', n; END IF;
END $$;

RESET ROLE;
ROLLBACK;