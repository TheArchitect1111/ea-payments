# EA Data Fabric

Run 0 establishes the enterprise data foundation without changing existing client production behavior.

## Purpose

The Data Fabric is the canonical, tenant-isolated data layer for future EA products such as ImpactOS. Existing Airtable-backed application flows remain untouched during Run 0.

## Run 0 boundaries

Included:
- PostgreSQL-first foundation contract
- durable organization and membership model
- row-level tenant isolation
- append-only audit-event foundation
- environment separation contract
- health/readiness SQL
- migration and rollback discipline
- backup/recovery requirements
- tenant-isolation verification fixture

Not included:
- ESR-specific tables or screens
- CARDS, Neighborly, WIPS, or browser connectors
- production secrets
- migration of existing client records
- changes to existing portal routes

## Canonical tenant boundary

Every tenant-owned business table must carry `organization_id UUID NOT NULL` and must be protected by PostgreSQL Row Level Security. Application code must set `app.current_organization_id` for every tenant transaction. Missing tenant context is fail-closed.

Platform-wide operations must use a separate privileged service identity and must never be reachable through tenant-facing request paths.

## Environment contract

Required logical environments:
- local
- development
- preview/test
- production

Each environment must have a distinct database and distinct credentials. Production credentials must never be used by local, preview, or CI workloads.

Expected secret names are documented only as names, never values:
- `DATA_FABRIC_DATABASE_URL`
- `DATA_FABRIC_DATABASE_URL_DIRECT`
- `DATA_FABRIC_ENVIRONMENT`
- `DATA_FABRIC_AUDIT_SIGNING_KEY`

## Migration policy

Migrations are forward-only in production. Every migration must:
1. be idempotent where practical;
2. avoid destructive operations unless preceded by a data-preserving migration;
3. include an acceptance query or test;
4. be exercised in preview/test before production;
5. record deployment metadata in `fabric.schema_migrations`.

## Backup / recovery baseline

Production database provider must support point-in-time recovery or equivalent continuous WAL backup. Minimum EA policy for the first production implementation:
- automated daily backup
- at least 30 days retention
- point-in-time recovery when provider supports it
- quarterly restore drill
- restore verification must use a non-production target
- database backup is not considered valid until a restore test succeeds

RPO/RTO targets for the first production implementation:
- target RPO: <= 24 hours at minimum, <= 15 minutes when PITR is enabled
- target RTO: <= 4 hours

These are platform targets, not contractual promises to ESR or any client until verified against the selected database provider.

## Health model

`fabric.health_check()` returns database time, environment, and tenant context. A readiness check is healthy only when the database is reachable and the expected migration version exists.

## Tenant isolation acceptance gate

Run 0 is accepted only when the fixture in `data-fabric/tests/tenant-isolation.sql` demonstrates:
- Organization A can read its own records;
- Organization A cannot read Organization B records;
- Organization B can read its own records;
- a request with no tenant context returns zero tenant rows;
- audit events retain the originating organization.

## Next run

Run 1 expands this foundation into the canonical domain model: people, households, programs, enrollments, services, grants, funding sources, expenditures, outcomes, evidence, and reporting requirements.