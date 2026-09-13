BEGIN;

-- Run 1 canonical nonprofit / human-services domain model.
-- Every tenant-owned entity carries organization_id and is protected by both
-- composite foreign keys and PostgreSQL RLS.

CREATE TABLE IF NOT EXISTS fabric.people (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  external_key text,
  first_name text,
  last_name text,
  date_of_birth date,
  email text,
  phone text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key)
);

CREATE TABLE IF NOT EXISTS fabric.households (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  external_key text,
  name text,
  county text,
  state_code text,
  postal_code text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key)
);

CREATE TABLE IF NOT EXISTS fabric.household_members (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  household_id uuid NOT NULL,
  person_id uuid NOT NULL,
  relationship text,
  is_head_of_household boolean NOT NULL DEFAULT false,
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, household_id, person_id),
  FOREIGN KEY (household_id, organization_id) REFERENCES fabric.households(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (person_id, organization_id) REFERENCES fabric.people(id, organization_id) ON DELETE CASCADE,
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS fabric.programs (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  external_key text,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  starts_on date,
  ends_on date,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key),
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS fabric.enrollments (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  program_id uuid NOT NULL,
  person_id uuid,
  household_id uuid,
  external_key text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','completed','exited','cancelled')),
  enrolled_on date NOT NULL,
  exited_on date,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key),
  FOREIGN KEY (program_id, organization_id) REFERENCES fabric.programs(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (person_id, organization_id) REFERENCES fabric.people(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (household_id, organization_id) REFERENCES fabric.households(id, organization_id) ON DELETE RESTRICT,
  CHECK (person_id IS NOT NULL OR household_id IS NOT NULL),
  CHECK (exited_on IS NULL OR exited_on >= enrolled_on)
);

CREATE TABLE IF NOT EXISTS fabric.funding_sources (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  external_key text,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'other',
  funder_name text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key)
);

CREATE TABLE IF NOT EXISTS fabric.grants (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  funding_source_id uuid NOT NULL,
  external_key text,
  name text NOT NULL,
  award_number text,
  starts_on date,
  ends_on date,
  award_amount numeric(14,2) CHECK (award_amount IS NULL OR award_amount >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('planned','active','closed','suspended','archived')),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key),
  FOREIGN KEY (funding_source_id, organization_id) REFERENCES fabric.funding_sources(id, organization_id) ON DELETE RESTRICT,
  CHECK (ends_on IS NULL OR starts_on IS NULL OR ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS fabric.services (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL,
  service_type text NOT NULL,
  service_date date NOT NULL,
  quantity numeric(12,2) NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  unit text,
  amount numeric(14,2) CHECK (amount IS NULL OR amount >= 0),
  county text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (enrollment_id, organization_id) REFERENCES fabric.enrollments(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.service_funding (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  service_id uuid NOT NULL,
  grant_id uuid NOT NULL,
  amount numeric(14,2) CHECK (amount IS NULL OR amount >= 0),
  allocation_percent numeric(7,4) CHECK (allocation_percent IS NULL OR (allocation_percent >= 0 AND allocation_percent <= 100)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, service_id, grant_id),
  FOREIGN KEY (service_id, organization_id) REFERENCES fabric.services(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (grant_id, organization_id) REFERENCES fabric.grants(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.expenditures (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  grant_id uuid NOT NULL,
  service_id uuid,
  external_key text,
  expenditure_date date NOT NULL,
  category text NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount >= 0),
  vendor text,
  description text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key),
  FOREIGN KEY (grant_id, organization_id) REFERENCES fabric.grants(id, organization_id) ON DELETE RESTRICT,
  FOREIGN KEY (service_id, organization_id) REFERENCES fabric.services(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.outcomes (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  enrollment_id uuid NOT NULL,
  outcome_type text NOT NULL,
  outcome_date date NOT NULL,
  value_numeric numeric(18,4),
  value_text text,
  status text NOT NULL DEFAULT 'achieved' CHECK (status IN ('planned','in_progress','achieved','not_achieved','unknown')),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  FOREIGN KEY (enrollment_id, organization_id) REFERENCES fabric.enrollments(id, organization_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS fabric.evidence (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  evidence_type text NOT NULL,
  storage_uri text,
  checksum_sha256 text,
  description text,
  captured_at timestamptz NOT NULL DEFAULT now(),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id)
);

CREATE TABLE IF NOT EXISTS fabric.reporting_requirements (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  grant_id uuid,
  external_key text,
  destination_system text NOT NULL,
  report_name text NOT NULL,
  frequency text,
  due_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  submission_method text NOT NULL DEFAULT 'unknown' CHECK (submission_method IN ('api','file','browser','human','unknown')),
  human_certification_required boolean NOT NULL DEFAULT false,
  schema_version text,
  mapping_profile text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','archived')),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE NULLS NOT DISTINCT (organization_id, external_key),
  FOREIGN KEY (grant_id, organization_id) REFERENCES fabric.grants(id, organization_id) ON DELETE RESTRICT
);

-- Query-path indexes.
CREATE INDEX IF NOT EXISTS people_org_name_idx ON fabric.people (organization_id, last_name, first_name);
CREATE INDEX IF NOT EXISTS households_org_county_idx ON fabric.households (organization_id, county);
CREATE INDEX IF NOT EXISTS household_members_household_idx ON fabric.household_members (organization_id, household_id);
CREATE INDEX IF NOT EXISTS programs_org_status_idx ON fabric.programs (organization_id, status);
CREATE INDEX IF NOT EXISTS enrollments_org_program_idx ON fabric.enrollments (organization_id, program_id, status);
CREATE INDEX IF NOT EXISTS enrollments_org_person_idx ON fabric.enrollments (organization_id, person_id);
CREATE INDEX IF NOT EXISTS grants_org_dates_idx ON fabric.grants (organization_id, starts_on, ends_on);
CREATE INDEX IF NOT EXISTS services_org_date_idx ON fabric.services (organization_id, service_date);
CREATE INDEX IF NOT EXISTS services_org_county_idx ON fabric.services (organization_id, county, service_date);
CREATE INDEX IF NOT EXISTS expenditures_org_date_idx ON fabric.expenditures (organization_id, expenditure_date);
CREATE INDEX IF NOT EXISTS outcomes_org_date_idx ON fabric.outcomes (organization_id, outcome_date);
CREATE INDEX IF NOT EXISTS reporting_requirements_destination_idx ON fabric.reporting_requirements (organization_id, destination_system, status);

-- RLS is deliberately repetitive here: explicit table-by-table protection is easier to audit.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'people','households','household_members','programs','enrollments',
    'funding_sources','grants','services','service_funding','expenditures',
    'outcomes','evidence','reporting_requirements'
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

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0002_canonical_domain', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;