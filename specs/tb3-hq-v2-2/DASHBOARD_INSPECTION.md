# TB3 database dashboard inspection

Inspected 2026-10-05 through the signed-in Vercel dashboard. Read-only; no configuration changed, secrets revealed, resources provisioned or deployment initiated.

## Verified project

`ea-payments`, team `the-architects-projects-cc813778`.
Storage: https://vercel.com/the-architects-projects-cc813778/ea-payments/stores
Environment settings: https://vercel.com/the-architects-projects-cc813778/ea-payments/settings/environment-variables

## Storage resources

One visible connected resource: `amandas-course-materials`, Vercel Blob, Private, Available, connected to Production and Preview. No Postgres, Neon, Supabase or KV resource is listed in this project's Storage view. The existing Blob store is Amanda-named and is not a verified TB3 contract destination.

## Environment names and scope

| Variable | Visible scope |
| --- | --- |
| PEOPLE_SUPABASE_URL | Production |
| PEOPLE_SUPABASE_KEY | Production |
| PEOPLE_SUPABASE_API_KEY | Production and Preview |
| PEOPLE_SUPABASE_JWT_SECRET | Production and Preview |

Searching all project environments for SUPABASE returned only those four entries. POSTGRES and DATABASE searches returned no results. The Shared tab states no shared variables are linked. Generic SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY were not present in the Supabase search.

This proves configuration presence, not successful database connectivity or permission to create TB3 tables. No database query or health probe was run. The Supabase database may be external to Vercel Storage.

## Code and tenancy

`lib/people/postgres-client.ts` uses the `people` schema and short-lived `people_app` JWT, explicitly disallowing the shared Simplifi service role for People DML. Do not treat these credentials as an unrestricted TB3 migration/admin connection.

`lib/simplifi-os/supabase.ts` requires generic SUPABASE_URL plus a service key; those required names were not observed in this project's environment configuration.

`npm run test:tenant-safety` passed during this inspection. This is a general code contract check, not TB3 database tenant certification. Current HQ records use `tb3.hq.v2.1.preview.records` browser storage. `config/ea-system-registry.json` still has TARRIS tenantId null. Private DB access must resolve persisted identity and active membership using existing EA guards; a public slug or synthetic org ID is insufficient.

## Driver decision

Observed database technology: Supabase/Postgres for People, accessible through PostgREST in code. Observed Storage binding: private Vercel Blob. No verified TB3-ready database connection or preview database URL yet. The draft migration remains unexecuted pending a dedicated authorized database role/connection and persisted Tarris organization mapping.

The earlier connector 403 was from a project-level environment request for `ea-payments`, not a protected preview deployment request. Browser dashboard inspection succeeded after secure sign-in.

No changes pushed: a push to the Git-integrated preview branch would trigger a deployment, contrary to the owner's current instruction to keep these drafts undeployed.

## Follow-up 2026-10-05 after final prompt

The latest owner attachment reauthorizes publishing the preview branch. No publication has occurred during this follow-up because the existing database is unavailable.

Read-only Airtable inspection of the documented Payments & Clients base found active organization record `recxUohHc16hPk1T3`: Name Tarris Bouie / TB3, Slug and Portal Slug `tarris`, Organization Id field `tb3-tarris-bouie`. Existing `mapOrganization` uses the Airtable record ID as its persisted ID. The proposed default `tarris-bouie-iii` is not the observed persisted organization identity. Membership searches for the record ID and field label returned no rows. Do not infer owner/staff authorization from this organization record.

Signed-in Supabase dashboard inspection shows two projects, both paused: `EA People Production` and `TheArchitect1111's Project`. The People project is `dwygvwnjjaennksddniu` (ca-central-1). Its overview explicitly says the project is paused and offers Resume project; database/SQL editor controls are disabled. Data remains safe and the dashboard says it can be resumed until 07 Sep 2027. No resume, migration, credential creation, plan upgrade or configuration mutation was performed.

The production database must be resumed before this project's database operations can proceed. Resuming changes production infrastructure state and therefore needs an explicit exception to the current production-unchanged instruction. Anonymous project credentials do not grant migration or private portal authorization. Keep draft migration unexecuted and retain the working v2.1 preview while this dependency is resolved.

## Authorized resume

Owner explicitly approved `resume` after reviewing the restoration confirmation on 2026-10-05. The final Resume button was clicked; the confirmation closed and the project overview progressed to Coming up. No migration or Vercel production promotion was performed. Final availability verification is pending.
