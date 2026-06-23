export type LaunchReadinessStatus =
  | 'build_ready'
  | 'revenue_ready'
  | 'delivery_ready'
  | 'controlled_paid_launch_ready'
  | 'full_launch_ready'
  | 'scale_ready'
  | 'needs_setup';

export type LaunchReadinessInputs = {
  revenue: {
    stripe: boolean;
    stripeWebhookSecret: boolean;
    airtable: boolean;
    resend: boolean;
    resendFrom: boolean;
  };
  delivery: {
    onboardingWebhook: boolean;
    esignWebhook: boolean;
    captureSchema: boolean;
    pulseSchema: boolean;
    assessmentSchema?: boolean;
    proposalSchema?: boolean;
  };
  monitoring: {
    sentryDsn: boolean;
    uptimeDashboard: boolean;
  };
  resilience: {
    backupDestination: boolean;
  };
  scale?: {
    fullLaunchReady?: boolean;
    operationalMaturity?: boolean;
    founderDependencyReduced?: boolean;
  };
};

export type LaunchReadinessCategory = {
  ready: boolean;
  purpose: string;
  missing: string[];
};

export type LaunchReadinessBreakdown = {
  revenue: LaunchReadinessCategory;
  delivery: LaunchReadinessCategory;
  monitoring: LaunchReadinessCategory;
  resilience: LaunchReadinessCategory;
  scale: LaunchReadinessCategory;
};

export type LaunchReadinessModel = {
  revenueReady: boolean;
  deliveryReady: boolean;
  monitoringReady: boolean;
  resilienceReady: boolean;
  criticalReady: boolean;
  fullLaunchReady: boolean;
  scaleReady: boolean;
  status: LaunchReadinessStatus;
  missing: LaunchReadinessBreakdown;
};

function missingFrom(checks: Record<string, boolean>): string[] {
  return Object.entries(checks)
    .filter(([, ready]) => !ready)
    .map(([key]) => key);
}

export function buildLaunchReadinessModel(inputs: LaunchReadinessInputs): LaunchReadinessModel {
  const revenueMissing = missingFrom({
    STRIPE_SECRET_KEY: inputs.revenue.stripe,
    STRIPE_WEBHOOK_SECRET: inputs.revenue.stripeWebhookSecret,
    AIRTABLE_API_KEY: inputs.revenue.airtable,
    RESEND_API_KEY: inputs.revenue.resend,
    RESEND_FROM_EMAIL: inputs.revenue.resendFrom,
  });

  const deliveryMissing = missingFrom({
    ONBOARDING_WEBHOOK_URL: inputs.delivery.onboardingWebhook,
    ESIGN_WEBHOOK_URL: inputs.delivery.esignWebhook,
    CAPTURE_RECORDS_SCHEMA: inputs.delivery.captureSchema,
    PULSE_EVENTS_SCHEMA: inputs.delivery.pulseSchema,
    ASSESSMENTS_SCHEMA: inputs.delivery.assessmentSchema ?? true,
    PROPOSALS_SCHEMA: inputs.delivery.proposalSchema ?? true,
  });

  const monitoringMissing = missingFrom({
    NEXT_PUBLIC_SENTRY_DSN: inputs.monitoring.sentryDsn,
    UPTIME_KUMA_DASHBOARD_URL: inputs.monitoring.uptimeDashboard,
  });

  const resilienceMissing = missingFrom({
    BACKUP_DESTINATION_URI: inputs.resilience.backupDestination,
  });

  const revenueReady = revenueMissing.length === 0;
  const deliveryReady = deliveryMissing.length === 0;
  const monitoringReady = monitoringMissing.length === 0;
  const resilienceReady = resilienceMissing.length === 0;
  const criticalReady = revenueReady && deliveryReady;
  const fullLaunchReady = criticalReady && monitoringReady && resilienceReady;
  const scaleReady = Boolean(
    fullLaunchReady &&
      inputs.scale?.operationalMaturity &&
      inputs.scale?.founderDependencyReduced,
  );

  let status: LaunchReadinessStatus = 'needs_setup';
  if (scaleReady) status = 'scale_ready';
  else if (fullLaunchReady) status = 'full_launch_ready';
  else if (criticalReady) status = 'controlled_paid_launch_ready';
  else if (deliveryReady) status = 'delivery_ready';
  else if (revenueReady) status = 'revenue_ready';
  else status = 'build_ready';

  return {
    revenueReady,
    deliveryReady,
    monitoringReady,
    resilienceReady,
    criticalReady,
    fullLaunchReady,
    scaleReady,
    status,
    missing: {
      revenue: {
        ready: revenueReady,
        purpose: 'Can the platform accept money and communicate with customers?',
        missing: revenueMissing,
      },
      delivery: {
        ready: deliveryReady,
        purpose: 'Can the platform onboard and serve customers?',
        missing: deliveryMissing,
      },
      monitoring: {
        ready: monitoringReady,
        purpose: 'Can the platform detect issues quickly?',
        missing: monitoringMissing,
      },
      resilience: {
        ready: resilienceReady,
        purpose: 'Can the platform recover from failures?',
        missing: resilienceMissing,
      },
      scale: {
        ready: scaleReady,
        purpose: 'Can the platform support broader acquisition with mature operations?',
        missing: scaleReady
          ? []
          : missingFrom({
              FULL_LAUNCH_READY: fullLaunchReady,
              OPERATIONAL_MATURITY: Boolean(inputs.scale?.operationalMaturity),
              FOUNDER_DEPENDENCY_REDUCED: Boolean(inputs.scale?.founderDependencyReduced),
            }),
      },
    },
  };
}
