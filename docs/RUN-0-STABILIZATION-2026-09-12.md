# Run 0 — Stabilization & Enforcement

Date: 2026-09-12

## Objective

Stop new reliability and governance debt before the EA data-plane migration. Run 0 changes must not redesign client experiences or introduce new product features.

## Verified findings

- GitHub `master` is currently unprotected and reports no required status checks at the branch layer. CI exists and is substantial, but repository-side enforcement is not active.
- The legacy Client Records `Temp Password` field contained one populated plaintext value. Run 0 cleared the value, verified zero populated values remain, and marked the field deprecated in Airtable. It must remain blank.
- Amanda course resources are already delivered through short-lived signed Vercel Blob URLs and a 307 redirect. The current source does not buffer resource files through the Next.js function.
- Vercel showed no Amanda resource-memory error and no reports-route runtime error during the six-hour Run 0 verification window.
- Historical reports failures overlapped with upstream Airtable/provider instability. Amanda Operations & Reports now degrades individual failed sources to empty data rather than allowing one rejected dependency to crash the whole panel.
- AI provider-health code already exists at `lib/ai/provider-health.ts`. Live telemetry proved that configured credentials do not necessarily mean a provider is operational; live provider-state work remains part of the durable reliability run rather than being misrepresented as complete here.
- The connected Vercel estate contains 24 projects. The canonical registry remains the authority for which surfaces are active, attention-required, repository-only, or historical.

## Run 0 changes

1. Generalized `config/production-protection.json` from an Amanda-only manifest to include the EA platform and Amplifi as protected production profiles.
2. Added production-protection verification as an explicit GitHub CI step before deployment verification.
3. Added the no-plaintext-password invariant to `SECURITY-MODEL.md` and recorded the completed Airtable cleanup.
4. Changed Amanda operational reporting to fail soft when one upstream source rejects.
5. Preserved the already-correct signed-Blob resource delivery path.

## Mandatory repository setting

Run 0 cannot truthfully certify repository enforcement until GitHub `master` is protected server-side. Required state:

- Require pull request before merge.
- Require the repository CI status check before merge.
- Block force pushes.
- Block branch deletion.
- Do not permit direct production changes that bypass the required CI path.

The connected GitHub administration surface available to this run can read branch protection but cannot write the branch-protection/ruleset setting. This is an external administrative control, not an application-code change.

## Acceptance rule

Run 0 is code-complete when its PR passes CI. Run 0 is fully governance-complete only when `master` reports `protected: true` with required checks enforced. Do not mark the governance item complete based only on documentation or the existence of CI.
