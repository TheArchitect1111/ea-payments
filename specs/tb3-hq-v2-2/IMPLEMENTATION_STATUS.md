# TB3 v2.2 implementation status — 2026-10-05

## Verified external state
- Existing Supabase project EA People Production (`dwygvwnjjaennksddniu`) restored with explicit approval. Dashboard Healthy; SQL `select 1` returned 1 in database postgres.
- Server database role `people_app` exists. No `tb3_%` tables exist as of inspection. Migration has NOT been executed.
- Vercel project Storage: private Blob `amandas-course-materials`; relational driver is existing Supabase/Postgres People subsystem configured through environment variables, not a Marketplace Storage binding.
- Existing People API key and JWT secret are available in Preview; existing URL is Production-only. Proposed new URL variable is branch-specific Preview only, not a copied production credential.
- Persisted Organizations record `recxUohHc16hPk1T3`, slug `tarris`, Active. Human OrganizationId field is `tb3-tarris-bouie`; neither it nor requested `tarris-bouie-iii` is the actual record ID used by EA membership guards.
- No membership records found for either the real org record ID or human field label. Do not synthesize access or mint a test session.

## Implemented locally
Public booking `/tarris` and `/tarris/book`, manual opportunity entry, API-backed HQ refresh without localStorage, four-stage opportunity details/status, agreed earnings, monthly earnings by inquiry creation month, private PDF upload/download, shared calendar and activity logging APIs, tutor contacts, transcript vault and eligibility recording, module tools, database-derived focus/upcoming/inbox/EVA context. Mutation errors remain visible; success requires a successful server response. No live write claimed.

Migration contains new TB3 tables, preview-only RLS, three invoker functions for atomic/idempotent booking/logging and linked status updates, derived impact view. Existing People tables are not modified. Tenant label is database constrained; actual authorization requires persisted EA org plus active membership. Production Vercel environment is denied by TB3 server helpers.

## Required activation confirmation
Running migration grants existing server role `people_app` read/write/execute access to NEW TB3 preview workspace only; this materially expands application access to inquiry contacts, agreements and transcripts. Browser confirmation policy requires confirmation at action time despite prior implementation approval. It also adds objects to the existing production-named database; approval must cover this specific additive preview scope.

After confirmation: execute `013_tb3_shared_tracking.sql`, verify RLS with real database role, add branch-specific Preview URL, resolve an explicitly authorized existing Tarris actor membership, deploy and verify public booking → authenticated HQ in two browsers. Do not promote production.

## Limits
Local layout/access tests do not verify Supabase writes or shared-device sync. Full repository TypeScript contains pre-existing unrelated diagnostics; changed TB3 files have no diagnostics in current full run. All asset locks and the source cable shoe waiver are preserved. Sixteen listed assets remain sixteen; vault-only lazy loading remains the interpreted requirement. No fake example statistics or duplicated recent-media assets are introduced.
