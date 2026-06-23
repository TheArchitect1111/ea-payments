# Launch Readiness Model

The launch health system uses staged readiness instead of a single pass/fail gate.

## Categories

| Category | Required checks | Business question |
| --- | --- | --- |
| Revenue | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `AIRTABLE_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | Can EA accept money, record customers, and communicate with buyers? |
| Delivery | `ONBOARDING_WEBHOOK_URL`, `ESIGN_WEBHOOK_URL`, Capture Records schema, Pulse Events schema | Can EA onboard clients and deliver the service after purchase? |
| Monitoring | `NEXT_PUBLIC_SENTRY_DSN`, `UPTIME_KUMA_DASHBOARD_URL` or `UPTIME_MONITORING_URL` | Can EA detect incidents quickly? |
| Resilience | `BACKUP_DESTINATION_URI` | Can EA recover from operational failure or data loss? |
| Scale | Full launch readiness plus operational maturity and founder dependency reduction | Can EA support broader acquisition with mature operations? |

## Statuses

| Status | Meaning |
| --- | --- |
| `build_ready` | The app can run, but revenue and delivery gates are incomplete. |
| `revenue_ready` | Payment, customer record, and customer communication prerequisites are present. |
| `delivery_ready` | Onboarding and service delivery prerequisites are present. |
| `controlled_paid_launch_ready` | Revenue and delivery are both ready. This is suitable for friend testing, referral clients, and initial paid customers. |
| `full_launch_ready` | Controlled paid launch is ready, and monitoring plus resilience controls are present. This is suitable for public launch and broader campaigns. |
| `scale_ready` | Full launch readiness plus mature operating controls. |

## Compatibility

`/api/health/launch` still returns legacy fields such as `criticalReady`, `controlIssues`, and `productionSecretIssues`.

`criticalReady` now means:

```ts
criticalReady = revenueReady && deliveryReady;
```

`fullLaunchReady` now means:

```ts
fullLaunchReady = criticalReady && monitoringReady && resilienceReady;
```

Missing monitoring and backup controls no longer make `criticalReady` false. They remain required for `full_launch_ready`.
