import { NextRequest, NextResponse } from 'next/server';
import {
  fireEsignWebhook,
  fireOnboardingWebhook,
  type OnboardingWebhookPayload,
} from '@/lib/make-webhooks';
import {
  getTier2EnvChecks,
  sampleEsignWebhookPayload,
  sampleOnboardingWebhookBody,
  sampleOnboardingWebhookPayload,
} from '@/lib/launch-tier2';

export const dynamic = 'force-dynamic';

function authorized(req: NextRequest): boolean {
  const expected = process.env.LAUNCH_SETUP_KEY?.trim();
  if (!expected) return false;
  return req.headers.get('x-launch-setup-key')?.trim() === expected;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  let body: { target?: 'onboarding' | 'esign' | 'both'; dryRun?: boolean; payload?: Record<string, unknown> };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const target = body.target ?? 'both';
  const dryRun = body.dryRun === true;
  const env = getTier2EnvChecks();

  const onboardingPayload: OnboardingWebhookPayload =
    body.payload?.event === 'payment.received'
      ? (body.payload as unknown as OnboardingWebhookPayload)
      : sampleOnboardingWebhookPayload();

  const esignPayload =
    body.payload?.event === 'esignatures.callback'
      ? body.payload
      : sampleEsignWebhookPayload();

  const results: Record<string, { configured: boolean; sent: boolean; dryRun: boolean }> = {
    onboarding: { configured: env.onboardingWebhook, sent: false, dryRun },
    esign: { configured: env.esignWebhook, sent: false, dryRun },
  };

  if (!dryRun) {
    if ((target === 'onboarding' || target === 'both') && env.onboardingWebhook) {
      await fireOnboardingWebhook(onboardingPayload);
      results.onboarding.sent = true;
    }
    if ((target === 'esign' || target === 'both') && env.esignWebhook) {
      await fireEsignWebhook(esignPayload);
      results.esign.sent = true;
    }
  }

  return NextResponse.json({
    ok: env.onboardingWebhook && env.esignWebhook,
    dryRun,
    env,
    payloads: {
      onboarding: onboardingPayload,
      esign: esignPayload,
    },
    results,
    note: dryRun
      ? 'Set dryRun:false to fire Make webhooks. Check Make scenario history for green runs.'
      : 'Verify runs in Make.com scenario history.',
  });
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized.' }, { status: 401 });
  }

  const env = getTier2EnvChecks();
  return NextResponse.json({
    ok: env.onboardingWebhook && env.esignWebhook,
    env,
    samples: {
      onboarding: sampleOnboardingWebhookBody(),
      onboardingInternal: sampleOnboardingWebhookPayload(),
      esign: sampleEsignWebhookPayload(),
    },
  });
}
