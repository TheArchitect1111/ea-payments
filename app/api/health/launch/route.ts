import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { resolveConsiderExperience } from '@/lib/consider-resolve';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { SIMPLIFI_APP_URL } from '@/lib/simplifi-app-host';
import { productionSecretIssues } from '@/lib/integration-env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? EA_PLATFORM_URL;

  const env = {
    airtable: Boolean(process.env.AIRTABLE_API_KEY),
    onboardingWebhook: Boolean(process.env.ONBOARDING_WEBHOOK_URL),
    esignWebhook: Boolean(process.env.ESIGN_WEBHOOK_URL),
    contentWebhook: Boolean(process.env.CONTENT_REQUEST_WEBHOOK_URL),
    resend: Boolean(process.env.RESEND_API_KEY),
    resendFrom: Boolean(process.env.RESEND_FROM_EMAIL),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
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
  const paymentsAutomationReady = env.onboardingWebhook && env.resend && env.resendFrom;
  const fullLaunchReady = friendTestingReady && paymentsAutomationReady;

  const captureExtensionKey = Boolean(process.env.EA_CAPTURE_API_KEY);
  const magnifiOperational = selenaCapture;
  const amplifiOperational = friendTestingReady && env.resend && env.resendFrom;

  const secretIssues = productionSecretIssues();

  return NextResponse.json({
    ok: friendTestingReady,
    status: fullLaunchReady ? 'full_launch_ready' : friendTestingReady ? 'friend_testing_ready' : 'needs_setup',
    baseUrl: base,
    checks: {
      env,
      demoClient,
      selenaCapture,
      productionSecrets: secretIssues.length === 0,
      productionSecretIssues: secretIssues,
      products: {
        magnifi: magnifiOperational,
        amplifi: amplifiOperational,
        captureExtensionKey,
        asyncCapture: true,
      },
    },
    links: {
      start: `${base}/start`,
      capture: `${base}/capture`,
      amplify: `${base}/amplify`,
      storyDemo: `${base}/story/selena`,
      signIn: `${base}/sign-in`,
      simplifiWorkspace: `${base}/simplifi/workspace`,
      simplifiApp: SIMPLIFI_APP_URL,
    },
    manual: {
      dns: 'Point www.efficiencyarchitects.online to ea-payments in Vercel → docs/DNS-THREE-CLICKS.md',
      simplifiAppDns:
        'Add app.simplifi.ai in Vercel Domains (same project) → CNAME to cname.vercel-dns.com — middleware routes / to workspace',
      makeWebhooks: env.onboardingWebhook ? null : 'Set ONBOARDING_WEBHOOK_URL on Vercel',
      resend: env.resend && env.resendFrom ? null : 'Set RESEND_API_KEY + RESEND_FROM_EMAIL + verify domain',
      chromeExtension: captureExtensionKey
        ? null
        : 'Set EA_CAPTURE_API_KEY on Vercel + extension settings (see /amplifi/install)',
      appStore: 'Not planned — use /capture and Add to Home Screen',
    },
  });
}
