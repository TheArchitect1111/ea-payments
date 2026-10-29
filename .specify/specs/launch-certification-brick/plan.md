# Implementation plan

1. Reuse `scripts/launch-preflight.mjs`, `scripts/ea-preview-gate.mjs`, the module evidence contract, `scripts/run-lego-certification-evidence.mjs`, and the existing chassis registrar conventions.
2. Add a versioned capability catalog and two client manifests (TB3 and Amanda) that point to existing source/configuration and expose installed modules and mandatory evidence classes.
3. Add a deterministic engine that validates manifests, validates evidence identity/freshness, computes the sole certification decision, and writes JSON plus Markdown reports.
4. Register the runner as a chassis brick without treating its own readiness as a client certificate.
5. Add tests for fail-closed and cross-client behavior.
6. Add GitHub Actions triggers for PR/pre-release, deployment status, schedule, and on-demand use; preserve human approval gates and report failures as deduplicated issues.
7. Run the new tests and available existing chassis/TB3 safety checks; keep live checks explicitly blocked where credentials or owner/provider approval are required.
