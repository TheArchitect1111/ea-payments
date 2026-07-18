/**
 * Pure intake classification (ESM) — unit-tested directly from Node.
 * Keep behavior in sync with TypeScript wrappers in factory-intake.ts.
 */

export function attachmentToSourceType(type) {
  switch (type) {
    case 'pdf':
      return 'pdf';
    case 'image':
      return 'image';
    case 'powerpoint':
      return 'powerpoint';
    case 'word':
      return 'word';
    case 'text':
      return 'text';
    case 'voice':
      return 'voice';
    default:
      return 'other';
  }
}

export function classifyIntakeSources(input) {
  const sources = [];
  const url = input.url?.trim();
  const notes = input.notes?.trim();
  const client = input.client?.trim();

  if (url) {
    sources.push({
      type: 'website',
      label: 'Website URL',
      url,
    });
  }

  (input.attachments ?? []).forEach((attachment, attachmentIndex) => {
    const type = attachmentToSourceType(attachment.type);
    sources.push({
      type,
      label: attachment.name || `${type} attachment`,
      url: attachment.url,
      textPreview: attachment.textPreview,
      name: attachment.name,
      attachmentIndex,
    });
  });

  if (sources.length === 0 && client) {
    sources.push({
      type: 'organization',
      label: 'Organization / company name',
      name: client,
      textPreview: notes ? notes.slice(0, 2000) : undefined,
    });
  }

  if (sources.length === 0) {
    sources.push({
      type: 'text',
      label: 'Plain text launch',
      textPreview: [client, input.goal, notes].filter(Boolean).join(' — ').slice(0, 2000),
    });
  }

  return {
    primarySourceType: sources[0]?.type ?? 'text',
    sources,
  };
}

export function buildIntakeRecord(project, completedAt = new Date().toISOString()) {
  const classified = classifyIntakeSources({
    client: project.client,
    goal: project.goal,
    deliverable: project.deliverable,
    industry: project.industry,
    notes: project.notes,
    url: project.url,
    attachments: project.attachments,
  });

  return {
    version: 1,
    projectId: project.id,
    primarySourceType: classified.primarySourceType,
    sources: classified.sources,
    normalized: {
      client: project.client,
      organizationName: project.client,
      goal: project.goal,
      deliverable: project.deliverable,
      industry: project.industry,
      notes: project.notes,
      primaryUrl: project.url || classified.sources.find((s) => s.url)?.url,
    },
    completedAt,
  };
}
