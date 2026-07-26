-- Phase 2C People transactional SoR (schema people)
-- Apply only on an isolated certification / non-production Supabase project first.
-- Does NOT grant DML to service_role (INV-29).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS people;

-- ---------------------------------------------------------------------------
-- Roles (no-op if lacking CREATEROLE — operator must create roles first)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_owner') THEN
    CREATE ROLE people_owner NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_migrator') THEN
    CREATE ROLE people_migrator NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_app') THEN
    CREATE ROLE people_app NOINHERIT LOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'people_readonly_audit') THEN
    CREATE ROLE people_readonly_audit NOINHERIT;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'people roles not created — operator must provision roles before grants';
END $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS people.persons (
  person_key text PRIMARY KEY,
  organization_id text NOT NULL,
  portal_slug text,
  display_name text NOT NULL,
  legal_name text,
  preferred_name text,
  primary_email text,
  emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  phones jsonb NOT NULL DEFAULT '[]'::jsonb,
  date_of_birth date,
  is_minor boolean,
  external_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  client_record_id text,
  lifecycle_status text NOT NULL,
  deceased_at timestamptz,
  merged_into_person_key text REFERENCES people.persons(person_key),
  duplicate_of_person_key text,
  source text NOT NULL DEFAULT 'manual',
  created_by_user_email text,
  owner_user_email text,
  merge_job_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  row_version bigint NOT NULL DEFAULT 1,
  CONSTRAINT persons_lifecycle_chk CHECK (
    lifecycle_status IN ('active', 'inactive', 'archived', 'deceased')
  )
);

CREATE INDEX IF NOT EXISTS persons_org_idx ON people.persons (organization_id);
CREATE INDEX IF NOT EXISTS persons_org_updated_idx ON people.persons (organization_id, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS persons_org_client_record_uq
  ON people.persons (organization_id, client_record_id)
  WHERE client_record_id IS NOT NULL
    AND merged_into_person_key IS NULL;

CREATE TABLE IF NOT EXISTS people.person_email_keys (
  organization_id text NOT NULL,
  email_normalized text NOT NULL,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  PRIMARY KEY (organization_id, email_normalized)
);

CREATE TABLE IF NOT EXISTS people.person_external_keys (
  organization_id text NOT NULL,
  system text NOT NULL,
  value text NOT NULL,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  PRIMARY KEY (organization_id, system, value)
);

CREATE TABLE IF NOT EXISTS people.org_memberships (
  membership_key text PRIMARY KEY,
  organization_id text NOT NULL,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL,
  title text,
  portal_membership_id text,
  client_record_id text,
  started_at timestamptz,
  ended_at timestamptz,
  CONSTRAINT org_memberships_status_chk CHECK (
    status IN ('active', 'inactive', 'invited', 'ended')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS org_memberships_org_person_active_uq
  ON people.org_memberships (organization_id, person_key)
  WHERE status <> 'ended';

CREATE TABLE IF NOT EXISTS people.households (
  household_key text PRIMARY KEY,
  organization_id text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'active',
  primary_contact_person_key text REFERENCES people.persons(person_key),
  CONSTRAINT households_status_chk CHECK (status IN ('active', 'archived'))
);

CREATE TABLE IF NOT EXISTS people.household_members (
  member_key text PRIMARY KEY,
  organization_id text NOT NULL,
  household_key text NOT NULL REFERENCES people.households(household_key) ON DELETE CASCADE,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  role text,
  is_authorized_representative boolean NOT NULL DEFAULT false,
  authz_expires_at timestamptz,
  UNIQUE (household_key, person_key)
);

CREATE TABLE IF NOT EXISTS people.relationships (
  edge_key text PRIMARY KEY,
  organization_id text NOT NULL,
  from_person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  to_person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  type text NOT NULL,
  status text NOT NULL,
  expires_at timestamptz,
  bidirectional_mirror_id text,
  notes text,
  CONSTRAINT relationships_status_chk CHECK (status IN ('active', 'ended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS relationships_active_uq
  ON people.relationships (organization_id, from_person_key, to_person_key, type)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS people.program_links (
  link_key text PRIMARY KEY,
  organization_id text NOT NULL,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  kind text NOT NULL,
  external_ref text,
  label text,
  status text NOT NULL,
  role_in_program text,
  CONSTRAINT program_links_status_chk CHECK (
    status IN ('active', 'completed', 'withdrawn', 'archived')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS program_links_uq
  ON people.program_links (organization_id, person_key, kind, COALESCE(external_ref, ''));

CREATE TABLE IF NOT EXISTS people.consents (
  consent_key text PRIMARY KEY,
  organization_id text NOT NULL,
  person_key text NOT NULL REFERENCES people.persons(person_key) ON DELETE RESTRICT,
  purpose text NOT NULL,
  status text NOT NULL,
  captured_at timestamptz,
  expires_at timestamptz,
  source text,
  actor_person_key text
);

CREATE TABLE IF NOT EXISTS people.acl_grants (
  grant_key text PRIMARY KEY,
  organization_id text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  grantee_kind text NOT NULL,
  grantee_value text NOT NULL,
  relation text NOT NULL,
  fields_allow jsonb,
  fields_deny jsonb,
  expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS people.merge_jobs (
  job_id text PRIMARY KEY,
  job_key text NOT NULL UNIQUE,
  organization_id text NOT NULL,
  survivor_person_key text NOT NULL REFERENCES people.persons(person_key),
  absorbed_person_key text NOT NULL REFERENCES people.persons(person_key),
  status text NOT NULL,
  completed_steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  actor_email text NOT NULL,
  last_error text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS people.import_jobs (
  job_id text PRIMARY KEY,
  organization_id text NOT NULL,
  idempotency_key text NOT NULL,
  source text NOT NULL,
  status text NOT NULL,
  row_count integer NOT NULL DEFAULT 0,
  ok_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  actor_email text NOT NULL,
  dry_run boolean DEFAULT false,
  last_error text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS people.import_row_results (
  row_key text PRIMARY KEY,
  organization_id text NOT NULL,
  import_job_id text NOT NULL REFERENCES people.import_jobs(job_id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  status text NOT NULL,
  person_key text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (import_job_id, row_number)
);

CREATE TABLE IF NOT EXISTS people.migration_checkpoints (
  checkpoint_key text PRIMARY KEY,
  organization_id text NOT NULL,
  job_id text NOT NULL,
  last_client_record_id text,
  processed integer NOT NULL DEFAULT 0,
  created integer NOT NULL DEFAULT 0,
  linked integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, job_id)
);

CREATE TABLE IF NOT EXISTS people.audit_events (
  audit_key text PRIMARY KEY,
  organization_id text NOT NULL,
  actor_email text NOT NULL,
  actor_person_key text,
  action text NOT NULL,
  subject_person_key text,
  at timestamptz NOT NULL DEFAULT now(),
  meta jsonb
);

CREATE OR REPLACE FUNCTION people.deny_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'people.audit_events is append-only (INV-34)';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_no_update ON people.audit_events;
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE OR DELETE ON people.audit_events
  FOR EACH ROW EXECUTE FUNCTION people.deny_audit_mutation();

-- ---------------------------------------------------------------------------
-- RLS (defense-in-depth; people_app must NOT have BYPASSRLS)
-- ---------------------------------------------------------------------------
ALTER TABLE people.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.persons FORCE ROW LEVEL SECURITY;
ALTER TABLE people.person_email_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.person_email_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE people.person_external_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.person_external_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE people.org_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.org_memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE people.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.households FORCE ROW LEVEL SECURITY;
ALTER TABLE people.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.household_members FORCE ROW LEVEL SECURITY;
ALTER TABLE people.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.relationships FORCE ROW LEVEL SECURITY;
ALTER TABLE people.program_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.program_links FORCE ROW LEVEL SECURITY;
ALTER TABLE people.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.consents FORCE ROW LEVEL SECURITY;
ALTER TABLE people.acl_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.acl_grants FORCE ROW LEVEL SECURITY;
ALTER TABLE people.merge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.merge_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE people.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.import_jobs FORCE ROW LEVEL SECURITY;
ALTER TABLE people.import_row_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.import_row_results FORCE ROW LEVEL SECURITY;
ALTER TABLE people.migration_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.migration_checkpoints FORCE ROW LEVEL SECURITY;
ALTER TABLE people.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE people.audit_events FORCE ROW LEVEL SECURITY;

-- Tenant predicate via session GUC set by RPC / app before DML
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'persons','person_email_keys','person_external_keys','org_memberships',
    'households','household_members','relationships','program_links','consents',
    'acl_grants','merge_jobs','import_jobs','import_row_results','migration_checkpoints','audit_events'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON people.%I', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON people.%I FOR ALL TO people_app USING (organization_id = current_setting(''people.organization_id'', true)) WITH CHECK (organization_id = current_setting(''people.organization_id'', true))',
      t
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- Grants — INV-29: revoke broad roles from people schema
-- ---------------------------------------------------------------------------
REVOKE ALL ON SCHEMA people FROM PUBLIC;
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON SCHEMA people FROM anon';
  EXECUTE 'REVOKE ALL ON SCHEMA people FROM authenticated';
  EXECUTE 'REVOKE ALL ON SCHEMA people FROM service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

GRANT USAGE ON SCHEMA people TO people_app, people_readonly_audit;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA people TO people_app;
REVOKE UPDATE, DELETE ON people.audit_events FROM people_app;
GRANT INSERT ON people.audit_events TO people_app;
GRANT SELECT ON people.audit_events TO people_readonly_audit;

-- ---------------------------------------------------------------------------
-- RPC: ensure person (transactional upsert) — ADV-P-1
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION people.ensure_person(
  p_organization_id text,
  p_person_key text,
  p_display_name text,
  p_email text,
  p_portal_slug text DEFAULT NULL,
  p_client_record_id text DEFAULT NULL,
  p_source text DEFAULT 'manual'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  v_email text := lower(trim(COALESCE(p_email, '')));
  v_existing text;
  v_person people.persons%ROWTYPE;
BEGIN
  IF p_organization_id IS NULL OR length(trim(p_organization_id)) = 0 THEN
    RAISE EXCEPTION 'organization_id required';
  END IF;
  IF v_email = '' AND (p_client_record_id IS NULL OR length(trim(p_client_record_id)) = 0) THEN
    RAISE EXCEPTION 'identity key required';
  END IF;

  PERFORM set_config('people.organization_id', p_organization_id, true);

  -- Serialize concurrent ensure for the same org+identity (ADV-P-1)
  IF v_email <> '' THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_organization_id || '#email#' || v_email));
  ELSIF p_client_record_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(p_organization_id || '#cr#' || p_client_record_id));
  END IF;

  IF p_client_record_id IS NOT NULL AND length(trim(p_client_record_id)) > 0 THEN
    SELECT person_key INTO v_existing
    FROM people.person_external_keys
    WHERE organization_id = p_organization_id
      AND system = 'client-record'
      AND value = p_client_record_id;
  END IF;

  IF v_existing IS NULL AND v_email <> '' THEN
    SELECT person_key INTO v_existing
    FROM people.person_email_keys
    WHERE organization_id = p_organization_id
      AND email_normalized = v_email;
  END IF;

  IF v_existing IS NOT NULL THEN
    SELECT * INTO v_person FROM people.persons WHERE person_key = v_existing;
    RETURN jsonb_build_object('created', false, 'person_key', v_person.person_key, 'person', to_jsonb(v_person));
  END IF;

  BEGIN
    INSERT INTO people.persons (
      person_key, organization_id, portal_slug, display_name, primary_email,
      emails, phones, external_ids, client_record_id, lifecycle_status, source
    ) VALUES (
      p_person_key, p_organization_id, p_portal_slug, p_display_name, NULLIF(v_email, ''),
      CASE WHEN v_email = '' THEN '[]'::jsonb ELSE jsonb_build_array(jsonb_build_object('value', v_email, 'kind', 'primary')) END,
      '[]'::jsonb,
      CASE WHEN p_client_record_id IS NULL THEN '[]'::jsonb
           ELSE jsonb_build_array(jsonb_build_object('system', 'client-record', 'value', p_client_record_id)) END,
      p_client_record_id, 'active', COALESCE(p_source, 'manual')
    );

    IF v_email <> '' THEN
      INSERT INTO people.person_email_keys (organization_id, email_normalized, person_key)
      VALUES (p_organization_id, v_email, p_person_key);
    END IF;

    IF p_client_record_id IS NOT NULL AND length(trim(p_client_record_id)) > 0 THEN
      INSERT INTO people.person_external_keys (organization_id, system, value, person_key)
      VALUES (p_organization_id, 'client-record', p_client_record_id, p_person_key);
    END IF;

    SELECT * INTO v_person FROM people.persons WHERE person_key = p_person_key;
    RETURN jsonb_build_object('created', true, 'person_key', v_person.person_key, 'person', to_jsonb(v_person));
  EXCEPTION WHEN unique_violation THEN
    IF v_email <> '' THEN
      SELECT person_key INTO v_existing FROM people.person_email_keys
      WHERE organization_id = p_organization_id AND email_normalized = v_email;
    END IF;
    IF v_existing IS NULL AND p_client_record_id IS NOT NULL THEN
      SELECT person_key INTO v_existing FROM people.person_external_keys
      WHERE organization_id = p_organization_id AND system = 'client-record' AND value = p_client_record_id;
    END IF;
    SELECT * INTO v_person FROM people.persons WHERE person_key = v_existing;
    RETURN jsonb_build_object('created', false, 'person_key', v_person.person_key, 'person', to_jsonb(v_person));
  END;
END;
$$;

REVOKE ALL ON FUNCTION people.ensure_person(text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.ensure_person(text, text, text, text, text, text, text) TO people_app;

-- ---------------------------------------------------------------------------
-- RPC: merge finalize (single transaction) — INV-21 / INV-30
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION people.merge_finalize(
  p_organization_id text,
  p_survivor_key text,
  p_absorbed_key text,
  p_job_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  k1 text;
  k2 text;
BEGIN
  IF p_organization_id IS NULL OR p_survivor_key IS NULL OR p_absorbed_key IS NULL THEN
    RAISE EXCEPTION 'merge_finalize args required';
  END IF;
  IF p_survivor_key = p_absorbed_key THEN
    RAISE EXCEPTION 'cannot merge person into itself';
  END IF;

  PERFORM set_config('people.organization_id', p_organization_id, true);

  -- Lock order: lexicographic person_key (P1-2)
  IF p_absorbed_key < p_survivor_key THEN
    k1 := p_absorbed_key; k2 := p_survivor_key;
  ELSE
    k1 := p_survivor_key; k2 := p_absorbed_key;
  END IF;
  PERFORM 1 FROM people.persons WHERE person_key = k1 AND organization_id = p_organization_id FOR UPDATE;
  PERFORM 1 FROM people.persons WHERE person_key = k2 AND organization_id = p_organization_id FOR UPDATE;

  -- Move email keys that do not conflict
  DELETE FROM people.person_email_keys e
  USING people.person_email_keys s
  WHERE e.person_key = p_absorbed_key
    AND s.person_key = p_survivor_key
    AND e.organization_id = p_organization_id
    AND s.organization_id = p_organization_id
    AND e.email_normalized = s.email_normalized;

  UPDATE people.person_email_keys
  SET person_key = p_survivor_key
  WHERE person_key = p_absorbed_key AND organization_id = p_organization_id;

  DELETE FROM people.person_external_keys e
  USING people.person_external_keys s
  WHERE e.person_key = p_absorbed_key
    AND s.person_key = p_survivor_key
    AND e.organization_id = p_organization_id
    AND e.system = s.system AND e.value = s.value;

  UPDATE people.person_external_keys
  SET person_key = p_survivor_key
  WHERE person_key = p_absorbed_key AND organization_id = p_organization_id;

  UPDATE people.persons
  SET merged_into_person_key = p_survivor_key,
      lifecycle_status = 'archived',
      merge_job_id = p_job_id,
      updated_at = now(),
      row_version = row_version + 1
  WHERE person_key = p_absorbed_key
    AND organization_id = p_organization_id
    AND merged_into_person_key IS NULL;

  UPDATE people.merge_jobs
  SET status = 'completed', updated_at = now()
  WHERE job_id = p_job_id AND organization_id = p_organization_id;

  INSERT INTO people.audit_events (audit_key, organization_id, actor_email, action, subject_person_key, meta)
  VALUES (
    'aud_' || replace(gen_random_uuid()::text, '-', ''),
    p_organization_id,
    'system:merge_finalize',
    'people.merge',
    p_survivor_key,
    jsonb_build_object('absorbedPersonId', p_absorbed_key, 'jobId', p_job_id)
  );

  RETURN jsonb_build_object('ok', true, 'survivor_key', p_survivor_key, 'absorbed_key', p_absorbed_key);
END;
$$;

REVOKE ALL ON FUNCTION people.merge_finalize(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.merge_finalize(text, text, text, text) TO people_app;

-- ---------------------------------------------------------------------------
-- OCC update person (INV-23 / ADV-P-8)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION people.update_person(
  p_organization_id text,
  p_person_key text,
  p_expected_updated_at timestamptz,
  p_patch jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  v_person people.persons%ROWTYPE;
  v_rows int;
BEGIN
  PERFORM set_config('people.organization_id', p_organization_id, true);

  UPDATE people.persons
  SET
    display_name = COALESCE(p_patch->>'display_name', display_name),
    primary_email = COALESCE(NULLIF(p_patch->>'primary_email', ''), primary_email),
    emails = COALESCE(p_patch->'emails', emails),
    phones = COALESCE(p_patch->'phones', phones),
    lifecycle_status = COALESCE(p_patch->>'lifecycle_status', lifecycle_status),
    date_of_birth = CASE
      WHEN p_patch ? 'date_of_birth' THEN NULLIF(p_patch->>'date_of_birth', '')::date
      ELSE date_of_birth
    END,
    updated_at = now(),
    row_version = row_version + 1
  WHERE person_key = p_person_key
    AND organization_id = p_organization_id
    AND updated_at = p_expected_updated_at
    AND merged_into_person_key IS NULL;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RAISE EXCEPTION 'conflict: person changed since read' USING ERRCODE = 'P0001';
  END IF;

  SELECT * INTO v_person FROM people.persons WHERE person_key = p_person_key;
  RETURN to_jsonb(v_person);
END;
$$;

REVOKE ALL ON FUNCTION people.update_person(text, text, timestamptz, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.update_person(text, text, timestamptz, jsonb) TO people_app;

-- ---------------------------------------------------------------------------
-- PostgREST pre-request: bind tenant GUC from X-People-Organization-Id (RLS)
-- Operator: set db-pre-request = people.pre_request on People API / project.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION people.pre_request()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  headers jsonb;
  org text;
BEGIN
  BEGIN
    headers := current_setting('request.headers', true)::jsonb;
  EXCEPTION WHEN OTHERS THEN
    headers := '{}'::jsonb;
  END;
  org := COALESCE(headers->>'x-people-organization-id', headers->>'X-People-Organization-Id');
  IF org IS NOT NULL AND length(trim(org)) > 0 THEN
    PERFORM set_config('people.organization_id', trim(org), true);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION people.pre_request() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.pre_request() TO people_app;

-- Harden: revoke People RPCs from broad Supabase roles when they exist (INV-29 / ADV-P-12)
DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION people.ensure_person(text, text, text, text, text, text, text) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.merge_finalize(text, text, text, text) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.update_person(text, text, timestamptz, jsonb) FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON FUNCTION people.pre_request() FROM anon, authenticated, service_role';
  EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA people FROM anon, authenticated, service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

COMMENT ON SCHEMA people IS 'EA Universal People Phase 2C SoR — expose in PostgREST db-schemas; JWT role people_app only; never service_role DML';
