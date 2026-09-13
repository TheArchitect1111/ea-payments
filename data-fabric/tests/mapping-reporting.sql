BEGIN;

INSERT INTO fabric.organizations(id,name,slug) VALUES
 ('00000000-0000-0000-0000-0000000003a1','Run3 Org A','run3-org-a'),
 ('00000000-0000-0000-0000-0000000003b2','Run3 Org B','run3-org-b');

SET LOCAL app.current_organization_id='00000000-0000-0000-0000-0000000003a1';

INSERT INTO fabric.people(id,organization_id,external_key,first_name,last_name) VALUES
 ('32000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','p1','Mary','Jones');
INSERT INTO fabric.households(id,organization_id,external_key,name,county,state_code) VALUES
 ('32100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','h1','Jones Household','Forsyth','NC');
INSERT INTO fabric.programs(id,organization_id,external_key,name) VALUES
 ('32300000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','self-sufficiency','Self-Sufficiency');
INSERT INTO fabric.enrollments(id,organization_id,program_id,person_id,household_id,external_key,enrolled_on) VALUES
 ('32400000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32300000-0000-0000-0000-000000000001','32000000-0000-0000-0000-000000000001','32100000-0000-0000-0000-000000000001','e1','2026-01-01');
INSERT INTO fabric.services(id,organization_id,enrollment_id,service_type,service_date,amount,county) VALUES
 ('32500000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32400000-0000-0000-0000-000000000001','Rental Assistance','2026-03-15',1200,'Forsyth');
INSERT INTO fabric.outcomes(id,organization_id,enrollment_id,outcome_type,outcome_date,value_text,status) VALUES
 ('32600000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','32400000-0000-0000-0000-000000000001','Housing Stability','2026-04-01','Stabilized','achieved');

INSERT INTO fabric.mapping_profiles(id,organization_id,name,destination_system,schema_version,status) VALUES
 ('33000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','CARDS Simulation','CARDS','sim-1','active'),
 ('33000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','WIPS Simulation','WIPS','sim-1','active'),
 ('33000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','Donor Simulation','DONOR','sim-1','active');

INSERT INTO fabric.mapping_rules(id,organization_id,mapping_profile_id,source_entity,source_field,destination_field,transform_type,transform_config,ordinal) VALUES
 ('33100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','service','county','ServiceArea','copy','{}',1),
 ('33100000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','service','service_type','ServiceCode','lookup','{"map":{"Rental Assistance":"HOUSING_ASSIST"}}',2),
 ('33100000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','service','county','CountyServed','copy','{}',1),
 ('33100000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','service','amount','SupportAmount','copy','{}',2),
 ('33100000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','service','county','GeographicArea','copy','{}',1),
 ('33100000-0000-0000-0000-000000000006','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','service','service_type','ImpactCategory','format','{"case":"upper"}',2);

INSERT INTO fabric.validation_rules(id,organization_id,mapping_profile_id,destination_field,rule_type,rule_config,severity,message) VALUES
 ('33200000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000001','ServiceArea','required','{}','error','Service area required'),
 ('33200000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000002','SupportAmount','range','{"min":0,"max":1000000}','error','Amount out of range'),
 ('33200000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000003a1','33000000-0000-0000-0000-000000000003','GeographicArea','required','{}','error','Geography required');

DO $$
DECLARE payload jsonb := '{"county":"Forsyth","service_type":"Rental Assistance","amount":1200}';
 e1 uuid; e2 uuid; e3 uuid; p jsonb;
BEGIN
 e1:=fabric.execute_mapping('33000000-0000-0000-0000-000000000001','service','32500000-0000-0000-0000-000000000001',payload);
 e2:=fabric.execute_mapping('33000000-0000-0000-0000-000000000002','service','32500000-0000-0000-0000-000000000001',payload);
 e3:=fabric.execute_mapping('33000000-0000-0000-0000-000000000003','service','32500000-0000-0000-0000-000000000001',payload);
 IF NOT fabric.validate_mapping_execution(e1) OR NOT fabric.validate_mapping_execution(e2) OR NOT fabric.validate_mapping_execution(e3) THEN RAISE EXCEPTION 'destination validation failed'; END IF;
 SELECT mapped_payload INTO p FROM fabric.mapping_executions WHERE id=e1;
 IF p->>'ServiceArea'<>'Forsyth' OR p->>'ServiceCode'<>'HOUSING_ASSIST' THEN RAISE EXCEPTION 'CARDS mapping incorrect: %',p; END IF;
 SELECT mapped_payload INTO p FROM fabric.mapping_executions WHERE id=e2;
 IF p->>'CountyServed'<>'Forsyth' OR (p->>'SupportAmount')::numeric<>1200 THEN RAISE EXCEPTION 'WIPS mapping incorrect: %',p; END IF;
 SELECT mapped_payload INTO p FROM fabric.mapping_executions WHERE id=e3;
 IF p->>'GeographicArea'<>'Forsyth' OR p->>'ImpactCategory'<>'RENTAL ASSISTANCE' THEN RAISE EXCEPTION 'Donor mapping incorrect: %',p; END IF;
END $$;

DO $$
DECLARE e uuid; ok boolean;
BEGIN
 e:=fabric.execute_mapping('33000000-0000-0000-0000-000000000001','service','32500000-0000-0000-0000-000000000001','{"service_type":"Rental Assistance","amount":1200}');
 ok:=fabric.validate_mapping_execution(e);
 IF ok OR (SELECT status FROM fabric.mapping_executions WHERE id=e)<>'invalid' THEN RAISE EXCEPTION 'required validation did not fail'; END IF;
END $$;

DO $$
DECLARE s jsonb;
BEGIN
 s:=fabric.impact_summary('Forsyth','2026-01-01','2026-12-31');
 IF (s->>'services_delivered')::int<>1 OR (s->>'service_value')::numeric<>1200 OR (s->>'people_served')::int<>1 OR (s->>'households_served')::int<>1 OR (s->>'outcomes_achieved')::int<>1 THEN RAISE EXCEPTION 'impact summary incorrect: %',s; END IF;
END $$;

INSERT INTO fabric.report_definitions(id,organization_id,name,report_type,query_spec) VALUES
 ('34000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','Forsyth County Impact','county','{"county":"Forsyth"}');
INSERT INTO fabric.report_runs(id,organization_id,report_definition_id,period_start,period_end,status,result_snapshot,generated_at) VALUES
 ('34100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000003a1','34000000-0000-0000-0000-000000000001','2026-01-01','2026-12-31','generated',fabric.impact_summary('Forsyth','2026-01-01','2026-12-31'),now());
INSERT INTO fabric.report_metrics(organization_id,report_run_id,metric_key,metric_value_numeric,source_entity,source_query) VALUES
 ('00000000-0000-0000-0000-0000000003a1','34100000-0000-0000-0000-000000000001','services_delivered',1,'services','{"county":"Forsyth"}'),
 ('00000000-0000-0000-0000-0000000003a1','34100000-0000-0000-0000-000000000001','service_value',1200,'services','{"county":"Forsyth"}');

-- Prove RLS as a non-privileged application role. Superusers bypass RLS by design.
CREATE ROLE run3_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT USAGE ON SCHEMA fabric TO run3_app;
GRANT SELECT ON fabric.mapping_profiles, fabric.report_runs TO run3_app;
SET LOCAL ROLE run3_app;
SET LOCAL app.current_organization_id='00000000-0000-0000-0000-0000000003b2';
DO $$
DECLARE n integer;
BEGIN
 SELECT count(*) INTO n FROM fabric.mapping_profiles;
 IF n<>0 THEN RAISE EXCEPTION 'cross-tenant mapping profile leak'; END IF;
 SELECT count(*) INTO n FROM fabric.report_runs;
 IF n<>0 THEN RAISE EXCEPTION 'cross-tenant report run leak'; END IF;
END $$;
RESET ROLE;

ROLLBACK;