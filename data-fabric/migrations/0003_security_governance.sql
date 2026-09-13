BEGIN;

-- Run 2: security + governance.
-- Authorization is deny-by-default. PostgreSQL is the enforcement backstop even
-- when a higher-level authorization service (OpenFGA) is used by the application.

CREATE OR REPLACE FUNCTION fabric.current_identity_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE raw text;
BEGIN
  raw := current_setting('app.current_identity_id', true);
  IF raw IS NULL OR btrim(raw) = '' THEN RETURN NULL; END IF;
  RETURN raw::uuid;
EXCEPTION WHEN invalid_text_representation THEN
  RETURN NULL;
END;
$$;

CREATE TABLE IF NOT EXISTS fabric.permission_definitions (
  permission text PRIMARY KEY,
  description text NOT NULL,
  sensitivity text NOT NULL DEFAULT 'standard' CHECK (sensitivity IN ('standard','sensitive','critical'))
);

CREATE TABLE IF NOT EXISTS fabric.role_permissions (
  role text NOT NULL,
  permission text NOT NULL REFERENCES fabric.permission_definitions(permission) ON DELETE CASCADE,
  PRIMARY KEY (role, permission)
);

INSERT INTO fabric.permission_definitions(permission, description, sensitivity) VALUES
  ('organization:manage', 'Manage organization configuration and memberships', 'critical'),
  ('pii:read', 'Read personally identifiable client data', 'sensitive'),
  ('pii:write', 'Create or modify personally identifiable client data', 'critical'),
  ('program:read', 'Read program and enrollment data', 'standard'),
  ('program:write', 'Create or modify program and enrollment data', 'sensitive'),
  ('service:read', 'Read service delivery records', 'standard'),
  ('service:write', 'Create or modify service delivery records', 'sensitive'),
  ('finance:read', 'Read funding, grant, and expenditure records', 'sensitive'),
  ('finance:write', 'Create or modify funding, grant, and expenditure records', 'critical'),
  ('outcome:read', 'Read outcome records', 'standard'),
  ('outcome:write', 'Create or modify outcome records', 'sensitive'),
  ('evidence:read', 'Read evidence metadata', 'sensitive'),
  ('evidence:write', 'Create or modify evidence metadata', 'sensitive'),
  ('report:read', 'Read reporting requirements and generated reporting data', 'standard'),
  ('report:manage', 'Configure reporting requirements and mappings', 'critical'),
  ('submission:approve', 'Approve an external submission before transmission', 'critical'),
  ('audit:read', 'Read tenant audit events', 'sensitive')
ON CONFLICT (permission) DO NOTHING;

-- Organization administrator: full tenant administration.
INSERT INTO fabric.role_permissions(role, permission)
SELECT 'organization_admin', permission FROM fabric.permission_definitions
ON CONFLICT DO NOTHING;

-- Executive: broad read access and submission approval, but no routine PII/finance mutation.
INSERT INTO fabric.role_permissions(role, permission) VALUES
 ('executive','pii:read'),('executive','program:read'),('executive','service:read'),
 ('executive','finance:read'),('executive','outcome:read'),('executive','evidence:read'),
 ('executive','report:read'),('executive','submission:approve'),('executive','audit:read'),
 -- Program director: program-scoped delivery management.
 ('program_director','pii:read'),('program_director','program:read'),('program_director','program:write'),
 ('program_director','service:read'),('program_director','service:write'),
 ('program_director','outcome:read'),('program_director','outcome:write'),
 ('program_director','evidence:read'),('program_director','evidence:write'),('program_director','report:read'),
 -- Case manager: program-scoped client/service work.
 ('case_manager','pii:read'),('case_manager','pii:write'),('case_manager','program:read'),
 ('case_manager','service:read'),('case_manager','service:write'),
 ('case_manager','outcome:read'),('case_manager','outcome:write'),
 ('case_manager','evidence:read'),('case_manager','evidence:write'),
 -- Finance: grant and expenditure work without routine PII mutation.
 ('finance','program:read'),('finance','service:read'),('finance','finance:read'),('finance','finance:write'),
 ('finance','report:read'),
 -- Reporting manager: broad read plus reporting configuration and approval.
 ('reporting_manager','pii:read'),('reporting_manager','program:read'),('reporting_manager','service:read'),
 ('reporting_manager','finance:read'),('reporting_manager','outcome:read'),('reporting_manager','evidence:read'),
 ('reporting_manager','report:read'),('reporting_manager','report:manage'),
 ('reporting_manager','submission:approve'),('reporting_manager','audit:read'),
 -- Read-only intentionally excludes raw PII and audit data.
 ('read_only','program:read'),('read_only','service:read'),('read_only','outcome:read'),('read_only','report:read')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS fabric.program_access (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES fabric.organizations(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL,
  program_id uuid NOT NULL,
  access_level text NOT NULL DEFAULT 'member' CHECK (access_level IN ('member','lead')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, organization_id),
  UNIQUE (organization_id, membership_id, program_id),
  FOREIGN KEY (membership_id, organization_id) REFERENCES fabric.memberships(id, organization_id) ON DELETE CASCADE,
  FOREIGN KEY (program_id, organization_id) REFERENCES fabric.programs(id, organization_id) ON DELETE CASCADE
);

-- memberships lacked a composite unique key in Run 0; add it for tenant-aware references.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'memberships_id_organization_key'
  ) THEN
    ALTER TABLE fabric.memberships ADD CONSTRAINT memberships_id_organization_key UNIQUE (id, organization_id);
  END IF;
END $$;

ALTER TABLE fabric.program_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE fabric.program_access FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS program_access_tenant_isolation ON fabric.program_access;
CREATE POLICY program_access_tenant_isolation ON fabric.program_access
  USING (organization_id = fabric.current_organization_id())
  WITH CHECK (organization_id = fabric.current_organization_id());

CREATE OR REPLACE FUNCTION fabric.current_membership_role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT m.role
  FROM fabric.memberships m
  WHERE m.organization_id = fabric.current_organization_id()
    AND m.identity_id = fabric.current_identity_id()
    AND m.status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION fabric.has_permission(required_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(EXISTS (
    SELECT 1
    FROM fabric.role_permissions rp
    WHERE rp.role = fabric.current_membership_role()
      AND rp.permission = required_permission
  ), false);
$$;

CREATE OR REPLACE FUNCTION fabric.can_access_program(target_program_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE r text;
BEGIN
  r := fabric.current_membership_role();
  IF r IS NULL THEN RETURN false; END IF;

  -- Tenant-wide roles can access all programs within the already-selected organization.
  IF r IN ('organization_admin','executive','finance','reporting_manager','read_only') THEN
    RETURN EXISTS (
      SELECT 1 FROM fabric.programs p
      WHERE p.id = target_program_id
        AND p.organization_id = fabric.current_organization_id()
    );
  END IF;

  -- Delivery roles require explicit program assignment.
  IF r IN ('program_director','case_manager') THEN
    RETURN EXISTS (
      SELECT 1
      FROM fabric.program_access pa
      JOIN fabric.memberships m
        ON m.id = pa.membership_id AND m.organization_id = pa.organization_id
      WHERE pa.organization_id = fabric.current_organization_id()
        AND pa.program_id = target_program_id
        AND m.identity_id = fabric.current_identity_id()
        AND m.status = 'active'
    );
  END IF;

  RETURN false;
END;
$$;

-- Audit records are append-only. RLS already prevents tenant UPDATE/DELETE because no
-- policies exist; this trigger additionally blocks accidental privileged mutation.
CREATE OR REPLACE FUNCTION fabric.prevent_audit_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_immutable ON fabric.audit_events;
CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON fabric.audit_events
FOR EACH ROW EXECUTE FUNCTION fabric.prevent_audit_mutation();

-- Record authorization-relevant membership changes in the existing audit stream.
CREATE OR REPLACE FUNCTION fabric.audit_membership_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE org uuid;
BEGIN
  org := COALESCE(NEW.organization_id, OLD.organization_id);
  INSERT INTO fabric.audit_events(
    organization_id, actor_identity_id, event_type, entity_type, entity_id, metadata
  ) VALUES (
    org,
    fabric.current_identity_id(),
    CASE TG_OP WHEN 'INSERT' THEN 'membership.created' WHEN 'UPDATE' THEN 'membership.updated' ELSE 'membership.deleted' END,
    'membership',
    COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object(
      'operation', TG_OP,
      'old_role', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.role END,
      'new_role', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.role END,
      'old_status', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      'new_status', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE NEW.status END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS memberships_audit_change ON fabric.memberships;
CREATE TRIGGER memberships_audit_change
AFTER INSERT OR UPDATE OR DELETE ON fabric.memberships
FOR EACH ROW EXECUTE FUNCTION fabric.audit_membership_change();

INSERT INTO fabric.schema_migrations(version, git_sha)
VALUES ('0003_security_governance', current_setting('app.git_sha', true))
ON CONFLICT (version) DO NOTHING;

COMMIT;