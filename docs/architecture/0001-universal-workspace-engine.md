# ADR-0001: Universal Workspace Engine

Status: Proposed for review
Date: 2026-07-12

## Context

The repository already contains reusable portal and premium chassis packages, a module registry, organizations, memberships, entitlements, RBAC, an AI gateway, and EA Intelligence. Product naming is fragmented, but splitting or renaming now would increase risk.

## Decision

Treat this repository as the current integration foundation and evolve a Universal Workspace Engine inside it. The engine is a tenant-safe composition layer: authenticated identity resolves to a persisted organization and membership; entitlements select modules; the registry composes navigation and capabilities; intelligence receives the same tenant context.

Canonical flow: `identity -> organization -> membership/role -> entitlements -> module registry -> workspace services`.

## Guardrails

- No implicit owner role.
- No privileged persistence using synthetic organization IDs.
- One documented tenant context at service boundaries.
- Product brands remain presentation/configuration concerns until an approved extraction decision.
- External repositories are consumers or references only after verification.

## Consequences

This preserves existing foundations and enables incremental hardening. It does not resolve naming, auth-realm consolidation, or data migration; those require separate ADRs and reviewed checkpoints.
