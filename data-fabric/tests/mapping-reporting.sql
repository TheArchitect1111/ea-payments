BEGIN;

-- Disposable Run 3 acceptance fixture after migrations 0001, 0002, 0003, 0004, 0005.
INSERT INTO fabric.organizations(id, name, slug) VALUES
 ('00000000-0000-0000-0000-0000000003a1','Run3 Org A','run3-org-a'),
 ('00000000-0000-0000-0000-0000000003b2','Run3 Org B','run3-org-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.identities(id, external_subject, email) VALUES
 ('30000000-0000-0000-0000-000000000001','run3-reporting','reporting3@example.test')
ON CONFLICT (id) DO NOTHING;

SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000003a1';
SET LOCAL app.current_identity_id = '30000000-0000-0000-0000-000000000001';

INSERT INTO fabric.memberships(id, organization_id, identity_id, role, status) VALUES
 ('31000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','30000000-0000-0000-0000-000000000001','reporting_manager','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.people(id, organization_id, external_key, first_name, last_name) VALUES
 ('32000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','person-1','Mary','Jones')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.households(id, organization_id, external_key, name, county, state_code) VALUES
 ('32100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','hh-1','Jones Household','Forsyth','NC')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.household_members(id, organization_id, household_id, person_id, is_head_of_household) VALUES
 ('32200000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32100000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001',true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.programs(id, organization_id, external_key, name) VALUES
 ('32300000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','self-sufficiency','Self-Sufficiency')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.enrollments(id, organization_id, program_id, person_id, household_id, external_key, enrolled_on) VALUES
 ('32400000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32300000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','32100000-0000-0000-0000-000000000001','enr-1','2026-01-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.services(id, organization_id, enrollment_id, service_type, service_date, amount, county) VALUES
 ('32500000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32400000-0000-0000-0000-000000000001','Rental Assistance','2026-03-15',1200.00,'Forsyth')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.outcomes(id, organization_id, enrollment_id, outcome_type, outcome_date, value_text, status) VALUES
 ('32600000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32400000-0000-0000-0000-000000000001','Housing Stability','2026-04-01','Stabilized','achieved')
ON CONFLICT (id) DO NOTHING;

-- Three destination profiles from one canonical payload.
INSERT INTO fabric.mapping_profiles(id, organization_id, name, destination_system, schema_version, status) VALUES
 ('33000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','CARDS Simulation','CARDS','sim-1','active'),
 ('33000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','WIPS Simulation','WIPS','sim-1','active'),
 ('33000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','Donor Simulation','DONOR','sim-1','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.mapping_rules(id, organization_id, mapping_profile_id, source_entity, source_field, destination_field, transform_type, transform_config, required, ordinal) VALUES
 ('33100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','service','county','ServiceArea','copy','{}',true,1),
 ('33100000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','service','service_type','ServiceCode','lookup','{"map":{"Rental Assistance":"HOUSING_ASSIST"}}',true,2),
 ('33100000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','service','county','CountyServed','copy','{}',true,1),
 ('33100000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','service','amount','SupportAmount','copy','{}',true,2),
 ('33100000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','service','county','GeographicArea','copy','{}',true,1),
 ('33100000-0000-0000-0000-000000000006','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','service','service_type','ImpactCategory','format','{"case":"upper"}',true,2)
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.validation_rules(id, organization_id, mapping_profile_id, destination_field, rule_type, rule_config, severity, message) VALUES
 ('33200000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','ServiceArea','required','{}','error','Service area is required'),
 ('33200000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','SupportAmount','range','{"min":0,"max":1000000}','error','Support amount must be in allowed range'),
 ('33200000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','GeographicArea','required','{}','error','Geographic area is required')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  payload jsonb := '{"county":"Forsyth","service_type":"Rental Assistance","amount":1200}'::jsonb;
  e1 uuid; e2 uuid; e3 uuid;
  p1 jsonb; p2 jsonb; p3 jsonb;
BEGIN
  e1 := fabric.execute_mapping('33000000-0000-0000-0000-000000000001','service','32500000-0000-0000-0000-000000000001',payload);
  e2 := fabric.execute_mapping('33000000-0000-0000-0000-000000000002','service','32500000-0000-0000-0000-000000000001',payload);
  e3 := fabric.execute_mapping('33000000-0000-0000-0000-000000000003','service','32500000-0000-0000-0000-000000000001',payload);

  IF NOT fabric.validate_mapping_execution(e1) THEN RAISE EXCEPTION 'CARDS simulation validation failed'; END IF;
  IF NOT fabric.validate_mapping_execution(e2) THEN RAISE EXCEPTION 'WIPS simulation validation failed'; END IF;
  IF NOT fabric.validate_mapping_execution(e3) THEN RAISE EXCEPTION 'Donor simulation validation failed'; END IF;

  SELECT mapped_payload INTO p1 FROM fabric.mapping_executions WHERE id=e1;
  SELECT mapped_payload INTO p2 FROM fabric.mapping_executions WHERE id=e2;
  SELECT mapped_payload INTO p3 FROM fabric.mapping_executions WHERE id=e3;

  IF p1 ->> 'ServiceArea' <> 'Forsyth' OR p1 ->> 'ServiceCode' <> 'HOUSING_ASSIST' THEN
    RAISE EXCEPTION 'CARDS simulation mapping incorrect: %', p1;
  END IF;
  IF p2 ->> 'CountyServed' <> 'Forsyth' OR (p2 ->> 'SupportAmount')::numeric <> 1200 THEN
    RAISE EXCEPTION 'WIPS simulation mapping incorrect: %', p2;
  END IF;
  IF p3 ->> 'GeographicArea' <> 'Forsyth' OR p3 ->> 'ImpactCategory' <> 'RENTAL ASSISTANCE' THEN
    RAISE EXCEPTION 'Donor simulation mapping incorrect: %', p3;
  END IF;
END $$;

-- Prove required-field failure does not become ready.
DO $$
DECLARE e uuid; ok boolean; st text;
BEGIN
  e := fabric.execute_mapping(
    '33000000-0000-0000-0000-000000000001','service',
    '32500000-0000-0000-0000-000000000001',
    '{"service_type":"Rental Assistance","amount":1200}'::jsonb
  );
  ok := fabric.validate_mapping_execution(e);
  SELECT status INTO st FROM fabric.mapping_executions WHERE id=e;
  IF ok OR st <> 'invalid' THEN RAISE EXCEPTION 'required field failure did not invalidate execution'; END IF;
END $$;

-- Rapid impact query from canonical records.
DO $$
DECLARE s jsonb;
BEGIN
  s := fabric.impact_summary('Forsyth','2026-01-01','2026-12-31');
  IF (s ->> 'services_delivered')::integer <> 1 THEN RAISE EXCEPTION 'impact service count incorrect: %', s; END IF;
  IF (s ->> 'service_value')::numeric <> 1200 THEN RAISE EXCEPTION 'impact service value incorrect: %', s; END IF;
  IF (s ->> 'people_served')::integer <> 1 THEN RAISE EXCEPTION 'impact people count incorrect: %', s; END IF;
  IF (s ->> 'households_served')::integer <> 1 THEN RAISE EXCEPTION 'impact household count incorrect: %', s; END IF;
  IF (s ->> 'outcomes_achieved')::integer <> 1 THEN RAISE EXCEPTION 'impact outcome count incorrect: %', s; END IF;
END $$;

INSERT INTO fabric.report_definitions(id, organization_id, name, report_type, query_spec) VALUES
 ('34000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','Forsyth County Impact','county','{"county":"Forsyth"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.report_runs(id, organization_id, report_definition_id, requested_by_identity_id, period_start, period_end, status, result_snapshot, generated_at) VALUES
 ('34100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','34000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','2026-01-01','2026-12-31','generated',fabric.impact_summary('Forsyth','2026-01-01','2026-12-31'),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.report_metrics(organization_id, report_run_id, metric_key, metric_value_numeric, source_entity, source_query) VALUES
 ('00000000-0000-0000-0000-0000000003a1','34100000-0000-0000-0000-000000000001','services_delivered',1,'services','{"county":"Forsyth"}'),
 ('00000000-0000-0000-0000-0000000003a1','34100000-0000-0000-0000-000000000001','service_value',1200,'services','{"county":"Forsyth"}'),
 ('00000000-0000-0000-0000-0000000003a1','34100000-0000-0000-0000-000000000001','outcomes_achieved',1,'outcomes','{"county":"Forsyth"}')
ON CONFLICT DO NOTHING;

-- Cross-tenant visibility must fail closed.
SET LOCAL app.current_organization_id = '00000000-0000-0000-0000-0000000003b2';
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM fabric.mapping_profiles;
  IF n <> 0 THEN RAISE EXCEPTION 'cross-tenant mapping profile leak'; END IF;
  SELECT count(*) INTO n FROM fabric.report_runs;
  IF n <> 0 THEN RAISE EXCEPTION 'cross-tenant report run leak'; END IF;
END $$;

ROLLBACK;