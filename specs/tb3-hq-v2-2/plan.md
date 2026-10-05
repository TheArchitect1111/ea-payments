# Implementation Plan: TB3 v2.2

## Constitution check

Approved attachment captured, protected assets and tenancy defined, preview-only rollback and evidence defined. Database deployment remains blocked until connection and persisted Tarris identity are verified.

## Architecture

Use the repository's server-only Supabase REST client. Separate TB3 tables avoid collisions with the existing general calendar or opportunity stack. Every record carries a preview workspace and persisted organization identity. Server APIs resolve authenticated membership using existing EA guards; they never trust a posted tenant. Public booking resolves its destination from server configuration. Transactions create inquiry/hold and log/event atomically. RLS denies direct anonymous/authenticated access; server authorization gates service-role access. Private documents are streamed after authorization.

## Execution sequence

1. Verify database connection, schema migration capability and persisted Tarris organization/membership.
2. Validate and apply the reviewed additive migration to the verified preview workspace.
3. Implement validated API contracts, transaction calls, upload access and authorization tests.
4. Replace browser-local context with server data, update module forms, public booking and Eva commands.
5. Run scoped type/lint/build/tenant checks and browser end-to-end checks.
6. Commit/tag and publish the approved preview branch; verify new preview and save evidence.

## Risk and rollback

Preview workspace separation prevents test data from being mixed with production. No destructive migrations. Restore v2.1 branch state on regression, preserving database rows for investigation. Never substitute synthetic org IDs or permissive auth to complete QA.

## Production proof

Production promotion requires a separate launch approval. This release requires deployed preview proof only.
