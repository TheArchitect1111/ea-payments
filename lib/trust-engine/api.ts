/**
 * Trust Engine public API — reusable across Simplifi, Amplifi, Magnifi, portals, etc.
 */
import { getLegalAuditHistory } from './audit';
import {
  ensureDemoLegalClients,
  getClientLegalProfile,
  listClientLegalProfiles,
} from './client-store';
import {
  publishLegalVersion,
  recordClientLegalAcceptance,
  recordMsaSent,
  recordMsaSigned,
  recordSowGenerated,
  recordSowSigned,
} from './governance';
import { buildLegalJourneyMilestones, shouldGatePortalForLegal } from './journey';
import { getProductLegalPack, PRODUCT_LEGAL_PACKS } from './legal-pack';
import {
  buildClientLegalStatus,
  getDocumentsRequiringAcceptance,
} from './status';
import {
  listEffectiveLegalDocuments,
  listUpcomingLegalReleases,
  type PublishLegalVersionInput,
} from './version-overlay';
import type {
  ClientLegalProfile,
  LegalExecutiveMetrics,
  TrustProductId,
} from './types';

export async function getClientLegalStatus(input: {
  clientId?: string;
  productId: TrustProductId;
  profile?: ClientLegalProfile | null;
}) {
  const profile =
    input.profile ??
    (input.clientId ? await getClientLegalProfile(input.clientId) : null);
  return buildClientLegalStatus({ productId: input.productId, profile });
}

export { getProductLegalPack, getDocumentsRequiringAcceptance, getLegalAuditHistory };

export async function publishLegalVersionApi(
  input: PublishLegalVersionInput & { actorUserId?: string },
) {
  return publishLegalVersion(input);
}

export async function getLegalExecutiveDashboard() {
  await ensureDemoLegalClients();
  const clients = await listClientLegalProfiles();
  const metrics = computeExecutiveMetrics(clients);
  const recentAcceptances = clients
    .flatMap((c) =>
      c.acceptanceHistory.map((a) => ({
        ...a,
        clientId: c.clientId,
        organizationName: c.organizationName,
        email: c.email,
      })),
    )
    .sort((a, b) => b.acceptedAt.localeCompare(a.acceptedAt))
    .slice(0, 20);

  const requiring = clients.filter((c) => {
    const status = buildClientLegalStatus({ productId: c.productId, profile: c });
    return status.requiresReacceptance || c.requiresReacceptance;
  });

  const upcomingRaw = listUpcomingLegalReleases();
  const upcoming =
    upcomingRaw.length > 0
      ? upcomingRaw
      : [
          {
            docType: 'privacy' as const,
            title: 'Privacy Policy',
            fromVersion: '1.0',
            toVersion: '1.1',
            plannedEffectiveDate: '2026-09-01',
            notes: 'Clarifies mobile capture data categories for Play Console.',
          },
        ];

  return {
    metrics,
    clients,
    recentAcceptances,
    requiringReacceptance: requiring,
    upcomingReleases: upcoming,
    productPacks: PRODUCT_LEGAL_PACKS,
    documents: listEffectiveLegalDocuments(),
  };
}

function computeExecutiveMetrics(clients: ClientLegalProfile[]): LegalExecutiveMetrics {
  const n = clients.length || 1;
  const pct = (count: number) => Math.round((count / n) * 100);

  let privacy = 0;
  let terms = 0;
  let ai = 0;
  let msa = 0;
  let sow = 0;
  let reaccept = 0;

  for (const c of clients) {
    const status = buildClientLegalStatus({ productId: c.productId, profile: c });
    const by = Object.fromEntries(status.documents.map((d) => [d.docType, d]));
    if (by.privacy?.status === 'current') privacy += 1;
    if (by.tos?.status === 'current') terms += 1;
    if (by.ai_disclosure?.status === 'current') ai += 1;
    if (c.msaStatus === 'signed' || by.msa?.status === 'signed') msa += 1;
    if (c.sowStatus === 'signed' || by.sow?.status === 'signed') sow += 1;
    if (status.requiresReacceptance || c.requiresReacceptance) reaccept += 1;
  }

  return {
    totalClients: clients.length,
    privacyAcceptedPct: pct(privacy),
    termsAcceptedPct: pct(terms),
    aiDisclosureAcceptedPct: pct(ai),
    msaSignedPct: pct(msa),
    sowSignedPct: pct(sow),
    documentsRequiringReacceptance: reaccept,
  };
}

export {
  recordClientLegalAcceptance,
  recordMsaSent,
  recordMsaSigned,
  recordSowGenerated,
  recordSowSigned,
  buildLegalJourneyMilestones,
  shouldGatePortalForLegal,
  listClientLegalProfiles,
  getClientLegalProfile,
};
