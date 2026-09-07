# Eva Client Enhancement Engine

## Product rule
Eva is the single front door for website changes. Routine content updates remain included. Requests beyond the client's included update privileges become paid enhancements.

## Transaction flow
1. Client describes the desired outcome to Eva.
2. Eva classifies the request as included, paid recipe, or EA review.
3. Paid recipes receive a fixed price before work begins.
4. Client sees scope, exclusions, exact price, and Approve & Pay.
5. Payment authorizes execution. It does not authorize unsafe production changes.
6. Auto-executable recipes create a production snapshot and staging change.
7. Automated QA must pass before publication.
8. Successful work publishes and creates a rollback point.
9. Client and EA receive completion notifications.
10. Failed QA stops publication, preserves the current live site, and creates an EA exception notification.

## Safety gates
Never auto-execute authentication, security, DNS/domain, destructive page deletion, novel payment logic, or arbitrary production code. These require EA review even after payment.

## Pricing v1
- Standard section: $99
- Standard page: $149
- Existing form/workflow modification: $149
- New standard form/workflow: $249
- Checkout/payment configuration modification: $249, EA review
- Integration: $399, EA review
- Standard portal feature: $399, EA review
- Major redesign/custom functionality: custom quote

Prices are versioned business rules. Change them from the catalog rather than scattering amounts through UI code.

## Auto-execution contract
A recipe can auto-publish only when all are true: known recipe, fixed scope, payment confirmed, required inputs present, staging execution succeeds, automated functional checks pass, visual regression is within tolerance, protected infrastructure is untouched, and a rollback point exists.

## Notifications
EA completion notice: client, request, amount charged, execution mode, publish status, QA status, rollback reference.
EA exception notice: client, approved amount, failed gate, current production status, recommended next action.
Client completion notice: enhancement completed and published, with a link to review it.

## Warranty rule
If an automated enhancement causes a defect attributable to the implementation, correction is included. A materially different requested outcome is a new enhancement request.

## Metrics
Track request category, quoted price, approval/decline, payment, execution mode, QA result, manual intervention, completion time, rollback, and warranty event. Use this data to tune pricing and automation thresholds rather than guessing.
