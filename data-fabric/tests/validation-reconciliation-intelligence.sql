BEGIN;

INSERT INTO fabric.organizations(id,name,slug) VALUES
('00000000-0000-0000-0000-0000000005a1','Run5 Org A','run5-org-a'),
('00000000-0000-0000-0000-0000000005b2','Run5 Org B','run5-org-b')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.identities(id,external_subject,email) VALUES
('50000000-0000-0000-0000-000000000001','run5-reporting','run5@example.test')
ON CONFLICT (id) DO NOTHING;

SET LOCAL app.current_organization_id='00000000-0000-0000-0000-0000000005a1';
SET LOCAL app.current_identity_id='50000000-0000-0000-0000-000000000001';

INSERT INTO fabric.memberships(id,organization_id,identity_id,role,status) VALUES
('51000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','50000000-0000-0000-0000-000000000001','reporting_manager','active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.people(id,organization_id,external_key,first_name,last_name,attributes) VALUES
('52000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','p1','Mary','Jones','{"age_band":"35-44"}')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.households(id,organization_id,external_key,name,county,state_code) VALUES
('52100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','h1','Jones Household','Forsyth','NC')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.programs(id,organization_id,external_key,name) VALUES
('52200000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','self','Self-Sufficiency')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.enrollments(id,organization_id,program_id,person_id,household_id,external_key,enrolled_on) VALUES
('52300000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52200000-0000-0000-0000-000000000001','52000000-0000-0000-0000-000000000001','52100000-0000-0000-0000-000000000001','e1','2026-01-01')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.funding_sources(id,organization_id,external_key,name,source_type) VALUES
('52400000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','fs1','Forsyth County','county')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.grants(id,organization_id,funding_source_id,external_key,name,status) VALUES
('52500000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52400000-0000-0000-0000-000000000001','g1','Community Grant','active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.services(id,organization_id,enrollment_id,service_type,service_date,amount,county) VALUES
('52600000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52300000-0000-0000-0000-000000000001','Rental Assistance','2026-03-15',1200,'Forsyth')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.service_funding(id,organization_id,service_id,grant_id,amount) VALUES
('52700000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52600000-0000-0000-0000-000000000001','52500000-0000-0000-0000-000000000001',1200)
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.expenditures(id,organization_id,grant_id,service_id,external_key,expenditure_date,category,amount) VALUES
('52800000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52500000-0000-0000-0000-000000000001','52600000-0000-0000-0000-000000000001','x1','2026-03-15','Rental Assistance',1200)
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.outcomes(id,organization_id,enrollment_id,outcome_type,outcome_date,value_text,status) VALUES
('52900000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','52300000-0000-0000-0000-000000000001','Housing Stability','2026-04-01','Stabilized','achieved')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.mapping_profiles(id,organization_id,name,destination_system,schema_version,status) VALUES
('53000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','Run5 Destination','SIM','1','active')
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.mapping_rules(id,organization_id,mapping_profile_id,source_entity,source_field,destination_field,transform_type,required,ordinal) VALUES
('53100000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','53000000-0000-0000-0000-000000000001','service','county','County','copy',true,1),
('53100000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000005a1','53000000-0000-0000-0000-000000000001','service','amount','Amount','copy',true,2)
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.validation_rules(id,organization_id,mapping_profile_id,destination_field,rule_type,severity,message) VALUES
('53200000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','53000000-0000-0000-0000-000000000001','County','required','error','County required')
ON CONFLICT (id) DO NOTHING;

INSERT INTO fabric.connector_definitions(id,organization_id,name,connector_type,destination_system,requires_human_approval) VALUES
('53300000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','Run5 Human','human','SIM',true)
ON CONFLICT (id) DO NOTHING;
INSERT INTO fabric.connector_runs(id,organization_id,connector_id,status) VALUES
('53400000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000005a1','53300000-0000-0000-0000-000000000001','draft')
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE e uuid; p uuid; a uuid; r uuid; q uuid; s jsonb; st text;
BEGIN
 e := fabric.execute_mapping('53000000-0000-0000-0000-000000000001','service','52600000-0000-0000-0000-000000000001','{"county":"Forsyth","amount":1200}');
 IF NOT fabric.validate_mapping_execution(e) THEN RAISE EXCEPTION 'mapping validation failed'; END IF;
 p := fabric.create_submission_package(e,'53400000-0000-0000-0000-000000000001');
 SELECT status INTO st FROM fabric.connector_runs WHERE id='53400000-0000-0000-0000-000000000001';
 IF st <> 'validated' THEN RAISE EXCEPTION 'connector not validated: %',st; END IF;
 a := fabric.request_connector_approval('53400000-0000-0000-0000-000000000001');
 PERFORM fabric.sync_submission_package_status('53400000-0000-0000-0000-000000000001');
 PERFORM fabric.decide_connector_approval(a,'approved','Run5 acceptance');
 PERFORM fabric.sync_submission_package_status('53400000-0000-0000-0000-000000000001');
 UPDATE fabric.connector_runs SET status='submitted' WHERE id='53400000-0000-0000-0000-000000000001';
 UPDATE fabric.connector_runs SET status='accepted', destination_reference='DEST-5001' WHERE id='53400000-0000-0000-0000-000000000001';
 PERFORM fabric.sync_submission_package_status('53400000-0000-0000-0000-000000000001');
 r := fabric.reconcile_submission(p,'{"County":"Forsyth","Amount":1200}');
 IF NOT (SELECT matched FROM fabric.reconciliation_results WHERE id=r) THEN RAISE EXCEPTION 'reconciliation should match'; END IF;
 SELECT status INTO st FROM fabric.connector_runs WHERE id='53400000-0000-0000-0000-000000000001';
 IF st <> 'reconciled' THEN RAISE EXCEPTION 'connector not reconciled'; END IF;
 q := fabric.run_impact_query('What was our Forsyth County impact?','{"county":"Forsyth","program":"Self-Sufficiency","funding_source":"Forsyth County","service_type":"Rental Assistance","outcome_type":"Housing Stability","start_date":"2026-01-01","end_date":"2026-12-31","demographics":{"age_band":"35-44"}}');
 SELECT result_snapshot INTO s FROM fabric.impact_queries WHERE id=q;
 IF (s->>'services_delivered')::int <> 1 OR (s->>'service_value')::numeric <> 1200 OR (s->>'people_served')::int <> 1 OR (s->>'households_served')::int <> 1 OR (s->>'outcomes_achieved')::int <> 1 OR (s->>'expenditures')::numeric <> 1200 THEN
   RAISE EXCEPTION 'impact intelligence mismatch: %',s;
 END IF;
END $$;

-- prove discrepancy handling
INSERT INTO fabric.connector_runs(id,organization_id,connector_id,status) VALUES
('53400000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000005a1','53300000-0000-0000-0000-000000000001','draft')
ON CONFLICT (id) DO NOTHING;
DO $$
DECLARE e uuid; p uuid; a uuid; r uuid; st text;
BEGIN
 e := fabric.execute_mapping('53000000-0000-0000-0000-000000000001','service','52600000-0000-0000-0000-000000000001','{"county":"Forsyth","amount":1200}');
 PERFORM fabric.validate_mapping_execution(e);
 p := fabric.create_submission_package(e,'53400000-0000-0000-0000-000000000002');
 a := fabric.request_connector_approval('53400000-0000-0000-0000-000000000002');
 PERFORM fabric.decide_connector_approval(a,'approved','Run5 mismatch test');
 UPDATE fabric.connector_runs SET status='submitted' WHERE id='53400000-0000-0000-0000-000000000002';
 UPDATE fabric.connector_runs SET status='accepted' WHERE id='53400000-0000-0000-0000-000000000002';
 r := fabric.reconcile_submission(p,'{"County":"Forsyth","Amount":1199}');
 IF (SELECT matched FROM fabric.reconciliation_results WHERE id=r) THEN RAISE EXCEPTION 'mismatch falsely reconciled'; END IF;
 SELECT status INTO st FROM fabric.submission_packages WHERE id=p;
 IF st <> 'exception' THEN RAISE EXCEPTION 'mismatch package not exception'; END IF;
END $$;

-- RLS proof as non-superuser app role
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='ea_run5_app') THEN CREATE ROLE ea_run5_app NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA fabric TO ea_run5_app;
GRANT SELECT ON fabric.submission_packages,fabric.reconciliation_results,fabric.impact_queries TO ea_run5_app;
SET LOCAL ROLE ea_run5_app;
SET LOCAL app.current_organization_id='00000000-0000-0000-0000-0000000005b2';
DO $$ DECLARE n int; BEGIN
 SELECT count(*) INTO n FROM fabric.submission_packages; IF n<>0 THEN RAISE EXCEPTION 'submission package tenant leak'; END IF;
 SELECT count(*) INTO n FROM fabric.reconciliation_results; IF n<>0 THEN RAISE EXCEPTION 'reconciliation tenant leak'; END IF;
 SELECT count(*) INTO n FROM fabric.impact_queries; IF n<>0 THEN RAISE EXCEPTION 'impact query tenant leak'; END IF;
END $$;
RESET ROLE;

ROLLBACK;
