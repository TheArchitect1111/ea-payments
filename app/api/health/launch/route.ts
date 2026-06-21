import { NextResponse } from 'next/server';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getCaptureByConsiderSlug } from '@/lib/capture-records';

export const dynamic = 'force-dynamic';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';

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
    const capture = await getCaptureByConsiderSlug('selena');
    selenaCapture = Boolean(capture);
  } catch {
    selenaCapture = false;
  }

  const friendTestingReady = env.airtable && demoClient;
  const paymentsAutomationReady = env.onboardingWebhook && env.resend && env.resendFrom;
  const fullLaunchReady = friendTestingReady && paymentsAutomationReady;

  return NextResponse.json({
    ok: friendTestingReady,
    status: fullLaunchReady ? 'full_launch_ready' : friendTestingReady ? 'friend_testing_ready' : 'needs_setup',
    baseUrl: base,
    checks: {
      env,
      demoClient,
      selenaCapture,
    },
    links: {
      start: `${base}/start`,
      capture: `${base}/capture`,
      amplify: `${base}/amplify`,
      storyDemo: `${base}/story/selena`,
      signIn: `${base}/sign-in`,
    },
    manual: {
      dns: 'Point www.efficiencyarchitects.online to ea-payments in Vercel → docs/DNS-THREE-CLICKS.md',
      makeWebhooks: env.onboardingWebhook ? null : 'Set ONBOARDING_WEBHOOK_URL on Vercel',
      resend: env.resend && env.resendFrom ? null : 'Set RESEND_API_KEY + RESEND_FROM_EMAIL + verify domain',
      chromeExtension: 'Load extension/ folder in chrome://extensions (see /amplifi/install)',
      appStore: 'Not planned — use /capture and Add to Home Screen',
    },
  });
}
