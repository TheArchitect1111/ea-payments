# Amanda V3 read-only Airtable reconciliation

**Status: BLOCKED pending authoritative Airtable row-level comparison.**

Airtable is the configured live data source, using the `Organizations` and `Creative Studio` tables. The connected Airtable plugin's list of accessible bases does not expose that Creative Studio schema in the visible EA Payments & Clients base; therefore direct independent row-by-row reconciliation could not be completed using this connection. No Airtable records were changed.

Crucial implementation finding: `lib/amanda-catherine/registry.ts` calls `getStatusFromHardcode(key,p.status)`, which **overrides Airtable availability** based on a fixed owner-approved list, logging when Airtable differs. Thus the live CTA state cannot honestly be certified as a direct mirror of Airtable status. `getCTA` maps effective `AVAILABLE` to `Register` and other statuses (including `INQUIRY`) to `Join Waitlist`. The existing grid does not expose a `Request Info` class state. Do not modify source data or policy without separate authorization.

## Observed Preview cards (read only)

| Class | Displayed CTA | Displayed price |
|---|---|---|
| Advanced Body Sculpt | Join Waitlist | not shown |
| Wood Therapy | Register | CAD 997 |
| Non-Surgical BBL | Register | CAD 1,497 |
| LIFELINE LIVE | Join Waitlist | not shown |
| Body Sculpt Certification | Register | CAD 2,497 |
| Strategy Call | Register | CAD 249 |
| 90-Day Package | Join Waitlist | CAD 2,500 |
| Nervous System Reset | Register | CAD 997 |
| Foundry Mentorship | Join Waitlist | not shown |
| Clinical Fat Loss | Register | CAD 1,497 |
| Starter Kit | Join Waitlist | CAD 499 |
| The Entrepreneurial Artist | Join Waitlist | not shown |

The table above is from the observed rendered grid, not verified raw Airtable rows. Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39032849185/artifacts/12101570116 .

**Approval blocker:** Read the correct underlying base with authorized read-only access and reconcile raw `Payload JSON.status`, slug, price, and Square URL against each effective CTA. Resolve owner-policy-versus-Airtable precedence explicitly.
