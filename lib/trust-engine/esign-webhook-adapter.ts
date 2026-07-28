/**
 * Normalize eSignatures.io (and Make-forwarded) payloads into Trust Engine events.
 * Incomplete/unknown payloads never mark documents as signed.
 */
import { getEsignaturesTemplateConfig } from '@/lib/esignatures-config';

export type NormalizedEsignKind = 'msa.sent' | 'msa.signed' | 'sow.sent' | 'sow.signed';

export type NormalizedEsignEvent = {
  kind: NormalizedEsignKind | null;
  valid: boolean;
  reason?: string;
  clientId: string | null;
  organizationId: string | null;
  templateId: string | null;
  signerEmail: string | null;
  timestamp: string | null;
  status: string | null;
  documentTypeHint: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return null;
}

function lower(value: string | null): string {
  return (value ?? '').toLowerCase();
}

/** Verify webhook authenticity when ESIGNATURES_WEBHOOK_SECRET is configured. */
export function verifyEsignWebhookAuthenticity(input: {
  headers: Headers | Record<string, string | null | undefined>;
  rawBody?: string;
}): { ok: true } | { ok: false; reason: string } {
  const secret = process.env.ESIGNATURES_WEBHOOK_SECRET?.trim();
  if (!secret) {
    // Not configured — authenticity check skipped (logged by caller in production reviews).
    return { ok: true };
  }

  const get = (name: string) => {
    if (input.headers instanceof Headers) return input.headers.get(name);
    return input.headers[name] ?? input.headers[name.toLowerCase()] ?? null;
  };

  const provided =
    get('x-esignatures-secret') ||
    get('x-webhook-secret') ||
    get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!provided || provided !== secret) {
    return { ok: false, reason: 'Invalid or missing webhook secret' };
  }
  return { ok: true };
}

/**
 * Map provider payload → normalized Trust Engine event.
 * Does not write — caller decides whether to apply.
 */
export function normalizeEsignWebhookPayload(
  body: Record<string, unknown>,
  opts?: { msaTemplateId?: string; sowTemplateId?: string },
): NormalizedEsignEvent {
  const cfg = getEsignaturesTemplateConfig();
  const msaTemplateId = opts?.msaTemplateId ?? cfg.msaTemplateId;
  const sowTemplateId = opts?.sowTemplateId ?? cfg.sowTemplateId;

  const meta = asRecord(body.metadata);
  const data = asRecord(body.data);
  const contract = asRecord(body.contract ?? body.document ?? data.contract);

  const status = pickString(
    body.status,
    body.event,
    body.type,
    body.action,
    data.status,
    contract.status,
  );
  const templateId = pickString(
    body.template_id,
    body.templateId,
    body.document_template_id,
    data.template_id,
    contract.template_id,
    meta.templateId,
  );
  const documentTypeHint = pickString(
    body.document_type,
    body.docType,
    body.documentType,
    meta.documentType,
    contract.title,
  );
  const signerEmail = pickString(
    body.signer_email,
    body.signerEmail,
    body.email,
    data.signer_email,
    meta.signerEmail,
    contract.signer_email,
  );
  const clientId = pickString(
    body.clientId,
    body.client_id,
    meta.clientId,
    data.clientId,
    body.portal_slug,
    body.portalSlug,
  );
  const organizationId = pickString(
    body.organizationId,
    body.orgId,
    body.organization_id,
    meta.organizationId,
    clientId,
  );
  const timestamp = pickString(
    body.signed_at,
    body.signedAt,
    body.timestamp,
    body.occurred_at,
    data.signed_at,
    contract.signed_at,
  );

  const statusL = lower(status);
  const hintL = lower(documentTypeHint);
  const isSigned =
    statusL.includes('sign') ||
    statusL.includes('complete') ||
    statusL.includes('finished') ||
    statusL === 'contract-signed' ||
    statusL === 'document.signed';
  const isSent =
    statusL.includes('sent') ||
    statusL.includes('delivered') ||
    statusL === 'contract-sent' ||
    statusL === 'document.sent';

  let docFamily: 'msa' | 'sow' | null = null;
  if (templateId && msaTemplateId && templateId === msaTemplateId) docFamily = 'msa';
  else if (templateId && sowTemplateId && templateId === sowTemplateId) docFamily = 'sow';
  else if (hintL.includes('msa') || hintL.includes('master services')) docFamily = 'msa';
  else if (hintL.includes('sow') || hintL.includes('statement of work')) docFamily = 'sow';

  if (!docFamily) {
    return {
      kind: null,
      valid: false,
      reason: 'Unable to map template/document type to MSA or SOW',
      clientId,
      organizationId,
      templateId,
      signerEmail,
      timestamp,
      status,
      documentTypeHint,
    };
  }

  if (!clientId && !organizationId) {
    return {
      kind: null,
      valid: false,
      reason: 'Missing clientId and organizationId',
      clientId,
      organizationId,
      templateId,
      signerEmail,
      timestamp,
      status,
      documentTypeHint,
    };
  }

  if (isSigned) {
    if (!signerEmail && !clientId) {
      return {
        kind: null,
        valid: false,
        reason: 'Signed event missing signer identity',
        clientId,
        organizationId,
        templateId,
        signerEmail,
        timestamp,
        status,
        documentTypeHint,
      };
    }
    return {
      kind: docFamily === 'msa' ? 'msa.signed' : 'sow.signed',
      valid: true,
      clientId: clientId ?? organizationId,
      organizationId: organizationId ?? clientId,
      templateId,
      signerEmail,
      timestamp: timestamp ?? new Date().toISOString(),
      status,
      documentTypeHint,
    };
  }

  if (isSent) {
    return {
      kind: docFamily === 'msa' ? 'msa.sent' : 'sow.sent',
      valid: true,
      clientId: clientId ?? organizationId,
      organizationId: organizationId ?? clientId,
      templateId,
      signerEmail,
      timestamp: timestamp ?? new Date().toISOString(),
      status,
      documentTypeHint,
    };
  }

  return {
    kind: null,
    valid: false,
    reason: `Unrecognized signature status: ${status ?? '(none)'}`,
    clientId,
    organizationId,
    templateId,
    signerEmail,
    timestamp,
    status,
    documentTypeHint,
  };
}
