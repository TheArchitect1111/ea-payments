/**
 * Pure research provider planners — decide what artifacts to emit (no AI).
 * Website network I/O stays in the TS provider (injectable for tests).
 */

export const DOCUMENT_SOURCE_TYPES = new Set([
  'pdf',
  'word',
  'powerpoint',
  'text',
  'voice',
  'other',
]);

export function getIntakePayload(context) {
  const outputs = context.outputs || [];
  for (let i = outputs.length - 1; i >= 0; i -= 1) {
    if (outputs[i].kind === 'intake') {
      return outputs[i].payload?.intake || null;
    }
  }
  return null;
}

export function resolveResearchUrl(context) {
  const intake = getIntakePayload(context);
  const fromIntake = intake?.normalized?.primaryUrl || intake?.sources?.find((s) => s.url)?.url;
  return (context.seed?.url || fromIntake || '').trim() || null;
}

export function planMetadataArtifact(context) {
  const intake = getIntakePayload(context);
  return {
    kind: 'metadata',
    providerId: 'metadata',
    sourceType: 'launch',
    data: {
      projectId: context.projectId,
      client: context.seed.client,
      goal: context.seed.goal,
      deliverable: context.seed.deliverable,
      industry: context.seed.industry || null,
      source: context.seed.source,
      hasUrl: Boolean(resolveResearchUrl(context)),
      attachmentCount: context.seed.attachments?.length ?? 0,
      primarySourceType: intake?.primarySourceType || null,
      contextSchemaVersion: context.schemaVersion,
      pipelineStatusAtCollect: context.pipelineStatus,
    },
  };
}

export function planOrganizationArtifact(context) {
  const intake = getIntakePayload(context);
  return {
    kind: 'organization',
    providerId: 'organization',
    sourceType: 'organization',
    sourceName: context.seed.client,
    data: {
      organizationName: intake?.normalized?.organizationName || context.seed.client,
      client: context.seed.client,
      goal: context.seed.goal,
      deliverable: context.seed.deliverable,
      industry: context.seed.industry || intake?.normalized?.industry || null,
      notes: context.seed.notes || null,
      primaryUrl: resolveResearchUrl(context),
    },
  };
}

export function planDocumentArtifacts(context) {
  const attachments = context.seed.attachments || [];
  const intake = getIntakePayload(context);
  const fromIntake = (intake?.sources || []).filter((s) => DOCUMENT_SOURCE_TYPES.has(s.type));

  const planned = [];

  attachments.forEach((attachment, index) => {
    const type = attachment.type || 'other';
    if (type === 'image') return;
    planned.push({
      kind: 'document',
      providerId: 'document',
      sourceType: type,
      sourceName: attachment.name || `attachment-${index}`,
      sourceUrl: attachment.url,
      data: {
        attachmentIndex: index,
        name: attachment.name || null,
        type,
        url: attachment.url || null,
        textPreview: attachment.textPreview || null,
        origin: 'seed.attachments',
      },
    });
  });

  fromIntake.forEach((source, index) => {
    const already = planned.some(
      (item) =>
        item.sourceName === (source.name || source.label) ||
        (source.url && item.sourceUrl === source.url),
    );
    if (already) return;
    if (source.type === 'image') return;
    planned.push({
      kind: 'document',
      providerId: 'document',
      sourceType: source.type,
      sourceName: source.name || source.label || `intake-doc-${index}`,
      sourceUrl: source.url,
      data: {
        name: source.name || source.label || null,
        type: source.type,
        url: source.url || null,
        textPreview: source.textPreview || null,
        origin: 'intake.sources',
      },
    });
  });

  return planned;
}

export function planBrandingArtifacts(context) {
  const attachments = (context.seed.attachments || []).filter((a) => a.type === 'image');
  const url = resolveResearchUrl(context);
  const planned = [];

  attachments.forEach((attachment, index) => {
    planned.push({
      kind: 'branding',
      providerId: 'branding',
      sourceType: 'image',
      sourceName: attachment.name || `image-${index}`,
      sourceUrl: attachment.url,
      data: {
        brandName: context.seed.client,
        assetType: 'image',
        name: attachment.name || null,
        url: attachment.url || null,
        textPreview: attachment.textPreview || null,
        origin: 'seed.attachments',
      },
    });
  });

  if (url) {
    let hostname = null;
    try {
      hostname = new URL(url).hostname;
    } catch {
      hostname = null;
    }
    planned.push({
      kind: 'branding',
      providerId: 'branding',
      sourceType: 'website',
      sourceUrl: url,
      sourceName: context.seed.client,
      data: {
        brandName: context.seed.client,
        websiteUrl: url,
        hostname,
        faviconGuess: hostname ? `https://${hostname}/favicon.ico` : null,
        note: 'Branding signals from URL/seed — no AI palette extraction',
        origin: 'seed.url',
      },
    });
  }

  if (planned.length === 0) {
    planned.push({
      kind: 'branding',
      providerId: 'branding',
      sourceType: 'organization',
      sourceName: context.seed.client,
      data: {
        brandName: context.seed.client,
        websiteUrl: null,
        note: 'Name-only branding seed — visual assets not provided',
        origin: 'seed.client',
      },
    });
  }

  return planned;
}

export function providerCanCollect(providerId, context) {
  switch (providerId) {
    case 'metadata':
    case 'organization':
    case 'branding':
      return true;
    case 'website':
      return Boolean(resolveResearchUrl(context));
    case 'document':
      return planDocumentArtifacts(context).length > 0;
    default:
      return false;
  }
}
