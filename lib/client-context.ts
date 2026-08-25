import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { listFactoryProjects, type FactoryProject } from '@/lib/factory-project-store';

export type ClientApprovalRules = {
  publishRequiresApproval: boolean;
  sendExternalMessagesRequiresApproval: boolean;
  pricingChangesRequireApproval: boolean;
  destructiveActionsRequireApproval: boolean;
};

export type ClientContextProfile = {
  version: 1;
  clientId: string;
  organizationName: string;
  aliases: string[];
  industry?: string;
  mission?: string;
  audience: string[];
  offers: string[];
  goals: string[];
  differentiators: string[];
  brandVoice?: string;
  brandRules: string[];
  links: Record<string, string>;
  contacts: Array<{ name: string; role?: string; email?: string; phone?: string }>;
  approvalRules: ClientApprovalRules;
  notes: string[];
  createdAt: string;
  updatedAt: string;
};

export type ClientContext = {
  profile: ClientContextProfile;
  projects: Array<{
    id: string;
    goal: string;
    deliverable: string;
    pipelineStatus: string;
    url?: string;
    updatedAt: string;
    latestOutputs: Record<string, unknown>;
  }>;
  generatedAt: string;
};

const ORG_ID = 'ea-client-context';
const DEFAULT_APPROVAL_RULES: ClientApprovalRules = {
  publishRequiresApproval: true,
  sendExternalMessagesRequiresApproval: true,
  pricingChangesRequireApproval: true,
  destructiveActionsRequireApproval: true,
};

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function recordId(clientId: string) {
  return `client-context-${slug(clientId)}`;
}

export function createClientProfile(input: Partial<ClientContextProfile> & { organizationName: string; clientId?: string }): ClientContextProfile {
  const now = new Date().toISOString();
  const clientId = input.clientId?.trim() || slug(input.organizationName);
  if (!clientId) throw new Error('Client Context requires a clientId or organizationName.');
  return {
    version: 1,
    clientId,
    organizationName: input.organizationName.trim(),
    aliases: input.aliases ?? [],
    industry: input.industry,
    mission: input.mission,
    audience: input.audience ?? [],
    offers: input.offers ?? [],
    goals: input.goals ?? [],
    differentiators: input.differentiators ?? [],
    brandVoice: input.brandVoice,
    brandRules: input.brandRules ?? [],
    links: input.links ?? {},
    contacts: input.contacts ?? [],
    approvalRules: { ...DEFAULT_APPROVAL_RULES, ...(input.approvalRules ?? {}) },
    notes: input.notes ?? [],
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
}

export async function saveClientProfile(profile: ClientContextProfile) {
  const normalized = createClientProfile(profile);
  const result = await saveStudioRecord({
    recordType: 'media',
    id: recordId(normalized.clientId),
    organizationId: ORG_ID,
    title: `Client Context — ${normalized.organizationName}`,
    payload: normalized,
  });
  return { ...result, profile: normalized };
}

export async function getClientProfile(clientId: string): Promise<ClientContextProfile | null> {
  const stored = await loadStudioRecord<ClientContextProfile>('media', recordId(clientId));
  if (!stored || stored.version !== 1 || !stored.organizationName) return null;
  return stored;
}

export async function listClientProfiles(): Promise<ClientContextProfile[]> {
  const rows = await listStudioRecords<ClientContextProfile>('media', ORG_ID);
  return rows.filter((row) => row?.version === 1 && Boolean(row.clientId));
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function projectMatchesClient(project: FactoryProject, profile: ClientContextProfile) {
  const candidates = [profile.organizationName, ...profile.aliases, profile.clientId].map(normalizeName).filter(Boolean);
  const projectName = normalizeName(project.client);
  return candidates.some((candidate) => candidate === projectName || projectName.includes(candidate) || candidate.includes(projectName));
}

function summarizeProject(project: FactoryProject) {
  const latestOutputs: Record<string, unknown> = {};
  for (const output of project.context?.outputs ?? []) latestOutputs[output.kind] = output.payload;
  return {
    id: project.id,
    goal: project.goal,
    deliverable: project.deliverable,
    pipelineStatus: project.pipelineStatus,
    url: project.url,
    updatedAt: project.updatedAt,
    latestOutputs,
  };
}

export async function buildClientContext(clientId: string): Promise<ClientContext | null> {
  const profile = await getClientProfile(clientId);
  if (!profile) return null;
  const projects = (await listFactoryProjects()).filter((project) => projectMatchesClient(project, profile));
  return {
    profile,
    projects: projects.map(summarizeProject),
    generatedAt: new Date().toISOString(),
  };
}

export async function resolveClientContext(input?: Record<string, unknown>): Promise<ClientContext | null> {
  if (!input) return null;
  const explicitId = typeof input.clientId === 'string' ? input.clientId.trim() : '';
  if (explicitId) return buildClientContext(explicitId);

  const name = typeof input.organizationName === 'string'
    ? input.organizationName.trim()
    : typeof input.clientName === 'string'
      ? input.clientName.trim()
      : '';
  if (!name) return null;

  const needle = normalizeName(name);
  const profiles = await listClientProfiles();
  const match = profiles.find((profile) =>
    [profile.organizationName, profile.clientId, ...profile.aliases].some((value) => normalizeName(value) === needle),
  );
  return match ? buildClientContext(match.clientId) : null;
}

export function clientContextForAgents(context: ClientContext) {
  return {
    clientId: context.profile.clientId,
    organizationName: context.profile.organizationName,
    industry: context.profile.industry,
    mission: context.profile.mission,
    audience: context.profile.audience,
    offers: context.profile.offers,
    goals: context.profile.goals,
    differentiators: context.profile.differentiators,
    brandVoice: context.profile.brandVoice,
    brandRules: context.profile.brandRules,
    links: context.profile.links,
    contacts: context.profile.contacts,
    approvalRules: context.profile.approvalRules,
    clientNotes: context.profile.notes,
    clientProjects: context.projects,
  };
}
