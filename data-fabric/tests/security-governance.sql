BEGIN;

-- Disposable acceptance fixture after migrations 0001-0003.
INSERT INTO fabric.organizations(id, name, slug) VALUES
 ('00000000-0000-0000-0000-0000000002a1','Run2 Org A','run2-org-a'),
 ('00000000-0000-0000-0000-0000000002b2','Run2 Org B','run2-org-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.identities(id, external_subject, email) VALUES
 ('20000000-0000-0000-0000-000000000001','run2-admin','admin@example.test'),
 ('20000000-0000-0000-0000-000000000002','run2-case','case@example.test'),
 ('20000000-0000-0000-0000-000000000003','run2-finance','finance@example.test'),
 ('20000000-0000-0000-0000-000000000004','run2-suspended','suspended@example.test')
ON CONFLICT (id) DO NOTHING;

SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000002a1';
SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000001';

INSERT INTO fabric.memberships(id, organization_id, identity_id, role, status) VALUES
 ('21000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000002a1','20000000-0000-0000-0000-000000000001','organization_admin','active'),
 ('21000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000002a1','20000000-0000-0000-0000-000000000002','case_manager','active'),
 ('21000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000002a1','20000000-0000-0000-0000-000000000003','finance','active'),
 ('21000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000002a1','20000000-0000-0000-0000-000000000004','executive','suspended')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.programs(id, organization_id, external_key, name) VALUES
 ('22000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000002a1','program-a1','Assigned Program'),
 ('22000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000002a1','program-a2','Unassigned Program')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.program_access(id, organization_id, membership_id, program_id, access_level) VALUES
 ('23000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000002a1','21000000-0000-0000-0000-000000000002','22000000-0000-0000-0000-000000000001','member')
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT fabric.has_permission('organization:manage') THEN
    RAISE EXCEPTION 'organization_admin must have organization:manage';
  END IF;
  IF NOT fabric.has_permission('finance:write') THEN
    RAISE EXCEPTION 'organization_admin must have finance:write';
  END IF;
END $$;

SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000002';
DO $$
BEGIN
  IF NOT fabric.has_permission('pii:write') THEN
    RAISE EXCEPTION 'case_manager must have pii:write';
  END IF;
  IF fabric.has_permission('finance:write') THEN
    RAISE EXCEPTION 'case_manager must not have finance:write';
  END IF;
  IF NOT fabric.can_access_program('22000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'case_manager must access assigned program';
  END IF;
  IF fabric.can_access_program('22000000-0000-0000-0000-000000000002') THEN
    RAISE EXCEPTION 'case_manager must not access unassigned program';
  END IF;
END $$;

SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000003';
DO $$
BEGIN
  IF NOT fabric.has_permission('finance:write') THEN
    RAISE EXCEPTION 'finance must have finance:write';
  END IF;
  IF fabric.has_permission('pii:write') THEN
    RAISE EXCEPTION 'finance must not have pii:write';
  END IF;
  IF NOT fabric.can_access_program('22000000-0000-0000-0000-000000000002') THEN
    RAISE EXCEPTION 'finance tenant-wide program visibility expected';
  END IF;
END $$;

SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000004';
DO $$
BEGIN
  IF fabric.has_permission('submission:approve') THEN
    RAISE EXCEPTION 'suspended membership must have no permissions';
  END IF;
END $$;

-- Missing identity fails closed.
SET LOCAL app.current_identity_id = '';
DO $$
BEGIN
  IF fabric.has_permission('program:read') THEN
    RAISE EXCEPTION 'missing identity must fail closed';
  END IF;
END $$;

-- Membership changes must create audit events.
SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000001';
UPDATE fabric.memberships
SET role = 'executive'
WHERE id = '21000000-0000-0000-0000-000000000004';

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n
  FROM fabric.audit_events
  WHERE organization_id = '00000000-0000-0000-0000-0000000002a1'
    AND event_type = 'membership.updated'
    AND entity_id = '21000000-0000-0000-0000-000000000004';
  IF n < 1 THEN RAISE EXCEPTION 'membership update audit event missing'; END IF;
END $$;

-- Even a privileged caller cannot mutate the audit history accidentally.
DO $$
BEGIN
  BEGIN
    UPDATE fabric.audit_events
    SET event_type = 'tampered'
    WHERE organization_id = '00000000-0000-0000-0000-0000000002a1'
    LIMIT 1;
    RAISE EXCEPTION 'audit mutation unexpectedly succeeded';
  EXCEPTION
    WHEN syntax_error THEN
      -- PostgreSQL UPDATE has no LIMIT; run a valid targeted update below.
      NULL;
  END;

  BEGIN
    UPDATE fabric.audit_events
    SET event_type = 'tampered'
    WHERE id = (
      SELECT id FROM fabric.audit_events
      WHERE organization_id = '00000000-0000-0000-0000-0000000002a1'
      ORDER BY id LIMIT 1
    );
    RAISE EXCEPTION 'audit mutation unexpectedly succeeded';
  EXCEPTION
    WHEN raise_exception THEN
      IF SQLERRM <> 'audit_events are append-only' THEN RAISE; END IF;
  END;
END $$;

-- Wrong tenant context cannot resolve Org A's membership or program access.
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000002b2';
SET LOCAL app.current_identity_id = '20000000-0000-0000-0000-000000000002';
DO $$
BEGIN
  IF fabric.has_permission('pii:read') THEN
    RAISE EXCEPTION 'cross-tenant permission leak detected';
  END IF;
  IF fabric.can_access_program('22000000-0000-0000-0000-000000000001') THEN
    RAISE EXCEPTION 'cross-tenant program access leak detected';
  END IF;
END $$;

ROLLBACK;