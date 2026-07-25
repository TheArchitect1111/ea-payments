# NOW

Last updated: 2026-07-21

## Objective

Stabilize and launch Version 1 (Website + Guided Project Experience). Prefer consolidation over stack expansion.

## Stack freeze

- Canonical inventory: [EA-Core-Technology-Stack.md](./EA-Core-Technology-Stack.md)
- Before any new tool: [INTEGRATION-GATE.md](./INTEGRATION-GATE.md)
- Optional/future providers: `lib/platform/launch-provider-catalog.ts` (health via `/api/health/ops`)

## Verified baseline

- Canonical working repository: `TheArchitect1111/ea-payments`.
- Branch: `master`; baseline commit: `d48f439`.
- Vercel linkage observed locally: project `ea-payments` (`prj_u7zAr2vz8bLLC4s77xlU5FnB8VTM`).
- Package name: `simplifi`.
- Safety checkpoint: local branch `checkpoint/ea-ecosystem-preflight-2026-07-12`, commit `2fd6465`.
- Preserved pre-existing change: `lib/capture-records.ts`.

## In progress

- Commercial TEST money-loop (blocked on local `sk_test` + Resend).
- Fail-closed tenant roles and membership fallback.
- Registry-driven repository inventory and focused tests.

## Next (after stack freeze)

1. Complete TEST commercial certification (blocked on `sk_test` + Resend).
2. ~~Simplify Mission Control / Command Center (less is more)~~ — done on `/admin/master`.
3. Amplifi Communications + Postiz engine — deferred product sprint.
4. **Amplifi + Magnifi portal-ready** — Phases 0–5 complete (`docs/AMPLIFI-MAGNIFI-PORTAL-READY-BUILD.md`); next = Phase 6 ops & support gate. Deploy local Phase 2–4 polish when ready for copy/warning parity.

## Review gate

Stop after documentation, focused tenant-safety changes, and checks. Do not rename repositories/projects, move major folders, change production configuration, delete data, or deploy until a reviewer approves a new checkpoint.
