/**
 * ProjectContext — long-term execution contract for all Factory workers.
 * Workers read this context and append structured outputs; they do not overwrite history.
 * Only the Orchestrator schedules/dispatches workers.
 */
import crypto from 'node:crypto';
import {
  appendProjectContextOutput as appendOutputPure,
  createContextOutputId,
  createProjectContext as createContextPure,
  getLatestProjectContextOutput as getLatestPure,
  listProjectContextOutputs as listOutputsPure,
  migrateProjectContext as migratePure,
  PROJECT_CONTEXT_SCHEMA_VERSION,
  withProjectContextStatus as withStatusPure,
} from '@/lib/factory-project-context.mjs';
import {
  getFactoryProject,
  saveFactoryProject,
  type FactoryAttachmentMeta,
  type FactoryIntakeRecord,
  type FactoryPipelineStatus,
  type FactoryProject,
  type FactoryProjectSource,
} from '@/lib/factory-project-store';
import { transitionFactoryProject } from '@/lib/factory-project';

export { PROJECT_CONTEXT_SCHEMA_VERSION, createContextOutputId };

export type ProjectContextOutputKind =
  | 'intake'
  | 'research'
  | 'discovery'
  | 'planning'
  | 'production'
  | 'qa'
  | 'publishing'
  | 'notification'
  | 'system';

export type ProjectContextOutput = {
  id: string;
  kind: ProjectContextOutputKind;
  worker: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

export type ProjectContextSeed = {
  client: string;
  goal: string;
  deliverable: string;
  industry?: string;
  notes?: string;
  url?: string;
  attachments: FactoryAttachmentMeta[];
  source: FactoryProjectSource;
};

export type ProjectContext = {
  schemaVersion: number;
  projectId: string;
  seed: ProjectContextSeed;
  pipelineStatus: FactoryPipelineStatus;
  outputs: ProjectContextOutput[];
  /** Append-only research (and future) artifacts with provenance. */
  artifacts: Array<{
    schemaVersion: number;
    id: string;
    projectId: string;
    kind: string;
    providerId: string;
    createdAt: string;
    provenance: Record<string, unknown>;
    data: Record<string, unknown>;
  }>;
  createdAt: string;
  updatedAt: string;
};

function seedFromProject(project: FactoryProject) {
  return {
    projectId: project.id,
    client: project.client,
    goal: project.goal,
    deliverable: project.deliverable,
    industry: project.industry,
    notes: project.notes,
    url: project.url,
    attachments: project.attachments ?? [],
    source: project.source,
  };
}

function hydrateFromLegacyIntake(project: FactoryProject, context: ProjectContext): ProjectContext {
  if (!project.intake || getLatestPure(context, 'intake')) return context;
  return appendOutputPure(context, {
    id: createContextOutputId('intake', 'intake', 'legacy'),
    kind: 'intake',
    worker: 'intake',
    createdAt: project.intake.completedAt || project.updatedAt,
    payload: { intake: project.intake },
  }) as ProjectContext;
}

/** Build or migrate context from a persisted project (does not save). */
export function projectContextFromProject(project: FactoryProject): ProjectContext {
  let context: ProjectContext;
  if (project.context) {
    context = migratePure(project.context) as ProjectContext;
  } else {
    context = createContextPure(
      seedFromProject(project),
      project.pipelineStatus,
      project.createdAt,
    ) as ProjectContext;
  }

  context = {
    ...context,
    pipelineStatus: project.pipelineStatus,
  };

  return hydrateFromLegacyIntake(project, context);
}

export async function loadProjectContext(projectId: string): Promise<ProjectContext | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;
  return projectContextFromProject(project);
}

export async function ensureProjectContext(projectId: string): Promise<ProjectContext | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;

  const context = projectContextFromProject(project);
  const needsPersist =
    !project.context ||
    project.context.schemaVersion !== context.schemaVersion ||
    (project.context.outputs?.length ?? 0) !== context.outputs.length ||
    (project.context.artifacts?.length ?? 0) !== (context.artifacts?.length ?? 0) ||
    project.context.pipelineStatus !== context.pipelineStatus;

  if (needsPersist) {
    await saveFactoryProject({
      ...project,
      context,
      updatedAt: new Date().toISOString(),
    });
  }
  return context;
}

/**
 * Append a structured worker output. Never overwrites prior outputs.
 * Optionally syncs pipeline status on the project row.
 */
export async function appendProjectContextOutput(
  projectId: string,
  input: {
    kind: ProjectContextOutputKind;
    worker: string;
    payload: Record<string, unknown>;
    id?: string;
    pipelineStatus?: FactoryPipelineStatus;
    detail?: string;
    /** Compat: mirror intake payload onto project.intake */
    mirrorIntake?: FactoryIntakeRecord;
  },
): Promise<{ context: ProjectContext; project: FactoryProject } | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;

  const at = new Date().toISOString();
  let context = projectContextFromProject(project);
  context = appendOutputPure(context, {
    id: input.id || createContextOutputId(input.worker, input.kind, crypto.randomBytes(3).toString('hex')),
    kind: input.kind,
    worker: input.worker,
    createdAt: at,
    payload: input.payload,
  }) as ProjectContext;

  if (input.pipelineStatus) {
    context = withStatusPure(context, input.pipelineStatus, at) as ProjectContext;
  }

  if (input.pipelineStatus && input.pipelineStatus !== project.pipelineStatus) {
    const transitioned = await transitionFactoryProject(
      projectId,
      input.pipelineStatus,
      input.worker,
      input.detail,
      {
        context,
        intake: input.mirrorIntake ?? project.intake,
      },
    );
    if (!transitioned) return null;
    return { context: projectContextFromProject(transitioned), project: transitioned };
  }

  const next: FactoryProject = {
    ...project,
    context,
    intake: input.mirrorIntake ?? project.intake,
    updatedAt: at,
  };
  await saveFactoryProject(next);
  return { context, project: next };
}

/** Status-only update that keeps context.pipelineStatus in sync (used by workers). */
export async function setProjectContextStatus(
  projectId: string,
  pipelineStatus: FactoryPipelineStatus,
  worker: string,
  detail?: string,
): Promise<{ context: ProjectContext; project: FactoryProject } | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;

  const at = new Date().toISOString();
  let context = projectContextFromProject(project);
  context = withStatusPure(context, pipelineStatus, at) as ProjectContext;

  const transitioned = await transitionFactoryProject(projectId, pipelineStatus, worker, detail, {
    context,
  });
  if (!transitioned) return null;
  return { context: projectContextFromProject(transitioned), project: transitioned };
}

export function listProjectContextOutputs(
  context: ProjectContext,
  kind?: ProjectContextOutputKind,
): ProjectContextOutput[] {
  return listOutputsPure(context, kind) as ProjectContextOutput[];
}

export function getLatestProjectContextOutput(
  context: ProjectContext,
  kind: ProjectContextOutputKind,
): ProjectContextOutput | null {
  return getLatestPure(context, kind) as ProjectContextOutput | null;
}

export function migrateProjectContext(raw: unknown): ProjectContext {
  return migratePure(raw) as ProjectContext;
}

export function createProjectContext(
  seed: {
    projectId: string;
    client: string;
    goal: string;
    deliverable: string;
    industry?: string;
    notes?: string;
    url?: string;
    attachments?: FactoryAttachmentMeta[];
    source?: FactoryProjectSource;
  },
  pipelineStatus: FactoryPipelineStatus = 'CREATED',
): ProjectContext {
  return createContextPure(seed, pipelineStatus) as ProjectContext;
}
