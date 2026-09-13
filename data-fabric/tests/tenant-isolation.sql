BEGIN;

-- This fixture is intended for a disposable test database after 0001_foundation.sql.
-- Use deterministic UUIDs so failures are reproducible.

INSERT INTO fabric.organizations(id, name, slug)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Run0 Org A', 'run0-org-a'),
  ('00000000-0000-0000-0000-0000000000b2', 'Run0 Org B', 'run0-org-b')
ON CONFLICT (id) DO NOTHING;

-- Seed through a privileged migration/test identity before tenant RLS checks.
SET LOCAL row_security = off;

INSERT INTO fabric.tenant_records(id, organization_id, record_type, external_key, payload)
VALUES
  ('10000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-0000000000a1', 'fixture', 'A-only', '{"owner":"A"}'),
  ('10000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b2', 'fixture', 'B-only', '{"owner":"B"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.audit_events(organization_id, event_type, entity_type, entity_id, metadata)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'run0.fixture.created', 'fixture', 'A-only', '{"owner":"A"}'),
  ('00000000-0000-0000-0000-0000000000b2', 'run0.fixture.created', 'fixture', 'B-only', '{"owner":"B"}');

SET LOCAL row_security = on;

DO $$
DECLARE n integer;
BEGIN
  PERFORM set_config('app.current_organization_id', '00000000-0000-0000-0000-0000000000a1', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 1 THEN RAISE EXCEPTION 'Org A isolation failed: expected 1 row, got %', n; END IF;
  IF EXISTS (SELECT 1 FROM fabric.tenant_records WHERE external_key = 'B-only') THEN
    RAISE EXCEPTION 'Org A can see Org B data';
  END IF;

  PERFORM set_config('app.current_organization_id', '00000000-0000-0000-0000-0000000000b2', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 1 THEN RAISE EXCEPTION 'Org B isolation failed: expected 1 row, got %', n; END IF;
  IF EXISTS (SELECT 1 FROM fabric.tenant_records WHERE external_key = 'A-only') THEN
    RAISE EXCEPTION 'Org B can see Org A data';
  END IF;

  PERFORM set_config('app.current_organization_id', '', true);
  SELECT count(*) INTO n FROM fabric.tenant_records;
  IF n <> 0 THEN RAISE EXCEPTION 'Fail-closed isolation failed: expected 0 rows without tenant context, got %', n; END IF;
END $$;

ROLLBACK;