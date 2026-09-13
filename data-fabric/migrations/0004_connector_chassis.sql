BEGIN;

-- Run 4: Connector Chassis
-- Standardizes outbound/inbound integration execution independently of any
-- specific funder or reporting-system mapping.

CREATE TABLE IF NOT EXISTS fabric.connector_definitions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  connector_type text NOT NULL CHECK (connector_type IN ('api','file','browser','human')),
  destination_system text NOT NULL,
  direction text NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound','inbound','bidirectional')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  requires_human_approval boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS fabric.connector_runs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  connector_id uuid NOT NULL,
  reporting_requirement_id uuid,
  correlation_key text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','prepared','validated','approval_required','approved','submitted',
    'accepted','reconciled','failed','cancelled'
  )),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  payload_manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  destination_reference text,
  last_error jsonb,
  prepared_at timestamptz,
  submitted_at timestamptz,
  accepted_at timestamptz,
  reconciled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (connector_id, organization_id)
    REFERENCES fabric.connector_definitions(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (reporting_requirement_id, organization_id)
    REFERENCES fabric.reporting_requirements(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.connector_run_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  connector_run_id uuid NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fabric.connector_artifacts (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  connector_run_id uuid NOT NULL,
  artifact_type text NOT NULL CHECK (artifact_type IN ('request','response','csv','json','xml','pdf','screenshot','receipt','other')),
  storage_uri text,
  checksum_sha256 text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fabric.approval_requests (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  connector_run_id uuid NOT NULL,
  requested_by_identity_id uuid,
  approved_by_identity_id uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied','expired','cancelled')),
  reason text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, connector_run_id, status),
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by_identity_id) REFERENCES fabric.identities(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by_identity_id) REFERENCES fabric.identities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS connector_definitions_org_type_idx
  ON fabric.connector_definitions (organization_id, connector_type, enabled);
CREATE INDEX IF NOT EXISTS connector_runs_org_status_idx
  ON fabric.connector_runs (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS connector_runs_correlation_idx
  ON fabric.connector_runs (organization_id, correlation_key);
CREATE INDEX IF NOT EXISTS connector_events_run_idx
  ON fabric.connector_run_events (organization_id, connector_run_id, occurred_at);
CREATE INDEX IF NOT EXISTS approvals_org_status_idx
  ON fabric.approval_requests (organization_id, status, requested_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'connector_definitions','connector_runs','connector_run_events','connector_artifacts','approval_requests'
  ]
  LOOP
    EXECUTE format('ALTER TABLE fabric.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE fabric.%I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON fabric.%I', t || '_tenant_isolation', t);
    EXECUTE format(
      'CREATE POLICY %I ON fabric.%I USING (organization_id = fabric.current_organization_id()) WITH CHECK (organization_id = fabric.current_organization_id())',
      t || '_tenant_isolation', t
    );
  END LOOP;
END $$;

-- Allowed state transitions are centralized so orchestration cannot silently jump gates.
CREATE OR REPLACE FUNCTION fabric.connector_transition_allowed(from_status text, to_status text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN from_status = to_status THEN true
    WHEN from_status = 'draft' AND to_status IN ('prepared','cancelled','failed') THEN true
    WHEN from_status = 'prepared' AND to_status IN ('validated','failed','cancelled') THEN true
    WHEN from_status = 'validated' AND to_status IN ('approval_required','approved','submitted','failed','cancelled') THEN true
    WHEN from_status = 'approval_required' AND to_status IN ('approved','cancelled','failed') THEN true
    WHEN from_status = 'approved' AND to_status IN ('submitted','failed','cancelled') THEN true
    WHEN from_status = 'submitted' AND to_status IN ('accepted','failed') THEN true
    WHEN from_status = 'accepted' AND to_status IN ('reconciled','failed') THEN true
    ELSE false
  END;
$$;

CREATE OR REPLACE FUNCTION fabric.enforce_connector_run_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF NOT fabric.connector_transition_allowed(OLD.status, NEW.status) THEN
      RAISE EXCEPTION 'invalid connector run transition: % -> %', OLD.status, NEW.status;
    END IF;

    INSERT INTO fabric.connector_run_events(
      organization_id, connector_run_id, event_type, from_status, to_status, detail
    ) VALUES (
      NEW.organization_id, NEW.id, 'status.changed', OLD.status, NEW.status, '{}'::jsonb
    );

    NEW.updated_at := now();
    IF NEW.status = 'prepared' AND NEW.prepared_at IS NULL THEN NEW.prepared_at := now(); END IF;
    IF NEW.status = 'submitted' AND NEW.submitted_at IS NULL THEN NEW.submitted_at := now(); END IF;
    IF NEW.status = 'accepted' AND NEW.accepted_at IS NULL THEN NEW.accepted_at := now(); END IF;
    IF NEW.status = 'reconciled' AND NEW.reconciled_at IS NULL THEN NEW.reconciled_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS connector_run_transition_guard ON fabric.connector_runs;
CREATE TRIGGER connector_run_transition_guard
BEFORE UPDATE OF status ON fabric.connector_runs
FOR EACH ROW EXECUTE FUNCTION fabric.enforce_connector_run_transition();

-- Approval must match the connector policy and tenant context.
CREATE OR REPLACE FUNCTION fabric.request_connector_approval(target_run_id uuid)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  run_row fabric.connector_runs%ROWTYPE;
  connector_row fabric.connector_definitions%ROWTYPE;
  approval_id uuid;
BEGIN
  SELECT * INTO run_row FROM fabric.connector_runs WHERE id = target_run_id;
  IF run_row.id IS NULL THEN RAISE EXCEPTION 'connector run not found'; END IF;

  SELECT * INTO connector_row FROM fabric.connector_definitions WHERE id = run_row.connector_id;
  IF connector_row.id IS NULL THEN RAISE EXCEPTION 'connector definition not found'; END IF;

  IF NOT connector_row.requires_human_approval THEN
    RAISE EXCEPTION 'connector does not require human approval';
  END IF;

  IF run_row.status <> 'validated' THEN
    RAISE EXCEPTION 'connector run must be validated before approval request';
  END IF;

  UPDATE fabric.connector_runs SET status = 'approval_required' WHERE id = target_run_id;

  approval_id := gen_random_uuid();
  INSERT INTO fabric.approval_requests(id, organization_id, connector_run_id, requested_by_identity_id)
  VALUES (approval_id, run_row.organization_id, run_row.id, fabric.current_identity_id());

  RETURN approval_id;
END;
$$;

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0004_connector_chassis', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;