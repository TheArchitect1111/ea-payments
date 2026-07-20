import { NextRequest } from 'next/server';
import { getEsignaturesTemplateConfig } from '@/lib/esignatures-config';
import { fireEsignWebhook } from '@/lib/make-webhooks';

export const dynamic = 'force-dynamic';

/** Receives eSignatures.io callbacks and forwards to the Make contract-signed scenario. */
export async function GET() {
  const cfg = getEsignaturesTemplateConfig();
  return Response.json({
    ok: true,
    route: '/api/webhooks/esignatures',
    methods: ['POST'],
    message: 'eSignatures callback route is live. POST signed payloads here (apex host only — not www).',
    callbackUrl: cfg.callbackUrl,
    templatesReady: cfg.templatesReady,
    missing: cfg.missing,
    makeEsignWebhookConfigured: cfg.makeEsignWebhookConfigured,
    contractDeliveryMode: cfg.contractDeliveryMode,
  });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON.', { status: 400 });
  }

  const cfg = getEsignaturesTemplateConfig();
  await fireEsignWebhook({
    event: 'esignatures.callback',
    receivedAt: new Date().toISOString(),
    esignaturesCallbackUrl: cfg.callbackUrl,
    esignaturesMsaTemplateId: cfg.msaTemplateId || undefined,
    esignaturesSowTemplateId: cfg.sowTemplateId || undefined,
    ...body,
  });

  return Response.json({ received: true });
}
