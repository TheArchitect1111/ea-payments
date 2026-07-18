/**
 * Intake classification + normalization (pure).
 * Mirror of lib/factory-intake-classify.mjs — keep behavior identical for unit tests.
 * No crawling / file parsing — metadata only in Phase 2.
 */
import type {
  FactoryAttachmentMeta,
  FactoryIntakeRecord,
  FactoryIntakeSource,
  FactoryProject,
  FactorySourceType,
} from '@/lib/factory-project-store';

export type IntakeClassifyInput = {
  client: string;
  goal: string;
  deliverable: string;
  industry?: string;
  notes?: string;
  url?: string;
  attachments?: FactoryAttachmentMeta[];
};

function attachmentToSourceType(type: FactoryAttachmentMeta['type']): FactorySourceType {
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

/**
 * Determine ordered sources and primary type from launch payload.
 * Priority: website URL > first attachment > organization name > free text.
 */
export function classifyIntakeSources(input: IntakeClassifyInput): {
  primarySourceType: FactorySourceType;
  sources: FactoryIntakeSource[];
} {
  const sources: FactoryIntakeSource[] = [];
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

export function buildIntakeRecord(
  project: Pick<
    FactoryProject,
    'id' | 'client' | 'goal' | 'deliverable' | 'industry' | 'notes' | 'url' | 'attachments'
  >,
  completedAt = new Date().toISOString(),
): FactoryIntakeRecord {
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
