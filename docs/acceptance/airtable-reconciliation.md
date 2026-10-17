# Amanda V3 Airtable-driven availability: reconciliation record

## Implementation outcome

**Per-class hardcoded status override REMOVED.** In `lib/amanda-catherine/registry.ts` the `Creative Studio` course record's `Payload JSON.status` is passed directly through `getAvailabilityFromAirtable(p.status)`. Only status vocabulary translation is allowed: `AVAILABLE` or `READY` to **Register** (checkout), `WAITLIST` or `NOT READY` to **Join Waitlist**, and `INQUIRY` to **Request Info**. Invalid or missing statuses reject rather than guessing. No hardcoded class slugs or prices are used to determine availability.

The public grid renders 12 Airtable-derived class records successfully with the following distribution: six Register, five Join Waitlist, one Request Info. Preview: https://amanda-catherine-4-ofrgdpjwq-the-architects-projects-cc813778.vercel.app .

| Airtable `Payload JSON.status` | Canonical status | UI CTA | Destination |
|---|---|---|---|
| AVAILABLE / READY | AVAILABLE | Register | Existing record's `square_checkout_url` |
| NOT READY / WAITLIST | WAITLIST | Join Waitlist | Existing `/courses/[slug]#waitlist` |
| INQUIRY | INQUIRY | Request Info | Amanda's existing `/amanda-catherine#contact` |

### Observed CTA mapping (12 rendered records)

Register: Wood Therapy; Non-Surgical BBL; Body Sculpt Certification; Strategy Call; Nervous System Reset; Clinical Fat Loss.

Join Waitlist: Advanced Body Sculpt; LIFELINE LIVE; 90-Day Package; Foundry Mentorship; The Entrepreneurial Artist.

Request Info: Starter Kit.

Source code and live-rendered behavior establish a direct source-to-CTA mapping. **Independent raw Airtable row-level verification remains unavailable** because the connected Airtable account does not expose the app's `Creative Studio` source base. This is a limitation of evidence, not a return to hardcoded status. No Airtable records have been modified.

**Reconciliation decision:** Source-to-CTA rule and actual Preview rendering PASS. Independent field-by-field cross-check DEFERRED/BLOCKED until read-only access to the correct Airtable base is supplied. Do not claim full independent reconciliation PASS based solely on rendering.

Evidence: https://github.com/TheArchitect1111/ea-payments/actions/runs/39033783118 and https://github.com/TheArchitect1111/ea-payments/actions/runs/39033958937 .
