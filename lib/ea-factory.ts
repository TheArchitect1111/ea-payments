export type ProtocolStatus = 'Draft' | 'Active' | 'Review' | 'Archived';
export type ApprovalStatus = 'Approved' | 'Needs Review' | 'Pending';

export interface EAProtocol {
  id: string;
  name: string;
  type: string;
  category: string;
  tags: string[];
  status: ProtocolStatus;
  owner: string;
  version: string;
  createdDate: string;
  modifiedDate: string;
  approvedBy: string;
  approvalStatus: ApprovalStatus;
  source: {
    repository: string;
    path: string;
    url: string;
  };
  summary: string;
  principles: string[];
  futureNotes: string;
  versions: Array<{
    version: string;
    date: string;
    notes: string;
  }>;
}

export interface RepoLibraryItem {
  id: string;
  name: string;
  description: string;
  githubUrl: string;
  category: string;
  tags: string[];
  storytellingScore: number;
  animationScore: number;
  mobileScore: number;
  complexityScore: number;
  performanceScore: number;
  recommendedUseCases: string[];
  suggestedProtocols: string[];
  recommended: boolean;
}

export interface ProjectGeneratorInput {
  clientName: string;
  organization: string;
  website: string;
  industry: string;
  mission: string;
  goals: string;
  desiredOutcome: string;
  projectType: string;
  protocolId: string;
  repoIds: string[];
}

export interface ProjectBrief {
  id: string;
  createdAt: string;
  clientName: string;
  organization: string;
  projectType: string;
  protocolName: string;
  repoNames: string[];
  sections: Array<{
    title: string;
    body: string;
  }>;
  codexBuildPrompt: string;
}

export interface SkinBrief {
  id: string;
  createdAt: string;
  projectBriefId: string;
  title: string;
  sections: Array<{
    title: string;
    body: string;
  }>;
}

export const protocolTypes = [
  'EA Master Protocol',
  'EA Brand Protocol',
  'EA Skin Protocol',
  'EA Chassis Protocol',
  'EA Website Protocol',
  'EA Image Protocol',
  'EA Portal Protocol',
  'EA Sales Protocol',
  'EA Assessment Protocol',
  'EA Training Protocol',
];

export const projectTypes = [
  'Website',
  'Landing Page',
  'Portal',
  'Membership Experience',
  'Training Experience',
  'Event Experience',
  'Recruiting Experience',
  'Creator Experience',
];

export const repoCategories = [
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

export const protocols: EAProtocol[] = [
  {
    id: 'ea-master',
    name: 'EA Master Protocol',
    type: 'EA Master Protocol',
    category: 'Operating System',
    tags: ['strategy', 'architecture', 'pulse'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-01',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/master/ea-master-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'The governing protocol for translating scattered operations into visible, measurable, improvable systems.',
    principles: [
      'Start with the current reality before prescribing tools.',
      'Name the transformation in human language.',
      'Connect every interface to a real operating behavior.',
    ],
    futureNotes:
      'Move protocol bodies into Pulse storage after schema and approval workflows are finalized.',
    versions: [
      { version: '1.0.0', date: '2026-06-23', notes: 'Factory-ready operating layer.' },
      { version: '0.8.0', date: '2026-06-10', notes: 'Internal strategy draft.' },
    ],
  },
  {
    id: 'ea-brand',
    name: 'EA Brand Protocol',
    type: 'EA Brand Protocol',
    category: 'Brand',
    tags: ['voice', 'positioning', 'trust'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-04',
    modifiedDate: '2026-06-21',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/brand/ea-brand-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Defines the EA voice: clear, premium, practical, story-first, and centered on operational leverage.',
    principles: [
      'Lead with clarity, not jargon.',
      'Make the invisible visible.',
      'Keep authority calm and human.',
    ],
    futureNotes: 'Add message examples for each EA product line.',
    versions: [
      { version: '1.0.0', date: '2026-06-21', notes: 'Approved brand language.' },
      { version: '0.7.0', date: '2026-06-09', notes: 'Voice and positioning draft.' },
    ],
  },
  {
    id: 'ea-skin',
    name: 'EA Skin Protocol',
    type: 'EA Skin Protocol',
    category: 'Experience Design',
    tags: ['visual direction', 'emotion', 'story'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-07',
    modifiedDate: '2026-06-23',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/skins/ea-skin-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Guides custom visual direction that feels specific, emotional, premium, and never like a generic SaaS template.',
    principles: [
      'Every skin must tell a story.',
      'Every visual decision should support an emotional state.',
      'Avoid corporate dashboards and generic AI gloss.',
    ],
    futureNotes: 'Connect approved skin briefs to an approval queue.',
    versions: [
      { version: '1.0.0', date: '2026-06-23', notes: 'Factory Skin Brief standard.' },
      { version: '0.6.0', date: '2026-06-12', notes: 'Creative direction draft.' },
    ],
  },
  {
    id: 'ea-chassis',
    name: 'EA Chassis Protocol',
    type: 'EA Chassis Protocol',
    category: 'Build System',
    tags: ['layout', 'components', 'reuse'],
    status: 'Review',
    owner: 'Efficiency Architects',
    version: '0.9.0',
    createdDate: '2026-06-12',
    modifiedDate: '2026-06-22',
    approvedBy: 'Pending',
    approvalStatus: 'Needs Review',
    source: {
      repository: 'ea-protocols',
      path: '/chassis/ea-chassis-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Defines reusable page structures, portal shells, and interface foundations for future builds.',
    principles: [
      'Reuse structure without reusing personality.',
      'Make mobile behavior part of the chassis, not an afterthought.',
      'Keep deployment separate from creative approval.',
    ],
    futureNotes: 'Add mapping to premium-chassis package exports.',
    versions: [
      { version: '0.9.0', date: '2026-06-22', notes: 'Review candidate.' },
      { version: '0.4.0', date: '2026-06-15', notes: 'Initial chassis notes.' },
    ],
  },
  {
    id: 'ea-website',
    name: 'EA Website Protocol',
    type: 'EA Website Protocol',
    category: 'Web Experience',
    tags: ['website', 'conversion', 'narrative'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-10',
    modifiedDate: '2026-06-20',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/websites/ea-website-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Turns a client mission into a structured website that builds trust, teaches the offer, and moves visitors forward.',
    principles: [
      'Make the first viewport specific to the client.',
      'Use structure to create confidence.',
      'Treat conversion as clarity plus momentum.',
    ],
    futureNotes: 'Add page-type templates for landing pages, nonprofits, churches, and creators.',
    versions: [
      { version: '1.0.0', date: '2026-06-20', notes: 'Approved website protocol.' },
      { version: '0.5.0', date: '2026-06-12', notes: 'Section architecture draft.' },
    ],
  },
  {
    id: 'ea-portal',
    name: 'EA Portal Protocol',
    type: 'EA Portal Protocol',
    category: 'Client Experience',
    tags: ['portal', 'membership', 'training'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-11',
    modifiedDate: '2026-06-22',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/portals/ea-portal-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Designs portal experiences around progress, access, learning, messaging, resources, and next steps.',
    principles: [
      'The portal should lower anxiety.',
      'Every module should answer a recurring client need.',
      'Progress should be visible without clutter.',
    ],
    futureNotes: 'Connect to saved project records and client portal module provisioning.',
    versions: [
      { version: '1.0.0', date: '2026-06-22', notes: 'Approved portal protocol.' },
      { version: '0.5.0', date: '2026-06-14', notes: 'Module model draft.' },
    ],
  },
  {
    id: 'ea-assessment',
    name: 'EA Assessment Protocol',
    type: 'EA Assessment Protocol',
    category: 'Diagnostics',
    tags: ['assessment', 'diagnostic', 'visibility'],
    status: 'Active',
    owner: 'Efficiency Architects',
    version: '1.0.0',
    createdDate: '2026-06-05',
    modifiedDate: '2026-06-19',
    approvedBy: 'EA Leadership',
    approvalStatus: 'Approved',
    source: {
      repository: 'ea-protocols',
      path: '/assessments/ea-assessment-protocol.md',
      url: 'https://github.com/efficiency-architects/ea-protocols',
    },
    summary:
      'Frames assessments as clarity engines that reveal gaps, priorities, and the path to operational leverage.',
    principles: [
      'Score the friction, not the person.',
      'Translate diagnosis into an achievable next step.',
      'Tie every recommendation to business capacity.',
    ],
    futureNotes: 'Add rubric versioning and scorecard compatibility metadata.',
    versions: [
      { version: '1.0.0', date: '2026-06-19', notes: 'Approved diagnostic protocol.' },
      { version: '0.5.0', date: '2026-06-08', notes: 'Scoring framework draft.' },
    ],
  },
];

export const repoLibrary: RepoLibraryItem[] = [
  {
    id: 'aceternity',
    name: 'Aceternity',
    description: 'Cinematic React interaction patterns for high-impact storytelling moments.',
    githubUrl: 'https://github.com/aceternity',
    category: 'Cinematic',
    tags: ['hero', 'motion', 'premium'],
    storytellingScore: 94,
    animationScore: 96,
    mobileScore: 78,
    complexityScore: 72,
    performanceScore: 70,
    recommendedUseCases: ['Premium websites', 'Founder stories', 'High-impact landing pages'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    recommended: true,
  },
  {
    id: 'magic-ui',
    name: 'Magic UI',
    description: 'Polished micro-interactions and visual accents for modern product experiences.',
    githubUrl: 'https://github.com/magicuidesign/magicui',
    category: 'Premium',
    tags: ['micro-interactions', 'components', 'visual polish'],
    storytellingScore: 82,
    animationScore: 90,
    mobileScore: 84,
    complexityScore: 58,
    performanceScore: 78,
    recommendedUseCases: ['Creator experiences', 'Premium service pages', 'Lead magnets'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    recommended: true,
  },
  {
    id: 'motion',
    name: 'Motion',
    description: 'Production animation library for subtle, controlled interface motion.',
    githubUrl: 'https://github.com/motiondivision/motion',
    category: 'Storytelling',
    tags: ['animation', 'transitions', 'react'],
    storytellingScore: 78,
    animationScore: 95,
    mobileScore: 88,
    complexityScore: 48,
    performanceScore: 82,
    recommendedUseCases: ['Narrative section transitions', 'Portal feedback', 'Training steps'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Chassis Protocol'],
    recommended: true,
  },
  {
    id: 'lenis',
    name: 'Lenis',
    description: 'Smooth scrolling foundation for editorial and immersive websites.',
    githubUrl: 'https://github.com/darkroomengineering/lenis',
    category: 'Cinematic',
    tags: ['scroll', 'experience', 'motion'],
    storytellingScore: 84,
    animationScore: 86,
    mobileScore: 74,
    complexityScore: 42,
    performanceScore: 76,
    recommendedUseCases: ['Story-led websites', 'Campaign pages', 'Portfolio experiences'],
    suggestedProtocols: ['EA Skin Protocol', 'EA Website Protocol'],
    recommended: false,
  },
  {
    id: 'react-bits',
    name: 'React Bits',
    description: 'Reusable animation and UI snippets for expressive front-end builds.',
    githubUrl: 'https://github.com/DavidHDev/react-bits',
    category: 'Creator',
    tags: ['snippets', 'animation', 'creative'],
    storytellingScore: 80,
    animationScore: 88,
    mobileScore: 76,
    complexityScore: 64,
    performanceScore: 72,
    recommendedUseCases: ['Creator sites', 'Event pages', 'Visual moments'],
    suggestedProtocols: ['EA Skin Protocol'],
    recommended: false,
  },
  {
    id: 'shadcn',
    name: 'Shadcn',
    description: 'Composable component patterns for clear, durable admin and portal interfaces.',
    githubUrl: 'https://github.com/shadcn-ui/ui',
    category: 'Dashboard',
    tags: ['components', 'forms', 'admin'],
    storytellingScore: 62,
    animationScore: 42,
    mobileScore: 90,
    complexityScore: 50,
    performanceScore: 88,
    recommendedUseCases: ['Pulse admin', 'Client portals', 'Dashboards'],
    suggestedProtocols: ['EA Chassis Protocol', 'EA Portal Protocol'],
    recommended: true,
  },
  {
    id: 'origin-ui',
    name: 'Origin UI',
    description: 'Clean application components for practical product and portal workflows.',
    githubUrl: 'https://github.com/origin-space/originui',
    category: 'Business',
    tags: ['forms', 'tables', 'workflow'],
    storytellingScore: 58,
    animationScore: 40,
    mobileScore: 86,
    complexityScore: 44,
    performanceScore: 84,
    recommendedUseCases: ['Operational tools', 'Membership portals', 'Training dashboards'],
    suggestedProtocols: ['EA Portal Protocol', 'EA Chassis Protocol'],
    recommended: false,
  },
  {
    id: '21st-dev',
    name: '21st.dev',
    description: 'Modern component discovery source for polished landing and app interfaces.',
    githubUrl: 'https://github.com/serafimcloud/21st',
    category: 'Premium',
    tags: ['discovery', 'components', 'premium'],
    storytellingScore: 72,
    animationScore: 72,
    mobileScore: 82,
    complexityScore: 56,
    performanceScore: 76,
    recommendedUseCases: ['Premium web sections', 'Component inspiration', 'Rapid concepting'],
    suggestedProtocols: ['EA Website Protocol', 'EA Skin Protocol'],
    recommended: false,
  },
];

function findProtocol(id: string): EAProtocol {
  return protocols.find((protocol) => protocol.id === id) ?? protocols[0];
}

function findRepos(ids: string[]): RepoLibraryItem[] {
  const selected = repoLibrary.filter((repo) => ids.includes(repo.id));
  return selected.length > 0 ? selected : repoLibrary.filter((repo) => repo.recommended).slice(0, 3);
}

function normalize(value: string, fallback: string): string {
  return value.trim() || fallback;
}

export function createProjectBrief(input: ProjectGeneratorInput): ProjectBrief {
  const protocol = findProtocol(input.protocolId);
  const repos = findRepos(input.repoIds);
  const clientName = normalize(input.clientName, 'New Client');
  const organization = normalize(input.organization, clientName);
  const industry = normalize(input.industry, 'mission-driven business');
  const mission = normalize(input.mission, 'serve people with greater clarity, trust, and operational leverage');
  const goals = normalize(input.goals, 'create a clearer digital experience and reduce friction');
  const outcome = normalize(input.desiredOutcome, 'a premium, practical experience that helps visitors know what to do next');
  const projectType = normalize(input.projectType, 'Website');

  const sections = [
    {
      title: 'Current Reality',
      body: `${organization} is operating in the ${industry} space with a mission to ${mission}. The current opportunity is to turn scattered context, unclear next steps, and hidden value into a visible experience that feels organized and trustworthy.`,
    },
    {
      title: 'Consider The Possibilities',
      body: `The experience can become more than a ${projectType.toLowerCase()}. It can become the first proof that ${organization} understands its audience, can guide decisions, and can create momentum before a conversation ever happens.`,
    },
    {
      title: 'Transformation Vision',
      body: `Build a story-first ${projectType.toLowerCase()} that moves people from uncertainty to confidence. The experience should make the mission tangible, clarify the offer, and show the next step without pressure.`,
    },
    {
      title: 'Story Framework',
      body: `Open with the audience's present tension, show what becomes possible, prove why ${organization} is credible, then guide the visitor toward the simplest next action.`,
    },
    {
      title: 'Website Structure',
      body: `Recommended structure: focused hero, current reality section, transformation section, proof section, offer/module section, process section, trust section, and action section.`,
    },
    {
      title: 'Portal Recommendations',
      body: `If portal access is included, prioritize dashboard, updates, documents, learning, resources, messaging, and Ask EA style guidance modules.`,
    },
    {
      title: 'Module Recommendations',
      body: `Recommended modules: intake summary, progress tracker, resource library, action checklist, content/update requests, and approval package viewer.`,
    },
    {
      title: 'Image Requirements',
      body: `Use real client, place, team, audience, or outcome imagery wherever possible. Avoid generic stock visuals. The image system should prove the world ${organization} serves.`,
    },
    {
      title: 'Repo Recommendations',
      body: repos.map((repo) => `${repo.name}: ${repo.recommendedUseCases.join(', ')}`).join('\n'),
    },
    {
      title: 'Suggested Next Steps',
      body: `Approve the project brief, generate a Skin Brief, collect required imagery, then convert the approved package into a Codex build prompt.`,
    },
    {
      title: 'Build Requirements',
      body: `Follow ${protocol.name}. Build the actual usable experience first, keep the first screen specific to ${organization}, and preserve mobile clarity throughout.`,
    },
  ];

  const codexBuildPrompt = [
    `Build a ${projectType} for ${organization}.`,
    `Client: ${clientName}`,
    `Website: ${input.website || 'Not provided'}`,
    `Protocol: ${protocol.name} ${protocol.version}`,
    `Mission: ${mission}`,
    `Goals: ${goals}`,
    `Desired outcome: ${outcome}`,
    `Recommended repositories: ${repos.map((repo) => repo.name).join(', ')}`,
    '',
    'Requirements:',
    '- Build the real usable experience, not a marketing placeholder.',
    '- Follow EA standards: premium, light, human-centered, story-first, and uncluttered.',
    '- Avoid generic corporate dashboard styling and generic AI-generated appearance.',
    '- Make the first viewport specific to the client and mobile-friendly.',
    '- Include exportable content, review package, and approval-ready copy where relevant.',
  ].join('\n');

  return {
    id: `project-${Date.now()}`,
    createdAt: new Date().toISOString(),
    clientName,
    organization,
    projectType,
    protocolName: protocol.name,
    repoNames: repos.map((repo) => repo.name),
    sections,
    codexBuildPrompt,
  };
}

export function createSkinBrief(projectBrief: ProjectBrief, selectedProtocolId = 'ea-skin'): SkinBrief {
  const protocol = findProtocol(selectedProtocolId);
  const repoPhrase = projectBrief.repoNames.length > 0 ? projectBrief.repoNames.join(', ') : 'approved EA repositories';

  return {
    id: `skin-${Date.now()}`,
    createdAt: new Date().toISOString(),
    projectBriefId: projectBrief.id,
    title: `${projectBrief.organization} Skin Brief`,
    sections: [
      {
        title: 'Hero Concept',
        body: `Create an immediate sense that ${projectBrief.organization} is not another generic option. The hero should show the audience entering a clearer, more capable state.`,
      },
      {
        title: 'Visual Story',
        body: `The visual system should move from tension to clarity: grounded first impression, proof of real people or outcomes, then confident next-step energy.`,
      },
      {
        title: 'Emotional Goals',
        body: 'Calm confidence, relief, trust, momentum, and the feeling that the experience was custom built for this audience.',
      },
      {
        title: 'Color Direction',
        body: 'Use a premium light base with restrained contrast, one confident accent, and enough warmth to avoid a cold corporate feel.',
      },
      {
        title: 'Typography Direction',
        body: 'Use clear modern typography with strong hierarchy. Headlines should feel editorial and specific; interface text should stay compact and readable.',
      },
      {
        title: 'Layout Direction',
        body: 'Favor generous whitespace, strong section rhythm, and compact information blocks. Avoid stacked generic cards unless they represent repeated records or tools.',
      },
      {
        title: 'Animation Direction',
        body: `Use ${repoPhrase} for purposeful transitions, reveal moments, and interaction feedback. Motion should support understanding, not decorate uncertainty.`,
      },
      {
        title: 'Image Requirements',
        body: 'Prioritize real people, real places, real proof, and real outcomes. If generated imagery is needed, it must look bespoke and avoid synthetic gloss.',
      },
      {
        title: 'Section Structure',
        body: 'Hero, current reality, possibility, transformation, proof, process, modules or offer, trust, and next step.',
      },
      {
        title: 'Experience Narrative',
        body: `Following ${protocol.name}, the experience should feel like a guided transformation rather than a template. Every section should earn its place.`,
      },
    ],
  };
}

export function buildExportPackage(projectBrief: ProjectBrief, skinBrief: SkinBrief | null): string {
  const skinSections = skinBrief
    ? skinBrief.sections.map((section) => `## ${section.title}\n${section.body}`).join('\n\n')
    : 'Skin Brief has not been generated yet.';

  return [
    `# ${projectBrief.organization} EA Factory Build Package`,
    '',
    `Generated: ${new Date(projectBrief.createdAt).toLocaleString('en-US')}`,
    `Project Type: ${projectBrief.projectType}`,
    `Protocol: ${projectBrief.protocolName}`,
    `Repositories: ${projectBrief.repoNames.join(', ')}`,
    '',
    '# Project Brief',
    '',
    projectBrief.sections.map((section) => `## ${section.title}\n${section.body}`).join('\n\n'),
    '',
    '# Skin Brief',
    '',
    skinSections,
    '',
    '# Codex Build Prompt',
    '',
    '```',
    projectBrief.codexBuildPrompt,
    '```',
  ].join('\n');
}
