BEGIN;

CREATE SCHEMA IF NOT EXISTS fabric;

CREATE TABLE IF NOT EXISTS fabric.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now(),
  environment text NOT NULL DEFAULT COALESCE(current_setting('app.environment', true), 'unknown'),
  git_sha text
);

CREATE TABLE IF NOT EXISTS fabric.organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fabric.identities (
  id uuid PRIMARY KEY,
  external_subject text NOT NULL UNIQUE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fabric.memberships (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  identity_id uuid NOT NULL REFERENCES fabric.identities(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','suspended','revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, identity_id)
);

CREATE TABLE IF NOT EXISTS fabric.tenant_records (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  record_type text NOT NULL,
  external_key text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_records_org_idx ON fabric.tenant_records (organization_id);
CREATE INDEX IF NOT EXISTS tenant_records_type_idx ON fabric.tenant_records (organization_id, record_type);

CREATE TABLE IF NOT EXISTS fabric.audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  organization_id uuid REFERENCES fabric.organizations(id) ON DELETE RESTRICT,
  actor_identity_id uuid REFERENCES fabric.identities(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  entity_type text,
  entity_id text,
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_org_time_idx ON fabric.audit_events (organization_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION fabric.current_organization_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  raw text;
BEGIN
  raw := current_setting('app.current_organization_id', true);
  IF raw IS NULL OR btrim(raw) = '' THEN
    RETURN NULL;
  END IF;
  RETURN raw::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

ALTER TABLE fabric.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric.tenant_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE fabric.tenant_records FORCE ROW LEVEL SECURITY;
ALTER TABLE fabric.audit_events FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS memberships_tenant_isolation ON fabric.memberships;
CREATE POLICY memberships_tenant_isolation ON fabric.memberships
  USING (organization_id = fabric.current_organization_id())
  WITH CHECK (organization_id = fabric.current_organization_id());

DROP POLICY IF EXISTS tenant_records_tenant_isolation ON fabric.tenant_records;
CREATE POLICY tenant_records_tenant_isolation ON fabric.tenant_records
  USING (organization_id = fabric.current_organization_id())
  WITH CHECK (organization_id = fabric.current_organization_id());

DROP POLICY IF EXISTS audit_events_tenant_read ON fabric.audit_events;
CREATE POLICY audit_events_tenant_read ON fabric.audit_events
  FOR SELECT USING (organization_id = fabric.current_organization_id());

DROP POLICY IF EXISTS audit_events_tenant_insert ON fabric.audit_events;
CREATE POLICY audit_events_tenant_insert ON fabric.audit_events
  FOR INSERT WITH CHECK (organization_id = fabric.current_organization_id());

CREATE OR REPLACE FUNCTION fabric.health_check()
RETURNS TABLE(
  database_time timestamptz,
  environment text,
  organization_id uuid,
  migration_version text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    now(),
    COALESCE(current_setting('app.environment', true), 'unknown'),
    fabric.current_organization_id(),
    (SELECT version FROM fabric.schema_migrations ORDER BY applied_at DESC LIMIT 1);
$$;

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0001_foundation', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;