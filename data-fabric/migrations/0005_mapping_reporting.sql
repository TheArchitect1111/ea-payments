BEGIN;

-- Run 3: Mapping + Reporting Engine
-- Logical Run 3 is migration 0005 because Connector Chassis (Run 4) was intentionally built first.

CREATE TABLE IF NOT EXISTS fabric.mapping_profiles (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  destination_system text NOT NULL,
  schema_version text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','retired')),
  effective_from date,
  effective_to date,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, name, schema_version),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to >= effective_from)
);

CREATE TABLE IF NOT EXISTS fabric.mapping_rules (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  mapping_profile_id uuid NOT NULL,
  source_entity text NOT NULL,
  source_field text NOT NULL,
  destination_field text NOT NULL,
  transform_type text NOT NULL DEFAULT 'copy' CHECK (transform_type IN ('copy','rename','constant','lookup','format','expression')),
  transform_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  required boolean NOT NULL DEFAULT false,
  ordinal integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, mapping_profile_id, destination_field),
  FOREIGN KEY (mapping_profile_id, organization_id)
    REFERENCES fabric.mapping_profiles(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fabric.validation_rules (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  mapping_profile_id uuid NOT NULL,
  destination_field text,
  rule_type text NOT NULL CHECK (rule_type IN ('required','type','regex','enum','range','date_range','custom')),
  rule_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  severity text NOT NULL DEFAULT 'error' CHECK (severity IN ('warning','error')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (mapping_profile_id, organization_id)
    REFERENCES fabric.mapping_profiles(id, organization_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fabric.mapping_executions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  mapping_profile_id uuid NOT NULL,
  connector_run_id uuid,
  source_entity text NOT NULL,
  source_entity_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','mapped','validated','invalid','ready','failed')),
  source_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  mapped_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (mapping_profile_id, organization_id)
    REFERENCES fabric.mapping_profiles(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (connector_run_id, organization_id)
    REFERENCES fabric.connector_runs(id, organization_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fabric.validation_results (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  mapping_execution_id uuid NOT NULL,
  validation_rule_id uuid,
  destination_field text,
  passed boolean NOT NULL,
  severity text NOT NULL CHECK (severity IN ('warning','error')),
  message text NOT NULL,
  observed_value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (mapping_execution_id, organization_id)
    REFERENCES fabric.mapping_executions(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (validation_rule_id, organization_id)
    REFERENCES fabric.validation_rules(id, organization_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS fabric.report_definitions (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('board','donor','grant','county','state','federal','custom')),
  description text,
  query_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  presentation_spec jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, name)
);

CREATE TABLE IF NOT EXISTS fabric.report_runs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  report_definition_id uuid NOT NULL,
  requested_by_identity_id uuid,
  period_start date,
  period_end date,
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','failed')),
  result_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  generated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (report_definition_id, organization_id)
    REFERENCES fabric.report_definitions(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (requested_by_identity_id) REFERENCES fabric.identities(id) ON DELETE SET NULL,
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS fabric.report_metrics (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  report_run_id uuid NOT NULL,
  metric_key text NOT NULL,
  metric_value_numeric numeric(20,4),
  metric_value_text text,
  source_entity text,
  source_query jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, report_run_id, metric_key),
  FOREIGN KEY (report_run_id, organization_id)
    REFERENCES fabric.report_runs(id, organization_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS mapping_profiles_destination_idx
  ON fabric.mapping_profiles (organization_id, destination_system, status);
CREATE INDEX IF NOT EXISTS mapping_rules_profile_idx
  ON fabric.mapping_rules (organization_id, mapping_profile_id, ordinal);
CREATE INDEX IF NOT EXISTS validation_rules_profile_idx
  ON fabric.validation_rules (organization_id, mapping_profile_id, severity);
CREATE INDEX IF NOT EXISTS mapping_executions_status_idx
  ON fabric.mapping_executions (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS report_runs_period_idx
  ON fabric.report_runs (organization_id, period_start, period_end, status);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'mapping_profiles','mapping_rules','validation_rules','mapping_executions',
    'validation_results','report_definitions','report_runs','report_metrics'
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

CREATE OR REPLACE FUNCTION fabric.apply_mapping_value(
  source_value jsonb,
  transform_type text,
  transform_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE v text;
BEGIN
  CASE transform_type
    WHEN 'copy', 'rename' THEN RETURN source_value;
    WHEN 'constant' THEN RETURN transform_config -> 'value';
    WHEN 'lookup' THEN
      v := trim(both '"' from COALESCE(source_value::text,''));
      RETURN COALESCE(transform_config -> 'map' -> v, transform_config -> 'default', 'null'::jsonb);
    WHEN 'format' THEN
      v := trim(both '"' from COALESCE(source_value::text,''));
      IF transform_config ->> 'case' = 'upper' THEN RETURN to_jsonb(upper(v)); END IF;
      IF transform_config ->> 'case' = 'lower' THEN RETURN to_jsonb(lower(v)); END IF;
      RETURN to_jsonb(v);
    ELSE
      -- Expression execution is intentionally not evaluated in SQL. It is reserved for a sandboxed mapper runtime.
      RETURN source_value;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION fabric.execute_mapping(
  target_profile_id uuid,
  target_source_entity text,
  target_source_entity_id uuid,
  source_payload jsonb,
  target_connector_run_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  execution_id uuid := gen_random_uuid();
  r record;
  out_payload jsonb := '{}'::jsonb;
  src jsonb;
  mapped jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM fabric.mapping_profiles p
    WHERE p.id = target_profile_id
      AND p.organization_id = fabric.current_organization_id()
      AND p.status IN ('draft','active')
  ) THEN RAISE EXCEPTION 'mapping profile unavailable'; END IF;

  FOR r IN
    SELECT * FROM fabric.mapping_rules
    WHERE mapping_profile_id = target_profile_id
    ORDER BY ordinal, destination_field
  LOOP
    src := source_payload -> r.source_field;
    mapped := fabric.apply_mapping_value(src, r.transform_type, r.transform_config);
    out_payload := jsonb_set(out_payload, ARRAY[r.destination_field], COALESCE(mapped,'null'::jsonb), true);
  END LOOP;

  INSERT INTO fabric.mapping_executions(
    id, organization_id, mapping_profile_id, connector_run_id,
    source_entity, source_entity_id, status, source_snapshot, mapped_payload
  ) VALUES (
    execution_id, fabric.current_organization_id(), target_profile_id, target_connector_run_id,
    target_source_entity, target_source_entity_id, 'mapped', source_payload, out_payload
  );

  RETURN execution_id;
END;
$$;

CREATE OR REPLACE FUNCTION fabric.validate_mapping_execution(target_execution_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  e fabric.mapping_executions%ROWTYPE;
  r record;
  value jsonb;
  passed boolean;
  error_count integer := 0;
  warning_count integer := 0;
BEGIN
  SELECT * INTO e FROM fabric.mapping_executions WHERE id = target_execution_id;
  IF e.id IS NULL THEN RAISE EXCEPTION 'mapping execution not found'; END IF;

  DELETE FROM fabric.validation_results WHERE mapping_execution_id = target_execution_id;

  FOR r IN SELECT * FROM fabric.validation_rules WHERE mapping_profile_id = e.mapping_profile_id LOOP
    value := CASE WHEN r.destination_field IS NULL THEN NULL ELSE e.mapped_payload -> r.destination_field END;
    passed := true;

    IF r.rule_type = 'required' THEN
      passed := value IS NOT NULL AND value <> 'null'::jsonb AND trim(both '"' from value::text) <> '';
    ELSIF r.rule_type = 'enum' THEN
      passed := (r.rule_config -> 'values') ? trim(both '"' from COALESCE(value::text,''));
    ELSIF r.rule_type = 'regex' THEN
      passed := trim(both '"' from COALESCE(value::text,'')) ~ COALESCE(r.rule_config ->> 'pattern', '.*');
    ELSIF r.rule_type = 'range' THEN
      BEGIN
        passed := (value #>> '{}')::numeric >= COALESCE((r.rule_config ->> 'min')::numeric, '-1e100'::numeric)
          AND (value #>> '{}')::numeric <= COALESCE((r.rule_config ->> 'max')::numeric, '1e100'::numeric);
      EXCEPTION WHEN others THEN passed := false; END;
    END IF;

    INSERT INTO fabric.validation_results(
      organization_id, mapping_execution_id, validation_rule_id, destination_field,
      passed, severity, message, observed_value
    ) VALUES (
      e.organization_id, e.id, r.id, r.destination_field,
      passed, r.severity, r.message, value
    );

    IF NOT passed AND r.severity = 'error' THEN error_count := error_count + 1; END IF;
    IF NOT passed AND r.severity = 'warning' THEN warning_count := warning_count + 1; END IF;
  END LOOP;

  UPDATE fabric.mapping_executions
  SET status = CASE WHEN error_count > 0 THEN 'invalid' ELSE 'ready' END,
      validation_summary = jsonb_build_object('errors', error_count, 'warnings', warning_count),
      updated_at = now()
  WHERE id = target_execution_id;

  RETURN error_count = 0;
END;
$$;

-- Generic impact summary for rapid executive/funder reporting.
-- This deliberately returns traceable counts/sums only from canonical records.
CREATE OR REPLACE FUNCTION fabric.impact_summary(
  target_county text DEFAULT NULL,
  target_start date DEFAULT NULL,
  target_end date DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
WITH svc AS (
  SELECT s.*
  FROM fabric.services s
  WHERE (target_county IS NULL OR lower(s.county) = lower(target_county))
    AND (target_start IS NULL OR s.service_date >= target_start)
    AND (target_end IS NULL OR s.service_date <= target_end)
),
enr AS (
  SELECT DISTINCT s.enrollment_id FROM svc s
),
people_served AS (
  SELECT count(DISTINCT e.person_id) AS n
  FROM fabric.enrollments e JOIN enr ON enr.enrollment_id = e.id
  WHERE e.person_id IS NOT NULL
),
households_served AS (
  SELECT count(DISTINCT e.household_id) AS n
  FROM fabric.enrollments e JOIN enr ON enr.enrollment_id = e.id
  WHERE e.household_id IS NOT NULL
),
outcomes_in_scope AS (
  SELECT count(*) AS n
  FROM fabric.outcomes o JOIN enr ON enr.enrollment_id = o.enrollment_id
  WHERE o.status = 'achieved'
    AND (target_start IS NULL OR o.outcome_date >= target_start)
    AND (target_end IS NULL OR o.outcome_date <= target_end)
)
SELECT jsonb_build_object(
  'county', target_county,
  'period_start', target_start,
  'period_end', target_end,
  'services_delivered', (SELECT count(*) FROM svc),
  'service_value', COALESCE((SELECT sum(amount) FROM svc),0),
  'people_served', (SELECT n FROM people_served),
  'households_served', (SELECT n FROM households_served),
  'outcomes_achieved', (SELECT n FROM outcomes_in_scope)
);
$$;

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0005_mapping_reporting', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;