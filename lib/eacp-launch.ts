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
import {
  EACPPersistenceConfigurationError,
  readEACPStore,
  updateEACPStore,
} from './eacp-store';

export type EACPLaunchStatus =
  | 'draft'
  | 'generated'
  | 'under-review'
  | 'revision-requested'
  | 'approved'
  | 'rejected'
  | 'building'
  | 'build-failed'
  | 'ready-for-deployment'
  | 'deployed'
  | 'archived';

export type EACPApprovalDecision = 'approved' | 'rejected' | 'revision-requested';
export type EACPRepoReviewStatus = 'pending' | 'approved' | 'removed';
export type EACPRepoRequirement = 'required' | 'optional';
export type EACPLifecycleAction = 'start-build' | 'fail-build' | 'complete-build' | 'deploy' | 'archive';

export interface EACPLaunchInput {
  client: string;
  goal: string;
  deliverable: string;
  industry?: string;
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
  reviewStatus: EACPRepoReviewStatus;
  requirement: EACPRepoRequirement;
  reviewerNotes: string;
}

export interface EACPAuditEvent {
  id: string;
  launchId: string;
  type:
    | 'launch-created'
    | 'package-generated'
    | 'approval-requested'
    | 'approved'
    | 'rejected'
    | 'revision-requested'
    | 'repo-modified'
    | 'codex-handoff-created'
    | 'deployment-package-generated'
    | 'build-started'
    | 'build-failed'
    | 'build-completed'
    | 'deployed'
    | 'archived';
  label: string;
  detail: string;
  actor: string;
  createdAt: string;
}

export interface EACPApprovalRecord {
  id: string;
  launchId: string;
  client: string;
  status: 'queued' | EACPApprovalDecision;
  href: string;
  queuedAt: string;
  decidedAt?: string;
  reviewerName?: string;
  comments?: string;
  reviewAreas: string[];
}

export interface EACPCodexHandoffRecord {
  id: string;
  launchId: string;
  client: string;
  goal: string;
  deliverable: string;
  status: 'ready';
  createdAt: string;
  approvedProjectBrief: EAFactoryProjectBrief;
  approvedSkinBrief: SkinBriefRecord;
  approvedRepoSet: EACPRepoRecommendation[];
  recommendedModules: string[];
  codexBuildPrompt: string;
  buildChecklist: string[];
}

export interface EACPDeploymentPackage {
  id: string;
  launchId: string;
  status: 'created' | 'deployed';
  createdAt: string;
  jsonExport: string;
  markdownExport: string;
  codexExport: string;
}

export interface EACPBuildPackage {
  id: string;
  generatedAt: string;
  executiveSummary: string;
  transformationStory: string;
  projectBrief: EAFactoryProjectBrief;
  skinBrief: SkinBriefRecord;
  repoRecommendations: EACPRepoRecommendation[];
  approvedRepoSet: EACPRepoRecommendation[];
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
  status: EACPLaunchStatus;
  createdAt: string;
  updatedAt: string;
  timestamp: string;
  protocolIds: string[];
  protocolNames: string[];
  projectBriefId: string;
  skinBriefId: string;
  recommendedRepos: EACPRepoRecommendation[];
  buildPackage: EACPBuildPackage;
  approvalRecord: EACPApprovalRecord;
  approvalQueue: EACPApprovalRecord;
  auditTrail: EACPAuditEvent[];
  codexHandoff?: EACPCodexHandoffRecord;
  deploymentPackage?: EACPDeploymentPackage;
  links: {
    reviewPackage: string;
    projectBrief: string;
    skinBrief: string;
    approval: string;
    codexBuilder: string;
    deployment: string;
  };
}

type RepoReviewInput = {
  repos: Array<{
    id: string;
    reviewStatus?: EACPRepoReviewStatus;
    requirement?: EACPRepoRequirement;
    reviewerNotes?: string;
    replacementRepoId?: string;
  }>;
  reviewerName?: string;
};

export function parseEACPCommand(command: string): Partial<EACPLaunchInput> {
  const values: Partial<EACPLaunchInput> = {};
  const normalized = command.replace(/^EACP\b/i, '').trim();
  const pattern = /(Client|Goal|Deliverable|Industry|Notes):\s*([\s\S]*?)(?=\s+(?:Client|Goal|Deliverable|Industry|Notes):|$)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(normalized)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) continue;
    if (key === 'client') values.client = value;
    if (key === 'goal') values.goal = value;
    if (key === 'deliverable') values.deliverable = value;
    if (key === 'industry') values.industry = value;
    if (key === 'notes') values.notes = value;
  }

  return values;
}

export async function createEACPLaunch(input: EACPLaunchInput): Promise<EACPLaunchRecord> {
  try {
    const { ensureEACPStoreTable } = await import('./eacp-store-setup');
    await ensureEACPStoreTable();
  } catch {
    // Best-effort — write path will surface persistence errors if setup cannot run.
  }

  const normalized = normalizeLaunchInput(input);
  const timestamp = new Date().toISOString();
  const id = createLaunchId();
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

  const projectBriefId = `project-${slugify(normalized.client)}-${Date.now()}`;
  const codexBuildPrompt = buildCodexBuildPrompt(normalized, protocolNames, projectBrief, skinBrief, repoRecommendations, recommendedModules);
  const buildPackage: EACPBuildPackage = {
    id: `package-${id}`,
    generatedAt: timestamp,
    executiveSummary: `${normalized.client} is ready for a ${normalized.deliverable} launch package focused on ${normalized.goal}. The package has protocols, project direction, skin direction, repo guidance, modules, and an approval handoff.`,
    transformationStory: projectBrief.transformationNarrative,
    projectBrief,
    skinBrief,
    repoRecommendations,
    approvedRepoSet: repoRecommendations.filter((repo) => repo.reviewStatus === 'approved'),
    recommendedModules,
    codexBuildPrompt,
  };

  const approvalRecord: EACPApprovalRecord = {
    id: `approval-${id}`,
    launchId: id,
    client: normalized.client,
    status: 'queued',
    href: '/admin/ea-factory/approvals',
    queuedAt: timestamp,
    reviewAreas: ['Executive Summary', 'Transformation Story', 'Project Brief', 'Skin Brief', 'Repo Recommendations', 'Codex Build Prompt'],
  };

  const auditTrail = [
    audit(id, 'launch-created', 'Launch Created', 'EACP command accepted and launch record created.', 'EACP'),
    audit(id, 'package-generated', 'Package generated', 'Project brief, skin brief, repo recommendations, and Codex prompt generated.', 'EACP'),
    audit(id, 'approval-requested', 'Approval Requested', 'Launch package moved under review.', 'EACP'),
  ];

  const record: EACPLaunchRecord = {
    id,
    client: normalized.client,
    goal: normalized.goal,
    deliverable: normalized.deliverable,
    industry: normalized.industry,
    notes: normalized.notes ?? '',
    status: 'under-review',
    createdAt: timestamp,
    updatedAt: timestamp,
    timestamp,
    protocolIds,
    protocolNames,
    projectBriefId,
    skinBriefId: skinBrief.id,
    recommendedRepos: repoRecommendations,
    buildPackage,
    approvalRecord,
    approvalQueue: approvalRecord,
    auditTrail,
    links: {
      reviewPackage: `/admin/ea-factory/launches/${id}`,
      projectBrief: `/admin/ea-factory/launches/${id}#project-brief`,
      skinBrief: `/admin/ea-factory/launches/${id}#skin-brief`,
      approval: '/admin/ea-factory/approvals',
      codexBuilder: '/admin/ea-factory/codex-builder',
      deployment: '/admin/ea-factory/chassis-deployment',
    },
  };

  try {
    await updateEACPStore((store) => {
      store.launches = [record, ...store.launches.filter((launch) => launch.id !== record.id)];
      store.approvals = [approvalRecord, ...store.approvals.filter((approval) => approval.launchId !== record.id)];
      store.auditEvents = [...store.auditEvents, ...auditTrail];
    });
  } catch (error) {
    // Field-demo / ChatGPT should still return a usable package when EACP Store Airtable
    // setup is incomplete; admin Factory may not list this record until storage is fixed.
    if (error instanceof EACPPersistenceConfigurationError) {
      console.error('[eacp-launch] durable store unavailable; returning ephemeral launch', record.id);
      return record;
    }
    throw error;
  }

  return record;
}

export async function listEACPLaunches() {
  const store = await readEACPStore();
  return store.launches.map((launch) => hydrateLaunchAudit(launch, store.auditEvents));
}

export async function getEACPLaunch(id: string) {
  const store = await readEACPStore();
  const launch = store.launches.find((item) => item.id === id);
  return launch ? hydrateLaunchAudit(launch, store.auditEvents) : undefined;
}

export async function listEACPApprovals() {
  return (await readEACPStore()).approvals;
}

export async function listEACPCodexHandoffs() {
  return (await readEACPStore()).codexHandoffs;
}

export async function reviewEACPRepos(launchId: string, input: RepoReviewInput) {
  let updated: EACPLaunchRecord | undefined;
  await updateEACPStore((store) => {
    const launch = store.launches.find((item) => item.id === launchId);
    if (!launch) return false;

    const allRepos = searchRepositories('', '', false, false);
    const nextRepos = [...launch.recommendedRepos];

    for (const review of input.repos) {
      const index = nextRepos.findIndex((repo) => repo.id === review.id);
      if (index < 0) continue;
      if (review.replacementRepoId) {
        const replacement = allRepos.find((repo) => repo.id === review.replacementRepoId);
        if (replacement) {
          nextRepos[index] = {
            ...nextRepos[index],
            id: replacement.id,
            name: replacement.name,
            href: replacement.href,
            category: replacement.category,
            strategy: replacement.strategy,
            implementationRationale: `${replacement.strategy} this because it supports ${replacement.useCases.slice(0, 3).join(', ')}.`,
          };
        }
      }
      nextRepos[index] = {
        ...nextRepos[index],
        reviewStatus: review.reviewStatus ?? nextRepos[index].reviewStatus,
        requirement: review.requirement ?? nextRepos[index].requirement,
        reviewerNotes: review.reviewerNotes ?? nextRepos[index].reviewerNotes,
      };
    }

    launch.recommendedRepos = nextRepos;
    launch.buildPackage.repoRecommendations = nextRepos;
    launch.buildPackage.approvedRepoSet = nextRepos.filter((repo) => repo.reviewStatus === 'approved');
    launch.updatedAt = new Date().toISOString();
    const event = audit(launch.id, 'repo-modified', 'Repo Modified', 'Recommended repository set was reviewed before approval.', input.reviewerName || 'Reviewer');
    store.auditEvents = [...store.auditEvents, event];
    updated = hydrateLaunchAudit(launch, store.auditEvents);
  });
  return updated;
}

export async function decideEACPApproval(launchId: string, decision: EACPApprovalDecision, reviewerName: string, comments: string) {
  let updated: EACPLaunchRecord | undefined;
  await updateEACPStore((store) => {
    const launch = store.launches.find((item) => item.id === launchId);
    if (!launch) return false;

    const now = new Date().toISOString();
    const approval = store.approvals.find((item) => item.launchId === launchId) ?? launch.approvalRecord;
    approval.status = decision;
    approval.decidedAt = now;
    approval.reviewerName = reviewerName;
    approval.comments = comments;

    launch.approvalRecord = approval;
    launch.approvalQueue = approval;
    launch.status = decision === 'approved' ? 'approved' : decision;
    launch.updatedAt = now;
    const auditEvents = [
      audit(launch.id, decision, statusLabel(decision), comments || `Launch ${statusLabel(decision).toLowerCase()}.`, reviewerName),
    ];

    if (decision === 'approved') {
      const handoff = createCodexHandoff(launch);
      launch.codexHandoff = handoff;
      auditEvents.push(audit(launch.id, 'codex-handoff-created', 'Codex handoff created', 'Approved launch package converted into a Codex Builder handoff.', 'EACP'));
      store.codexHandoffs = [handoff, ...store.codexHandoffs.filter((item) => item.launchId !== launch.id)];
    }

    store.auditEvents = [...store.auditEvents, ...auditEvents];
    store.approvals = [approval, ...store.approvals.filter((item) => item.launchId !== launchId)];
    updated = hydrateLaunchAudit(launch, store.auditEvents);
  });
  return updated;
}

export async function transitionEACPLaunchLifecycle(launchId: string, action: EACPLifecycleAction, actor = 'EA Operator', detail = '') {
  let updated: EACPLaunchRecord | undefined;

  await updateEACPStore((store) => {
    const launch = store.launches.find((item) => item.id === launchId);
    if (!launch) return false;

    const now = new Date().toISOString();
    const next = getLifecycleTransition(launch.status, action);
    if (!next.allowed) {
      throw new Error(next.message);
    }

    const events: EACPAuditEvent[] = [];
    launch.status = next.status;
    launch.updatedAt = now;

    if (action === 'complete-build') {
      launch.deploymentPackage = createDeploymentPackage(launch);
      events.push(audit(launch.id, 'deployment-package-generated', 'Deployment Package Generated', 'Export-ready deployment package created after build completion.', 'EACP'));
    }

    if (action === 'deploy' && launch.deploymentPackage) {
      launch.deploymentPackage = {
        ...launch.deploymentPackage,
        status: 'deployed',
      };
    }

    events.push(audit(launch.id, next.auditType, next.label, detail || next.detail, actor));
    store.auditEvents = [...store.auditEvents, ...events];
    updated = hydrateLaunchAudit(launch, store.auditEvents);
  });

  return updated;
}

export function validateEACPLaunchInput(input: Partial<EACPLaunchInput>) {
  const missing: string[] = [];
  if (!input.client?.trim()) missing.push('client');
  if (!input.goal?.trim()) missing.push('goal');
  if (!input.deliverable?.trim()) missing.push('deliverable');
  return missing;
}

export function friendlyLaunchCorrection(missing: string[]) {
  return `I need ${missing.join(', ')} before I can launch EACP. Try: EACP Client: Bob Rumball Centre Goal: Training Transformation Deliverable: Website + Portal + Learning Hub Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.`;
}

export function exportEACPLaunchJson(launch: EACPLaunchRecord) {
  return JSON.stringify(launch, null, 2);
}

export function exportEACPLaunchMarkdown(launch: EACPLaunchRecord) {
  return [
    `# EACP Launch Package: ${launch.client}`,
    '',
    `Status: ${statusLabel(launch.status)}`,
    `Goal: ${launch.goal}`,
    `Deliverable: ${launch.deliverable}`,
    `Industry: ${launch.industry}`,
    '',
    '## Executive Summary',
    launch.buildPackage.executiveSummary,
    '',
    '## Transformation Story',
    launch.buildPackage.transformationStory,
    '',
    '## Project Brief',
    launch.buildPackage.projectBrief.transformationVision,
    '',
    '## Skin Brief',
    launch.buildPackage.skinBrief.hero_concept,
    '',
    '## Approved Repository Set',
    ...launch.buildPackage.approvedRepoSet.map((repo) => `- ${repo.name} (${repo.requirement}): ${repo.implementationRationale}`),
    '',
    '## Codex Build Prompt',
    '```txt',
    launch.buildPackage.codexBuildPrompt,
    '```',
  ].join('\n');
}

export function statusLabel(status: string) {
  return status.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function normalizeLaunchInput(input: EACPLaunchInput): Required<EACPLaunchInput> {
  const partial = {
    client: input.client.trim(),
    goal: input.goal.trim(),
    deliverable: input.deliverable.trim(),
    industry: input.industry?.trim() || inferIndustry(input),
    notes: input.notes?.trim() ?? '',
  };
  return partial;
}

function inferIndustry(input: EACPLaunchInput) {
  const blob = `${input.client} ${input.goal} ${input.deliverable} ${input.notes}`.toLowerCase();
  if (blob.includes('nonprofit') || blob.includes('centre') || blob.includes('foundation')) return 'Nonprofit';
  if (blob.includes('learning') || blob.includes('training')) return 'Education / Training';
  if (blob.includes('athlete') || blob.includes('recruit')) return 'Sports Recruiting';
  if (blob.includes('property') || blob.includes('real estate')) return 'Real Estate';
  if (blob.includes('golf')) return 'Golf / Hospitality';
  return 'General';
}

function selectProtocols(protocols: EAFactoryProtocol[], input: Required<EACPLaunchInput>) {
  const blob = `${input.goal} ${input.deliverable} ${input.industry} ${input.notes}`.toLowerCase();
  const desired = new Set(['master', 'skin']);

  if (blob.includes('website') || blob.includes('site') || blob.includes('landing')) desired.add('website');
  if (blob.includes('portal') || blob.includes('member') || blob.includes('dashboard')) desired.add('portal');
  if (blob.includes('training') || blob.includes('learning') || blob.includes('onboarding')) desired.add('training');
  if (blob.includes('assessment') || blob.includes('transformation') || blob.includes('growth')) desired.add('assessment');
  if (
    blob.includes('ctp') ||
    blob.includes('consider') ||
    blob.includes('possibilities') ||
    blob.includes('discovery')
  ) {
    desired.add('ctp');
  }

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

function recommendRepositories(input: Required<EACPLaunchInput>, protocolNames: string[]): EACPRepoRecommendation[] {
  const query = `${input.industry} ${input.goal} ${input.deliverable} ${input.notes}`;
  const matches = searchRepositories(query);
  const candidates = matches.length > 0 ? matches : searchRepositories('', '', false, true);

  return candidates
    .map((repo, index) => {
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
        reviewStatus: index < 3 ? 'approved' as const : 'pending' as const,
        requirement: index === 0 ? 'required' as const : 'optional' as const,
        reviewerNotes: '',
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 5);
}

function protocolOverlap(repoProtocols: string[], selectedProtocols: string[]) {
  const selected = selectedProtocols.map((protocol) => protocol.toLowerCase());
  return repoProtocols.filter((protocol) => selected.some((item) => item.includes(protocol.toLowerCase()) || protocol.toLowerCase().includes(item))).length;
}

function normalizeChassisModules(projectModules: string[], input: Required<EACPLaunchInput>): ChassisModule[] {
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
  if (blob.includes('training') || blob.includes('learning')) return 'Training Experience';
  if (blob.includes('member')) return 'Membership Experience';
  if (blob.includes('landing')) return 'Landing Page';
  return 'Website';
}

function normalizeSkinProjectType(input: Required<EACPLaunchInput>): SkinProjectType {
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

function desiredEmotion(input: Required<EACPLaunchInput>) {
  const blob = `${input.goal} ${input.industry}`.toLowerCase();
  if (blob.includes('training')) return 'confidence';
  if (blob.includes('growth')) return 'momentum';
  if (blob.includes('nonprofit')) return 'trust and possibility';
  return 'clarity';
}

function buildCodexBuildPrompt(
  input: Required<EACPLaunchInput>,
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
    `Recommended repos: ${repoRecommendations.map((repo) => `${repo.name} (${repo.compatibilityScore}, ${repo.requirement})`).join(', ')}`,
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

function createCodexHandoff(launch: EACPLaunchRecord): EACPCodexHandoffRecord {
  const approvedRepoSet = launch.recommendedRepos.filter((repo) => repo.reviewStatus === 'approved');
  return {
    id: `codex-${launch.id}`,
    launchId: launch.id,
    client: launch.client,
    goal: launch.goal,
    deliverable: launch.deliverable,
    status: 'ready',
    createdAt: new Date().toISOString(),
    approvedProjectBrief: launch.buildPackage.projectBrief,
    approvedSkinBrief: launch.buildPackage.skinBrief,
    approvedRepoSet,
    recommendedModules: launch.buildPackage.recommendedModules,
    codexBuildPrompt: launch.buildPackage.codexBuildPrompt,
    buildChecklist: [
      'Confirm approved repo set is still compatible.',
      'Create implementation branch or worktree.',
      'Apply Project Brief structure.',
      'Apply Skin Brief visual direction.',
      'Preserve EA Chassis auth, navigation, permissions, search, analytics, and update patterns.',
      'Run lint, build, and smoke verification before deployment.',
    ],
  };
}

function createDeploymentPackage(launch: EACPLaunchRecord): EACPDeploymentPackage {
  const markdownExport = exportEACPLaunchMarkdown(launch);
  const jsonExport = exportEACPLaunchJson(launch);
  return {
    id: `deploy-${launch.id}`,
    launchId: launch.id,
    status: 'created',
    createdAt: new Date().toISOString(),
    jsonExport,
    markdownExport,
    codexExport: launch.buildPackage.codexBuildPrompt,
  };
}

function hydrateLaunchAudit(launch: EACPLaunchRecord, events: EACPAuditEvent[]) {
  const auditTrail = events
    .filter((event) => event.launchId === launch.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return { ...launch, auditTrail };
}

function getLifecycleTransition(status: EACPLaunchStatus, action: EACPLifecycleAction): {
  allowed: true;
  status: EACPLaunchStatus;
  auditType: EACPAuditEvent['type'];
  label: string;
  detail: string;
} | { allowed: false; message: string } {
  if (action === 'start-build') {
    if (!['approved', 'build-failed'].includes(status)) {
      return { allowed: false, message: 'Launch must be approved before build can start.' };
    }
    return {
      allowed: true,
      status: 'building',
      auditType: 'build-started',
      label: 'Build Started',
      detail: 'Approved launch entered the build lifecycle.',
    };
  }

  if (action === 'fail-build') {
    if (status !== 'building') return { allowed: false, message: 'Only an active build can be marked failed.' };
    return {
      allowed: true,
      status: 'build-failed',
      auditType: 'build-failed',
      label: 'Build Failed',
      detail: 'Build failed and requires review before retry.',
    };
  }

  if (action === 'complete-build') {
    if (status !== 'building') return { allowed: false, message: 'Only an active build can be completed.' };
    return {
      allowed: true,
      status: 'ready-for-deployment',
      auditType: 'build-completed',
      label: 'Build Completed',
      detail: 'Build completed and deployment package is ready.',
    };
  }

  if (action === 'deploy') {
    if (status !== 'ready-for-deployment') return { allowed: false, message: 'Launch must be ready for deployment before deploy.' };
    return {
      allowed: true,
      status: 'deployed',
      auditType: 'deployed',
      label: 'Deployed',
      detail: 'Deployment completed.',
    };
  }

  if (action === 'archive') {
    return {
      allowed: true,
      status: 'archived',
      auditType: 'archived',
      label: 'Archived',
      detail: 'Launch archived.',
    };
  }

  return { allowed: false, message: 'Unsupported lifecycle action.' };
}

function audit(launchId: string, type: EACPAuditEvent['type'], label: string, detail: string, actor: string): EACPAuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    launchId,
    type,
    label,
    detail,
    actor,
    createdAt: new Date().toISOString(),
  };
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
