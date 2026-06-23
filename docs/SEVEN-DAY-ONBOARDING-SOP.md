# 7-Day Client Onboarding SOP

## Purpose

This SOP makes the first week after payment visible, repeatable, and founder-leveraged.

The goal is not just to "start onboarding." The goal is that every new client feels supported, knows what happens next, has portal access, has a named owner, and reaches a first-value milestone without Robert personally tracking every detail.

## Success Standard

By the end of day 7, every paid client should have:

- Payment confirmed in Client Records.
- Portal access active.
- Welcome communication delivered.
- Onboarding owner assigned.
- Docs sent or signed.
- Kickoff/discovery path scheduled.
- First-value target documented.
- Next action, due date, and risk visible on the Client Delivery Board.

## Source Of Truth

Primary operating view:

- `/admin/delivery`

Primary Airtable table:

- Payments base -> Client Records

Minimum fields used today:

- `Client Name`
- `Email`
- `Organization`
- `Package Purchased`
- `Amount Paid`
- `Payment Received At`
- `Portal Access Status`
- `Onboarding Status`
- `Lifecycle Stage`
- `Discovery Status`
- `Build Status`
- `Launch Status`

Recommended next fields:

- `Delivery Owner`
- `Backup Owner`
- `Next Action`
- `Next Action Due`
- `Client Health`
- `Blocked Reason`
- `Last Client Touch`
- `Next Client Touch`
- `First Value Target`

## Roles

| Role | Owns |
| --- | --- |
| Delivery Owner | Daily onboarding progress, next action, client communication |
| Backup Owner | Coverage if owner is unavailable |
| Architect | Strategic interpretation, first-value target, high-value client guidance |
| Ops/Admin | Portal access, records, email/docs verification |
| Automation Owner | Make, eSign, Stripe, Resend, Airtable workflow failures |

Robert should act as Architect, not default coordinator.

## Day 0: Payment Received

Trigger:

- Stripe payment creates or updates Client Records.
- Portal access is provisioned.
- Welcome email is sent.
- Make onboarding webhook starts.

Checklist:

- Confirm Client Record exists.
- Confirm `Amount Paid` and `Payment Received At`.
- Confirm `Portal Access Status`.
- Confirm `Onboarding Status` is `Not Started` or `In Progress`.
- Confirm lifecycle defaults:
  - `Lifecycle Stage = Onboarding`
  - `Build Status = Not Started`
  - `Launch Status = Not Scheduled`
- Assign Delivery Owner.
- Create first internal note: "Payment received. Owner assigned. First-week onboarding started."

Client outcome:

- Client knows payment was received.
- Client knows they are not carrying the next step alone.

Escalate if:

- No Client Record exists within 15 minutes.
- Portal access is not provisioned.
- Welcome email fails.
- Make webhook does not run.

## Day 1: Welcome And Access

Checklist:

- Verify client can log in or has credentials.
- Send welcome confirmation if automated email was missed.
- Confirm best contact and organization name.
- Confirm package purchased and expected onboarding path.
- Set first client touchpoint.
- Move `Onboarding Status` to `In Progress` if not already set.

Client outcome:

- "I know where everything lives and what happens next."

Escalate if:

- Client cannot access portal.
- Email bounced.
- Package or scope is unclear.

## Day 2: Context And Docs

Checklist:

- Send MSA/SOW or required onboarding docs.
- Update `Onboarding Status = Docs Sent`.
- Populate `Docs Sent At` if available.
- Collect missing context needed for first-value work.
- Confirm kickoff/discovery scheduling path.

Client outcome:

- "The formal start is moving and I know what is needed from me."

Escalate if:

- Docs are not sent by end of day 2.
- eSign template or Make scenario fails.
- Client has not received access or welcome communication.

## Day 3: Discovery And First-Value Target

Checklist:

- Confirm discovery/kickoff is scheduled or completed.
- Define the first-value target:
  - What stress will be reduced first?
  - What time will be saved first?
  - What uncertainty will be removed first?
  - What should feel lighter by day 14?
- Capture client constraints, urgency, and decision owner.
- Update `Discovery Status`.

Client outcome:

- "EA understands what I need relief from first."

Escalate if:

- Discovery is not scheduled.
- No first-value target is documented.
- Client expectations do not match package scope.

## Day 4: Internal Build Plan

Checklist:

- Translate discovery into first deliverable.
- Set `Build Status = In Progress` when work begins.
- Identify dependencies:
  - client content
  - login credentials
  - assets
  - approvals
  - technical access
- Add blocked reason if any dependency is missing.
- Confirm next action and due date on the delivery board.

Client outcome:

- "There is a concrete plan and I know what I need to provide."

Escalate if:

- Required client materials are missing.
- Scope has expanded beyond package.
- Delivery owner cannot identify the first milestone.

## Day 5: First Progress Signal

Checklist:

- Deliver a small visible progress signal:
  - portal update
  - Pulse item
  - first draft
  - first workflow confirmation
  - first recommendation
  - first captured opportunity
- Send short client update:
  - what happened
  - what is next
  - what is needed from client
- Log client touchpoint.

Client outcome:

- "Something is happening and I do not have to chase it."

Escalate if:

- No visible progress can be shown.
- Client has not responded to required input.
- Work is waiting on founder-only context.

## Day 6: Risk And Support Check

Checklist:

- Review delivery board for risk:
  - portal not active
  - onboarding older than 7 days
  - no owner
  - no next action
  - no due date
  - awaiting client
- Check content requests and enhancement requests for the client.
- Confirm support path is clear.
- Prepare any items for Architect Review.

Client outcome:

- "Nothing is invisible or falling through the cracks."

Escalate if:

- Client is blocked.
- Client has urgent support request.
- Any status is stale.

## Day 7: Client Success Checkpoint

Checklist:

- Confirm first-week outcome:
  - access
  - docs
  - kickoff/discovery
  - first-value target
  - first progress signal
- If docs are signed and build is ready, move:
  - `Onboarding Status = Complete`
  - `Lifecycle Stage = Build`
- If not complete, document blocked reason and next action.
- Schedule Architect Review or next client success review.

Client outcome:

- "I know where things stand, what progress has been made, and what is next."

Escalate if:

- Client is still in onboarding with no clear next action.
- Owner is unassigned.
- Client has not received a meaningful update.

## Daily Operating Cadence

Every business morning:

1. Open `/admin/delivery`.
2. Review `critical` and `high` risk rows first.
3. Confirm every active client has:
   - owner
   - next action
   - due date
   - current status
4. Update stale Client Records.
5. Send client updates where needed.
6. Escalate anything blocked for more than one business day.

## Weekly Operating Cadence

Every week:

1. Review all active clients.
2. Confirm each has a current milestone.
3. Confirm each had a touchpoint or visible progress signal.
4. Review support/content/enhancement queues.
5. Prepare Architect Review inputs.
6. Identify founder-dependent decisions and convert them into rules.

## Status Movement Rules

| Situation | Field update |
| --- | --- |
| Payment received | `Lifecycle Stage = Onboarding`, `Onboarding Status = Not Started`, `Build Status = Not Started` |
| Owner starts onboarding | `Onboarding Status = In Progress` |
| Docs sent | `Onboarding Status = Docs Sent`, populate `Docs Sent At` |
| Docs signed | `Onboarding Status = Docs Signed`, populate `Docs Signed At` |
| Onboarding complete | `Onboarding Status = Complete`, `Lifecycle Stage = Build` |
| Build starts | `Build Status = In Progress` |
| Waiting on client | `Build Status = Awaiting Client` |
| Ready to launch | `Build Status = Ready For Launch`, `Launch Status = Scheduled` |
| Launched | `Launch Status = Launched`, `Lifecycle Stage = Adoption` |

## Escalation Rules

Escalate to the Automation Owner when:

- Stripe payment did not create/update Client Records.
- Welcome email failed.
- Make webhook failed.
- eSign docs did not send.
- Portal access failed.

Escalate to the Architect when:

- First-value target is unclear.
- Scope is ambiguous.
- Client expectations are misaligned.
- A strategic recommendation is needed.

Escalate to Delivery Owner/Backup Owner when:

- No next action exists.
- Due date is missed.
- Client has not had a touchpoint within the expected window.

## Scale Readiness Test

EA is ready to accept 10 clients in one week when:

- Every active client appears on `/admin/delivery`.
- Every row has a named owner.
- No row has an empty next action.
- No row has onboarding older than 7 days without a blocked reason.
- Portal access gaps are resolved within one business day.
- Clients receive a progress signal by day 5.
- Weekly review can be run without Robert manually reconstructing status.
