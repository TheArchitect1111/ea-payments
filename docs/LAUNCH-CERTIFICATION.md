# EA Launch Certification

`launch-certification` is registered in `src/chassis/BrickInterface.ts` and wired through `src/chassis/runClickTest.ts`. Its chassis socket health means the runner is present; it never means a client deployment is certified. The authoritative decision is produced by `scripts/launch-certification.mjs` and `lib/launch-certification/engine.mjs`.

## Run it

```sh
npm run launch:certification -- --client=tarris
npm run launch:certification -- --client=amanda
npm run launch:certification -- --client=all
```

For a preview, provide the exact URL and environment:

```sh
EA_CERTIFICATION_ENVIRONMENT=preview npm run launch:certification -- --client=tarris --base-url=https://your-preview.example
```

Reports are written to `artifacts/launch-certification/<client>.json` and `.md`. A nonzero exit status means at least one client is `NOT CERTIFIED`; missing, stale, mismatched, pending-approval, and unverified evidence fail closed.

## Client capability manifests

`config/launch-certification/capabilities.json` defines mandatory checks by capability. `config/launch-certification/clients.json` is the client-to-installed-capabilities and route registry. Each website client must declare `publicFormRoutes`, the exact public route(s) where its public forms should render. Add or remove capabilities there only after confirming the client's installed modules and source-of-truth files. The engine evaluates only the checks attached to that client's installed capabilities. It validates duplicate IDs, unknown capabilities, missing source files, incomplete deployment identity, and missing form routes.

To supply reusable evidence, pass an evidence array through `--evidence-file=path.json` (a JSON array or `{ "records": [] }`). Each item must contain `checkId`, `status`, `sourceCommit`, `environment`, an ISO timestamp, and a nonempty `evidenceRef`. The runner imports `scripts/ea-preview-gate.mjs` reports from `artifacts/ea-gate/` only when each required configured route has an exact source/environment/deployment match. That gate can prove responsive rendering and asset health; it cannot prove accessibility, SEO, performance, portal authorization, durable writes, provider authorization, or live commerce. The current runner generates commit-bound public-route evidence only when the deployment build-info endpoint proves its commit and environment. It does not infer authenticated behavior from HTTP 200 responses.

The workflow also runs `scripts/launch-browser-audit.mjs` against configured website routes and each client's explicit public-form routes. It checks accessible internal link names and destinations, form structure and labels, axe-core WCAG 2.0 A/AA and WCAG 2.1 AA rules, title/description/canonical/H1/indexability, and desktop/mobile DOMContentLoaded, LCP, and CLS thresholds. It preserves accessibility selectors and failure summaries for repair triage. It also probes the configured portal route without a user session and can prove only anonymous denial. Evidence is tied to build identity including a real deployment ID, commit, environment, timestamp, and the `website-audit.json` artifact. The performance sample is a lab measurement and does not replace production field monitoring.

Form structure passing does not count as a successful form check: without a configured safe test submission and receipt, the form check stays `unverified`. The auditor never submits forms, opens checkout, or invokes a write endpoint. Broken links, missing accessible names, missing anchors, SEO gaps, accessibility violations, and performance threshold breaches fail their relevant check.

The existing responsive evidence now verifies the final browser URL for both desktop and mobile. A redirect away from a configured private portal route cannot pass as evidence that the portal itself rendered responsively. The engine requires a full source SHA, HTTPS deployment URL, and exact deployment ID for any certificate. Production also requires a 64-character critical configuration fingerprint. `verifyCertificateBinding()` invalidates a previous certificate when the current deployment binding changes. A persistent deployment-certificate registry and an installed pre-promotion consumer are not configured in this repository, so the validator exists but a durable cross-run certificate status/promotion service remains outstanding.

Production evidence also requires a deployment ID and a `criticalConfigurationFingerprint` from the deployment identity endpoint or the non-secret `EA_CRITICAL_CONFIG_FINGERPRINT` environment variable. The binding fingerprint changes with client, deployment, source commit, installed capabilities, and critical configuration fingerprint. Reports are immutable per workflow run; only a fresh report matching the current deployment binding is current evidence.

## Automatic runs and gates

`.github/workflows/launch-certification.yml` runs on relevant pull requests, successful deployment events, daily, and manual dispatch for one or all clients. It reuses the existing LEGO certification contract/evidence runner, chassis guard, project regression suite, and `scripts/ea-preview-gate.mjs` browser checks, then adds the reusable public website audit. Reports are uploaded as workflow artifacts. A `NOT CERTIFIED` result fails the workflow check.

Configure the `EA Launch Certification / certify` check as a required status check in repository rules if it must block merge or release promotion. This change does not edit branch protection or Vercel production gates. A failed result creates or updates one open issue per affected client, classifies the failure for triage, and includes the run/report link.

## Repair limits

No executable code-repair agent is configured in this repository workflow. The workflow opens or updates a repair issue and explicitly records that limitation. An engineer must make a fix on an isolated branch, add regression evidence, and rerun certification. The PR review and production approval path remains in force.

## Evidence boundary

The first live TB3 evaluation read `/api/ops/build-info`, `/tarris`, and `/tarris/future` without writing data or starting a purchase. The routes responded HTTP 200 on source commit `6997358f5bd0655ae0720ef827538e71fc81d635`. This proves route reachability only. TB3 remains `NOT CERTIFIED` until all installed-capability checks have current evidence and outstanding owner/provider approvals are resolved. Current known blockers include Stripe authorization, Printful funding and live fulfillment/shipping verification, Instagram commerce setup/synchronization, purchase confirmation delivery, authenticated HQ roles and tenant isolation, and the production configuration fingerprint.
