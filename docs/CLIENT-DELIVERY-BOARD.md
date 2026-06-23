# Client Delivery Board

Admin route:

- `/admin/delivery`

## Purpose

The Client Delivery Board is the daily operating view for active clients. It is designed to answer:

- Who is active?
- Who owns the next action?
- Which clients are stuck?
- Who lacks portal access?
- What is due next?
- Which handoffs need attention before clients have to ask?

## Current Inputs

The board reads from Airtable Client Records through existing fields:

- `Client Name`
- `Organization`
- `Email`
- `Package Purchased`
- `Amount Paid`
- `Payment Received At`
- `Portal Access Status`
- `Onboarding Status`
- `Lifecycle Stage`
- `Discovery Status`
- `Build Status`
- `Launch Status`

## Computed Signals

| Signal | Logic |
| --- | --- |
| Active clients | Paid clients or records in delivery lifecycle |
| Age | Days since `Payment Received At`, falling back to Airtable created time |
| Portal gaps | `Portal Access Status` is not `Active` |
| Stalled onboarding | More than 7 days old and `Onboarding Status` is not `Complete` |
| Next action | Computed from portal, onboarding, build, and launch status |
| Risk | Critical if onboarding is stale; high for portal/not-started onboarding; medium for docs/build handoffs |

## Required Next Upgrade

The board currently exposes that all clients are `Unassigned` because Client Records does not yet have a delivery owner field.

Add these fields next:

- `Delivery Owner`
- `Backup Owner`
- `Next Action`
- `Next Action Due`
- `Client Health`
- `Blocked Reason`
- `Last Client Touch`
- `Next Client Touch`
- `First Value Target`

Once these exist, the board should move from computed/read-only to source-of-truth delivery management.

## Daily Use

1. Open `/admin/delivery`.
2. Work critical and high risk rows first.
3. Confirm portal access, onboarding status, owner, next action, and due date.
4. Update Client Records.
5. Send client updates before clients have to chase.

## Related

- `docs/SEVEN-DAY-ONBOARDING-SOP.md`
- `docs/IMAGINE-POSSIBILITIES-TRANSFORMATION-PLAN.md`
- `docs/LAUNCH-READINESS-MODEL.md`
