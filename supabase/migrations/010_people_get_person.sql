-- Phase 2C: get_person for PK reads under FORCE RLS (people_app JWT).
CREATE OR REPLACE FUNCTION people.get_person(p_person_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = people, pg_temp
AS $$
DECLARE
  v_person people.persons%ROWTYPE;
BEGIN
  IF p_person_key IS NULL OR length(trim(p_person_key)) = 0 THEN
    RETURN NULL;
  END IF;
  SELECT * INTO v_person FROM people.persons WHERE person_key = p_person_key;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  -- Bind tenant GUC for any subsequent RLS-sensitive work in-session.
  PERFORM set_config('people.organization_id', v_person.organization_id, true);
  RETURN to_jsonb(v_person);
END;
$$;

REVOKE ALL ON FUNCTION people.get_person(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION people.get_person(text) TO people_app;

DO $$
BEGIN
  EXECUTE 'REVOKE ALL ON FUNCTION people.get_person(text) FROM anon, authenticated, service_role';
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;
