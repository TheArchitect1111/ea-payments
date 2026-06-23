import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolveConsiderExperience } from '@/lib/consider-resolve';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { SIMPLIFI_APP_URL } from '@/lib/simplifi-app-host';
import { productionSecretIssues } from '@/lib/integration-env';
import { checkAirtableLaunchSchema } from '@/lib/airtable-schema-check';
import { isCaptureApiKeyConfigured } from '@/lib/capture-api-key';
import { ESIGNATURES_CALLBACK_URL, getTier2EnvChecks, isTier2AutomationReady } from '@/lib/launch-tier2';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;

  const tier2 = getTier2EnvChecks();

  const env = {
    airtable: Boolean(process.env.AIRTABLE_API_KEY),
    onboardingWebhook: tier2.onboardingWebhook,
    esignWebhook: tier2.esignWebhook,
    contentWebhook: Boolean(process.env.CONTENT_REQUEST_WEBHOOK_URL),
    resend: tier2.resend,
    resendFrom: tier2.resendFrom,
    stripe: tier2.stripe,
    stripeWebhookSecret: tier2.stripeWebhookSecret,
  };

  let demoClient = false;
  let selenaCapture = false;

  try {
    const client = await getClientByPortalSlug('demo-client');
    demoClient = Boolean(client);
  } catch {
    demoClient = false;
  }

  try {
    const resolved = await resolveConsiderExperience('selena');
    selenaCapture = Boolean(resolved);
  } catch {
    selenaCapture = false;
  }

  const friendTestingReady = env.airtable && demoClient;

  const captureExtensionKey = isCaptureApiKeyConfigured();
  const magnifiOperational = selenaCapture;
  const amplifiOperational = friendTestingReady && env.resend && env.resendFrom;
  const simplifiGuestCapture = demoClient;

  const secretIssues = productionSecretIssues();
  const controls = {
    sentryDsn: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()),
    uptimeDashboard: Boolean(
      process.env.UPTIME_KUMA_DASHBOARD_URL?.trim() || process.env.UPTIME_MONITORING_URL?.trim(),
    ),
    backupDestination: Boolean(process.env.BACKUP_DESTINATION_URI?.trim()),
  };
  const controlIssues: string[] = [];
  if (!controls.sentryDsn) controlIssues.push('NEXT_PUBLIC_SENTRY_DSN');
  if (!controls.uptimeDashboard) controlIssues.push('UPTIME_KUMA_DASHBOARD_URL');
  if (!controls.backupDestination) controlIssues.push('BACKUP_DESTINATION_URI');
  const criticalIssues = [...secretIssues, ...controlIssues];

  let airtableSchema = {
    capture: { ok: false, exists: false, missingFields: [] as string[] },
    pulse: { ok: false, exists: false, configured: false, missingFields: [] as string[] },
    captureAnalysisMissing: [] as string[],
  };

  if (env.airtable) {
    try {
      const schema = await checkAirtableLaunchSchema();
      airtableSchema = schema;
    } catch {
      // schema check is best-effort
    }
  }

  const captureReady = airtableSchema.capture.ok;
  const tier2Ready = isTier2AutomationReady(tier2);
  const criticalReady = criticalIssues.length === 0;
  const fullLaunchReady = friendTestingReady && captureReady && tier2Ready && criticalReady;

  return NextResponse.json({
    ok: friendTestingReady && captureReady,
    status: fullLaunchReady ? 'full_launch_ready' : friendTestingReady ? 'friend_testing_ready' : 'needs_setup',
    baseUrl: base,
    checks: {
      env,
      tier2: { ...tier2, ready: tier2Ready },
      demoClient,
      selenaCapture,
      productionSecrets: secretIssues.length === 0,
      productionSecretIssues: secretIssues,
      controls,
      controlIssues,
      criticalReady,
      products: {
        magnifi: magnifiOperational,
        amplifi: amplifiOperational,
        simplifi: captureReady && simplifiGuestCapture,
        captureExtensionKey,
        extensionConnect: captureExtensionKey,
        guestSessions: demoClient,
        asyncCapture: captureReady,
      },
      airtableSchema,
    },
    links: {
      start: `${base}/start`,
      capture: `${base}/capture`,
      amplify: `${base}/amplify`,
      storyDemo: `${base}/story/selena`,
      signIn: `${base}/sign-in`,
      simplifiWorkspace: `${base}/simplifi/workspace`,
      simplifiApp: SIMPLIFI_APP_URL,
      checkout: `${base}/checkout`,
      tier2Guide: 'ea-payments/docs/MAKE-TIER2.md',
    },
    manual: {
      tier2: tier2Ready
        ? null
        : 'Set ONBOARDING_WEBHOOK_URL + ESIGN_WEBHOOK_URL on Vercel → docs/MAKE-TIER2.md',
      onboardingWebhook: env.onboardingWebhook
        ? null
        : 'Create Make onboarding scenario → copy Custom webhook URL → ONBOARDING_WEBHOOK_URL',
      esignWebhook: env.esignWebhook
        ? null
        : `Create Make eSign scenario → ESIGN_WEBHOOK_URL. eSignatures callback: ${ESIGNATURES_CALLBACK_URL}`,
      stripeLiveTest: tier2Ready
        ? 'Run one live checkout at /checkout and confirm Make + welcome email'
        : null,
      dns: 'Point www.efficiencyarchitects.online to ea-payments in Vercel → docs/DNS-THREE-CLICKS.md',
      simplifiAppDns:
        'Add app.simplifi.ai in Vercel Domains (same project) → CNAME to cname.vercel-dns.com — middleware routes / to workspace',
      resend: env.resend && env.resendFrom ? null : 'Set RESEND_API_KEY + RESEND_FROM_EMAIL + verify domain',
      sentryDsn: controls.sentryDsn
        ? null
        : 'Set NEXT_PUBLIC_SENTRY_DSN in Vercel Production (required for full launch readiness)',
      uptimeDashboard: controls.uptimeDashboard
        ? null
        : 'Set UPTIME_KUMA_DASHBOARD_URL (or UPTIME_MONITORING_URL) to your monitoring dashboard URL',
      backupDestination: controls.backupDestination
        ? null
        : 'Set BACKUP_DESTINATION_URI to your encrypted backup destination location',
      chromeExtension: captureExtensionKey
        ? null
        : 'Set EA_CAPTURE_API_KEY or ADMIN_SESSION_SECRET on Vercel — then use /extension/connect',
      appStore: 'Not planned — use /capture and Add to Home Screen',
      captureRecords: captureReady
        ? null
        : airtableSchema.capture.exists
          ? `Capture Records missing columns: ${airtableSchema.capture.missingFields.join(', ')}. Run scripts/run-capture-pulse-setup.bat`
          : 'Create Capture Records table — run scripts/run-capture-pulse-setup.bat',
      pulseEvents: airtableSchema.pulse.ok
        ? null
        : airtableSchema.pulse.configured
          ? `Pulse Events missing columns: ${airtableSchema.pulse.missingFields.join(', ')}`
          : 'Set PULSE_EVENTS_TABLE=Pulse Events on Vercel and run setup-pulse-events script',
    },
  });
}
