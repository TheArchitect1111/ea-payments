# Amanda V3 checkout and destination routing

**Read-only browser check.** No charges, bookings, registrations, or notifications were sent.

| Type | Class | Observed link | Result |
|---|---|---|---|
| Register | Wood Therapy | `https://checkout.square.site/merchant/ML66P9AHCJ025/checkout/HKOOTIHYWSOICFQLLKBUD4FV` | Square checkout loaded HTTP 200; rendered grid displays CAD 997; independent Square-side pricing not proven |
| Waitlist | Advanced Body Sculpt | `/courses/advanced-body-sculpt#waitlist` | HTTP 200, no form submission |
| Request Info | none currently rendered | N/A | **Not testable:** class CTA policy has no Request Info state; `INQUIRY` routes to waitlist |
| Jane booking | Jane | `https://aesthetikine.janeapp.com/#/discipline/1/treatment/2` | HTTP 200, no booking |
| Shared EA client smoke | TB3 | `https://tb3.online` | HTTP 200; this is a public-homepage check, not full shared-component regression |

Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39032849185/artifacts/12101570116 . For accurate price reconciliation, source Airtable row and Square checkout line item must be independently compared.
