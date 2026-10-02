# Amanda Production Launch Report

**Date:** 2026-10-02  
**Status:** 🟢 Production launch ready  
**Production host:** https://efficiencyarchitects.online/amanda-catherine

## Promotion record

- Amanda launch work is merged to `master`. The final application fix is `6aa44354f6903bfda37496d1f75189ed0da6e17c`; production gate metadata is `2032ff1fd071cdcdc669eb80e8c586f69824cdb2`.
- PRs #483–#489 delivered the launch repairs. Key fixes corrected the manually triggered gate inputs, production image loading/viewport checks, the practitioner kit test contract, and the health check’s canonical owner route and response body.
- PR #490 merged this report, removed a stale TODO from Amanda’s approved free-shipping source of truth, and labeled the earlier review-only audit as historical.
- Production deployment `dpl_Giv5Bdx8oKuXb7jFZhMHuiMLSyTS` is Vercel `READY`, targets `production`, and is aliased to `efficiencyarchitects.online`.
- Gate run #15, for exact source commit `6aa44354f6903bfda37496d1f75189ed0da6e17c`, passed source identity, build, assets, desktop/mobile visuals, functional checks, and visual critic. Desktop and mobile had 11 loaded visuals, no broken images, failed requests, console/page errors, or overflow.
- Production checks observed during the promotion: Amanda login health returned HTTP 200 with all checks true; final acceptance returned HTTP 200 with `tripleChecked: true`; public menu and both primary product images returned HTTP 200. I also opened the production host and confirmed the published menu, courses, kit, pricing, and Jane booking handoff are rendered there.

## Verification areas

| Area | Result | Evidence and scope |
|---|---|---|
| A. Shipping | **PASS WITH WORKAROUND** | Shipping is explicitly free for pickup and ship-to-me. Amanda’s kit flow captures the address and preserves payment/tenant validation; the targeted kit shipping contract test passed. Fulfillment uses an owner-operated packing/tracking workflow. No postage label is fabricated or charged; the owner chooses postage and records tracking. |
| B. Mentorship scheduling | **PASS WITH WORKAROUND** | The production menu clearly hands appointment booking and management to Amanda’s Jane App, the approved scheduling system. The handoff is live. The application does not own appointment records or execute create/reschedule/cancel, timezone, and conflict rules; those operations remain in Jane. No real appointment was created or changed during validation. |
| C. Live menu certification | **PASS** | Exact-source production gate passed all seven checks. Live host rendered the published Amanda content and Canadian RIMAN destination, approved course names/prices, READY enrollments, NOT READY waitlists, kit, and Jane handoff. Menu visuals and images passed desktop and mobile asset/function checks. |
| D. Repository-wide checks | **PASS WITH WORKAROUND** | `npm run lint` passed with 0 errors and 276 existing warnings. Amanda-targeted contract tests passed, and the official production gate’s install/build/functional checks passed. This repository defines no `npm test` or `typecheck` script. A direct `npx tsc --noEmit` run still reports 342 existing diagnostics outside Amanda; no Amanda diagnostic was identified. The configured release gate is green, but that baseline type-check debt remains visible rather than suppressed. |

## Checks, fixes, and limits

- The production health check initially returned 503 because it compared a valid redirect with the wrong owner path and inspected the response for a different route. The check now validates `/portal/amanda-catherine/owner` and inspects that authenticated response. The final production health and acceptance endpoints passed.
- The browser gate originally reported false image failures because it examined lazy images before scrolling/decoding them, and it found an 8 px horizontal overflow. The gate now waits for image decode and the Amanda page resets the body margin/overflow. The final gate reports zero broken images and zero overflow on both viewports.
- The public smoke was read-only. I did not accept legal terms, create a production account, create an appointment, place a paid order, send real email, or generate a carrier label. The page, health endpoint, release-gate browser journey, course and waitlist routing, and fulfillment contracts were checked without those side effects.
- No production secrets or feature flags were changed. The production health endpoint verified the required Amanda service checks using the already-configured production environment.

## Launch decision

**Production promotion is complete and the live service is launch ready.** Shipping and mentorship are launchable through their documented owner/Jane handoffs. The direct repository type-check remains a pre-existing non-Amanda debt; it is not hidden by this report, and the configured production gate/build and lint remain green.
