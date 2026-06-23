import {
  EA_FACTORY_PROTOCOLS,
  generateEAFactoryProjectBrief,
  getProtocolLibraryFromGitHub,
  searchRepositories,
  type EAFactoryProjectBrief,
  type EAFactoryProtocol,
} from './ea-factory';
import {
  CHASSIS_MODULE_OPTIONS,
  generateSkinBrief,
  type ChassisModule,
  type SkinBriefRecord,
  type SkinProjectType,
} from './skin-factory';

export interface EACPLaunchInput {
  client: string;
  goal: string;
  deliverable: string;
  industry: string;
  notes?: string;
}

export interface EACPRepoRecommendation {
  id: string;
  name: string;
  href: string;
  category: string;
  compatibilityScore: number;
  implementationRationale: string;
  strategy: string;
}

export interface EACPApprovalQueueItem {
  id: string;
  launchId: string;
  client: string;
  status: 'queued';
  approvalCenter: 'placeholder';
  href: string;
  queuedAt: string;
  reviewAreas: string[];
}

export interface EACPBuildPackage {
  id: string;
  generatedAt: string;
  executiveSummary: string;
  transformationStory: string;
  projectBrief: EAFactoryProjectBrief;
  skinBrief: SkinBriefRecord;
  repoRecommendations: EACPRepoRecommendation[];
  recommendedModules: string[];
  codexBuildPrompt: string;
}

export interface EACPLaunchRecord {
  id: string;
  client: string;
  goal: string;
  deliverable: string;
  industry: string;
  notes: string;
  status: 'approval-queued';
  timestamp: string;
  protocolIds: string[];
  protocolNames: string[];
  projectBriefId: string;
  skinBriefId: string;
  recommendedRepos: EACPRepoRecommendation[];
  buildPackage: EACPBuildPackage;
  approvalQueue: EACPApprovalQueueItem;
  links: {
    reviewPackage: string;
    projectBrief: string;
    skinBrief: string;
    approval: string;
  };
}

type LaunchStore = {
  launches: EACPLaunchRecord[];
  approvals: EACPApprovalQueueItem[];
};

const STORE_KEY = '__eacpLaunchStore';

export function parseEACPCommand(command: string): Partial<EACPLaunchInput> {
  const lines = command
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const values: Partial<EACPLaunchInput> = {};

  for (const line of lines) {
    const match = line.match(/^([a-zA-Z ]+):\s*(.+)$/);
    if (!match) continue;

    const key = match[1].toLowerCase().replace(/\s+/g, '');
    const value = match[2].trim();

    if (key === 'client') values.client = value;
    if (key === 'goal') values.goal = value;
    if (key === 'deliverable') values.deliverable = value;
    if (key === 'industry') values.industry = value;
    if (key === 'notes') values.notes = value;
  }

  return values;
}

export async function createEACPLaunch(input: EACPLaunchInput): Promise<EACPLaunchRecord> {
  const normalized = normalizeLaunchInput(input);
  const protocolLibrary = await getProtocolLibraryFromGitHub();
  const selectedProtocols = selectProtocols(protocolLibrary.protocols, normalized);
  const protocolIds = selectedProtocols.map((protocol) => protocol.id);
  const protocolNames = selectedProtocols.map((protocol) => protocol.name);
  const repoRecommendations = recommendRepositories(normalized, protocolNames);

  const projectBrief = generateEAFactoryProjectBrief({
    clientName: normalized.client,
    organization: normalized.client,
    industry: normalized.industry,
    mission: normalized.notes || normalized.goal,
    goals: [normalized.goal],
    desiredOutcome: `${normalized.goal} through ${normalized.deliverable}`,
    projectType: normalizeProjectTypeLabel(normalized.deliverable),
    selectedProtocolIds: protocolIds,
  });

  const recommendedModules = normalizeChassisModules(projectBrief.moduleRecommendations, normalized);
  const skinBrief = generateSkinBrief({
    client_name: normalized.client,
    organization_type: normalized.industry,
    mission: normalized.notes || projectBrief.transformationNarrative,
    audience: `${normalized.industry} stakeholders`,
    primary_goal: normalized.goal,
    desired_emotion: desiredEmotion(normalized),
    transformation_promise: projectBrief.transformationVision,
    project_type: normalizeSkinProjectType(normalized),
    selected_protocol: protocolIds,
    selected_repos: repoRecommendations.map((repo) => repo.id),
    chassis_modules: recommendedModules,
    brand_colors: [],
    assets: [],
    notes: normalized.notes,
  });

  const timestamp = new Date().toISOString();
  const id = createLaunchId();
  const projectBriefId = `project-${slugify(normalized.client)}-${Date.now()}`;
  const buildPackage: EACPBuildPackage = {
    id: `package-${id}`,
    generatedAt: timestamp,
    executiveSummary: `${normalized.client} is ready for a ${normalized.deliverable} launch package focused on ${normalized.goal}. The package has protocols, project direction, skin direction, repo guidance, modules, and an approval handoff.`,
    transformationStory: projectBrief.transformationNarrative,
    projectBrief,
    skinBrief,
    repoRecommendations,
    recommendedModules,
    codexBuildPrompt: buildCodexBuildPrompt(normalized, protocolNames, projectBrief, skinBrief, repoRecommendations, recommendedModules),
  };

  const approvalQueue: EACPApprovalQueueItem = {
    id: `approval-${id}`,
    launchId: id,
    client: normalized.client,
    status: 'queued',
    approvalCenter: 'placeholder',
    href: '/admin/ea-factory/approvals',
    queuedAt: timestamp,
    reviewAreas: ['Executive Summary', 'Transformation Story', 'Project Brief', 'Skin Brief', 'Repo Recommendations', 'Codex Build Prompt'],
  };

  const record: EACPLaunchRecord = {
    id,
    client: normalized.client,
    goal: normalized.goal,
    deliverable: normalized.deliverable,
    industry: normalized.industry,
    notes: normalized.notes ?? '',
    status: 'approval-queued',
    timestamp,
    protocolIds,
    protocolNames,
    projectBriefId,
    skinBriefId: skinBrief.id,
    recommendedRepos: repoRecommendations,
    buildPackage,
    approvalQueue,
    links: {
      reviewPackage: `/admin/ea-factory/launches/${id}`,
      projectBrief: `/admin/ea-factory/launches/${id}#project-brief`,
      skinBrief: `/admin/ea-factory/launches/${id}#skin-brief`,
      approval: '/admin/ea-factory/approvals',
    },
  };

  const store = getStore();
  store.launches = [record, ...store.launches.filter((launch) => launch.id !== record.id)].slice(0, 50);
  store.approvals = [approvalQueue, ...store.approvals.filter((approval) => approval.launchId !== record.id)].slice(0, 50);

  return record;
}

export function listEACPLaunches() {
  return getStore().launches;
}

export function getEACPLaunch(id: string) {
  return getStore().launches.find((launch) => launch.id === id);
}

export function listEACPApprovals() {
  return getStore().approvals;
}

export function validateEACPLaunchInput(input: Partial<EACPLaunchInput>) {
  const missing: string[] = [];
  if (!input.client?.trim()) missing.push('client');
  if (!input.goal?.trim()) missing.push('goal');
  if (!input.deliverable?.trim()) missing.push('deliverable');
  if (!input.industry?.trim()) missing.push('industry');
  return missing;
}

function normalizeLaunchInput(input: EACPLaunchInput): EACPLaunchInput {
  return {
    client: input.client.trim(),
    goal: input.goal.trim(),
    deliverable: input.deliverable.trim(),
    industry: input.industry.trim(),
    notes: input.notes?.trim() ?? '',
  };
}

function selectProtocols(protocols: EAFactoryProtocol[], input: EACPLaunchInput) {
  const blob = `${input.goal} ${input.deliverable} ${input.industry} ${input.notes}`.toLowerCase();
  const desired = new Set(['master', 'skin']);

  if (blob.includes('website') || blob.includes('site') || blob.includes('landing')) desired.add('website');
  if (blob.includes('portal') || blob.includes('member') || blob.includes('dashboard')) desired.add('portal');
  if (blob.includes('training') || blob.includes('learning') || blob.includes('onboarding')) desired.add('training');
  if (blob.includes('assessment') || blob.includes('transformation') || blob.includes('growth')) desired.add('assessment');

  const selected = [...EA_FACTORY_PROTOCOLS, ...protocols].filter((protocol) => {
    const haystack = `${protocol.id} ${protocol.name} ${protocol.category} ${protocol.tags.join(' ')}`.toLowerCase();
    return Array.from(desired).some((key) => haystack.includes(key));
  });

  const fallback = EA_FACTORY_PROTOCOLS.filter((protocol) => ['ea-master', 'ea-skin', 'ea-website'].includes(protocol.id));
  const unique = new Map<string, EAFactoryProtocol>();
  for (const protocol of selected) {
    if (!unique.has(protocol.name)) unique.set(protocol.name, protocol);
  }
  return unique.size > 0 ? Array.from(unique.values()) : fallback;
}

function recommendRepositories(input: EACPLaunchInput, protocolNames: string[]): EACPRepoRecommendation[] {
  const query = `${input.industry} ${input.goal} ${input.deliverable} ${input.notes}`;
  const matches = searchRepositories(query);
  const candidates = matches.length > 0 ? matches : searchRepositories('', '', false, true);

  return candidates
    .map((repo) => {
      const score = Math.max(
        55,
        Math.min(
          98,
          Math.round(
            repo.storytellingScore * 2.2 +
              repo.mobileScore * 2.2 +
              repo.performanceScore * 2 +
              repo.animationScore * 1.2 -
              repo.complexityScore * 1.3 +
              protocolOverlap(repo.protocolCompatibility, protocolNames) * 8 +
              (repo.recommended ? 8 : 0) +
              (repo.favorite ? 4 : 0),
          ),
        ),
      );

      return {
        id: repo.id,
        name: repo.name,
        href: repo.href,
        category: repo.category,
        compatibilityScore: score,
        implementationRationale: `${repo.strategy} this because it supports ${repo.useCases.slice(0, 3).join(', ')} and aligns with ${repo.protocolCompatibility.slice(0, 3).join(', ')}.`,
        strategy: repo.strategy,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}

function protocolOverlap(repoProtocols: string[], selectedProtocols: string[]) {
  const selected = selectedProtocols.map((protocol) => protocol.toLowerCase());
  return repoProtocols.filter((protocol) => selected.some((item) => item.includes(protocol.toLowerCase()) || protocol.toLowerCase().includes(item))).length;
}

function normalizeChassisModules(projectModules: string[], input: EACPLaunchInput): ChassisModule[] {
  const allowed = new Set<string>(CHASSIS_MODULE_OPTIONS);
  const modules = new Set<string>(['Navigation shell', 'Dashboard home', 'Update Hub', 'Search', 'Permissions & roles']);
  const blob = `${input.goal} ${input.deliverable} ${input.industry} ${input.notes}`.toLowerCase();

  for (const moduleName of projectModules) {
    if (allowed.has(moduleName)) modules.add(moduleName);
    if (moduleName === 'Dashboard') modules.add('Dashboard home');
  }

  if (blob.includes('portal')) modules.add('Dashboard home');
  if (blob.includes('training') || blob.includes('learning')) modules.add('Learning Hub');
  if (blob.includes('member') || blob.includes('community')) modules.add('Community Directory');
  if (blob.includes('resource')) modules.add('Resource library');
  if (blob.includes('event')) modules.add('Event Hub');

  return Array.from(modules).filter((module): module is ChassisModule => allowed.has(module));
}

function normalizeProjectTypeLabel(deliverable: string) {
  const blob = deliverable.toLowerCase();
  if (blob.includes('portal')) return 'Portal';
  if (blob.includes('training')) return 'Training Experience';
  if (blob.includes('member')) return 'Membership Experience';
  if (blob.includes('landing')) return 'Landing Page';
  return 'Website';
}

function normalizeSkinProjectType(input: EACPLaunchInput): SkinProjectType {
  const blob = `${input.deliverable} ${input.goal} ${input.industry}`.toLowerCase();
  if (blob.includes('training') || blob.includes('learning')) return 'training-experience';
  if (blob.includes('member')) return 'membership-experience';
  if (blob.includes('portal')) return 'portal-skin';
  if (blob.includes('event')) return 'event-experience';
  if (blob.includes('recruit')) return 'recruiting-experience';
  if (blob.includes('creator')) return 'creator-experience';
  if (blob.includes('church') || blob.includes('nonprofit')) return 'church-nonprofit-experience';
  if (blob.includes('landing')) return 'landing-page';
  return 'website';
}

function desiredEmotion(input: EACPLaunchInput) {
  const blob = `${input.goal} ${input.industry}`.toLowerCase();
  if (blob.includes('training')) return 'confidence';
  if (blob.includes('growth')) return 'momentum';
  if (blob.includes('nonprofit')) return 'trust and possibility';
  return 'clarity';
}

function buildCodexBuildPrompt(
  input: EACPLaunchInput,
  protocolNames: string[],
  projectBrief: EAFactoryProjectBrief,
  skinBrief: SkinBriefRecord,
  repoRecommendations: EACPRepoRecommendation[],
  recommendedModules: string[],
) {
  return [
    `EACP Launch Package for ${input.client}`,
    `Goal: ${input.goal}`,
    `Deliverable: ${input.deliverable}`,
    `Industry: ${input.industry}`,
    `Protocols: ${protocolNames.join(', ')}`,
    `Executive direction: ${projectBrief.transformationVision}`,
    `Skin direction: ${skinBrief.hero_concept}`,
    `Recommended modules: ${recommendedModules.join(', ')}`,
    `Recommended repos: ${repoRecommendations.map((repo) => `${repo.name} (${repo.compatibilityScore})`).join(', ')}`,
    input.notes ? `Notes: ${input.notes}` : '',
    '',
    'Build only after Approval Center review.',
    'Use the Project Brief for structure, Skin Brief for visual direction, and Repo Recommendations for implementation references.',
    'Do not auto-deploy. Preserve EA Chassis auth, navigation, permissions, search, analytics, and update patterns.',
    '',
    projectBrief.codexBuildPrompt,
    '',
    skinBrief.codex_build_prompt,
  ].filter(Boolean).join('\n');
}

function getStore(): LaunchStore {
  const globalStore = globalThis as typeof globalThis & { [STORE_KEY]?: LaunchStore };
  globalStore[STORE_KEY] ??= { launches: [], approvals: [] };
  return globalStore[STORE_KEY];
}

function createLaunchId() {
  return `launch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'client';
}
