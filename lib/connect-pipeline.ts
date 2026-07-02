import { createCaptureRecord } from '@/lib/capture-records';
import { emitCaptureCompleted } from '@/lib/capture-pulse';
import { emitPulseEvent } from '@/lib/pulse-bus';
import type { ConnectOrgConfig, ConnectRelationship } from '@/lib/connect-store';

export type ConnectHandoffResult = {
  simplifi: { ok: boolean; captureId?: string; error?: string };
  amplifi: { ok: boolean; shareUrl?: string; error?: string };
};

function platformBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://www.efficiencyarchitects.online';
  return raw.replace(/\/$/, '');
}

/**
 * After Connect captures a relationship, push it into Simplifi (Capture Records)
 * and queue Amplifi (share surface + Pulse event).
 */
export async function handoffConnectRelationship(
  relationship: ConnectRelationship,
  org: ConnectOrgConfig,
): Promise<ConnectHandoffResult> {
  const origin = platformBaseUrl();
  const title = `${org.name} · ${relationship.name}`;
  const description = [
    relationship.conversationNotes,
    relationship.event ? `Event: ${relationship.event}` : '',
    relationship.representative ? `Rep: ${relationship.representative}` : '',
    `Lead type: ${relationship.leadType}`,
    `Opportunity score: ${relationship.aiProfile.opportunityScore}`,
  ]
    .filter(Boolean)
    .join('\n');

  const simplifi = await createCaptureRecord({
    title,
    description,
    captureType: 'Person',
    source: `Connect · ${org.slug}`,
    category: 'Connect Relationship',
    priority:
      relationship.aiProfile.followUpPriority === 'Immediate' ||
      relationship.aiProfile.followUpPriority === 'High'
        ? 'High'
        : 'Normal',
    status: 'Routed',
    tags: [...relationship.tags, 'connect', org.slug, 'simplifi'],
    prospectName: relationship.name,
    businessName: org.name,
    opportunityScore: relationship.aiProfile.opportunityScore,
    analysisSummary: relationship.aiProfile.summary,
    productAlignment: ['Simplifi', 'Connect'],
    prospectStatus: relationship.status,
    portalSlug: org.slug,
  });

  let shareUrl = `${origin}/amplifi/share?source=connect&org=${encodeURIComponent(org.slug)}&relationship=${encodeURIComponent(relationship.id)}`;

  if (simplifi.ok && simplifi.record) {
    shareUrl = `${origin}/amplifi/share?capture=${encodeURIComponent(simplifi.record.captureId)}`;
    await emitCaptureCompleted(simplifi.record, org.slug);
  }

  await emitPulseEvent({
    product: 'amplifi',
    type: 'capture.completed',
    title: `Amplifi ready: ${relationship.name}`,
    detail: `${org.name} Connect — nurture and share`,
    href: shareUrl,
    objectId: simplifi.record?.id ?? relationship.id,
    tenantId: org.slug,
    priority: relationship.aiProfile.opportunityScore >= 70 ? 'high' : 'medium',
    metadata: {
      connectRelationshipId: relationship.id,
      opportunityScore: relationship.aiProfile.opportunityScore,
    },
  });

  return {
    simplifi: simplifi.ok
      ? { ok: true, captureId: simplifi.record?.captureId }
      : { ok: false, error: simplifi.error },
    amplifi: { ok: true, shareUrl },
  };
}
