# Chassis Production Certification

Canonical chassis: **23 modules**, promoted by the independent EA Production Gate.

- Certified production source: `c8d94286b7515d4e6d2dd38b3369e505cbcafa53`.
- Manifest-only production commit: `3c52b25da058a389ff0b607e812ba5fa6d6ebb92`.
- [EA Production Gate run 38149604351](https://github.com/TheArchitect1111/ea-payments/actions/runs/38149604351) PASS; [live production](https://ea-payments.vercel.app) READY.
- Certification manifest: `.ea/gates/latest.json`. Branch 23-module fixture proof: `docs/CHASSIS_100_PERCENT_CERTIFIED.md`.

## TB3 Bonfire add-on
The new `fix/tb3-bonfire-integration` branch contains a **candidate**, not a provider-certified live Bonfire order stream. Its signed preview adapter, canonical Billing payment reconciliation, Member read-back, TB3 sales dashboard and protected report are described in [TB3_BONFIRE_CERTIFIED.md](./TB3_BONFIRE_CERTIFIED.md).

Do not claim live Bonfire revenue, payout integration or deployment until Bonfire confirms a supported order feed, verifies signature/payload shape and a new production gate promotes the merge. No live payout was executed.
