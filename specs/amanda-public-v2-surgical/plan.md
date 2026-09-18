# Implementation Plan: Amanda public V2 surgical update

Constitution and SECURITY-MODEL read. Preview-only user scope supersedes production deployment steps.
Architecture: preserve the public page and reuse its cards/style; isolated inquiry endpoint with fixed Amanda recipient, schema validation, same-origin check, honeypot and preview dry-run; no changes to owner portal or existing payment APIs.
Sequence: inspect baseline/assets; implement; validate changed source and dry-run form; build/deploy preview; compare rendered desktop/mobile and source invariants; record pending integrations.
