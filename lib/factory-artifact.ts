/**
 * ArtifactService — append-only artifacts with provenance (research + discovery + planning).
 * Artifacts live on ProjectContext.artifacts[]; never overwrite history.
 * WorkOrders are persisted as kind: work_order artifacts (ProjectContext schema unchanged).
 */
import crypto from 'node:crypto';
import {
  appendArtifacts as appendArtifactsPure,
  ARTIFACT_KINDS,
  ARTIFACT_SCHEMA_VERSION,
  createArtifact as createArtifactPure,
  createArtifactId,
  DISCOVERY_ARTIFACT_KINDS,
  getArtifactById as getArtifactByIdPure,
  listArtifacts as listArtifactsPure,
  listArtifactsByCapability as listByCapabilityPure,
  listDiscoveryArtifacts as listDiscoveryPure,
  listPlanningArtifacts as listPlanningPure,
  listResearchArtifacts as listResearchPure,
  listWorkOrderArtifacts as listWorkOrderArtsPure,
  migrateArtifact,
  PLANNING_ARTIFACT_KINDS,
  PLANNING_DOCUMENT_KINDS,
  PRODUCTION_ARTIFACT_KINDS,
  RESEARCH_ARTIFACT_KINDS,
} from '@/lib/factory-artifact.mjs';
import {
  getLatestProjectContextOutput,
  loadProjectContext,
  projectContextFromProject,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getFactoryProject, saveFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import {
  listWorkOrdersFromArtifacts,
  workOrderToArtifactDraft,
  type WorkOrder,
} from '@/lib/factory-work-order';

export {
  ARTIFACT_KINDS,
  ARTIFACT_SCHEMA_VERSION,
  createArtifactId,
  DISCOVERY_ARTIFACT_KINDS,
  migrateArtifact,
  PLANNING_ARTIFACT_KINDS,
  PLANNING_DOCUMENT_KINDS,
  PRODUCTION_ARTIFACT_KINDS,
  RESEARCH_ARTIFACT_KINDS,
};

export type ResearchArtifactKind =
  | 'website'
  | 'organization'
  | 'document'
  | 'branding'
  | 'metadata';

export type DiscoveryArtifactKind =
  | 'organization_profile'
  | 'programs'
  | 'services'
  | 'audience_segments'
  | 'content_inventory'
  | 'technology_stack'
  | 'learning_opportunities'
  | 'accessibility_findings'
  | 'automation_opportunities'
  | 'recommendations';

export type PlanningArtifactKind =
  | 'executive_summary'
  | 'information_architecture'
  | 'website_sitemap'
  | 'navigation_tree'
  | 'portal_blueprint'
  | 'learning_architecture'
  | 'content_strategy'
  | 'deliverables_matrix'
  | 'production_plan'
  | 'milestone_plan'
  | 'review_checklist'
  | 'work_order';

export type ProductionArtifactKind =
  | 'website_site'
  | 'deliverable'
  | 'review_gate'
  | 'production_progress';

export type ExperienceDirectorArtifactKind = 'experience_review';

export type ArtifactKind =
  | ResearchArtifactKind
  | DiscoveryArtifactKind
  | PlanningArtifactKind
  | ProductionArtifactKind
  | ExperienceDirectorArtifactKind;

export type ArtifactProvenance = {
  capabilityId: string;
  sourceType: string;
  sourceUrl?: string;
  sourceName?: string;
  intakeOutputId?: string;
  seedClient?: string;
  collectedAt: string;
  notes?: string;
  sourceArtifactIds?: string[];
};

export type Artifact = {
  schemaVersion: number;
  id: string;
  projectId: string;
  kind: ArtifactKind;
  providerId: string;
  createdAt: string;
  provenance: ArtifactProvenance;
  data: Record<string, unknown>;
};

export type ArtifactDraft = {
  id?: string;
  kind: ArtifactKind;
  providerId: string;
  provenance: Omit<ArtifactProvenance, 'collectedAt'> & { collectedAt?: string };
  data: Record<string, unknown>;
};

export function createArtifact(
  input: {
    id: string;
    projectId: string;
    kind: ArtifactKind;
    providerId: string;
    provenance: ArtifactProvenance;
    data?: Record<string, unknown>;
    createdAt?: string;
  },
  at?: string,
): Artifact {
  return createArtifactPure(input, at) as Artifact;
}

export function listArtifacts(context: ProjectContext, kind?: ArtifactKind): Artifact[] {
  return listArtifactsPure(context.artifacts || [], kind) as Artifact[];
}

export function listArtifactsByCapability(
  context: ProjectContext,
  capabilityId: string,
): Artifact[] {
  return listByCapabilityPure(context.artifacts || [], capabilityId) as Artifact[];
}

export function listResearchArtifacts(context: ProjectContext): Artifact[] {
  return listResearchPure(context.artifacts || []) as Artifact[];
}

export function listDiscoveryArtifacts(context: ProjectContext): Artifact[] {
  return listDiscoveryPure(context.artifacts || []) as Artifact[];
}

/** Planning document artifacts (excludes work_order carriers). */
export function listPlanningArtifacts(context: ProjectContext): Artifact[] {
  return listPlanningPure(context.artifacts || []) as Artifact[];
}

export function listWorkOrderArtifacts(context: ProjectContext): Artifact[] {
  return listWorkOrderArtsPure(context.artifacts || []) as Artifact[];
}

export function listWorkOrders(context: ProjectContext): WorkOrder[] {
  return listWorkOrdersFromArtifacts(context.artifacts || []);
}

export function getArtifactById(context: ProjectContext, id: string): Artifact | null {
  return getArtifactByIdPure(context.artifacts || [], id) as Artifact | null;
}

function intakeOutputIdFrom(context: ProjectContext): string | undefined {
  return getLatestProjectContextOutput(context, 'intake')?.id;
}

export function provenanceFromContext(
  context: ProjectContext,
  sourceType: string,
  extra?: Partial<ArtifactProvenance>,
): ArtifactProvenance {
  const at = new Date().toISOString();
  return {
    capabilityId: 'research',
    sourceType,
    sourceUrl: extra?.sourceUrl ?? context.seed.url,
    sourceName: extra?.sourceName,
    intakeOutputId: extra?.intakeOutputId ?? intakeOutputIdFrom(context),
    seedClient: context.seed.client,
    collectedAt: extra?.collectedAt || at,
    notes: extra?.notes,
    sourceArtifactIds: extra?.sourceArtifactIds,
  };
}

export function provenanceFromResearchArtifacts(
  context: ProjectContext,
  sourceArtifactIds: string[],
  extra?: Partial<ArtifactProvenance>,
): ArtifactProvenance {
  const at = new Date().toISOString();
  const ids = [...new Set(sourceArtifactIds.filter(Boolean))];
  if (ids.length === 0) {
    throw new Error('Discovery provenance requires at least one sourceArtifactId');
  }
  return {
    capabilityId: 'discovery',
    sourceType: extra?.sourceType || 'research_artifacts',
    sourceUrl: extra?.sourceUrl,
    sourceName: extra?.sourceName,
    intakeOutputId: extra?.intakeOutputId ?? intakeOutputIdFrom(context),
    seedClient: extra?.seedClient ?? context.seed.client,
    collectedAt: extra?.collectedAt || at,
    notes: extra?.notes,
    sourceArtifactIds: ids,
  };
}

/** Provenance for Planning artifacts / WorkOrders — must link Discovery artifact ids. */
export function provenanceFromDiscoveryArtifacts(
  context: ProjectContext,
  sourceArtifactIds: string[],
  extra?: Partial<ArtifactProvenance>,
): ArtifactProvenance {
  const at = new Date().toISOString();
  const ids = [...new Set(sourceArtifactIds.filter(Boolean))];
  if (ids.length === 0) {
    throw new Error('Planning provenance requires at least one Discovery sourceArtifactId');
  }
  return {
    capabilityId: 'planning',
    sourceType: extra?.sourceType || 'discovery_artifacts',
    sourceUrl: extra?.sourceUrl,
    sourceName: extra?.sourceName,
    intakeOutputId: extra?.intakeOutputId ?? intakeOutputIdFrom(context),
    seedClient: extra?.seedClient ?? context.seed.client,
    collectedAt: extra?.collectedAt || at,
    notes: extra?.notes,
    sourceArtifactIds: ids,
  };
}

export async function appendArtifacts(
  projectId: string,
  drafts: ArtifactDraft[],
): Promise<{ context: ProjectContext; project: FactoryProject; appended: Artifact[] } | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;

  const at = new Date().toISOString();
  const context = projectContextFromProject(project);

  const prepared = drafts.map((draft) =>
    createArtifact(
      {
        id:
          draft.id ||
          createArtifactId(draft.providerId, draft.kind, crypto.randomBytes(3).toString('hex')),
        projectId,
        kind: draft.kind,
        providerId: draft.providerId,
        provenance: {
          ...draft.provenance,
          collectedAt: draft.provenance.collectedAt || at,
        },
        data: draft.data,
      },
      at,
    ),
  );

  const { artifacts, appended } = appendArtifactsPure(context.artifacts || [], prepared, at);
  if (appended.length === 0) {
    return { context, project, appended: [] };
  }

  const nextContext: ProjectContext = {
    ...context,
    artifacts: artifacts as Artifact[],
    updatedAt: at,
  };

  const next: FactoryProject = {
    ...project,
    context: nextContext as FactoryProject['context'],
    updatedAt: at,
  };
  await saveFactoryProject(next);

  console.info('[factory-artifact] appended', {
    projectId,
    appended: appended.length,
    total: artifacts.length,
    kinds: (appended as Artifact[]).map((item) => item.kind),
    capabilityIds: [
      ...new Set((appended as Artifact[]).map((item) => item.provenance.capabilityId)),
    ],
  });

  return {
    context: nextContext,
    project: next,
    appended: appended as Artifact[],
  };
}

/** Append WorkOrders as work_order artifacts (append-only). */
export async function appendWorkOrders(
  projectId: string,
  workOrders: WorkOrder[],
): Promise<{ context: ProjectContext; project: FactoryProject; appended: Artifact[]; workOrders: WorkOrder[] } | null> {
  const drafts = workOrders.map((wo) => workOrderToArtifactDraft(wo) as ArtifactDraft);
  const result = await appendArtifacts(projectId, drafts);
  if (!result) return null;
  return {
    ...result,
    workOrders: listWorkOrdersFromArtifacts(result.context.artifacts || []),
  };
}

export async function loadArtifacts(projectId: string): Promise<Artifact[]> {
  const context = await loadProjectContext(projectId);
  if (!context) return [];
  return listArtifacts(context);
}
