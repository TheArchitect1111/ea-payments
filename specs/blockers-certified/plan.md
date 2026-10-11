# Implementation Plan

## Constitution check
Approved branch-only scope, authoritative contracts, no production edits, tenant boundaries and rollback captured in spec.md.

## Architecture
Shared durable module install receipts and access guard. Add Calendar and Discovery storage services. People installer uses existing Postgres repository and flags. Foundation invokes these installers for admitted selections. Preview provisioning endpoints use fixed fixture tenant names and admin authorization.

## Sequence
Audit sources; implement storage and guarded routes; exercise real services through isolated ports; verify UI/build/security; generate exact-source evidence; push and verify branch preview. Do not promote production.

## Risk
Optional external calendars and People Postgres require valid deployed configuration. Provider failures remain blockers to individual tenant installs. Multi-table Airtable writes are not transactional; incomplete installs remain incomplete. Distributed email delivery is not claimed exactly-once.
