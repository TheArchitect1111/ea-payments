import {
  getFactoryProject,
  saveFactoryProject,
  type FactoryFulfillmentRecord,
} from '@/lib/factory-project-store';

const CLIENT_CABINET_ROOT = '/EA Projects/02 Client Projects';
const CLIENT_CABINET_TEMPLATE = `${CLIENT_CABINET_ROOT}/_EA Client Project Template`;

function safeFolderName(value: string): string {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'Client';
}

export function canonicalClientCabinetPath(client: string): string {
  return `${CLIENT_CABINET_ROOT}/${safeFolderName(client)}`;
}

export type FactoryFulfillmentInput = {
  projectId: string;
  websiteStatus?: 'live' | 'quarantined' | 'draft_only' | 'skipped';
  websiteUrl?: string;
  previewPath?: string;
  portalSlug?: string;
  organizationId?: string;
  portalUrl?: string;
  portalLoginUrl?: string;
  portalProvisioned: boolean;
  loginCtaPresent: boolean;
  memberHomeSaved: boolean;
  directorGateVerified: boolean;
  controlPlane: {
    verified: boolean;
    manifestRecordId?: string;
    governanceRecordId?: string;
    acceptanceRecordId?: string;
  };
};

export function buildFactoryFulfillmentRecord(input: FactoryFulfillmentInput, client: string): FactoryFulfillmentRecord {
  const blockers: string[] = [];
  const siteStatus = input.websiteStatus === 'live'
    ? 'live'
    : input.websiteStatus === 'draft_only' || input.websiteStatus === 'quarantined'
      ? 'draft_only'
      : input.websiteStatus === 'skipped'
        ? 'skipped'
        : 'blocked';

  if (!input.controlPlane.verified) blockers.push('Control Plane acceptance is not verified.');
  if (siteStatus === 'blocked') blockers.push('Website fulfillment has no verified result.');
  if (siteStatus === 'draft_only') blockers.push('Website remains draft-only and requires review before public completion.');
  if (!input.portalProvisioned) blockers.push('Portal access is not provisioned.');
  if (!input.portalUrl || !input.portalLoginUrl) blockers.push('Portal URLs are incomplete.');
  if (!input.loginCtaPresent) blockers.push('Website-to-portal login CTA is not verified.');
  if (!input.memberHomeSaved) blockers.push('Portal member home is not verified.');
  if (!input.directorGateVerified && siteStatus === 'live') blockers.push('Experience Director gate is not verified.');

  const monitoringTargets: FactoryFulfillmentRecord['monitoring']['targets'] = [];
  if (input.websiteUrl) {
    monitoringTargets.push({ target: client, url: input.websiteUrl });
  }
  if (input.portalUrl) {
    monitoringTargets.push({
      target: client,
      url: input.portalUrl,
      route: input.portalSlug ? `/portal/${input.portalSlug}` : undefined,
    });
  }

  const verified = blockers.length === 0;
  const reviewRequired = blockers.length > 0 && blockers.every((item) => /draft-only|review/i.test(item));
  const now = new Date().toISOString();

  return {
    version: 1,
    status: verified ? 'verified' : reviewRequired ? 'review_required' : 'blocked',
    projectId: input.projectId,
    client,
    fileCabinet: {
      canonicalPath: canonicalClientCabinetPath(client),
      templatePath: CLIENT_CABINET_TEMPLATE,
      handoffReady: true,
    },
    site: {
      status: siteStatus,
      url: input.websiteUrl,
      previewPath: input.previewPath,
    },
    portal: {
      status: input.portalProvisioned ? 'provisioned' : 'blocked',
      url: input.portalUrl,
      loginUrl: input.portalLoginUrl,
      slug: input.portalSlug,
      organizationId: input.organizationId,
      accessProvisioned: input.portalProvisioned,
    },
    controlPlane: input.controlPlane,
    qa: {
      verified: verified || reviewRequired,
      directorGateVerified: input.directorGateVerified,
      loginCtaPresent: input.loginCtaPresent,
      memberHomeSaved: input.memberHomeSaved,
    },
    monitoring: {
      registered: monitoringTargets.length > 0,
      targets: monitoringTargets,
    },
    blockers,
    completedAt: verified ? now : undefined,
    updatedAt: now,
  };
}

export async function persistFactoryFulfillment(input: FactoryFulfillmentInput): Promise<FactoryFulfillmentRecord> {
  const project = await getFactoryProject(input.projectId);
  if (!project) throw new Error('Factory project not found while saving fulfillment proof.');

  const fulfillment = buildFactoryFulfillmentRecord(input, project.client);
  const nextStatus = fulfillment.status === 'verified' ? 'COMPLETE' : 'UNDER_REVIEW';
  const now = new Date().toISOString();
  const saved = await saveFactoryProject({
    ...project,
    pipelineStatus: nextStatus,
    fulfillment,
    updatedAt: now,
    error: fulfillment.status === 'blocked' ? fulfillment.blockers.join(' ') : undefined,
    activity: [
      ...project.activity,
      {
        at: now,
        from: project.pipelineStatus,
        to: nextStatus,
        worker: 'factory-fulfillment',
        detail: fulfillment.status === 'verified'
          ? 'Client system fulfillment verified'
          : `Client system fulfillment requires review: ${fulfillment.blockers.join(' ')}`,
      },
    ].slice(-100),
  });
  if (!saved.ok) throw new Error(saved.error || 'Could not persist Factory fulfillment proof.');
  return fulfillment;
}

export async function listFactoryMonitoringTargets(): Promise<FactoryFulfillmentRecord['monitoring']['targets']> {
  const { listFactoryProjects } = await import('@/lib/factory-project-store');
  const projects = await listFactoryProjects();
  const seen = new Set<string>();
  const targets: FactoryFulfillmentRecord['monitoring']['targets'] = [];
  for (const project of projects) {
    for (const target of project.fulfillment?.monitoring.targets || []) {
      if (!target.url || seen.has(target.url)) continue;
      seen.add(target.url);
      targets.push(target);
    }
  }
  return targets;
}
