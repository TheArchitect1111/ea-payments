import { NextRequest } from 'next/server';
import { getEsignaturesTemplateConfig } from '@/lib/esignatures-config';
import { fireEsignWebhook } from '@/lib/make-webhooks';
import {
  normalizeEsignWebhookPayload,
  verifyEsignWebhookAuthenticity,
} from '@/lib/trust-engine/esign-webhook-adapter';
import {
  recordMsaSent,
  recordMsaSigned,
  recordSowGenerated,
  recordSowSigned,
} from '@/lib/trust-engine/governance';

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
  const rawBody = await req.text();
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response('Invalid JSON.', { status: 400 });
  }

  const auth = verifyEsignWebhookAuthenticity({ headers: req.headers, rawBody });
  if (!auth.ok) {
    console.error('[esignatures] webhook authenticity failed:', auth.reason);
    return Response.json({ received: false, error: auth.reason }, { status: 401 });
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

  const normalized = normalizeEsignWebhookPayload(body, {
    msaTemplateId: cfg.msaTemplateId,
    sowTemplateId: cfg.sowTemplateId,
  });

  if (!normalized.valid || !normalized.kind) {
    console.warn('[esignatures] incomplete payload — not marking signed', {
      reason: normalized.reason,
      status: normalized.status,
      templateId: normalized.templateId,
      clientId: normalized.clientId,
    });
    return Response.json({
      received: true,
      trustEngine: { applied: false, reason: normalized.reason },
    });
  }

  try {
    const clientId = normalized.clientId!;
    const organizationId = normalized.organizationId!;
    switch (normalized.kind) {
      case 'msa.sent':
        await recordMsaSent(clientId, organizationId);
        break;
      case 'msa.signed':
        await recordMsaSigned(clientId, organizationId);
        break;
      case 'sow.sent':
        await recordSowGenerated(clientId, organizationId);
        break;
      case 'sow.signed':
        await recordSowSigned(clientId, organizationId);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error('[esignatures] trust engine apply failed:', err);
  }

  return Response.json({
    received: true,
    trustEngine: { applied: true, kind: normalized.kind },
  });
}
