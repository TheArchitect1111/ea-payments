import { EA_FACTORY_PROTOCOLS } from './ea-factory';
import { EA_REPOSITORY_LIBRARY, matchRepositories, type RepositoryCandidate } from './repository-library';

export type SkinBriefStatus = 'draft' | 'needs-review' | 'approved' | 'revision-requested' | 'archived';

export type SkinProjectType =
  | 'website'
  | 'landing-page'
  | 'portal-skin'
  | 'training-experience'
  | 'membership-experience'
  | 'event-experience'
  | 'recruiting-experience'
  | 'creator-experience'
  | 'church-nonprofit-experience';

export const SKIN_PROJECT_TYPES: Array<{ id: SkinProjectType; label: string }> = [
  { id: 'website', label: 'Website' },
  { id: 'landing-page', label: 'Landing page' },
  { id: 'portal-skin', label: 'Portal skin' },
  { id: 'training-experience', label: 'Training experience' },
  { id: 'membership-experience', label: 'Membership experience' },
  { id: 'event-experience', label: 'Event experience' },
  { id: 'recruiting-experience', label: 'Recruiting experience' },
  { id: 'creator-experience', label: 'Creator experience' },
  { id: 'church-nonprofit-experience', label: 'Church / nonprofit experience' },
];

export const CHASSIS_MODULE_OPTIONS = [
  'Authentication',
  'Navigation shell',
  'Dashboard home',
  'Update Hub',
  'Opportunities & Resources',
  'Learning Hub',
  'Event Hub',
  'Community Directory',
  'Job Board',
  'Sponsor Center',
  'Marketplace',
  'Training modules',
  'Resource library',
  'Analytics widgets',
  'Search',
  'Help center',
  'Permissions & roles',
] as const;

export type ChassisModule = (typeof CHASSIS_MODULE_OPTIONS)[number];

export interface SkinBriefAsset {
  name: string;
  type: string;
  dataUrl?: string;
}

export interface SkinBriefSection {
  section: string;
  purpose: string;
  emotion: string;
  contentNotes: string;
}

export interface SkinRepoRecommendation {
  repoId: string;
  name: string;
  whyItFits: string;
  suggestedUse: string;
  complexityLevel: 'low' | 'medium' | 'high';
  mobileImpact: string;
  performanceConcerns: string;
}

export interface SkinBriefInput {
  client_name: string;
  organization_type: string;
  website_social_url?: string;
  mission: string;
  audience: string;
  primary_goal: string;
  desired_emotion: string;
  transformation_promise: string;
  project_type: SkinProjectType;
  selected_protocol: string[];
  selected_repos: string[];
  chassis_modules: string[];
  brand_colors: string[];
  assets: SkinBriefAsset[];
  notes?: string;
}

export interface SkinBriefRecord {
  id: string;
  client_name: string;
  organization_type: string;
  website_social_url: string;
  mission: string;
  audience: string;
  primary_goal: string;
  desired_emotion: string;
  transformation_promise: string;
  project_type: SkinProjectType;
  selected_protocol: string[];
  selected_repos: string[];
  chassis_modules: string[];
  brand_colors: string[];
  assets: SkinBriefAsset[];
  notes: string;
  visual_story_summary: string;
  emotional_direction: string;
  hero_concept: string;
  section_story_flow: SkinBriefSection[];
  image_requirements: string[];
  color_direction: string[];
  typography_direction: string;
  animation_direction: string[];
  repo_recommendations: SkinRepoRecommendation[];
  chassis_wiring_notes: string[];
  module_placement_notes: string[];
  mobile_notes: string[];
  accessibility_notes: string[];
  codex_build_prompt: string;
  status: SkinBriefStatus;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
}

export interface SkinBuildExportPackage {
  generatedAt: string;
  clientName: string;
  projectType: string;
  status: SkinBriefStatus;
  exportMode: 'approved' | 'draft';
  protocols: string[];
  repositories: string[];
  chassisModules: string[];
  designRules: string[];
  buildRequirements: string[];
  skinBrief: SkinBriefRecord;
  codexBuildPrompt: string;
}

export const SKIN_DESIGN_RULES = [
  'Tell a story — the skin is the storytelling layer on top of the EA Chassis.',
  'Create emotion before explaining features.',
  'Feel custom built and cinematic — never like a generic SaaS template.',
  'Avoid boxy layouts, corporate dashboard-first design, and generic AI visuals.',
  'Use large emotional imagery and scroll-driven storytelling where appropriate.',
  'Preserve the client wording, mission language, and transformation promise.',
  'Support mobile-first layouts with generous hierarchy and breathing room.',
  'Do not hardcode colors — inherit brand tokens from the brief.',
  'Do not break chassis modules — wire story around function, not over it.',
  'Do not auto-deploy — human approval is required before build.',
];

export const SKIN_FACTORY_FUTURE_HOOKS = [
  { id: 'protocol-center', label: 'Protocol Center', href: '/admin/protocol-center', ready: true },
  { id: 'project-generator', label: 'Project Generator', href: '/admin/ea-factory/project-generator', ready: true },
  { id: 'approval-center', label: 'Approval Center', href: '/admin/ea-factory/approvals', ready: false },
  { id: 'codex-builder', label: 'Codex Builder', href: '/admin/ea-factory/codex-builder', ready: false },
  { id: 'chassis-deployment', label: 'Chassis Deployment', href: '/admin/ea-factory/chassis-deployment', ready: false },
  { id: 'simplifi-possibilities', label: 'Simplifi Generate Possibilities', href: '/admin/simplifi', ready: true },
  { id: 'magnifi-analysis', label: 'Magnifi Analysis', href: '/admin/ea-factory/magnifi-integration', ready: false },
  { id: 'pulse-analytics', label: 'Pulse Analytics', href: '/admin/master', ready: true },
] as const;

export function skinProjectTypeLabel(type: SkinProjectType) {
  return SKIN_PROJECT_TYPES.find((item) => item.id === type)?.label ?? type;
}

export function canExportSkinBrief(status: SkinBriefStatus, exportDraft = false) {
  return status === 'approved' || exportDraft;
}

export function createSkinBriefId() {
  return `skin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function generateSkinBrief(input: SkinBriefInput, existing?: Partial<SkinBriefRecord>): SkinBriefRecord {
  const now = new Date().toISOString();
  const projectLabel = skinProjectTypeLabel(input.project_type);
  const protocolNames = resolveProtocolNames(input.selected_protocol);
  const repoRecs = buildSkinRepoRecommendations(input);
  const modules = normalizeModules(input);
  const sectionFlow = buildSectionStoryFlow(input, projectLabel);
  const heroConcept = buildHeroConcept(input, projectLabel);
  const visualStory = buildVisualStorySummary(input, projectLabel);
  const emotionalDirection = buildEmotionalDirection(input);
  const chassisWiring = buildChassisWiringNotes(input, modules, projectLabel);
  const modulePlacement = buildModulePlacementNotes(input, modules, projectLabel);
  const imageRequirements = buildImageRequirements(input, projectLabel);
  const colorDirection = buildColorDirection(input);
  const typographyDirection = buildTypographyDirection(input);
  const animationDirection = buildAnimationDirection(input);
  const mobileNotes = buildMobileNotes(input, projectLabel);
  const accessibilityNotes = buildAccessibilityNotes(input);
  const codexPrompt = buildCodexBuildPrompt({
    input,
    projectLabel,
    protocolNames,
    repoRecs,
    modules,
    heroConcept,
    visualStory,
    emotionalDirection,
    sectionFlow,
    imageRequirements,
    colorDirection,
    typographyDirection,
    animationDirection,
    chassisWiring,
    modulePlacement,
    mobileNotes,
    accessibilityNotes,
  });

  return {
    id: existing?.id ?? createSkinBriefId(),
    client_name: input.client_name.trim(),
    organization_type: input.organization_type.trim(),
    website_social_url: input.website_social_url?.trim() ?? '',
    mission: input.mission.trim(),
    audience: input.audience.trim(),
    primary_goal: input.primary_goal.trim(),
    desired_emotion: input.desired_emotion.trim(),
    transformation_promise: input.transformation_promise.trim(),
    project_type: input.project_type,
    selected_protocol: input.selected_protocol,
    selected_repos: input.selected_repos,
    chassis_modules: modules,
    brand_colors: input.brand_colors,
    assets: input.assets,
    notes: input.notes?.trim() ?? '',
    visual_story_summary: visualStory,
    emotional_direction: emotionalDirection,
    hero_concept: heroConcept,
    section_story_flow: sectionFlow,
    image_requirements: imageRequirements,
    color_direction: colorDirection,
    typography_direction: typographyDirection,
    animation_direction: animationDirection,
    repo_recommendations: repoRecs,
    chassis_wiring_notes: chassisWiring,
    module_placement_notes: modulePlacement,
    mobile_notes: mobileNotes,
    accessibility_notes: accessibilityNotes,
    codex_build_prompt: codexPrompt,
    status: existing?.status ?? 'needs-review',
    created_at: existing?.created_at ?? now,
    updated_at: now,
    approved_at: existing?.approved_at ?? null,
    approved_by: existing?.approved_by ?? null,
  };
}

export function buildSkinExportPackage(brief: SkinBriefRecord, exportDraft = false): SkinBuildExportPackage {
  if (!canExportSkinBrief(brief.status, exportDraft)) {
    throw new Error('Skin Brief must be Approved or exported as draft.');
  }

  const protocolNames = resolveProtocolNames(brief.selected_protocol);

  return {
    generatedAt: new Date().toISOString(),
    clientName: brief.client_name,
    projectType: skinProjectTypeLabel(brief.project_type),
    status: brief.status,
    exportMode: exportDraft ? 'draft' : 'approved',
    protocols: protocolNames,
    repositories: brief.repo_recommendations.map((repo) => repo.name),
    chassisModules: brief.chassis_modules,
    designRules: SKIN_DESIGN_RULES,
    buildRequirements: [
      'Build the approved skin using selected repos and chassis requirements.',
      'Preserve story, wording, emotion, brand, layout direction, mobile behavior, and module wiring.',
      'Do not replace the skin with a generic template or corporate SaaS layout.',
      'Do not hardcode colors — use brand tokens from the brief.',
      'Do not break chassis modules or bypass human approval gates.',
      'Do not auto-deploy.',
    ],
    skinBrief: brief,
    codexBuildPrompt: brief.codex_build_prompt,
  };
}

function resolveProtocolNames(ids: string[]) {
  return ids
    .map((id) => EA_FACTORY_PROTOCOLS.find((protocol) => protocol.id === id)?.name ?? id)
    .filter(Boolean);
}

function normalizeModules(input: SkinBriefInput) {
  if (input.chassis_modules.length > 0) return input.chassis_modules;
  return recommendChassisModules(input);
}

function recommendChassisModules(input: SkinBriefInput): string[] {
  const blob = `${input.organization_type} ${input.mission} ${input.audience} ${input.primary_goal} ${input.project_type}`.toLowerCase();
  const modules = new Set<string>(['Navigation shell', 'Update Hub', 'Opportunities & Resources']);

  if (input.project_type.includes('portal') || blob.includes('member') || blob.includes('community')) {
    modules.add('Dashboard home');
    modules.add('Authentication');
  }
  if (input.project_type.includes('training') || blob.includes('learn') || blob.includes('course')) {
    modules.add('Learning Hub');
    modules.add('Training modules');
  }
  if (input.project_type.includes('event') || blob.includes('event')) modules.add('Event Hub');
  if (input.project_type.includes('recruiting') || blob.includes('recruit') || blob.includes('athlete')) {
    modules.add('Resource library');
    modules.add('Job Board');
  }
  if (input.project_type.includes('membership') || blob.includes('member')) modules.add('Community Directory');
  if (input.project_type.includes('church') || blob.includes('church') || blob.includes('nonprofit')) {
    modules.add('Help center');
    modules.add('Event Hub');
  }
  if (input.project_type.includes('creator')) modules.add('Marketplace');
  if (blob.includes('sponsor') || blob.includes('partner')) modules.add('Sponsor Center');

  modules.add('Search');
  modules.add('Permissions & roles');

  return Array.from(modules);
}

function buildSkinRepoRecommendations(input: SkinBriefInput): SkinRepoRecommendation[] {
  const blob = `${input.organization_type} ${input.mission} ${input.audience} ${input.primary_goal} ${input.project_type}`;
  const autoMatched = matchRepositories(blob, blob);
  const selected = input.selected_repos
    .map((id) => EA_REPOSITORY_LIBRARY.find((repo) => repo.id === id))
    .filter((repo): repo is RepositoryCandidate => Boolean(repo));

  const merged = [...selected, ...autoMatched].filter(
    (repo, index, list) => list.findIndex((item) => item.id === repo.id) === index,
  );

  const tagNeedle = [
    input.project_type.replace(/-/g, ' '),
    input.organization_type,
    input.desired_emotion,
    ...input.chassis_modules,
  ]
    .join(' ')
    .toLowerCase();

  const ranked = merged
    .map((repo) => ({
      repo,
      score:
        scoreRepoForSkin(repo, tagNeedle) +
        (input.selected_repos.includes(repo.id) ? 12 : 0) +
        (repo.recommended ? 6 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return ranked.map(({ repo }) => ({
    repoId: repo.id,
    name: repo.name,
    whyItFits: explainRepoFit(repo, input),
    suggestedUse: suggestRepoUse(repo, input),
    complexityLevel: repo.scores.complexity >= 7 ? 'high' : repo.scores.complexity >= 5 ? 'medium' : 'low',
    mobileImpact:
      repo.scores.mobile >= 8
        ? 'Strong mobile patterns — safe for story-first mobile layouts.'
        : repo.scores.mobile >= 6
          ? 'Moderate mobile support — validate hero and scroll sections on small screens.'
          : 'Mobile needs extra QA — use selectively for desktop-led moments only.',
    performanceConcerns:
      repo.scores.performance >= 8
        ? 'Low concern — keep imagery optimized and lazy-load emotional sections.'
        : repo.scores.animation >= 8
          ? 'Watch animation weight on mobile — prefer reveal timing over heavy effects.'
          : 'Balance visual richness with bundle size — prefer overlay patterns over full replacement.',
  }));
}

function scoreRepoForSkin(repo: RepositoryCandidate, needle: string) {
  const haystack = `${repo.category} ${repo.industries.join(' ')} ${repo.useCases.join(' ')} ${repo.strengths.join(' ')}`.toLowerCase();
  const keywords = ['cinematic', 'story', 'animation', 'premium', 'community', 'training', 'recruiting', 'membership', 'church', 'nonprofit', 'creator', 'sports', 'dashboard', 'portal'];
  let score = repo.scores.storytelling + repo.scores.animation * 0.6;
  for (const word of keywords) {
    if (needle.includes(word) && haystack.includes(word)) score += 4;
  }
  return score;
}

function explainRepoFit(repo: RepositoryCandidate, input: SkinBriefInput) {
  const type = skinProjectTypeLabel(input.project_type).toLowerCase();
  if (repo.id === 'ea-payments') {
    return `Anchors the ${type} to the live EA Chassis with Pulse, portal, and module patterns already proven in production.`;
  }
  if (repo.id === 'cpr-site' && input.project_type === 'recruiting-experience') {
    return 'Proven recruiting portal storytelling, parent communication, and high-trust athlete pipeline patterns.';
  }
  if ((repo.id === 'brother-hub' || repo.id === 'sister-hub') && input.project_type.includes('membership')) {
    return 'Warm membership and community hub patterns that support belonging without dashboard-first design.';
  }
  if (repo.scores.animation >= 8) {
    return `Adds cinematic motion vocabulary that supports the desired emotion: ${input.desired_emotion}.`;
  }
  if (repo.scores.storytelling >= 8) {
    return `Strong narrative layout references for ${input.organization_type} audiences moving toward ${input.primary_goal}.`;
  }
  return `Compatible overlay for ${input.client_name}'s ${type} without replacing chassis function.`;
}

function suggestRepoUse(repo: RepositoryCandidate, _input: SkinBriefInput) {
  if (repo.strategy === 'extend') return 'Extend as the chassis-connected foundation — skin wraps modules, not replaces them.';
  if (repo.strategy === 'overlay') return 'Borrow section rhythm, portal tone, and trust patterns — adapt to client story language.';
  if (repo.scores.animation >= 8) return 'Use for hero motion, scroll reveals, and interactive proof moments only.';
  return 'Reuse component and layout inspiration while preserving client-specific copy and imagery direction.';
}

function buildHeroConcept(input: SkinBriefInput, projectLabel: string) {
  return [
    `Open on a cinematic first viewport for ${input.client_name}: ${input.audience} should immediately feel ${input.desired_emotion}.`,
    `Lead with the transformation promise — "${input.transformation_promise}" — before any module or dashboard language appears.`,
    `Use one dominant emotional image or film-like sequence that proves ${input.primary_goal} is already possible.`,
    `The hero is not a product screenshot. It is the future ${input.mission} makes believable inside this ${projectLabel.toLowerCase()}.`,
  ].join(' ');
}

function buildVisualStorySummary(input: SkinBriefInput, projectLabel: string) {
  return `${input.client_name} exists so ${input.audience} can move from today's friction toward ${input.transformation_promise}. The ${projectLabel.toLowerCase()} should feel like a guided story — not a template — where every section earns the next scroll. Preserve the client's language: mission ("${input.mission}"), goal ("${input.primary_goal}"), and emotional target (${input.desired_emotion}). The chassis handles function behind the scenes; the skin makes that function feel inevitable.`;
}

function buildEmotionalDirection(input: SkinBriefInput) {
  return [
    `Primary emotion: ${input.desired_emotion}.`,
    `Secondary tones: confidence, clarity, and momentum without corporate coldness.`,
    `Audience: ${input.audience} — design for their real context in ${input.organization_type}, not a generic industry persona.`,
    `Every section should answer: "Why should I believe ${input.transformation_promise} is possible for me right now?"`,
    `Avoid sterile SaaS hero patterns, stock-photo sameness, and dashboard-first first impressions.`,
  ].join(' ');
}

function buildSectionStoryFlow(input: SkinBriefInput, projectLabel: string): SkinBriefSection[] {
  const base: SkinBriefSection[] = [
    {
      section: 'Opening scene',
      purpose: 'Establish identity and emotional stakes',
      emotion: input.desired_emotion,
      contentNotes: `Use client mission language verbatim where possible: "${input.mission}". Show ${input.audience} in the world ${input.client_name} serves.`,
    },
    {
      section: 'Current reality',
      purpose: 'Name the cost of staying where they are',
      emotion: 'recognition',
      contentNotes: `Reflect real friction for ${input.organization_type} audiences without shaming. Bridge toward ${input.primary_goal}.`,
    },
    {
      section: 'Transformation promise',
      purpose: 'Make the future tangible',
      emotion: 'hope',
      contentNotes: `Center "${input.transformation_promise}" with proof, not buzzwords. Large imagery, minimal boxes.`,
    },
    {
      section: 'Proof & pathway',
      purpose: 'Show how change happens inside the experience',
      emotion: 'confidence',
      contentNotes: 'Introduce modules only after the story lands. Preview portal/training/events as chapters, not widgets.',
    },
    {
      section: 'Invitation',
      purpose: 'Clear next step aligned to goal',
      emotion: 'momentum',
      contentNotes: `CTA language should reinforce ${input.primary_goal}. Preserve client wording from notes and mission.`,
    },
  ];

  if (input.project_type === 'portal-skin') {
    base.splice(4, 0, {
      section: 'Inside the portal',
      purpose: 'Show authenticated experience without dashboard dominance',
      emotion: 'belonging',
      contentNotes: 'Skin the portal shell, navigation, and module containers — chassis supplies data and permissions.',
    });
  }

  if (input.project_type.includes('training')) {
    base.splice(4, 0, {
      section: 'Learning journey',
      purpose: 'Frame training as transformation, not content library',
      emotion: 'growth',
      contentNotes: 'Learning Hub modules render inside story-led section wrappers.',
    });
  }

  if (input.project_type.includes('recruiting')) {
    base.splice(3, 0, {
      section: 'Athlete / recruit spotlight',
      purpose: 'Humanize the pipeline with cinematic profiles',
      emotion: 'pride',
      contentNotes: 'Use large portraits and scroll-driven profile reveals — avoid table-first recruiting UI.',
    });
  }

  if (input.project_type.includes('church') || input.project_type.includes('nonprofit')) {
    base.splice(2, 0, {
      section: 'Community belonging',
      purpose: 'Show people gathered around shared mission',
      emotion: 'warmth',
      contentNotes: 'Warm light, real faces, generous whitespace — never corporate nonprofit template aesthetics.',
    });
  }

  if (input.notes?.trim()) {
    base.push({
      section: 'Client-specific notes',
      purpose: 'Honor founder / stakeholder direction',
      emotion: 'trust',
      contentNotes: input.notes.trim(),
    });
  }

  return base;
}

function buildImageRequirements(input: SkinBriefInput, projectLabel: string) {
  const items = [
    `Hero: one cinematic image or short loop that embodies ${input.desired_emotion} for ${input.audience}.`,
    `Transformation: before/after or journey imagery supporting "${input.transformation_promise}".`,
    `People: authentic ${input.organization_type} subjects — no generic AI faces or stock cliches.`,
    `Proof: real environments, events, training, or community moments tied to ${input.primary_goal}.`,
    `Mobile crops: provide portrait-safe hero and section assets for small screens.`,
  ];

  if (input.assets.length > 0) {
    items.push(`Uploaded brand assets to reference: ${input.assets.map((asset) => asset.name).join(', ')}.`);
  }
  if (input.website_social_url) {
    items.push(`Review existing visual language at ${input.website_social_url} — evolve, do not clone blindly.`);
  }
  items.push(`All imagery must support the ${projectLabel.toLowerCase()} story arc, not decorate a template.`);

  return items;
}

function buildColorDirection(input: SkinBriefInput) {
  const palette =
    input.brand_colors.length > 0
      ? input.brand_colors
      : ['warm light base', 'deep trust anchor', 'one energetic accent', 'restrained neutral support'];

  return [
    `Brand palette (tokens, not hardcoded hex in components): ${palette.join(', ')}.`,
    `Emotional temperature should reinforce ${input.desired_emotion} — avoid cold corporate blues unless client brand requires it.`,
    'Use accent color sparingly for CTAs and story beats.',
    'Maintain strong contrast for accessibility while keeping the experience cinematic.',
    'Portal and module surfaces inherit tokens — skin sets the atmosphere, chassis keeps readability.',
  ];
}

function buildTypographyDirection(input: SkinBriefInput) {
  return [
    `Editorial display type for hero and story moments — supports ${input.desired_emotion} and ${input.organization_type} tone.`,
    'Highly readable sans or humanist body type for portal content, updates, and module data.',
    `Preserve client wording — typography should elevate their language ("${input.mission.slice(0, 80)}${input.mission.length > 80 ? '…' : ''}"), not replace it.`,
    'Avoid tech-SaaS default pairings unless the brand intentionally calls for them.',
    'Scale type dramatically on mobile for emotional headlines; keep module text calm and scannable.',
  ].join(' ');
}

function buildAnimationDirection(input: SkinBriefInput) {
  return [
    'Motion guides attention through the story — section reveals, parallax restraint, and soft transitions.',
    `Animate toward ${input.desired_emotion}: confident easing, not bouncy corporate micro-interactions.`,
    'Prefer scroll-driven storytelling on marketing surfaces; keep portal/module motion subtle.',
    'No busy backgrounds, infinite loops, or animation that makes the site feel AI-generated.',
    'Respect reduced-motion preferences — provide static fallbacks for all critical content.',
  ];
}

function buildChassisWiringNotes(input: SkinBriefInput, modules: string[], projectLabel: string) {
  const notes = [
    `Skin wraps the EA Chassis for ${input.client_name}'s ${projectLabel.toLowerCase()} — chassis owns auth, data, permissions, and module behavior.`,
    `Selected modules: ${modules.join(', ')}.`,
    'Brand tokens flow from skin CSS variables into chassis shells — colors, type, spacing, and imagery atmosphere.',
    'Navigation items should reflect story priority first, then module access (Updates, Training, Events, Resources, etc.).',
    'Dashboard widgets render inside skinned containers — never let raw dashboard grids become the homepage hero.',
    'Updates, training, events, and resources inherit typography and spacing tokens but keep chassis data contracts unchanged.',
  ];

  if (modules.includes('Authentication')) {
    notes.push('Login/register/forgot-password surfaces use the same emotional skin — no unstyled chassis fallback pages.');
  }
  if (modules.includes('Learning Hub') || modules.includes('Training modules')) {
    notes.push('Training modules appear as story chapters or journey steps in the skin — chassis supplies progress and content APIs.');
  }
  if (modules.includes('Event Hub')) {
    notes.push('Events render as experiential cards and timelines — chassis supplies RSVP, dates, and permissions.');
  }

  return notes;
}

function buildModulePlacementNotes(input: SkinBriefInput, modules: string[], projectLabel: string) {
  const notes = [
    `Marketing ${projectLabel.toLowerCase()}: story sections first, module previews second, deep module access behind auth when applicable.`,
    'Update Hub: surface as a living pulse of momentum — not a blog sidebar.',
    'Opportunities & Resources: present as curated pathways toward the transformation promise.',
  ];

  if (modules.includes('Dashboard home')) {
    notes.push('Portal dashboard: welcome narrative strip above widgets; widgets grouped by user goal, not internal taxonomy.');
  }
  if (modules.includes('Community Directory')) {
    notes.push('Community Directory: people-first cards with warmth — avoid spreadsheet density.');
  }
  if (modules.includes('Job Board')) {
    notes.push('Job Board / recruiting modules: profile-led cards with cinematic imagery, not table-first layouts.');
  }
  if (modules.includes('Marketplace')) {
    notes.push('Marketplace: creator offerings framed as extensions of the client story.');
  }

  notes.push(`Primary goal alignment: every module placement should reinforce "${input.primary_goal}".`);

  return notes;
}

function buildMobileNotes(input: SkinBriefInput, projectLabel: string) {
  return [
    'Mobile-first: hero headline, emotional image, and primary CTA visible without horizontal scroll.',
    'Story sections stack vertically with strong typographic hierarchy — avoid cramming desktop grids into phone viewports.',
    `Portal ${projectLabel.toLowerCase()} on mobile: thumb-friendly nav, module cards full-width, chassis data remains scannable.`,
    'Test uploaded brand assets and hero crops at 390px width minimum.',
    `Preserve mission wording on mobile — do not shorten "${input.mission}" into generic marketing copy.`,
  ];
}

function buildAccessibilityNotes(input: SkinBriefInput) {
  return [
    'Maintain WCAG-minded contrast on all text over cinematic imagery — use scrims and token-backed foreground colors.',
    'All story content must be available with reduced motion enabled.',
    'Form, auth, and module surfaces keep visible focus states and semantic headings.',
    'Alt text for emotional imagery should describe meaning for the story, not just visual decoration.',
    `Language and reading level should match ${input.audience} — clear, respectful, client-authentic.`,
  ];
}

function buildCodexBuildPrompt(args: {
  input: SkinBriefInput;
  projectLabel: string;
  protocolNames: string[];
  repoRecs: SkinRepoRecommendation[];
  modules: string[];
  heroConcept: string;
  visualStory: string;
  emotionalDirection: string;
  sectionFlow: SkinBriefSection[];
  imageRequirements: string[];
  colorDirection: string[];
  typographyDirection: string;
  animationDirection: string[];
  chassisWiring: string[];
  modulePlacement: string[];
  mobileNotes: string[];
  accessibilityNotes: string[];
}) {
  const { input } = args;
  const sectionBlock = args.sectionFlow
    .map((section) => `- ${section.section}: ${section.purpose} [${section.emotion}] — ${section.contentNotes}`)
    .join('\n');
  const repoBlock = args.repoRecs
    .map((repo) => `- ${repo.name}: ${repo.whyItFits} Use: ${repo.suggestedUse} (${repo.complexityLevel} complexity)`)
    .join('\n');

  return [
    '# Codex Build Prompt — EA Skin Factory',
    '',
    `Build the approved skin for **${input.client_name}** (${input.organization_type}) using the EA Chassis™.`,
    '',
    '## Non-negotiables',
    '- This is a SKIN, not a template. Preserve story, wording, emotion, brand, and layout direction.',
    '- Do NOT convert into corporate SaaS, boxy dashboards, or generic AI visuals.',
    '- Do NOT hardcode colors — use brand tokens from the brief.',
    '- Do NOT break chassis modules, auth, permissions, or data contracts.',
    '- Do NOT auto-deploy. Human approval is required.',
    '',
    '## Client context',
    `- Project type: ${args.projectLabel}`,
    `- Mission: ${input.mission}`,
    `- Audience: ${input.audience}`,
    `- Primary goal: ${input.primary_goal}`,
    `- Desired emotion: ${input.desired_emotion}`,
    `- Transformation promise: ${input.transformation_promise}`,
    input.website_social_url ? `- Reference URL: ${input.website_social_url}` : '',
    input.notes ? `- Notes: ${input.notes}` : '',
    '',
    '## Protocols',
    args.protocolNames.map((name) => `- ${name}`).join('\n'),
    '',
    '## Visual direction',
    `Hero: ${args.heroConcept}`,
    '',
    `Story: ${args.visualStory}`,
    '',
    `Emotion: ${args.emotionalDirection}`,
    '',
    '### Section flow',
    sectionBlock,
    '',
    '### Imagery',
    args.imageRequirements.map((item) => `- ${item}`).join('\n'),
    '',
    '### Color',
    args.colorDirection.map((item) => `- ${item}`).join('\n'),
    '',
    '### Typography',
    args.typographyDirection,
    '',
    '### Motion',
    args.animationDirection.map((item) => `- ${item}`).join('\n'),
    '',
    '## Repo recommendations',
    repoBlock,
    '',
    '## Chassis wiring',
    args.chassisWiring.map((item) => `- ${item}`).join('\n'),
    '',
    '## Module placement',
    args.modulePlacement.map((item) => `- ${item}`).join('\n'),
    '',
    '## Chassis modules',
    args.modules.map((item) => `- ${item}`).join('\n'),
    '',
    '## Mobile',
    args.mobileNotes.map((item) => `- ${item}`).join('\n'),
    '',
    '## Accessibility',
    args.accessibilityNotes.map((item) => `- ${item}`).join('\n'),
    '',
    '## Build instruction',
    'Implement the skin layer on top of the EA Chassis using the repos above for inspiration and compatible patterns only.',
    'Wire modules where specified. Keep Look, Feel, Messaging, Wording, Story, Brand identity, and Visual direction intact.',
  ]
    .filter(Boolean)
    .join('\n');
}
