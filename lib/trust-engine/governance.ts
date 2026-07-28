/**
 * Version governance — detect stale acceptances and require reacceptance.
 * Acceptance history is never overwritten.
 */
import { recordLegalAuditEvent } from './audit';
import {
  appendClientAcceptances,
  listClientLegalProfiles,
  markClientsReacceptanceRequired,
  updateClientEsignStatus,
} from './client-store';
import { notifyLegalEvent } from './notifications';
import { buildClientLegalStatus } from './status';
import { publishLegalVersionOverlay, type PublishLegalVersionInput } from './version-overlay';
import type { LegalAcceptanceRecord, TrustLegalDocType } from './types';

export async function publishLegalVersion(input: PublishLegalVersionInput & { actorUserId?: string }) {
  const published = publishLegalVersionOverlay(input);

  const clientIds = await markClientsReacceptanceRequired(input.docType, input.version);

  await recordLegalAuditEvent({
    type: 'version_upgrade',
    userId: input.actorUserId ?? 'system',
    organizationId: 'ea',
    organizationName: 'Efficiency Architects',
    docType: input.docType,
    version: input.version,
    summary: `Published ${input.docType} v${input.version} — ${clientIds.length} clients require reacceptance`,
    metadata: { clientsAffected: clientIds.length },
  });

  for (const clientId of clientIds) {
    await recordLegalAuditEvent({
      type: 'reacceptance_required',
      userId: clientId,
      organizationId: clientId,
      docType: input.docType,
      version: input.version,
      summary: `Requires reacceptance of ${input.docType} v${input.version}`,
      metadata: { clientId },
    });
  }

  await notifyLegalEvent({
    kind: 'version_published',
    docType: input.docType,
    version: input.version,
    clientsAffected: clientIds.length,
  });

  if (input.docType === 'support') {
    await notifyLegalEvent({ kind: 'support_updated', version: input.version });
  }

  return { published, clientsAffected: clientIds };
}

/** Record checkbox / login acceptances — append-only history. */
export async function recordClientLegalAcceptance(input: {
  clientId: string;
  organizationId: string;
  organizationName?: string;
  email?: string;
  displayName?: string;
  records: LegalAcceptanceRecord[];
  ipAddress?: string;
  isReacceptance?: boolean;
}) {
  const profile = await appendClientAcceptances(input.clientId, input.records, {
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    email: input.email,
    displayName: input.displayName,
    productId: input.records[0]?.productId,
  });

  for (const rec of input.records) {
    await recordLegalAuditEvent({
      type: input.isReacceptance ? 'reacceptance' : 'acceptance',
      userId: rec.userId,
      email: input.email,
      organizationId: input.organizationId,
      organizationName: input.organizationName,
      docType: rec.docType,
      version: rec.version,
      productId: rec.productId,
      ipAddress: input.ipAddress,
      summary: `${input.isReacceptance ? 'Reaccepted' : 'Accepted'} ${rec.docType} v${rec.version}`,
      metadata: { clientId: input.clientId },
    });
  }

  return profile;
}

export async function recordMsaSent(clientId: string, organizationId: string, version = '1.0') {
  await updateClientEsignStatus(clientId, { msaStatus: 'sent' });
  await recordLegalAuditEvent({
    type: 'msa_sent',
    userId: clientId,
    organizationId,
    docType: 'msa',
    version,
    summary: 'MSA sent for signature',
    metadata: { clientId },
  });
  await notifyLegalEvent({ kind: 'msa_waiting', clientId, organizationId });
}

export async function recordMsaSigned(clientId: string, organizationId: string, version = '1.0') {
  const at = new Date().toISOString();
  await updateClientEsignStatus(clientId, { msaStatus: 'signed', msaSignedAt: at });
  await recordLegalAuditEvent({
    type: 'msa_signed',
    userId: clientId,
    organizationId,
    docType: 'msa',
    version,
    summary: 'MSA signed',
    metadata: { clientId },
  });
}

export async function recordSowGenerated(clientId: string, organizationId: string, version = '1.0') {
  await updateClientEsignStatus(clientId, { sowStatus: 'generated' });
  await recordLegalAuditEvent({
    type: 'sow_generated',
    userId: clientId,
    organizationId,
    docType: 'sow',
    version,
    summary: 'SOW generated',
    metadata: { clientId },
  });
  await notifyLegalEvent({ kind: 'sow_waiting', clientId, organizationId });
}

export async function recordSowSigned(clientId: string, organizationId: string, version = '1.0') {
  const at = new Date().toISOString();
  await updateClientEsignStatus(clientId, { sowStatus: 'signed', sowSignedAt: at });
  await recordLegalAuditEvent({
    type: 'sow_signed',
    userId: clientId,
    organizationId,
    docType: 'sow',
    version,
    summary: 'SOW signed',
    metadata: { clientId },
  });
}

/** Re-scan all clients against effective versions (ops / cron). */
export async function reconcileReacceptanceFlags(): Promise<number> {
  const profiles = await listClientLegalProfiles();
  let count = 0;
  for (const profile of profiles) {
    const status = buildClientLegalStatus({
      productId: profile.productId,
      profile,
    });
    const needs = status.requiringAcceptance.length > 0;
    if (needs !== profile.requiresReacceptance) {
      const { upsertClientLegalProfile } = await import('./client-store');
      await upsertClientLegalProfile({ ...profile, requiresReacceptance: needs });
      count += 1;
    }
  }
  return count;
}

export function docsNeedingLoginGate(
  productId: Parameters<typeof buildClientLegalStatus>[0]['productId'],
  profile: Parameters<typeof buildClientLegalStatus>[0]['profile'],
) {
  return buildClientLegalStatus({ productId, profile }).requiringAcceptance.filter(
    (d) => !d.requiresEsign,
  );
}

export type { TrustLegalDocType };
