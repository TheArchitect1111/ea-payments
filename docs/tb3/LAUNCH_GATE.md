# TB3 Merchandise Launch Gate

Scope: TB3 personal-brand merchandise on tb3.online, Printful POD, Stripe Connect, Instagram. This is an acceptance plan, not evidence of completion.

## Technical acceptance
- [ ] PR #608 browser, sandbox, transport and chassis tests pass.
- [ ] Authorized staff run the live Printful audit in /portal/tarris/reports; require 14/14 products and 82 configured variants. Print files and sync identity do not establish print quality.
- [ ] Staff run private launch-readiness check; require merchant ready, Printful verified, and readyForRealOrderTest true.
- [ ] Verify mobile/desktop shopping, images, product links and disabled checkout until owner activation.

## External activation and financial proof
- [ ] Actual Tarris legal account owner completes Stripe Connect identity, charges, and payouts. Never substitute the EA platform Stripe account.
- [ ] Authorized owner adds a Printful billing method and verifies the proposed $500 working capital is actually accessible. Approval of funding is not receipt of funds.
- [ ] Confirm Printful cost limits from provider evidence and signed Stripe Connect webhook account scope.
- [ ] Authorize exactly one controlled real paid purchase; prove Stripe paid session, one Printful draft/confirmation, actual fulfillment charge, shipment and portal tracking.
- [ ] Authorized Instagram professional account owner connects Meta Commerce Manager, imports gated CSV at /api/tb3/merch/meta-catalog, and verifies website domain and shop catalog.
- [ ] Reconcile settled payouts, Printful charges, fees, taxes, refunds, loan receipt, reserve and safe repayment. No automatic loan repayment.
- [ ] Only after successful real-order acceptance and release approval: merge PR #608, deploy, and verify tb3.online and TB3 HQ in production.

## Safety
- No connected account, unverified Printful billing or stock, failed paid webhook, or Preview environment: do not collect customer payments.
- Do not advertise unverified inventory as in stock or charge a Printful card from tests.
- Keep Amanda and other clients isolated.

## Evidence boundaries
- GitHub tests and Preview certification are not a real settled payment or manufactured shipment.
- The Printful catalog audit requires authorized staff access and actual live provider credentials.
- Financial activation and Meta account access remain owner-controlled actions.
