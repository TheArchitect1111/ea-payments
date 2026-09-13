BEGIN;

INSERT INTO fabric.organizations(id, name, slug) VALUES
 ('00000000-0000-0000-0000-0000000004a1','Run4 Org A','run4-org-a'),
 ('00000000-0000-0000-0000-0000000004b2','Run4 Org B','run4-org-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.identities(id, external_subject, email) VALUES
 ('40000000-0000-0000-0000-000000000001','run4-reporter','reporter@example.test'),
 ('40000000-0000-0000-0000-000000000002','run4-case','case@example.test')
ON CONFLICT (id) DO NOTHING;

SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000004a1';
SET LOCAL app.current_identity_id = '40000000-0000-0000-0000-000000000001';

INSERT INTO fabric.memberships(id, organization_id, identity_id, role, status) VALUES
 ('41000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000004a1','40000000-0000-0000-0000-000000000001','reporting_manager','active'),
 ('41000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000004a1','40000000-0000-0000-0000-000000000002','case_manager','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.connector_definitions(id, organization_id, name, connector_type, destination_system, requires_human_approval) VALUES
 ('42000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000004a1','Mock API','api','mock-api',false),
 ('42000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000004a1','Mock File','file','mock-file',false),
 ('42000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000004a1','Mock Browser','browser','mock-browser',true),
 ('42000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000004a1','Mock Human','human','mock-human',true),
 ('42000000-0000-0000-0000-0000000000b2','00000000-0000-0000-0000-0000000004b2','Org B API','api','mock-b',false)
ON CONFLICT (id) DO NOTHING;

-- API connector completes the durable lifecycle without approval.
INSERT INTO fabric.connector_runs(id, organization_id, connector_id, correlation_key)
VALUES ('43000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000004a1','42000000-0000-0000-0000-000000000001','api-001');
UPDATE fabric.connector_runs SET status='prepared' WHERE id='43000000-0000-0000-0000-000000000001';
UPDATE fabric.connector_runs SET status='validated' WHERE id='43000000-0000-0000-0000-000000000001';
UPDATE fabric.connector_runs SET status='submitted', destination_reference='ACK-001' WHERE id='43000000-0000-0000-0000-000000000001';
UPDATE fabric.connector_runs SET status='accepted' WHERE id='43000000-0000-0000-0000-000000000001';
UPDATE fabric.connector_runs SET status='reconciled' WHERE id='43000000-0000-0000-0000-000000000001';

DO $$
DECLARE s text; n integer;
BEGIN
 SELECT status INTO s FROM fabric.connector_runs WHERE id='43000000-0000-0000-0000-000000000001';
 IF s <> 'reconciled' THEN RAISE EXCEPTION 'API run did not reconcile'; END IF;
 SELECT count(*) INTO n FROM fabric.connector_run_events WHERE connector_run_id='43000000-0000-0000-0000-000000000001';
 IF n <> 5 THEN RAISE EXCEPTION 'expected 5 lifecycle events, got %', n; END IF;
END $$;

-- Human connector cannot bypass approval.
INSERT INTO fabric.connector_runs(id, organization_id, connector_id, correlation_key)
VALUES ('43000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000004a1','42000000-0000-0000-0000-000000000004','human-001');
UPDATE fabric.connector_runs SET status='prepared' WHERE id='43000000-0000-0000-0000-000000000002';
UPDATE fabric.connector_runs SET status='validated' WHERE id='43000000-0000-0000-0000-000000000002';

DO $$
BEGIN
  BEGIN
    UPDATE fabric.connector_runs SET status='submitted' WHERE id='43000000-0000-0000-0000-000000000002';
    RAISE EXCEPTION 'approval bypass unexpectedly succeeded';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM <> 'human approval required before submission' THEN RAISE; END IF;
  END;
END $$;

CREATE TEMP TABLE run4_approval(id uuid);
INSERT INTO run4_approval SELECT fabric.request_connector_approval('43000000-0000-0000-0000-000000000002');

-- Case manager lacks submission approval permission.
SET LOCAL app.current_identity_id = '40000000-0000-0000-0000-000000000002';
DO $$
DECLARE a uuid;
BEGIN
 SELECT id INTO a FROM run4_approval;
 BEGIN
   PERFORM fabric.decide_connector_approval(a, 'approved', 'unauthorized attempt');
   RAISE EXCEPTION 'unauthorized approval unexpectedly succeeded';
 EXCEPTION WHEN raise_exception THEN
   IF SQLERRM <> 'submission approval permission required' THEN RAISE; END IF;
 END;
END $$;

-- Reporting manager approves, then submission can proceed.
SET LOCAL app.current_identity_id = '40000000-0000-0000-0000-000000000001';
DO $$ DECLARE a uuid; BEGIN SELECT id INTO a FROM run4_approval; PERFORM fabric.decide_connector_approval(a, 'approved', 'verified'); END $$;
UPDATE fabric.connector_runs SET status='submitted', destination_reference='HUMAN-ACK-1' WHERE id='43000000-0000-0000-0000-000000000002';
UPDATE fabric.connector_runs SET status='accepted' WHERE id='43000000-0000-0000-0000-000000000002';
UPDATE fabric.connector_runs SET status='reconciled' WHERE id='43000000-0000-0000-0000-000000000002';

DO $$
DECLARE s text; a text;
BEGIN
 SELECT status INTO s FROM fabric.connector_runs WHERE id='43000000-0000-0000-0000-000000000002';
 IF s <> 'reconciled' THEN RAISE EXCEPTION 'human run did not reconcile'; END IF;
 SELECT status INTO a FROM fabric.approval_requests WHERE connector_run_id='43000000-0000-0000-0000-000000000002';
 IF a <> 'approved' THEN RAISE EXCEPTION 'approval was not recorded'; END IF;
END $$;

-- Cross-tenant connector relationships are rejected.
DO $$
BEGIN
  BEGIN
    INSERT INTO fabric.connector_runs(id, organization_id, connector_id)
    VALUES ('43000000-0000-0000-0000-000000000099','00000000-0000-0000-0000-0000000004a1','42000000-0000-0000-0000-0000000000b2');
    RAISE EXCEPTION 'cross-tenant connector relation unexpectedly succeeded';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
END $$;

-- RLS verification as a non-privileged application role.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='run4_app') THEN CREATE ROLE run4_app NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA fabric TO run4_app;
GRANT SELECT ON fabric.connector_definitions, fabric.connector_runs TO run4_app;
SET LOCAL ROLE run4_app;
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000004a1';
DO $$ DECLARE n integer; BEGIN SELECT count(*) INTO n FROM fabric.connector_definitions; IF n <> 4 THEN RAISE EXCEPTION 'Org A expected 4 connectors, got %', n; END IF; END $$;
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000004b2';
DO $$ DECLARE n integer; BEGIN SELECT count(*) INTO n FROM fabric.connector_definitions; IF n <> 1 THEN RAISE EXCEPTION 'Org B expected 1 connector, got %', n; END IF; END $$;
SET LOCAL app.current_organization_id = '';
DO $$ DECLARE n integer; BEGIN SELECT count(*) INTO n FROM fabric.connector_definitions; IF n <> 0 THEN RAISE EXCEPTION 'missing tenant context must see 0 connectors'; END IF; END $$;
RESET ROLE;

ROLLBACK;