/**
 * Compute per-document legal status for a client / product pack.
 */
import { getLegalDocument, resolveRequiredLegalDocs } from './legal-pack';
import { getEffectiveLegalDocument } from './version-overlay';
import type {
  ClientLegalDocRow,
  ClientLegalProfile,
  LegalDocDisplayStatus,
  TrustLegalDocType,
  TrustProductId,
} from './types';

function displayStatus(input: {
  docType: TrustLegalDocType;
  currentVersion: string;
  acceptedVersion: string | null;
  requiresEsign?: boolean;
  msaStatus?: ClientLegalProfile['msaStatus'];
  sowStatus?: ClientLegalProfile['sowStatus'];
}): LegalDocDisplayStatus {
  if (input.requiresEsign) {
    if (input.docType === 'msa') {
      if (input.msaStatus === 'signed') return 'signed';
      if (input.msaStatus === 'sent') return 'pending';
      return 'pending';
    }
    if (input.docType === 'sow') {
      if (input.sowStatus === 'signed') return 'signed';
      if (input.sowStatus === 'generated') return 'pending';
      return 'pending';
    }
  }

  if (!input.acceptedVersion) return 'pending';
  if (input.acceptedVersion !== input.currentVersion) return 'update_required';
  return 'current';
}

export type ClientLegalStatusResult = {
  productId: TrustProductId;
  clientId?: string;
  requiresReacceptance: boolean;
  documents: ClientLegalDocRow[];
  requiringAcceptance: ClientLegalDocRow[];
};

/** Build legal status rows for a product + optional client profile. */
export function buildClientLegalStatus(input: {
  productId: TrustProductId;
  profile?: ClientLegalProfile | null;
  /** Include optional pack docs (cookie, etc.). */
  includeOptional?: boolean;
}): ClientLegalStatusResult {
  const required = resolveRequiredLegalDocs(input.productId);
  const docs = required.map((base) => {
    const effective = getEffectiveLegalDocument(base.docType) ?? base;
    const accepted = input.profile?.latestByDoc[base.docType] ?? null;
    const status = displayStatus({
      docType: base.docType,
      currentVersion: effective.version,
      acceptedVersion: accepted?.version ?? null,
      requiresEsign: effective.requiresEsign,
      msaStatus: input.profile?.msaStatus,
      sowStatus: input.profile?.sowStatus,
    });
    return {
      docType: base.docType,
      title: effective.title,
      href: effective.href,
      currentVersion: effective.version,
      acceptedVersion: accepted?.version ?? null,
      acceptanceDate: accepted?.acceptedAt ?? null,
      status,
      requiresEsign: effective.requiresEsign,
    } satisfies ClientLegalDocRow;
  });

  const requiringAcceptance = docs.filter(
    (d) => d.status === 'pending' || d.status === 'update_required',
  );

  return {
    productId: input.productId,
    clientId: input.profile?.clientId,
    requiresReacceptance:
      Boolean(input.profile?.requiresReacceptance) || requiringAcceptance.length > 0,
    documents: docs,
    requiringAcceptance,
  };
}

export function getDocumentsRequiringAcceptance(
  productId: TrustProductId,
  profile?: ClientLegalProfile | null,
): ClientLegalDocRow[] {
  return buildClientLegalStatus({ productId, profile }).requiringAcceptance;
}

export function resolveDocTitle(docType: TrustLegalDocType): string {
  return getEffectiveLegalDocument(docType)?.title ?? getLegalDocument(docType)?.title ?? docType;
}
