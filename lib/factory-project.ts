/**
 * EA Factory Runtime — Phase 1 project domain.
 * Thin wrapper over EACP package generation with an async pipeline.
 */
import crypto from 'node:crypto';
import { parseEACPCommand, type EACPLaunchInput } from '@/lib/eacp-launch';
import { createProjectContext as createProjectContextPure } from '@/lib/factory-project-context.mjs';
import {
  getFactoryProject,
  listFactoryProjects,
  saveFactoryProject,
  type FactoryActivity,
  type FactoryAttachmentMeta,
  type FactoryPipelineStatus,
  type FactoryProject,
  type FactoryProjectSource,
} from '@/lib/factory-project-store';

export type {
  FactoryActivity,
  FactoryAttachmentMeta,
  FactoryPipelineStatus,
  FactoryProject,
  FactoryProjectSource,
};

export type LaunchProjectInput = {
  command?: string;
  client?: string;
  companyName?: string;
  url?: string;
  website?: string;
  goal?: string;
  deliverable?: string;
  industry?: string;
  notes?: string;
  text?: string;
  source?: FactoryProjectSource;
  attachments?: FactoryAttachmentMeta[];
};

const FACTORY_ORG = 'ea-factory';

export function factoryOrganizationId(): string {
  return FACTORY_ORG;
}

function createProjectId(): string {
  return `proj-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
}

function extractUrl(text: string): string | undefined {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match?.[0]?.replace(/[),.]+$/, '');
}

function extractClientFromLaunchCommand(command: string): string | undefined {
  const trimmed = command.trim();
  const launchMatch = trimmed.match(/^launch\s+(.+)$/i);
  if (!launchMatch) return undefined;
  const rest = launchMatch[1].trim();
  if (/^https?:\/\//i.test(rest)) return undefined;
  const beforeAnd = rest.split(/\s+and\s+/i)[0]?.trim();
  return beforeAnd || rest || undefined;
}

export function resolveLaunchProjectInput(body: LaunchProjectInput): {
  input?: EACPLaunchInput & { url?: string; attachments: FactoryAttachmentMeta[] };
  missing: string[];
  correction?: string;
} {
  const commandInput = body.command ? parseEACPCommand(body.command) : {};
  const commandText = body.command?.trim() || '';
  const url =
    body.url?.trim() ||
    body.website?.trim() ||
    (commandText ? extractUrl(commandText) : undefined) ||
    (body.text ? extractUrl(body.text) : undefined);

  const clientFromLaunch = commandText ? extractClientFromLaunchCommand(commandText) : undefined;
  let clientFromUrl: string | undefined;
  if (url) {
    try {
      clientFromUrl = new URL(url).hostname.replace(/^www\./, '');
    } catch {
      clientFromUrl = undefined;
    }
  }
  const client =
    body.client?.trim() ||
    body.companyName?.trim() ||
    commandInput.client?.trim() ||
    clientFromLaunch ||
    clientFromUrl ||
    undefined;

  const notesParts = [
    body.notes?.trim(),
    commandInput.notes?.trim(),
    body.text?.trim(),
    url ? `Source URL: ${url}` : undefined,
  ].filter(Boolean);

  const goal =
    body.goal?.trim() ||
    commandInput.goal?.trim() ||
    (url || client
      ? 'Complete client transformation package'
      : undefined);

  const deliverable =
    body.deliverable?.trim() ||
    commandInput.deliverable?.trim() ||
    'Website + Portal';

  if (!client || !goal) {
    return {
      missing: [!client ? 'client' : '', !goal ? 'goal' : ''].filter(Boolean),
      correction:
        'Provide a client/company name or URL, and a goal (or use: Launch Acme Roofing / Launch https://acme.com).',
    };
  }

  return {
    input: {
      client,
      goal,
      deliverable,
      industry: body.industry?.trim() || commandInput.industry?.trim() || undefined,
      notes: notesParts.join('\n') || undefined,
      url,
      attachments: body.attachments ?? [],
    },
    missing: [],
  };
}

export async function createFactoryProject(
  body: LaunchProjectInput,
): Promise<{ ok: true; project: FactoryProject } | { ok: false; missing: string[]; correction?: string }> {
  const resolved = resolveLaunchProjectInput(body);
  if (!resolved.input) {
    return { ok: false, missing: resolved.missing, correction: resolved.correction };
  }

  const now = new Date().toISOString();
  const id = createProjectId();
  const source = body.source || 'api';
  const context = createProjectContextPure(
    {
      projectId: id,
      client: resolved.input.client,
      goal: resolved.input.goal,
      deliverable: resolved.input.deliverable,
      industry: resolved.input.industry,
      notes: resolved.input.notes,
      url: resolved.input.url,
      attachments: resolved.input.attachments,
      source,
    },
    'CREATED',
    now,
  );
  const project: FactoryProject = {
    version: 1,
    id,
    client: resolved.input.client,
    goal: resolved.input.goal,
    deliverable: resolved.input.deliverable,
    industry: resolved.input.industry,
    notes: resolved.input.notes,
    url: resolved.input.url,
    attachments: resolved.input.attachments,
    source,
    pipelineStatus: 'CREATED',
    context,
    createdAt: now,
    updatedAt: now,
    queuedAt: undefined,
    activity: [
      {
        at: now,
        from: null,
        to: 'CREATED',
        worker: 'launcher',
        detail: 'Project created',
      },
    ],
  };

  const saved = await saveFactoryProject(project);
  if (!saved.ok) {
    return {
      ok: false,
      missing: ['storage'],
      correction:
        saved.error ||
        'Could not save the project. Check Creative Studio / Airtable, then try Launch again.',
    };
  }
  return { ok: true, project };
}

export async function transitionFactoryProject(
  projectId: string,
  to: FactoryPipelineStatus,
  worker: string,
  detail?: string,
  patch?: Partial<
    Pick<FactoryProject, 'launchId' | 'launchReviewUrl' | 'error' | 'intake' | 'context'>
  >,
): Promise<FactoryProject | null> {
  const project = await getFactoryProject(projectId);
  if (!project) return null;

  const from = project.pipelineStatus;
  if (from === to && !patch) return project;

  const now = new Date().toISOString();
  const activity: FactoryActivity = {
    at: now,
    from,
    to,
    worker,
    detail,
  };

  const nextContext =
    patch?.context ??
    (project.context
      ? {
          ...project.context,
          pipelineStatus: to,
          updatedAt: now,
        }
      : undefined);

  const next: FactoryProject = {
    ...project,
    ...patch,
    pipelineStatus: to,
    context: nextContext,
    updatedAt: now,
    queuedAt: to === 'QUEUED' ? now : project.queuedAt,
    activity: [...project.activity, activity].slice(-100),
    error: to === 'FAILED' ? patch?.error || project.error : to === 'CANCELLED' ? project.error : undefined,
  };

  console.info('[factory-project] transition', {
    projectId,
    from,
    to,
    worker,
    detail,
  });

  await saveFactoryProject(next);
  return next;
}

export async function getProject(id: string): Promise<FactoryProject | null> {
  return getFactoryProject(id);
}

export async function listProjects(): Promise<FactoryProject[]> {
  return listFactoryProjects();
}

export function canRestart(project: FactoryProject): boolean {
  return project.pipelineStatus === 'FAILED' || project.pipelineStatus === 'CANCELLED';
}

/** Mid-pipeline statuses that can be nudged forward without a full restart. */
export function canContinueFactoryProject(project: FactoryProject): boolean {
  return (
    project.pipelineStatus === 'QUEUED' ||
    project.pipelineStatus === 'INTAKE' ||
    project.pipelineStatus === 'INTAKE_COMPLETE' ||
    project.pipelineStatus === 'RESEARCHING' ||
    project.pipelineStatus === 'DISCOVERING' ||
    project.pipelineStatus === 'PLANNING' ||
    project.pipelineStatus === 'BUILDING' ||
    project.pipelineStatus === 'GENERATING'
  );
}

export function canCancel(project: FactoryProject): boolean {
  return (
    project.pipelineStatus === 'CREATED' ||
    project.pipelineStatus === 'QUEUED' ||
    project.pipelineStatus === 'GENERATING' ||
    project.pipelineStatus === 'INTAKE' ||
    project.pipelineStatus === 'INTAKE_COMPLETE' ||
    project.pipelineStatus === 'RESEARCHING'
  );
}
