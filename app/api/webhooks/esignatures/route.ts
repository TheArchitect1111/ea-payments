import { NextRequest } from 'next/server';
import { fireEsignWebhook } from '@/lib/make-webhooks';

export const dynamic = 'force-dynamic';

/** Receives eSignatures.io callbacks and forwards to the Make onboarding/docs scenario. */
export async function GET() {
  return Response.json({
    ok: true,
    route: '/api/webhooks/esignatures',
    methods: ['POST'],
    message: 'eSignatures callback route is live. POST signed payloads here.',
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON.', { status: 400 });
  }

  await fireEsignWebhook({
    event: 'esignatures.callback',
    receivedAt: new Date().toISOString(),
    ...body,
  });

  return Response.json({ received: true });
}
