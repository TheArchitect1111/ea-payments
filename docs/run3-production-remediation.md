# EA Run 3 Production Remediation

Date: 2026-09-11
Status: BLOCKED FROM PRODUCTION PROMOTION

Run 3 production proof found material runtime blockers on the shared EA platform. This branch exists to remediate them without modifying production until the normal EA production gates pass.

## P0 durability

1. Creative Studio / Factory Airtable persistence
   - Production logs show repeated `Payload JSON cannot accept the provided value` and `Airtable upsert returned empty` failures.
   - The Creative Studio schema currently exposes Payload JSON as multiline text, and the persistence adapter serializes payloads before upsert. The exact failing payload/adapter behavior must be reproduced and fixed before promotion.
   - Add bounded retry/backoff for Airtable 429 responses and avoid queue amplification.

2. Factory queue
   - Do not repeatedly process jobs whose durable context cannot be persisted.
   - Fail closed or park the project with actionable state rather than retrying indefinitely.

## P0 client reliability

3. `/portal/[slug]/reports`
   - Fix undefined `.length` access and add regression coverage for empty/missing collections.

4. `/api/portal/amanda/resources/[resourceId]`
   - Remove the memory-heavy response path that is exhausting Vercel function memory.
   - Stream or redirect large resources from durable object/blob storage rather than buffering them in the function.

## P0 AI provider readiness

5. Amplifi / AI execution
   - Production evidence includes exhausted OpenAI quota, Vercel AI Gateway payment verification failure, and invalid Claude API key events.
   - AI-dependent routes must report provider readiness clearly and fail gracefully.
   - No Amplifi autonomous-production acceptance until at least one production provider path passes the failover smoke test.

## Acceptance gates

Before merge/promotion:
- lint and build pass
- production-protection contracts pass
- reports regression passes
- Amanda resource delivery proves bounded memory behavior
- Factory durable write test passes against Airtable
- Factory queue does not spin on persistence failure
- AI failover smoke has one healthy provider
- preview gate passes desktop/mobile/assets/functionality
- post-deploy runtime errors are rechecked

No production changes are authorized by this document alone. Promotion must use the existing EA Production Gate.