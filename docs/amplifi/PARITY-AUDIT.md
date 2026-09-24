# Amplifi Branch Parity Audit

Canonical integration branch: `canonical/amplifi`

## Audit result

### Historical branches already fully behind canonical
These have no commits ahead of canonical and require no merge:
- agent/amplifi-completion-build
- feat/amplifi-premium-ui
- feat/amplifi-guided-onboarding
- feat/amplifi-native-social
- feat/amplifi-postiz-connections

### Branches with unique work requiring deliberate integration

#### agent/amplifi-campaign-analytics
11 commits ahead.
Unique work includes campaign analytics, attribution redirect, analytics API, campaign dashboard results UI, analytics types and tests.

#### agent/amplifi-phase-5-approval-scheduling
45 commits ahead.
Unique work includes approval workflow, scheduling, cron publishing, campaign scheduler, workflow APIs, media validation, publishing changes and tests.

#### agent/amplifi-durable-social-connections
1 commit ahead.
Contains durable social-connection changes and Supabase migration. The canonical publishing-gateway branch already contains a newer connection-store implementation, so this branch must not be merged wholesale.

## Integration rule
Do not merge these branches wholesale. They are hundreds of commits behind canonical and would risk regressions. Port only unique Amplifi functionality into canonical, preserving the newer publishing gateway and connection implementation.

## Next integration order
1. Analytics and attribution
2. Approval and scheduling
3. Durable-connection delta only if not already superseded
4. Run Amplifi tests
5. Freeze canonical branch after parity verification
