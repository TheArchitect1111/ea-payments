# Scrapling Integration

EA uses Scrapling as an adaptive production inspection layer behind the Spec Kit governance and existing deployment gates.

Pinned version: `scrapling==0.4.15`.

## Purpose

Scrapling does not build or deploy client sites. It verifies deployed public surfaces and preserves selector memory so checks can relocate required elements after safe layout or DOM changes.

The inspector also reports repeated image sources, missing required selectors/text, undersized responses, and image-count regressions.

## Components

- `requirements-scrapling.txt` pins the reviewed Scrapling release.
- `scripts/ea_scrapling_inspector.py` performs adaptive inspection and emits machine-readable evidence.
- `config/ea-scrapling-manifest.json` defines monitored production targets and acceptance rules.
- `.github/workflows/scrapling-inspector.yml` self-tests the adaptive engine on pull requests and runs production inspection hourly/on demand after merge.

## Adaptive memory

Scrapling stores learned element properties in SQLite. GitHub Actions caches `.ea/scrapling-state` between production runs so selector memory survives ephemeral runners. A direct selector match refreshes the stored element. If the direct selector later fails, Scrapling attempts adaptive relocation using the saved identifier.

## Failure behavior

A failed production inspection exits non-zero, uploads `artifacts/scrapling/report.json`, and opens or updates a GitHub incident. It does not silently modify production and it does not bypass EA security, deployment, or approval rules.

## Relationship to Spec Kit

Spec Kit defines what must be true. Scrapling supplies additional deployed-page evidence about whether selected production invariants remain true. A Scrapling failure therefore prevents a production state from qualifying as VERIFIED/DONE when the failed rule is part of the active specification.
