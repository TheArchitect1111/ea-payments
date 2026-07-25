import { NextRequest, NextResponse } from 'next/server';
import {
  getPretixIntegrationConfig,
  listAllPretixEvents,
  pretixWebhookAllowedWithoutSecret,
  verifyPretixWebhookAuth,
} from '@/lib/events/pretix-store';
import {
  handlePretixRegistrationWebhook,
  type PretixWebhookPayload,
} from '@/lib/events/pretix-webhook';

export const dynamic = 'force-dynamic';

/**
 * pretix order webhooks → Pulse + portal notify.
 * Secure with Basic Auth in the pretix target URL (user + PRETIX_WEBHOOK_SECRET).
 */
export async function GET() {
  const events = await listAllPretixEvents();
  return NextResponse.json({
    ok: true,
    route: '/api/webhooks/pretix',
    methods: ['POST'],
    message:
      'Configure pretix webhook target as https://USER:SECRET@host/api/webhooks/pretix (Basic Auth).',
    integration: getPretixIntegrationConfig(events.length),
  });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const authorized =
    verifyPretixWebhookAuth({
      rawBody,
      authorizationHeader: req.headers.get('authorization'),
      signatureHeader:
        req.headers.get('x-pretix-signature') || req.headers.get('pretix-signature'),
    }) || pretixWebhookAllowedWithoutSecret();

  if (!authorized) {
    return NextResponse.json(
      { received: false, error: 'Unauthorized pretix webhook.' },
      { status: 401 },
    );
  }

  let payload: PretixWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as PretixWebhookPayload;
  } catch {
    return NextResponse.json({ received: false, error: 'Invalid JSON.' }, { status: 400 });
  }

  try {
    const result = await handlePretixRegistrationWebhook(payload);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    console.error('[pretix] webhook handler failed:', err);
    return NextResponse.json(
      { received: false, error: 'Webhook handler failed.' },
      { status: 500 },
    );
  }
}
