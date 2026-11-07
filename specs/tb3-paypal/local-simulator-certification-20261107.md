# TB3 PayPal local simulator certification - 2026-11-07

## Result

**PASS: local end-to-end sandbox simulation.** **NOT CERTIFIED: external PayPal sandbox or real database.** No deployment or production configuration change occurred. Existing Coming Soon deployment was not accessed or modified.

## Evidence

- Existing PayPal suite evidence is 30/30 passing (`specs/tb3-paypal/sandbox-resume-20261107.md`). It was not repeated.
- This run executed only the focused browser simulator case: 1/1 pass, 0 failures, 0 skips. Command:

  ```powershell
  node --require ./tests/fixtures/network-offline.cjs --import tsx --test --test-name-pattern="local sandbox simulator" tests/tb3-paypal.test.mts
  ```

- The browser loaded the checkout component and called loopback HTTP endpoints handled by `createPayPalHandlers`, the same handler factory exported through the Next.js route modules. The PayPal SDK, PayPal provider, signature verifier and ledger are deterministic local fixtures.
- Simulated order record persisted across requests and browser reload with `tenant=tarris`, `mode=sandbox`, expected merchant, subtotal plus `$5.00` fixture shipping, `$0` simulated tax, one PayPal order ID, one capture ID, `state=paid`, `fulfillment=simulated`, and no Printful ID.
- Duplicate create reused the original provider order; capture status retry and repeated signed completion webhook did not capture again or create another row. Forged signature, wrong order identity and authorization-token rejection returned failures without changing the paid record.
- The existing suite's saved 30-case evidence includes declined/pending payment, lost-response reconciliation, retry, cancellation/refund hold and concurrency business-state coverage. This focused test additionally exercises HTTP boundary failure behavior. No production suite was rerun.
- Browser network guard observed zero external browser requests. Printful request/quote counters remained zero. All storage was the test fixture's isolated in-memory ledger; no Supabase/local database rows were written.

The code has no separate entitlement subsystem for this physical merchandise checkout. The paid order ledger is the simulated entitlement/order record; manufacturing is explicitly simulated and creates no Printful order.

## Test harness correction

Expanded the existing browser acceptance with order/duplicate/failure assertions. Replaced the simulator provider's hard-coded one-row precondition with a check that the matching intent is committed before provider order creation. This preserves the ordering invariant while allowing the fixture to represent multiple independent orders. One intermediate focused run exposed this fixture assumption; the final focused run passed. No application runtime defect was found or changed.

## Outstanding verification

- Real PayPal sandbox app credentials, merchant ID, buyer eligibility and webhook registration are not configured in the inspected local/Preview environment.
- A real sandbox HTTPS origin and live webhook delivery have not been exercised.
- No real PostgreSQL connection, TLS pooler authentication, ledger migration execution or durable database persistence was tested here. Supabase catalog access previously showed the table and restricted role already exist, with forced RLS and least-privilege grants, but provenance/migration history is empty and is outside this local simulation.
- PayPal-hosted declined, pending, eligible-card and refund outcomes remain provider scenarios; only deterministic local failure fixtures and the existing offline service cases passed.

**Certification statement:** local simulated checkout/capture/webhook/order reconciliation PASS. Real PayPal sandbox certification remains BLOCKED pending authorized sandbox runtime configuration and provider-backed acceptance. Live PayPal and Printful ordering remain disabled/unverified; no Printful path ran.
