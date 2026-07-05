import { EA_REPOSITORY_LIBRARY, type RepositoryCandidate } from './repository-library';
import { generateSkinBrief, skinProjectTypeLabel, type SkinProjectType } from './skin-factory';

export type EAFactoryPhaseId =
  | 'protocol-center'
  | 'repo-library'
  | 'project-generator'
  | 'skin-factory'
  | 'codex-builder'
  | 'approval-center'
  | 'chassis-deployment';

export type ProtocolStatus = 'draft' | 'review' | 'approved' | 'active' | 'retired';

export interface EAFactoryProtocol {
  id: string;
  name: string;
  category: string;
  status: ProtocolStatus;
  activeVersion: string;
  owner?: string;
  createdDate?: string;
  modifiedDate?: string;
  approvedBy?: string;
  approvalStatus?: 'needs-review' | 'approved' | 'active' | 'revision-requested';
  futureNotes?: string;
  tags: string[];
  purpose: string;
  governs: string[];
  approvalRequired: boolean;
  versionHistory: Array<{
    version: string;
    status: ProtocolStatus;
    approvedBy?: string;
    approvedAt?: string;
    notes: string;
  }>;
  source?: 'github' | 'pulse-seed';
  sourcePath?: string;
}

export interface EAFactoryPhase {
  id: EAFactoryPhaseId;
  name: string;
  purpose: string;
  input: string[];
  output: string[];
  humanApprovalGate: boolean;
}

export interface EAFactoryProjectInput {
  clientName: string;
  organization?: string;
  website?: string;
  industry: string;
  mission: string;
  goals: string[];
  desiredOutcome: string;
  projectType?: string;
  selectedProtocolIds: string[];
}

export interface EAFactoryProjectBrief {
  clientName: string;
  currentReality: string[];
  considerThePossibilities: string[];
  transformationVision: string;
  storyFramework: string[];
  transformationNarrative: string;
  websiteStructure: string[];
  portalRecommendations: string[];
  moduleRecommendations: string[];
  imageRequirements: string[];
  repoRecommendations: RepositoryCandidate[];
  buildRequirements: string[];
  suggestedNextSteps: string[];
  codexBuildPrompt: string;
  exportPackage: {
    filename: string;
    generatedAt: string;
    protocols: string[];
    repositories: string[];
    payload: string;
  };
  approvalGate: {
    required: true;
    status: 'needs-review';
    reviewAreas: string[];
  };
}

export interface EAFactorySkinBrief {
  projectName: string;
  heroConcept: string;
  visualStory: string;
  emotionalGoals: string[];
  colorDirection: string[];
  typographyDirection: string;
  layoutDirection: string[];
  animationDirection: string[];
  imageRequirements: string[];
  sectionStructure: string[];
  experienceNarrative: string;
  reviewPackage: string[];
  exportPackage: {
    protocols: string[];
    repositories: string[];
    codexReadySummary: string;
  };
  approvalPackage: {
    required: true;
    status: 'needs-review' | 'approved';
    checklist: string[];
  };
}

export const EA_FACTORY_PHASES: EAFactoryPhase[] = [
  {
    id: 'protocol-center',
    name: 'Protocol Center',
    purpose: 'Single source of truth for EA standards, rules, and approval-ready operating protocols.',
    input: ['EA standards', 'brand rules', 'chassis rules', 'delivery lessons', 'approved client patterns'],
    output: ['versioned protocols', 'active protocol registry', 'import/export packages'],
    humanApprovalGate: true,
  },
  {
    id: 'repo-library',
    name: 'Repo Library',
    purpose: 'Searchable intelligence layer for approved UI, animation, visual, and storytelling repositories.',
    input: ['internal repos', 'external approved libraries', 'compatibility notes', 'performance evaluations'],
    output: ['ranked repo recommendations', 'reuse guidance', 'implementation constraints'],
    humanApprovalGate: false,
  },
  {
    id: 'project-generator',
    name: 'Project Generator',
    purpose: 'Convert client facts into strategy, requirements, recommendations, and Codex-ready build prompts.',
    input: ['client profile', 'mission', 'goals', 'desired outcome', 'selected protocols'],
    output: ['story framework', 'website structure', 'module recommendations', 'build prompt'],
    humanApprovalGate: true,
  },
  {
    id: 'skin-factory',
    name: 'Skin Factory',
    purpose: 'Generate emotional, cinematic, story-driven visual direction without deploying code.',
    input: ['approved project brief', 'brand protocol', 'skin protocol', 'image requirements'],
    output: ['Skin Brief', 'Approval Package', 'visual direction'],
    humanApprovalGate: true,
  },
  {
    id: 'codex-builder',
    name: 'Codex Builder',
    purpose: 'Convert approved briefs into working EA Chassis-connected experiences.',
    input: ['approved protocols', 'project brief', 'skin brief', 'repo recommendations', 'chassis requirements'],
    output: ['landing pages', 'websites', 'portal skins', 'components', 'responsive layouts'],
    humanApprovalGate: true,
  },
  {
    id: 'approval-center',
    name: 'Approval Center',
    purpose: 'Prevent automatic deployment and track story, visual, module, brand, and functionality approval.',
    input: ['generated assets', 'reviewer notes', 'version metadata'],
    output: ['approval record', 'revision requests', 'approved deployment package'],
    humanApprovalGate: true,
  },
  {
    id: 'chassis-deployment',
    name: 'Chassis Deployment',
    purpose: 'Attach approved skins and modules to the EA Chassis without overwriting story or function.',
    input: ['approved deployment package', 'skin controls', 'chassis controls'],
    output: ['deployed experience', 'Pulse-ready analytics', 'module registrations'],
    humanApprovalGate: true,
  },
];

export const EA_FACTORY_PROTOCOLS: EAFactoryProtocol[] = [
  {
    id: 'ea-master',
    name: 'EA Master Protocol',
    category: 'governance',
    status: 'active',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'active',
    futureNotes: 'Move to Pulse-native protocol storage after the Git-backed seed is approved.',
    tags: ['ea', 'governance', 'approval', 'operating-system'],
    purpose: 'Defines how EA captures expertise, creates standards, automates decisions, and preserves human approval.',
    governs: ['all phases', 'human approval', 'deployment authority', 'quality standards'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'active', notes: 'Seeded from EA Factory master build prompt.' }],
  },
  {
    id: 'ea-brand',
    name: 'EA Brand Protocol',
    category: 'brand',
    status: 'approved',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'approved',
    futureNotes: 'Expand with voice examples for vertical deployments.',
    tags: ['brand', 'voice', 'trust', 'premium'],
    purpose: 'Keeps EA messaging premium, direct, human, and outcome-driven across every artifact.',
    governs: ['voice', 'positioning', 'offers', 'client-facing language'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'approved', notes: 'Initial brand governance seed.' }],
  },
  {
    id: 'ea-skin',
    name: 'EA Skin Protocol',
    category: 'experience',
    status: 'active',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'active',
    futureNotes: 'Add image QA examples and approved skin references.',
    tags: ['skin', 'cinematic', 'storytelling', 'emotion'],
    purpose: 'Ensures every skin tells a human story, creates emotion, and avoids generic corporate design.',
    governs: ['hero concepts', 'visual direction', 'imagery', 'section layouts', 'animation recommendations'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'active', notes: 'Aligned with EA Skin and Chassis Constitution.' }],
  },
  {
    id: 'ea-chassis',
    name: 'EA Chassis Protocol',
    category: 'platform',
    status: 'active',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'active',
    futureNotes: 'Wire module self-registration metadata into Pulse.',
    tags: ['chassis', 'modules', 'navigation', 'permissions', 'pulse'],
    purpose: 'Defines module registration, dashboard, search, help, analytics, permissions, and mobile support rules.',
    governs: ['portal modules', 'dashboard widgets', 'admin pages', 'permissions', 'analytics', 'Pulse support'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'active', notes: 'Aligned with reusable EA Portal Chassis rules.' }],
  },
  {
    id: 'ea-website',
    name: 'EA Website Protocol',
    category: 'website',
    status: 'approved',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'approved',
    futureNotes: 'Add vertical structure variants for recruiting, nonprofit, church, and membership.',
    tags: ['website', 'landing-page', 'conversion', 'story'],
    purpose: 'Turns strategy and visual direction into story-first public websites and landing pages.',
    governs: ['site structure', 'conversion flow', 'content hierarchy', 'responsive layout'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'approved', notes: 'Initial website protocol seed.' }],
  },
  {
    id: 'ea-image',
    name: 'EA Image Protocol',
    category: 'creative',
    status: 'approved',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'approved',
    futureNotes: 'Add prompt packs for real client imagery, generated imagery, and proof galleries.',
    tags: ['image', 'cinematic', 'campaign', 'human'],
    purpose: 'Guides image requirements toward cinematic, emotional, outcome-focused visuals.',
    governs: ['hero images', 'gallery assets', 'generated imagery', 'visual QA'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'approved', notes: 'Initial image protocol seed.' }],
  },
  {
    id: 'ea-sales',
    name: 'EA Sales Protocol',
    category: 'revenue',
    status: 'draft',
    activeVersion: '0.1.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvalStatus: 'needs-review',
    futureNotes: 'Needs offer library, objection handling, and proposal stage mapping.',
    tags: ['sales', 'proposal', 'offer', 'conversion'],
    purpose: 'Standardizes how EA turns assessment insight into offers, proposals, and purchase paths.',
    governs: ['offers', 'proposal narratives', 'checkout alignment', 'follow-up prompts'],
    approvalRequired: true,
    versionHistory: [{ version: '0.1.0', status: 'draft', notes: 'Needs offer-specific review.' }],
  },
  {
    id: 'ea-portal',
    name: 'EA Portal Protocol',
    category: 'portal',
    status: 'approved',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'approved',
    futureNotes: 'Connect directly to portal module presets and tenant deployment rules.',
    tags: ['portal', 'pulse', 'modules', 'dashboard', 'client-success'],
    purpose: 'Defines how portal deployments organize dashboard, modules, help, search, notifications, and client success paths.',
    governs: ['portal navigation', 'portal modules', 'dashboard composition', 'user workflows', 'client success'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'approved', notes: 'Seeded from EA Factory Phase 1-4 prompt.' }],
  },
  {
    id: 'ea-assessment',
    name: 'EA Assessment Protocol',
    category: 'intelligence',
    status: 'approved',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Founder',
    approvalStatus: 'approved',
    futureNotes: 'Connect assessment output history to Project Generator recommendations.',
    tags: ['assessment', 'capture', 'blueprint', 'recommendations'],
    purpose: 'Converts client inputs into structured diagnosis, blueprint, and next-step recommendations.',
    governs: ['assessment questions', 'scoring', 'blueprint generation', 'recommendation logic'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'approved', notes: 'Initial assessment protocol seed.' }],
  },
  {
    id: 'ea-ctp',
    name: 'EA CTP Protocol',
    category: 'intelligence',
    status: 'active',
    activeVersion: '1.3.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-07-04',
    modifiedDate: '2026-07-04',
    approvedBy: 'EA Founder',
    approvalStatus: 'active',
    futureNotes: 'Wire Creative Studio campaign bridge and portal CTP status module.',
    tags: ['ctp', 'consider', 'discovery', 'intake', 'magnifi', 'possibilities'],
    purpose:
      'Governs Consider The Possibilities™ — Magnifi share → guided discovery → CTP submission → workspace, studio, and collaborative review lifecycle.',
    governs: [
      'discovery intake',
      'architect mode gating',
      'CTP submissions persistence',
      'workspace provisioning status',
      'design studio readiness',
      'review scheduling',
      'Pulse ctp.submitted + ctp.intake.analyzed + ctp.workspace.* events',
      'post-submit intake agent orchestration',
      'workspace auto-provision on portal-required submissions',
      'portal CTP status module',
    ],
    approvalRequired: true,
    versionHistory: [
      { version: '1.3.0', status: 'active', notes: 'Portal /ctp status page and GET /api/portal/ctp for prospect lifecycle visibility.' },
      { version: '1.2.0', status: 'active', notes: 'Auto-provision EA portal workspace after CTP submit when portal required.' },
      { version: '1.1.0', status: 'active', notes: 'Intake agent runs after CTP submit; analysis stored on submission row.' },
      { version: '1.0.0', status: 'active', notes: 'Initial CTP operational protocol — submissions table + Pulse integration.' },
    ],
  },
  {
    id: 'ea-training',
    name: 'EA Training Protocol',
    category: 'delivery',
    status: 'draft',
    activeVersion: '0.1.0',
    owner: 'Efficiency Architects',
    createdDate: '2026-06-23',
    modifiedDate: '2026-06-23',
    approvalStatus: 'needs-review',
    futureNotes: 'Expand with 7-day onboarding SOP and module help content.',
    tags: ['training', 'learning', 'onboarding', 'enablement'],
    purpose: 'Standardizes training, onboarding, and enablement flows for clients and portal users.',
    governs: ['learning hub', 'onboarding SOPs', 'help content', 'client enablement'],
    approvalRequired: true,
    versionHistory: [{ version: '0.1.0', status: 'draft', notes: 'Needs delivery SOP expansion.' }],
  },
];

export const EA_FACTORY_FUTURE_PROTOCOLS = [
  'EA Social Protocol',
  'EA Experience Rental Protocol',
  'EA Recruiting Protocol',
  'EA Nonprofit Protocol',
  'EA Church Protocol',
  'EA Membership Protocol',
];

export const EA_FACTORY_REPO_CATEGORIES = [
  'Cinematic',
  'Storytelling',
  'Dashboard',
  'Training',
  'Membership',
  'Recruiting',
  'Community',
  'Events',
  'Nonprofit',
  'Church',
  'Creator',
  'Business',
  'Premium',
];

export const EA_FACTORY_FUTURE_SECTIONS = [
  {
    name: 'Approval Center',
    href: '/admin/ea-factory/approvals',
    purpose: 'Placeholder for future human approval tracking.',
  },
  {
    name: 'Codex Builder',
    href: '/admin/ea-factory/codex-builder',
    purpose: 'Placeholder for future approved build prompt handoff.',
  },
  {
    name: 'Chassis Deployment',
    href: '/admin/ea-factory/chassis-deployment',
    purpose: 'Placeholder for future deployment package registration.',
  },
  {
    name: 'AI Research Agent',
    href: '/admin/ea-factory/ai-research-agent',
    purpose: 'Placeholder only. No agent functionality is built.',
  },
  {
    name: 'Magnifi Integration',
    href: '/admin/ea-factory/magnifi-integration',
    purpose: 'Placeholder for future Magnifi intelligence integration.',
  },
  {
    name: 'Simplifi Integration',
    href: '/admin/ea-factory/simplifi-integration',
    purpose: 'Placeholder for future Simplifi capture integration.',
  },
];

export function getProtocolLibrary() {
  return {
    protocols: EA_FACTORY_PROTOCOLS.map((protocol) => ({ ...protocol, source: 'pulse-seed' as const })),
    categories: Array.from(new Set(EA_FACTORY_PROTOCOLS.map((protocol) => protocol.category))).sort(),
    activeVersions: Object.fromEntries(EA_FACTORY_PROTOCOLS.map((protocol) => [protocol.id, protocol.activeVersion])),
    futureProtocols: EA_FACTORY_FUTURE_PROTOCOLS,
    source: 'pulse-seed',
  };
}

export async function getProtocolLibraryFromGitHub() {
  const owner = process.env.EA_PROTOCOLS_GITHUB_OWNER ?? 'TheArchitect1111';
  const repo = process.env.EA_PROTOCOLS_GITHUB_REPO ?? 'ea-protocols';
  const branch = process.env.EA_PROTOCOLS_GITHUB_BRANCH ?? 'main';
  const token = process.env.GITHUB_TOKEN ?? process.env.EA_PROTOCOLS_GITHUB_TOKEN;
  const endpoint = `https://api.github.com/repos/${owner}/${repo}/contents?ref=${branch}`;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) return getProtocolLibrary();

    const files = (await response.json()) as Array<{
      name?: string;
      path?: string;
      type?: string;
      download_url?: string;
    }>;

    const protocolFiles = files.filter((file) => file.type === 'file' && /\.(md|mdx|json)$/i.test(file.name ?? ''));
    if (protocolFiles.length === 0) return getProtocolLibrary();

    const githubProtocols = await Promise.all(
      protocolFiles.map(async (file) => {
        const raw = file.download_url ? await fetch(file.download_url, { next: { revalidate: 300 } }) : null;
        const content = raw?.ok ? await raw.text() : '';
        return protocolFromGitHubFile(file.name ?? 'protocol.md', file.path ?? file.name ?? 'protocol.md', content);
      }),
    );

    return {
      protocols: githubProtocols,
      categories: Array.from(new Set(githubProtocols.map((protocol) => protocol.category))).sort(),
      activeVersions: Object.fromEntries(githubProtocols.map((protocol) => [protocol.id, protocol.activeVersion])),
      futureProtocols: EA_FACTORY_FUTURE_PROTOCOLS,
      source: 'github',
      repository: `${owner}/${repo}`,
      branch,
    };
  } catch {
    return getProtocolLibrary();
  }
}

export function searchProtocols(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return EA_FACTORY_PROTOCOLS;

  return EA_FACTORY_PROTOCOLS.filter((protocol) => {
    const blob = [
      protocol.id,
      protocol.name,
      protocol.category,
      protocol.status,
      protocol.purpose,
      ...protocol.tags,
      ...protocol.governs,
    ]
      .join(' ')
      .toLowerCase();

    return blob.includes(needle);
  });
}

export function getProtocolById(id: string) {
  return EA_FACTORY_PROTOCOLS.find((protocol) => protocol.id === id);
}

export function buildRepoIntelligence() {
  return EA_REPOSITORY_LIBRARY.map((repo) => ({
    ...repo,
    tags: Array.from(new Set([...repo.industries, ...repo.useCases, repo.category, ...repo.suggestedProtocols])),
    compatibility: repo.strengths.includes('Chassis reuse') || repo.id === 'ea-payments' ? 'EA Chassis ready' : 'EA compatible',
    animationLevel: repo.scores.animation >= 8 ? 'high' : repo.scores.animation >= 6 ? 'medium' : 'low',
    storytellingScore: repo.scores.storytelling,
    animationScore: repo.scores.animation,
    mobileScore: repo.scores.mobile,
    complexityScore: repo.scores.complexity,
    performanceScore: repo.scores.performance,
    protocolCompatibility: repo.suggestedProtocols,
  }));
}

export function searchRepositories(query = '', category = '', favoritesOnly = false, recommendedOnly = false) {
  const needle = query.toLowerCase().trim();
  return buildRepoIntelligence().filter((repo) => {
    const matchesQuery =
      !needle ||
      [repo.name, repo.description, repo.category, repo.compatibility, ...repo.tags, ...repo.useCases, ...repo.strengths]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    const matchesCategory = !category || repo.category === category;
    const matchesFavorite = !favoritesOnly || repo.favorite;
    const matchesRecommended = !recommendedOnly || repo.recommended;
    return matchesQuery && matchesCategory && matchesFavorite && matchesRecommended;
  });
}

export function getRepoIntelligenceById(id: string) {
  return buildRepoIntelligence().find((repo) => repo.id === id);
}

export function generateEAFactoryProjectBrief(input: EAFactoryProjectInput): EAFactoryProjectBrief {
  const industryBlob = `${input.industry} ${input.mission}`;
  const useCaseBlob = `${input.goals.join(' ')} ${input.desiredOutcome}`;
  const repoRecommendations = EA_REPOSITORY_LIBRARY.filter((repo) => {
    const haystack = `${repo.industries.join(' ')} ${repo.useCases.join(' ')} ${repo.strengths.join(' ')}`.toLowerCase();
    const needles = `${industryBlob} ${useCaseBlob}`.toLowerCase().split(/\s+/).filter((word) => word.length > 3);
    return needles.some((word) => haystack.includes(word));
  })
    .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || b.scores.storytelling - a.scores.storytelling)
    .slice(0, 5);

  const protocolNames = input.selectedProtocolIds
    .map((id) => EA_FACTORY_PROTOCOLS.find((protocol) => protocol.id === id)?.name)
    .filter(Boolean);

  const storyFramework = [
    `Audience sees why ${input.clientName} exists.`,
    `Audience feels the cost of staying where they are.`,
    `Audience sees the future ${input.clientName} helps create.`,
    `Audience receives a clear first step into the EA Chassis-connected experience.`,
  ];

  const websiteStructure = ['Story-first hero', 'Transformation proof', 'How it works', 'Relevant modules', 'Client portal entry', 'Conversion action'];
  const portalRecommendations = ['Dashboard', 'Update Hub', 'Help', 'Search', 'Pulse analytics'];
  const moduleRecommendations = recommendModules(input);
  const imageRequirements = [
    'Cinematic hero image showing the human outcome, not generic software.',
    'Proof images that show real people, transformation, or operational momentum.',
    'Portal preview imagery that supports the story without replacing it.',
  ];
  const buildRequirements = [
    'Use EA Chassis controls for authentication, navigation, modules, search, help, analytics, and permissions.',
    'Use EA Skin controls for story, imagery, typography, visual identity, and layout.',
    'Preserve human approval before deployment.',
    'Reuse recommended repositories before building new components.',
  ];
  const currentReality = [
    `${input.clientName} has a mission that needs to be translated into a clear digital path.`,
    'Audience attention must be earned through story before modules or features are introduced.',
    'Reusable EA Chassis patterns should reduce rebuild time without making the experience feel generic.',
  ];
  const considerThePossibilities = [
    'A visitor understands the transformation in the first screen.',
    'A client or member can move from interest to action without confusion.',
    'The portal becomes an operating layer for communication, resources, and momentum.',
  ];
  const suggestedNextSteps = [
    'Review and approve the Project Brief.',
    'Generate and review the Skin Brief.',
    'Confirm selected repositories and module recommendations.',
    'Only after approval, create the Codex Builder implementation prompt.',
  ];

  const codexBuildPrompt = [
    `Build an EA Chassis-connected experience for ${input.clientName}.`,
    input.organization ? `Organization: ${input.organization}` : '',
    input.website ? `Website: ${input.website}` : '',
    input.projectType ? `Project type: ${input.projectType}` : '',
    `Mission: ${input.mission}`,
    `Goals: ${input.goals.join('; ')}`,
    `Desired outcome: ${input.desiredOutcome}`,
    `Selected protocols: ${protocolNames.join(', ') || input.selectedProtocolIds.join(', ')}`,
    `Required modules: ${moduleRecommendations.join(', ')}`,
    `Repo recommendations: ${repoRecommendations.map((repo) => repo.name).join(', ') || 'Use EA platform defaults'}`,
    'Do not build AI agents.',
    'Do not build automatic deployment.',
    'Do not make autonomous decisions.',
    'Do not deploy until the Approval Center marks the version approved.',
  ].filter(Boolean).join('\n');

  const exportPayload = {
    projectBrief: {
      clientName: input.clientName,
      organization: input.organization,
      website: input.website,
      industry: input.industry,
      mission: input.mission,
      goals: input.goals,
      desiredOutcome: input.desiredOutcome,
      projectType: input.projectType,
      selectedProtocolIds: input.selectedProtocolIds,
      currentReality,
      considerThePossibilities,
      transformationVision: `${input.clientName} becomes a story-first ${input.projectType ?? 'experience'} that turns ${input.desiredOutcome} into a visible, guided path.`,
      storyFramework,
      websiteStructure,
      portalRecommendations,
      moduleRecommendations,
      imageRequirements,
      repoRecommendations: repoRecommendations.map((repo) => repo.name),
      buildRequirements,
      suggestedNextSteps,
      codexBuildPrompt,
    },
  };

  return {
    clientName: input.clientName,
    currentReality,
    considerThePossibilities,
    transformationVision: `${input.clientName} becomes a story-first ${input.projectType ?? 'experience'} that turns ${input.desiredOutcome} into a visible, guided path.`,
    storyFramework,
    transformationNarrative: `${input.clientName} helps ${input.industry} audiences move from scattered effort to ${input.desiredOutcome}. The experience should make the future feel possible before introducing features.`,
    websiteStructure,
    portalRecommendations,
    moduleRecommendations,
    imageRequirements,
    repoRecommendations,
    buildRequirements,
    suggestedNextSteps,
    codexBuildPrompt,
    exportPackage: {
      filename: `${slugify(input.clientName)}-ea-factory-build-package.json`,
      generatedAt: new Date().toISOString(),
      protocols: protocolNames as string[],
      repositories: repoRecommendations.map((repo) => repo.name),
      payload: JSON.stringify(exportPayload, null, 2),
    },
    approvalGate: {
      required: true,
      status: 'needs-review',
      reviewAreas: ['story', 'visual direction', 'layout', 'images', 'modules', 'branding', 'functionality'],
    },
  };
}

export function generateEAFactorySkinBrief(
  projectBrief: EAFactoryProjectBrief,
  selectedProtocolIds: string[],
  selectedRepositoryIds: string[],
): EAFactorySkinBrief {
  const projectType = normalizeSkinProjectType(projectBrief.exportPackage.payload);

  const record = generateSkinBrief({
    client_name: projectBrief.clientName,
    organization_type: extractJsonField(projectBrief.exportPackage.payload, 'industry') ?? 'Client',
    mission: extractJsonField(projectBrief.exportPackage.payload, 'mission') ?? projectBrief.transformationNarrative,
    audience: 'Primary audience from project brief',
    primary_goal: projectBrief.considerThePossibilities[0] ?? 'Transform the client experience',
    desired_emotion: 'hope',
    transformation_promise: projectBrief.transformationVision,
    project_type: projectType,
    selected_protocol: selectedProtocolIds,
    selected_repos: selectedRepositoryIds,
    chassis_modules: projectBrief.moduleRecommendations,
    brand_colors: [],
    assets: [],
    notes: '',
  });

  const protocols = selectedProtocolIds
    .map((id) => EA_FACTORY_PROTOCOLS.find((protocol) => protocol.id === id)?.name)
    .filter(Boolean) as string[];
  const repositories = record.repo_recommendations.map((repo) => repo.name);

  return {
    projectName: record.client_name,
    heroConcept: record.hero_concept,
    visualStory: record.visual_story_summary,
    emotionalGoals: record.emotional_direction.split('.').map((item) => item.trim()).filter(Boolean),
    colorDirection: record.color_direction,
    typographyDirection: record.typography_direction,
    layoutDirection: record.chassis_wiring_notes,
    animationDirection: record.animation_direction,
    imageRequirements: record.image_requirements,
    sectionStructure: record.section_story_flow.map((section) => `${section.section}: ${section.purpose}`),
    experienceNarrative: record.visual_story_summary,
    reviewPackage: [
      'Review hero concept for emotional accuracy.',
      'Review imagery for authenticity and non-generic appearance.',
      'Review section order for story clarity.',
      'Review module recommendations against the client outcome.',
      `Project type: ${skinProjectTypeLabel(record.project_type)}`,
    ],
    exportPackage: {
      protocols,
      repositories,
      codexReadySummary: record.codex_build_prompt,
    },
    approvalPackage: {
      required: true,
      status: record.status === 'approved' ? 'approved' : 'needs-review',
      checklist: ['story', 'emotion', 'visual direction', 'images', 'layout', 'modules', 'brand fit'],
    },
  };
}

function normalizeSkinProjectType(payload: string): SkinProjectType {
  const raw = extractJsonField(payload, 'projectType') ?? 'Website';
  const slug = raw.toLowerCase().replace(/\s+/g, '-');
  const allowed: SkinProjectType[] = [
    'website',
    'landing-page',
    'portal-skin',
    'training-experience',
    'membership-experience',
    'event-experience',
    'recruiting-experience',
    'creator-experience',
    'church-nonprofit-experience',
  ];
  return allowed.find((type) => type === slug || type.replace(/-/g, ' ') === raw.toLowerCase()) ?? 'website';
}

function extractJsonField(payload: string, key: string) {
  const match = payload.match(new RegExp(`"${key}":"([^"]+)"`));
  return match?.[1];
}

function recommendModules(input: EAFactoryProjectInput) {
  const blob = `${input.industry} ${input.mission} ${input.goals.join(' ')} ${input.desiredOutcome}`.toLowerCase();
  const modules = new Set(['Update Hub', 'Opportunities & Resources']);

  if (blob.includes('training') || blob.includes('education') || blob.includes('onboarding')) modules.add('Learning Hub');
  if (blob.includes('event') || blob.includes('camp') || blob.includes('showcase')) modules.add('Event Hub');
  if (blob.includes('community') || blob.includes('member')) modules.add('Community Directory');
  if (blob.includes('job') || blob.includes('career') || blob.includes('recruit')) modules.add('Job Board');
  if (blob.includes('sponsor') || blob.includes('partner')) modules.add('Sponsor Center');
  if (blob.includes('market') || blob.includes('resource') || blob.includes('offer')) modules.add('Marketplace');

  return Array.from(modules);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'ea-project';
}

function protocolFromGitHubFile(name: string, path: string, content: string): EAFactoryProtocol {
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? name.replace(/\.(md|mdx|json)$/i, '');
  const id = slugify(title.replace(/™/g, ''));
  const type = inferProtocolType(title);
  const purpose =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#') && !line.startsWith('---')) ??
    'GitHub protocol record imported from ea-protocols.';

  return {
    id,
    name: title,
    category: type,
    status: 'active',
    activeVersion: '1.0.0',
    owner: 'Efficiency Architects',
    createdDate: 'GitHub source',
    modifiedDate: 'GitHub source',
    approvedBy: 'GitHub source',
    approvalStatus: 'active',
    futureNotes: 'Imported from GitHub. Pulse-native protocol storage can replace this source later.',
    tags: [type, 'github', 'ea-protocols'],
    purpose,
    governs: [type, 'EA Factory', 'Pulse retrieval'],
    approvalRequired: true,
    versionHistory: [{ version: '1.0.0', status: 'active', notes: `Imported from ${path}.` }],
    source: 'github',
    sourcePath: path,
  };
}

function inferProtocolType(title: string) {
  const value = title.toLowerCase();
  if (value.includes('brand')) return 'brand';
  if (value.includes('skin') || value.includes('image')) return 'creative';
  if (value.includes('chassis') || value.includes('portal')) return 'platform';
  if (value.includes('website')) return 'website';
  if (value.includes('sales')) return 'revenue';
  if (value.includes('assessment')) return 'intelligence';
  if (value.includes('training')) return 'delivery';
  return 'governance';
}
