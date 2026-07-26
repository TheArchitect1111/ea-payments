-- Phase 2C: transactional relationship upsert (ADV-P-2 concurrency)
CREATE OR REPLACE FUNCTION people.upsert_relationship(
  p_organization_id text,
  p_edge_key text,
  p_from_person_key text,
  p_to_person_key text,
  p_type text,
  p_status text DEFAULT 'active',
  p_expires_at timestamptz DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  v_row people.relationships%ROWTYPE;
BEGIN
  IF p_organization_id IS NULL OR p_from_person_key IS NULL OR p_to_person_key IS NULL THEN
    RAISE EXCEPTION 'upsert_relationship args required';
  END IF;
  PERFORM set_config('people.organization_id', p_organization_id, true);

  BEGIN
    INSERT INTO people.relationships (
      edge_key, organization_id, from_person_key, to_person_key, type, status, expires_at, notes
    ) VALUES (
      p_edge_key, p_organization_id, p_from_person_key, p_to_person_key, p_type,
      COALESCE(p_status, 'active'), p_expires_at, p_notes
    )
    RETURNING * INTO v_row;
  EXCEPTION WHEN unique_violation THEN
    SELECT * INTO v_row
    FROM people.relationships
    WHERE organization_id = p_organization_id
      AND from_person_key = p_from_person_key
      AND to_person_key = p_to_person_key
      AND type = p_type
      AND status = 'active'
    LIMIT 1;
  END;

  RETURN to_jsonb(v_row);
END;
$$;

REVOKE ALL ON FUNCTION people.upsert_relationship(text, text, text, text, text, text, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.upsert_relationship(text, text, text, text, text, text, timestamptz, text) TO people_app;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION people.upsert_relationship(text, text, text, text, text, text, timestamptz, text) FROM anon, authenticated, service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;
