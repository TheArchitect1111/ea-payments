-- REVIEW/APPLY SEPARATELY. Never executed by checkout or tests.
-- Existing restricted merchant role/database; no credential or account creation.
BEGIN;
-- Run the read-only preflight first. CREATE without IF NOT EXISTS also fails
-- closed if any relation takes this name between preflight and migration.
CREATE TABLE public.tb3_paypal_orders (
 id text PRIMARY KEY CHECK (id ~ '^[a-f0-9]{64}$'),
 tenant_slug text NOT NULL CHECK (tenant_slug='tarris'),
 payload jsonb NOT NULL,
 paypal_id text GENERATED ALWAYS AS (payload->>'paypalId') STORED UNIQUE,
 capture_id text GENERATED ALWAYS AS (payload->>'captureId') STORED UNIQUE,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK (payload ?& ARRAY['id','tenant','mode','state','merchantId','inputHash','total','subtotal','shipping','tax','createdAt']),
 CHECK (payload->>'id'=id AND payload->>'tenant'=tenant_slug),
 CHECK (payload->>'mode' IN ('live','sandbox')),
 CHECK (payload->>'state' IN ('creating','created','paid','hold'))
);
ALTER TABLE public.tb3_paypal_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tb3_paypal_orders FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.tb3_paypal_orders FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS tb3_paypal_server_only ON public.tb3_paypal_orders;
CREATE POLICY tb3_paypal_server_only ON public.tb3_paypal_orders TO ea_merchant_api
 USING (tenant_slug='tarris') WITH CHECK (tenant_slug='tarris');
GRANT SELECT, INSERT, UPDATE ON public.tb3_paypal_orders TO ea_merchant_api;
-- If an existing dedicated tb3_paypal_api role is selected instead, grant only
-- this table and an equivalent tenant policy in the reviewed migration.
COMMIT;
