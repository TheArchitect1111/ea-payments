BEGIN;

-- Disposable acceptance fixture. Migrations 0001 and 0002 must already be applied.
INSERT INTO fabric.organizations(id, name, slug)
VALUES
 ('20000000-0000-0000-0000-0000000000a1','Run1 Org A','run1-org-a'),
 ('20000000-0000-0000-0000-0000000000b2','Run1 Org B','run1-org-b')
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='fabric_run1_app') THEN
    CREATE ROLE fabric_run1_app NOLOGIN NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;
GRANT USAGE ON SCHEMA fabric TO fabric_run1_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA fabric TO fabric_run1_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA fabric TO fabric_run1_app;

SET LOCAL ROLE fabric_run1_app;
SELECT set_config('app.current_organization_id','20000000-0000-0000-0000-0000000000a1',true);

INSERT INTO fabric.people(id,organization_id,external_key,first_name,last_name)
VALUES ('21000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','person-a','Alex','Example');
INSERT INTO fabric.households(id,organization_id,external_key,name,county,state_code)
VALUES ('22000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','hh-a','Example Household','Forsyth','NC');
INSERT INTO fabric.household_members(id,organization_id,household_id,person_id,is_head_of_household)
VALUES ('23000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','22000000-0000-0000-0000-0000000000a1','21000000-0000-0000-0000-0000000000a1',true);
INSERT INTO fabric.programs(id,organization_id,external_key,name)
VALUES ('24000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','program-a','Self Sufficiency');
INSERT INTO fabric.enrollments(id,organization_id,program_id,person_id,household_id,external_key,enrolled_on)
VALUES ('25000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','24000000-0000-0000-0000-0000000000a1','21000000-0000-0000-0000-0000000000a1','22000000-0000-0000-0000-0000000000a1','enroll-a',DATE '2026-09-01');
INSERT INTO fabric.funding_sources(id,organization_id,external_key,name,source_type,funder_name)
VALUES ('26000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','fund-a','Community Grant','county','Forsyth County');
INSERT INTO fabric.grants(id,organization_id,funding_source_id,external_key,name,award_amount)
VALUES ('27000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','26000000-0000-0000-0000-0000000000a1','grant-a','Housing Stability Grant',100000);
INSERT INTO fabric.services(id,organization_id,enrollment_id,service_type,service_date,amount,county)
VALUES ('28000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','25000000-0000-0000-0000-0000000000a1','rental_assistance',DATE '2026-09-10',1200,'Forsyth');
INSERT INTO fabric.service_funding(id,organization_id,service_id,grant_id,amount,allocation_percent)
VALUES ('29000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','28000000-0000-0000-0000-0000000000a1','27000000-0000-0000-0000-0000000000a1',1200,100);
INSERT INTO fabric.expenditures(id,organization_id,grant_id,service_id,external_key,expenditure_date,category,amount)
VALUES ('2a000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','27000000-0000-0000-0000-0000000000a1','28000000-0000-0000-0000-0000000000a1','expense-a',DATE '2026-09-10','direct_assistance',1200);
INSERT INTO fabric.outcomes(id,organization_id,enrollment_id,outcome_type,outcome_date,value_text,status)
VALUES ('2b000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','25000000-0000-0000-0000-0000000000a1','housing_stability',DATE '2026-09-10','stabilized','achieved');
INSERT INTO fabric.evidence(id,organization_id,entity_type,entity_id,evidence_type,storage_uri)
VALUES ('2c000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','service','28000000-0000-0000-0000-0000000000a1','receipt','s3://placeholder/run1/receipt');
INSERT INTO fabric.reporting_requirements(id,organization_id,grant_id,external_key,destination_system,report_name,frequency,submission_method,human_certification_required)
VALUES ('2d000000-0000-0000-0000-0000000000a1','20000000-0000-0000-0000-0000000000a1','27000000-0000-0000-0000-0000000000a1','report-a','Neighborly','Monthly Performance','monthly','human',true);

DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM fabric.services WHERE county='Forsyth';
  IF n <> 1 THEN RAISE EXCEPTION 'Canonical service flow missing'; END IF;
  SELECT count(*) INTO n
  FROM fabric.services s
  JOIN fabric.enrollments e ON e.id=s.enrollment_id AND e.organization_id=s.organization_id
  JOIN fabric.people p ON p.id=e.person_id AND p.organization_id=e.organization_id
  JOIN fabric.service_funding sf ON sf.service_id=s.id AND sf.organization_id=s.organization_id
  JOIN fabric.grants g ON g.id=sf.grant_id AND g.organization_id=sf.organization_id
  JOIN fabric.outcomes o ON o.enrollment_id=e.id AND o.organization_id=e.organization_id
  WHERE p.external_key='person-a' AND g.external_key='grant-a' AND o.outcome_type='housing_stability';
  IF n <> 1 THEN RAISE EXCEPTION 'End-to-end canonical relationship chain failed'; END IF;
END $$;

RESET ROLE;
-- Seed a B record as privileged fixture setup.
INSERT INTO fabric.people(id,organization_id,external_key,first_name,last_name)
VALUES ('21000000-0000-0000-0000-0000000000b2','20000000-0000-0000-0000-0000000000b2','person-b','Blair','Example');

SET LOCAL ROLE fabric_run1_app;
SELECT set_config('app.current_organization_id','20000000-0000-0000-0000-0000000000a1',true);
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM fabric.people;
  IF n <> 1 THEN RAISE EXCEPTION 'Org A should see exactly its one person, got %',n; END IF;
  IF EXISTS (SELECT 1 FROM fabric.people WHERE external_key='person-b') THEN
    RAISE EXCEPTION 'Org A can see Org B person';
  END IF;
END $$;

-- Composite FK must reject a cross-tenant relationship, even if a caller guesses another tenant ID.
DO $$
BEGIN
  BEGIN
    INSERT INTO fabric.household_members(id,organization_id,household_id,person_id)
    VALUES ('23000000-0000-0000-0000-0000000000ff','20000000-0000-0000-0000-0000000000a1','22000000-0000-0000-0000-0000000000a1','21000000-0000-0000-0000-0000000000b2');
    RAISE EXCEPTION 'Cross-tenant FK unexpectedly succeeded';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

SELECT set_config('app.current_organization_id','',true);
DO $$
DECLARE n integer;
BEGIN
  SELECT count(*) INTO n FROM fabric.people;
  IF n <> 0 THEN RAISE EXCEPTION 'Missing tenant context must fail closed'; END IF;
END $$;

RESET ROLE;
ROLLBACK;