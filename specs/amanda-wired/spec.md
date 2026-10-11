# Feature Specification: Amanda public-to-HQ wiring

**Request:** Repair the audited Amanda routes, click coverage, queues, payment tracking and billing setup.
**Project/tenant:** amanda-catherine, ea-payments and amanda-catherine wrapper
**Status:** Implementing

## Intent and scope
Preserve Amanda's approved content, assets, prices, waitlist status, free kit pickup/shipping and private $1 isolation. Connect every public/Classes CTA to the canonical registrar without manufacturing anonymous leads. Restore pathways and navigation, repair custom-domain routing, align applications with owner queues, and match verified Stripe purchases to tracking and HQ sales.

## Source of truth
Master ac6cbfce826a3316d6e646ed733e6e98db44bd5e; clients/amanda-catherine; lib/amanda-catherine; Amanda_Page_CTA_Audit; wrapper main ad6a0a3804be0d47a1cec432e6151f53e581876b.

## Protected invariants
SECURITY-MODEL.md; verified payment evidence before paid events; no new authentication bypass; no anonymous fake email registrations; no test events in live data; no course activation without readiness; other clients including Tarris preserved.

## Acceptance criteria
1. Homepage and Classes expose no untagged links/buttons and accept normalized click keys through Amanda brick-events and brickRegistrar.
2. Public pathway and Hub/Foundry/Calendar/Eva navigation resolves on both application and custom hosts.
3. Each named application enters its matching owner queue with submitted status and retained program context.
4. Public course and standalone kit Stripe paths carry/recover a stable registration identity, process signed paid events idempotently and expose verified purchases in protected HQ Sales.
5. Nervous System Reset resolves; Classes and brand navigation do not return to homepage or redirect-loop.
6. Unconfigured billing offers a working setup route. Loading/entitlement/approval guards remain.
7. Tests, build, source guard and existing production certification pass; live desktop/mobile, routing and tracking readback evidence recorded.

## Verification and rollback
Run npm test, focused Amanda regression tests, npm run build and relevant preview production gate. Verify anonymous analytics with event ID readback without exposing private contact data; payment test uses mocked signed provider fixtures or isolated preview test path. Never perform an unapproved real payment. Roll back to ea-payments dpl_Currj9yjKP9zTD2C1zoYADaYU6Fy and wrapper dpl_GMLStCxUVytE4hqmp1GzsHnsHY8J if tenant/payment/auth invariants regress.

## Completion evidence
Pending implementation, preview certification and production verification. Deployment registry must distinguish verified deployment from candidate source.
