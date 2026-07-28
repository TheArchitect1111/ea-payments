# Simplifi OS Certification Harness

**Purpose:** Permanent release gate for the Personal Opportunity Operating System.  
**Harness version:** 1.0.0  
**Reports:** `prototypes/simplifi-os-cert/latest.json` + `history/cert-*.json`

## Commands

```bash
# Full certification (shadow-safe; flags stay off)
npm run cert:simplifi-os

# Gate mode — exit 1 unless CERTIFIED or CERTIFIED WITH WARNINGS
# Also fails on ≥5 point overall score regression vs prior report
npm run cert:simplifi-os:gate
```

## Metadata recorded every run

- Git commit SHA / short / branch / dirty
- Build name + version (`package.json`) + Node version
- Latest Supabase migration filename
- Enabled Simplifi OS feature flags
- Env presence (Supabase / OpenAI / CRON_SECRET) — never secret values
- Validation timestamp
- Harness version

## Subsystem scores (weighted → overall 0–100)

| Subsystem | Weight | Covers |
|-----------|--------|--------|
| Functional | 28% | Memory events, Ask, embeddings, detectors, Brief merge |
| Security | 22% | Session auth, slug isolation, RPC portal filter, service-role, cron, flags |
| Performance | 15% | Non-blocking capture, detector/ask latency, timeouts, workflow separation |
| Reliability | 15% | Retries, idempotency, fingerprint upsert, graceful degrade, shadow OS_READ |
| Intelligence | 20% | Grounding, unsupported refuse, precision/recall, evidence, dup rate |

## Classification

| Result | Rule |
|--------|------|
| **CERTIFIED** | overall ≥ 90 and zero blocking fails |
| **CERTIFIED WITH WARNINGS** | overall ≥ 75 and zero blocking fails |
| **NOT CERTIFIED** | otherwise |

## Release policy

1. **Every internal release** — `npm run cert:simplifi-os:gate` must pass.
2. **Every production release** — same gate; additionally dogfood live probe when enabling `SIMPLIFI_SEMANTIC_ASK` / `SIMPLIFI_BRIEF_INTEL`.
3. **Shadow mode** — keep `SIMPLIFI_OS_READ` unset. Live semantic/LLM latency checks are `SKIP` until flags + Supabase + OpenAI are configured on a dogfood tenant.
4. **Regressions** — gate fails if overall score drops ≥ 5 points vs the previous history entry.

## Recommendation mapping

| Classification | Activation stance |
|----------------|-------------------|
| CERTIFIED | Ready for internal activation *after* dogfood flag enablement |
| CERTIFIED WITH WARNINGS | Remain in shadow — clear warnings first |
| NOT CERTIFIED | Remain in shadow — fix blocking failures |
