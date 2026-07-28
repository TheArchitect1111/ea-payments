/**
 * Hardened legal acceptance service — server resolves identity, versions, and timestamps.
 */
import { appendClientAcceptancesDetailed } from './client-store';
import { recordLegalAuditEvent } from './audit';
import { resolveOnboardingAcceptanceDocs } from './legal-pack';
import { getEffectiveLegalDocument } from './version-overlay';
import type {
  ClientLegalProfile,
  LegalAcceptanceRecord,
  TrustLegalDocType,
  TrustProductId,
} from './types';
import { PRODUCT_LEGAL_PACKS } from './legal-pack';

const VALID_PRODUCTS = new Set(PRODUCT_LEGAL_PACKS.map((p) => p.productId));

export type AcceptLegalDocsInput = {
  userId: string;
  clientId: string;
  organizationId: string;
  email?: string;
  displayName?: string;
  productId: TrustProductId;
  /** Document types the user claims to accept — versions resolved server-side. */
  docTypes: TrustLegalDocType[];
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  isReacceptance?: boolean;
};

export type AcceptLegalDocsResult =
  | {
      ok: true;
      profile: ClientLegalProfile;
      records: LegalAcceptanceRecord[];
      duplicatesSkipped: number;
    }
  | { ok: false; error: string; status: number };

export function isValidTrustProductId(value: string): value is TrustProductId {
  return VALID_PRODUCTS.has(value as TrustProductId);
}

export function validateAcceptDocTypes(
  productId: TrustProductId,
  docTypes: TrustLegalDocType[],
): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(docTypes) || docTypes.length === 0) {
    return { ok: false, error: 'docTypes required' };
  }
  const allowed = new Set(resolveOnboardingAcceptanceDocs(productId).map((d) => d.docType));
  for (const docType of docTypes) {
    if (docType === 'msa' || docType === 'sow') {
      return { ok: false, error: 'MSA and SOW cannot be accepted via checkbox flow' };
    }
    if (!allowed.has(docType)) {
      return { ok: false, error: `Document type not applicable for product: ${docType}` };
    }
    const current = getEffectiveLegalDocument(docType);
    if (!current || current.status !== 'active') {
      return { ok: false, error: `No active document for type: ${docType}` };
    }
  }
  return { ok: true };
}

/** Build server-authoritative acceptance records (ignores client versions/timestamps). */
export function buildServerAcceptanceRecords(input: {
  userId: string;
  productId: TrustProductId;
  docTypes: TrustLegalDocType[];
  acceptedAt: string;
}): LegalAcceptanceRecord[] | { error: string } {
  const records: LegalAcceptanceRecord[] = [];
  for (const docType of input.docTypes) {
    const doc = getEffectiveLegalDocument(docType);
    if (!doc) return { error: `Unknown document: ${docType}` };
    records.push({
      userId: input.userId,
      productId: input.productId,
      docType,
      version: doc.version,
      acceptedAt: input.acceptedAt,
      href: doc.href,
    });
  }
  return records;
}

export async function acceptLegalDocuments(
  input: AcceptLegalDocsInput,
): Promise<AcceptLegalDocsResult> {
  if (!isValidTrustProductId(input.productId)) {
    return { ok: false, error: 'Invalid product', status: 400 };
  }
  const docCheck = validateAcceptDocTypes(input.productId, input.docTypes);
  if (!docCheck.ok) {
    return { ok: false, error: docCheck.error, status: 400 };
  }

  const acceptedAt = new Date().toISOString();
  const built = buildServerAcceptanceRecords({
    userId: input.userId,
    productId: input.productId,
    docTypes: input.docTypes,
    acceptedAt,
  });
  if ('error' in built) {
    return { ok: false, error: built.error, status: 400 };
  }

  try {
    const { profile, duplicatesSkipped } = await appendClientAcceptancesDetailed(
      input.clientId,
      built,
      {
        organizationId: input.organizationId,
        organizationName: input.displayName,
        email: input.email,
        displayName: input.displayName,
        productId: input.productId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        source: input.source ?? 'api',
      },
    );

    for (const rec of built) {
      await recordLegalAuditEvent({
        type: input.isReacceptance ? 'reacceptance' : 'acceptance',
        userId: input.userId,
        email: input.email,
        organizationId: input.organizationId,
        organizationName: input.displayName,
        docType: rec.docType,
        version: rec.version,
        productId: input.productId,
        ipAddress: input.ipAddress,
        clientId: input.clientId,
        summary: `${input.isReacceptance ? 'Reaccepted' : 'Accepted'} ${rec.docType} v${rec.version}${duplicatesSkipped ? ' (dedupe pass)' : ''}`,
        metadata: {
          clientId: input.clientId,
          duplicateSkipped: duplicatesSkipped > 0,
        },
      });
    }

    return { ok: true, profile, records: built, duplicatesSkipped };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Persistence failed';
    return { ok: false, error: message, status: 503 };
  }
}
