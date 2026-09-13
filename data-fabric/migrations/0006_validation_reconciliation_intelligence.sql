BEGIN;

-- Run 5: Validation + Reconciliation + Impact Intelligence
-- Closes the loop from mapped canonical data through submission acceptance,
-- reconciliation, and traceable impact intelligence.

CREATE TABLE IF NOT EXISTS fabric.submission_packages (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  mapping_execution_id uuid NOT NULL,
  connector_run_id uuid NOT NULL,
  reporting_requirement_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','mapped','validated','ready','approval_required','approved','submitted','accepted','reconciled','exception','cancelled'
  )),
  payload_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  destination_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, mapping_execution_id, connector_run_id),
  FOREIGN KEY (mapping_execution_id, organization_id)
    REFERENCES fabric.mapping_executions(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (reporting_requirement_id, organization_id)
    REFERENCES fabric.reporting_requirements(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.reconciliation_results (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  submission_package_id uuid NOT NULL,
  connector_run_id uuid NOT NULL,
  expected_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  actual_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  matched boolean NOT NULL,
  discrepancy_count integer NOT NULL DEFAULT 0 CHECK (discrepancy_count >= 0),
  discrepancies jsonb NOT NULL DEFAULT '[]'::jsonb,
  reconciled_by_identity_id uuid,
  reconciled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (submission_package_id, organization_id)
    REFERENCES fabric.submission_packages(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (reconciled_by_identity_id) REFERENCES fabric.identities(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fabric.impact_queries (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  requested_by_identity_id uuid,
  question text,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('queued','running','completed','failed')),
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (id, organization_id),
  FOREIGN KEY (requested_by_identity_id) REFERENCES fabric.identities(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS submission_packages_org_status_idx
  ON fabric.submission_packages (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS reconciliation_org_run_idx
  ON fabric.reconciliation_results (organization_id, connector_run_id, reconciled_at DESC);
CREATE INDEX IF NOT EXISTS impact_queries_org_created_idx
  ON fabric.impact_queries (organization_id, created_at DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['submission_packages','reconciliation_results','impact_queries']
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

CREATE OR REPLACE FUNCTION fabric.create_submission_package(
  target_mapping_execution_id uuid,
  target_connector_run_id uuid,
  target_reporting_requirement_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  e fabric.mapping_executions%ROWTYPE;
  c fabric.connector_runs%ROWTYPE;
  package_id uuid := gen_random_uuid();
BEGIN
  SELECT * INTO e FROM fabric.mapping_executions WHERE id = target_mapping_execution_id;
  IF e.id IS NULL THEN RAISE EXCEPTION 'mapping execution not found'; END IF;
  IF e.status <> 'ready' THEN RAISE EXCEPTION 'mapping execution must be ready'; END IF;

  SELECT * INTO c FROM fabric.connector_runs WHERE id = target_connector_run_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'connector run not found'; END IF;
  IF c.status <> 'draft' THEN RAISE EXCEPTION 'connector run must be draft'; END IF;

  IF e.organization_id <> c.organization_id THEN RAISE EXCEPTION 'tenant mismatch'; END IF;

  INSERT INTO fabric.submission_packages(
    id, organization_id, mapping_execution_id, connector_run_id,
    reporting_requirement_id, status, payload_snapshot, validation_snapshot
  ) VALUES (
    package_id, e.organization_id, e.id, c.id,
    target_reporting_requirement_id, 'ready', e.mapped_payload, e.validation_summary
  );

  UPDATE fabric.connector_runs
  SET status = 'prepared', payload_manifest = e.mapped_payload
  WHERE id = c.id;

  UPDATE fabric.connector_runs SET status = 'validated' WHERE id = c.id;

  RETURN package_id;
END;
$$;

CREATE OR REPLACE FUNCTION fabric.sync_submission_package_status(target_connector_run_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  run_row fabric.connector_runs%ROWTYPE;
  package_status text;
BEGIN
  SELECT * INTO run_row FROM fabric.connector_runs WHERE id = target_connector_run_id;
  IF run_row.id IS NULL THEN RAISE EXCEPTION 'connector run not found'; END IF;

  package_status := CASE run_row.status
    WHEN 'validated' THEN 'ready'
    WHEN 'approval_required' THEN 'approval_required'
    WHEN 'approved' THEN 'approved'
    WHEN 'submitted' THEN 'submitted'
    WHEN 'accepted' THEN 'accepted'
    WHEN 'reconciled' THEN 'reconciled'
    WHEN 'cancelled' THEN 'cancelled'
    WHEN 'failed' THEN 'exception'
    ELSE NULL
  END;

  IF package_status IS NOT NULL THEN
    UPDATE fabric.submission_packages
    SET status = package_status,
        destination_reference = run_row.destination_reference,
        updated_at = now()
    WHERE connector_run_id = target_connector_run_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION fabric.reconcile_submission(
  target_submission_package_id uuid,
  actual_snapshot jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  p fabric.submission_packages%ROWTYPE;
  c fabric.connector_runs%ROWTYPE;
  reconciliation_id uuid := gen_random_uuid();
  matched_now boolean;
  diff jsonb := '[]'::jsonb;
  k text;
  discrepancy_count integer := 0;
BEGIN
  SELECT * INTO p FROM fabric.submission_packages WHERE id = target_submission_package_id;
  IF p.id IS NULL THEN RAISE EXCEPTION 'submission package not found'; END IF;

  SELECT * INTO c FROM fabric.connector_runs WHERE id = p.connector_run_id;
  IF c.id IS NULL THEN RAISE EXCEPTION 'connector run not found'; END IF;
  IF c.status <> 'accepted' THEN RAISE EXCEPTION 'connector run must be accepted before reconciliation'; END IF;

  FOR k IN SELECT jsonb_object_keys(p.payload_snapshot)
  LOOP
    IF actual_snapshot -> k IS DISTINCT FROM p.payload_snapshot -> k THEN
      discrepancy_count := discrepancy_count + 1;
      diff := diff || jsonb_build_array(jsonb_build_object(
        'field', k,
        'expected', p.payload_snapshot -> k,
        'actual', actual_snapshot -> k
      ));
    END IF;
  END LOOP;

  matched_now := discrepancy_count = 0;

  INSERT INTO fabric.reconciliation_results(
    id, organization_id, submission_package_id, connector_run_id,
    expected_snapshot, actual_snapshot, matched, discrepancy_count,
    discrepancies, reconciled_by_identity_id
  ) VALUES (
    reconciliation_id, p.organization_id, p.id, p.connector_run_id,
    p.payload_snapshot, actual_snapshot, matched_now, discrepancy_count,
    diff, fabric.current_identity_id()
  );

  IF matched_now THEN
    UPDATE fabric.connector_runs SET status = 'reconciled' WHERE id = p.connector_run_id;
    UPDATE fabric.submission_packages SET status = 'reconciled', updated_at = now() WHERE id = p.id;
  ELSE
    UPDATE fabric.submission_packages SET status = 'exception', updated_at = now() WHERE id = p.id;
  END IF;

  RETURN reconciliation_id;
END;
$$;

-- Traceable impact intelligence over canonical records.
-- Filters support county, program, funding source, service type, outcome type,
-- date range, and a person.attributes containment filter for demographics.
CREATE OR REPLACE FUNCTION fabric.impact_intelligence(filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH scoped_services AS (
  SELECT DISTINCT s.*, e.person_id, e.household_id, e.program_id
  FROM fabric.services s
  JOIN fabric.enrollments e ON e.id = s.enrollment_id AND e.organization_id = s.organization_id
  LEFT JOIN fabric.programs p ON p.id = e.program_id AND p.organization_id = e.organization_id
  LEFT JOIN fabric.people pe ON pe.id = e.person_id AND pe.organization_id = e.organization_id
  LEFT JOIN fabric.service_funding sf ON sf.service_id = s.id AND sf.organization_id = s.organization_id
  LEFT JOIN fabric.grants g ON g.id = sf.grant_id AND g.organization_id = s.organization_id
  LEFT JOIN fabric.funding_sources fs ON fs.id = g.funding_source_id AND fs.organization_id = g.organization_id
  WHERE (filters ->> 'county' IS NULL OR lower(s.county) = lower(filters ->> 'county'))
    AND (filters ->> 'program' IS NULL OR lower(p.name) = lower(filters ->> 'program'))
    AND (filters ->> 'funding_source' IS NULL OR lower(fs.name) = lower(filters ->> 'funding_source'))
    AND (filters ->> 'service_type' IS NULL OR lower(s.service_type) = lower(filters ->> 'service_type'))
    AND (filters ->> 'start_date' IS NULL OR s.service_date >= (filters ->> 'start_date')::date)
    AND (filters ->> 'end_date' IS NULL OR s.service_date <= (filters ->> 'end_date')::date)
    AND (filters -> 'demographics' IS NULL OR pe.attributes @> (filters -> 'demographics'))
),
scoped_enrollments AS (
  SELECT DISTINCT enrollment_id, person_id, household_id FROM scoped_services
),
scoped_outcomes AS (
  SELECT o.*
  FROM fabric.outcomes o
  JOIN scoped_enrollments se ON se.enrollment_id = o.enrollment_id
  WHERE (filters ->> 'outcome_type' IS NULL OR lower(o.outcome_type) = lower(filters ->> 'outcome_type'))
    AND (filters ->> 'start_date' IS NULL OR o.outcome_date >= (filters ->> 'start_date')::date)
    AND (filters ->> 'end_date' IS NULL OR o.outcome_date <= (filters ->> 'end_date')::date)
),
scoped_expenditures AS (
  SELECT DISTINCT x.*
  FROM fabric.expenditures x
  JOIN scoped_services ss ON ss.id = x.service_id
  WHERE (filters ->> 'start_date' IS NULL OR x.expenditure_date >= (filters ->> 'start_date')::date)
    AND (filters ->> 'end_date' IS NULL OR x.expenditure_date <= (filters ->> 'end_date')::date)
)
SELECT jsonb_build_object(
  'filters', filters,
  'services_delivered', (SELECT count(*) FROM scoped_services),
  'service_value', COALESCE((SELECT sum(amount) FROM scoped_services),0),
  'people_served', (SELECT count(DISTINCT person_id) FROM scoped_enrollments WHERE person_id IS NOT NULL),
  'households_served', (SELECT count(DISTINCT household_id) FROM scoped_enrollments WHERE household_id IS NOT NULL),
  'outcomes_achieved', (SELECT count(*) FROM scoped_outcomes WHERE status = 'achieved'),
  'expenditures', COALESCE((SELECT sum(amount) FROM scoped_expenditures),0),
  'source_counts', jsonb_build_object(
    'services', (SELECT count(*) FROM scoped_services),
    'outcomes', (SELECT count(*) FROM scoped_outcomes),
    'expenditures', (SELECT count(*) FROM scoped_expenditures)
  )
);
$$;

CREATE OR REPLACE FUNCTION fabric.run_impact_query(
  question_text text,
  query_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  query_id uuid := gen_random_uuid();
  result jsonb;
BEGIN
  result := fabric.impact_intelligence(query_filters);
  INSERT INTO fabric.impact_queries(
    id, organization_id, requested_by_identity_id, question,
    filters, status, result_snapshot, completed_at
  ) VALUES (
    query_id, fabric.current_organization_id(), fabric.current_identity_id(), question_text,
    query_filters, 'completed', result, now()
  );
  RETURN query_id;
END;
$$;

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0006_validation_reconciliation_intelligence', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;
