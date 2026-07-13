export type PersonalityDensity = 'low' | 'medium' | 'high';
export type InformationDepth =
  | 'summary'
  | 'balanced'
  | 'visual'
  | 'detailed'
  | 'supportive'
  | 'guided';

export type WorkspacePersonality = {
  id: string;
  name: string;
  description: string;
  density: PersonalityDensity;
  dashboardSections: string[];
  sectionOrder: string[];
  terminology: Record<string, string>;
  primaryActions: string[];
  alertPriorities: string[];
  aiInstructions: string;
  /** Preferred enable keys / module hints (may use legacy kebab or camel). */
  defaultModules: string[];
  emptyStateLanguage: string;
  cardVariants: string[];
  informationDepth: InformationDepth;
};

export const WORKSPACE_PERSONALITY_KEYS = {
  executive: 'executive',
  operations: 'operations',
  creative: 'creative',
  compliance: 'compliance',
  athletics: 'athletics',
  financialCoaching: 'financial-coaching',
  trainingLearning: 'training-learning',
} as const;

export type WorkspacePersonalityId =
  (typeof WORKSPACE_PERSONALITY_KEYS)[keyof typeof WORKSPACE_PERSONALITY_KEYS];

export const workspacePersonalities: Record<string, WorkspacePersonality> = {
  [WORKSPACE_PERSONALITY_KEYS.executive]: {
    id: WORKSPACE_PERSONALITY_KEYS.executive,
    name: 'Executive',
    description:
      'Calm, minimal decision support for leaders who need risk, opportunity, and next actions.',
    density: 'low',
    dashboardSections: [
      'todaysFocus',
      'recentWork',
      'decisionsRequired',
      'executiveBriefing',
      'workspaceDock',
    ],
    sectionOrder: [
      'todaysFocus',
      'decisionsRequired',
      'executiveBriefing',
      'recentWork',
      'workspaceDock',
    ],
    terminology: {
      home: 'Command Center',
      focus: "Today's Focus",
      attention: 'Decisions Required',
      start: 'Continue Building',
      library: 'Briefing Library',
      members: 'Clients',
    },
    primaryActions: ['Review recommendation', 'Open briefing', 'Approve next move'],
    alertPriorities: ['risk', 'decision', 'opportunity', 'client-impact'],
    aiInstructions:
      'Prioritize one clear recommendation, decision context, business risk, opportunity, and likely outcome. Keep language calm and executive.',
    defaultModules: ['clients', 'pulse', 'briefings', 'growth-portal', 'settings'],
    emptyStateLanguage: 'No executive decisions need attention right now.',
    cardVariants: ['briefing', 'recommendation', 'risk'],
    informationDepth: 'summary',
  },
  [WORKSPACE_PERSONALITY_KEYS.operations]: {
    id: WORKSPACE_PERSONALITY_KEYS.operations,
    name: 'Operations',
    description:
      'Operational visibility for tasks, throughput, owners, blockers, and system health.',
    density: 'medium',
    dashboardSections: [
      'todaysFocus',
      'needsAttention',
      'continueWorking',
      'systemHealth',
      'whileYouWereAway',
      'workspaceDock',
    ],
    sectionOrder: [
      'needsAttention',
      'todaysFocus',
      'systemHealth',
      'continueWorking',
      'whileYouWereAway',
      'workspaceDock',
    ],
    terminology: {
      home: 'Operations Hub',
      focus: "Today's Focus",
      attention: 'Blockers',
      start: 'Start Work',
      library: 'Operations Library',
      members: 'Teams',
    },
    primaryActions: ['Assign owner', 'Resolve blocker', 'Open workflow'],
    alertPriorities: ['blocked', 'overdue', 'capacity', 'system-health'],
    aiInstructions:
      'Surface blockers, owners, due dates, process gaps, throughput, and the next operational action.',
    defaultModules: ['tasks', 'update-hub', 'training', 'pulse', 'connections'],
    emptyStateLanguage: 'No operational blockers are open right now.',
    cardVariants: ['task', 'health', 'owner'],
    informationDepth: 'balanced',
  },
  [WORKSPACE_PERSONALITY_KEYS.creative]: {
    id: WORKSPACE_PERSONALITY_KEYS.creative,
    name: 'Creative',
    description:
      'Image-forward workspace for campaigns, drafts, approvals, assets, and publishing calendars.',
    density: 'medium',
    dashboardSections: [
      'todaysFocus',
      'creativeQueue',
      'needsAttention',
      'calendar',
      'assetLibrary',
      'workspaceDock',
    ],
    sectionOrder: [
      'creativeQueue',
      'needsAttention',
      'todaysFocus',
      'calendar',
      'assetLibrary',
      'workspaceDock',
    ],
    terminology: {
      home: 'Creative Studio',
      focus: 'Creative Focus',
      attention: 'Approvals Needed',
      start: 'Create Something New',
      library: 'Asset Library',
      members: 'Audiences',
    },
    primaryActions: ['Create draft', 'Review asset', 'Approve campaign'],
    alertPriorities: ['approval', 'deadline', 'publishing-gap', 'asset-needed'],
    aiInstructions:
      'Help generate, refine, review, and organize content while preserving brand voice, approval status, and channel fit.',
    defaultModules: ['amplifi', 'update-hub', 'asset-library', 'calendar', 'approvals'],
    emptyStateLanguage: 'No drafts or creative approvals need attention right now.',
    cardVariants: ['visual', 'draft', 'approval'],
    informationDepth: 'visual',
  },
  [WORKSPACE_PERSONALITY_KEYS.compliance]: {
    id: WORKSPACE_PERSONALITY_KEYS.compliance,
    name: 'Compliance',
    description:
      'Readiness workspace for deadlines, policy status, training completion, risk, audits, and evidence.',
    density: 'high',
    dashboardSections: [
      'readinessFocus',
      'risksRequiringAction',
      'upcomingDeadlines',
      'evidenceUpdates',
      'workspaceDock',
    ],
    sectionOrder: [
      'risksRequiringAction',
      'upcomingDeadlines',
      'readinessFocus',
      'evidenceUpdates',
      'workspaceDock',
    ],
    terminology: {
      home: 'Readiness Center',
      focus: 'Readiness Focus',
      attention: 'Risks Requiring Action',
      start: 'Improve Compliance Process',
      library: 'Evidence Library',
      members: 'Staff',
    },
    primaryActions: ['Upload evidence', 'Assign remediation', 'Review deadline'],
    alertPriorities: ['critical-risk', 'deadline', 'missing-evidence', 'training-gap'],
    aiInstructions:
      'Identify gaps, risks, deadlines, evidence needs, and audit readiness. Be precise and avoid unsupported claims.',
    defaultModules: ['training', 'policies', 'evidence', 'incidents', 'audit-readiness'],
    emptyStateLanguage: 'No compliance exceptions are open right now.',
    cardVariants: ['risk', 'deadline', 'evidence'],
    informationDepth: 'detailed',
  },
  [WORKSPACE_PERSONALITY_KEYS.athletics]: {
    id: WORKSPACE_PERSONALITY_KEYS.athletics,
    name: 'Athletics',
    description:
      'Athlete and family-centered workspace for development, recruiting, eligibility, events, communication, and film.',
    density: 'medium',
    dashboardSections: [
      'playerFocus',
      'recentAthleteActivity',
      'eligibilityAlerts',
      'upcomingEvents',
      'workspaceDock',
    ],
    sectionOrder: [
      'playerFocus',
      'eligibilityAlerts',
      'recentAthleteActivity',
      'upcomingEvents',
      'workspaceDock',
    ],
    terminology: {
      home: 'Team Portal',
      focus: 'Player Focus',
      attention: 'Eligibility Alerts',
      start: 'Create For Players Or Families',
      library: 'Film & Resource Library',
      members: 'Players',
    },
    primaryActions: ['Open player profile', 'Update recruiting timeline', 'Send family update'],
    alertPriorities: ['eligibility', 'recruiting', 'event', 'communication'],
    aiInstructions:
      'Surface player development, recruiting activity, eligibility, events, communication gaps, and family-friendly next steps.',
    defaultModules: [
      'player-profiles',
      'family-pages',
      'recruiting-timeline',
      'film-library',
      'events',
      'messages',
    ],
    emptyStateLanguage: 'No player or eligibility alerts need attention right now.',
    cardVariants: ['athlete', 'event', 'timeline'],
    informationDepth: 'balanced',
  },
  [WORKSPACE_PERSONALITY_KEYS.financialCoaching]: {
    id: WORKSPACE_PERSONALITY_KEYS.financialCoaching,
    name: 'Financial Coaching',
    description:
      'Calm coaching workspace for assessments, action plans, milestones, sessions, progress, and financial behavior support.',
    density: 'low',
    dashboardSections: [
      'clientFocus',
      'progressUpdates',
      'actionPlanAlerts',
      'upcomingSessions',
      'workspaceDock',
    ],
    sectionOrder: [
      'clientFocus',
      'actionPlanAlerts',
      'progressUpdates',
      'upcomingSessions',
      'workspaceDock',
    ],
    terminology: {
      home: 'Coaching Portal',
      focus: 'Client Focus',
      attention: 'Action Plan Alerts',
      start: 'Support A Client Outcome',
      library: 'Resource Library',
      members: 'Clients',
    },
    primaryActions: ['Open action plan', 'Schedule session', 'Review progress'],
    alertPriorities: ['stalled-progress', 'session', 'milestone', 'assessment'],
    aiInstructions:
      'Guide progress with clear, nonjudgmental language. Emphasize next steps, momentum, and client confidence.',
    defaultModules: [
      'assessments',
      'financial-blueprint',
      'sessions',
      'action-plan',
      'resources',
      'payments',
    ],
    emptyStateLanguage: 'No client action plan items need attention right now.',
    cardVariants: ['progress', 'coaching', 'milestone'],
    informationDepth: 'supportive',
  },
  [WORKSPACE_PERSONALITY_KEYS.trainingLearning]: {
    id: WORKSPACE_PERSONALITY_KEYS.trainingLearning,
    name: 'Training and Learning',
    description:
      'Learning workspace for courses, lessons, certifications, completion, assessments, reminders, and learner support.',
    density: 'medium',
    dashboardSections: [
      'learningFocus',
      'continueLearning',
      'certificationAlerts',
      'learnerSupport',
      'workspaceDock',
    ],
    sectionOrder: [
      'learningFocus',
      'certificationAlerts',
      'continueLearning',
      'learnerSupport',
      'workspaceDock',
    ],
    terminology: {
      home: 'Learning Hub',
      focus: 'Learning Focus',
      attention: 'Certification Alerts',
      start: 'Create Learning Path',
      library: 'Learning Library',
      members: 'Learners',
    },
    primaryActions: ['Assign training', 'Continue lesson', 'Review completion'],
    alertPriorities: ['certification', 'overdue-training', 'accessibility-support', 'quiz-support'],
    aiInstructions:
      'Support completion, understanding, accessibility, certification readiness, and learner confidence.',
    defaultModules: [
      'courses',
      'lessons',
      'certifications',
      'quizzes',
      'resources',
      'learner-support',
    ],
    emptyStateLanguage: 'No learner support or certification alerts need attention right now.',
    cardVariants: ['learning', 'progress', 'certification'],
    informationDepth: 'guided',
  },
};

export function getWorkspacePersonality(
  id: string = WORKSPACE_PERSONALITY_KEYS.executive,
): WorkspacePersonality {
  return (
    workspacePersonalities[id] ??
    workspacePersonalities[WORKSPACE_PERSONALITY_KEYS.executive]
  );
}

export function normalizeWorkspacePersonality(
  personality: Partial<WorkspacePersonality> & { id?: string } = {},
): WorkspacePersonality {
  const base = getWorkspacePersonality(personality.id);
  return {
    ...base,
    ...personality,
    id: personality.id || base.id,
    terminology: {
      ...base.terminology,
      ...(personality.terminology || {}),
    },
    dashboardSections: personality.dashboardSections || base.dashboardSections,
    sectionOrder: personality.sectionOrder || base.sectionOrder,
    primaryActions: personality.primaryActions || base.primaryActions,
    alertPriorities: personality.alertPriorities || base.alertPriorities,
    defaultModules: personality.defaultModules || base.defaultModules,
    cardVariants: personality.cardVariants || base.cardVariants,
    aiInstructions: personality.aiInstructions || base.aiInstructions,
    emptyStateLanguage: personality.emptyStateLanguage || base.emptyStateLanguage,
    informationDepth: personality.informationDepth || base.informationDepth,
  };
}

export function listWorkspacePersonalities(): WorkspacePersonality[] {
  return Object.values(workspacePersonalities);
}

/** Merge personality AI instructions with capability AI skills for Orbie / advisors. */
export function buildAiContextEnvelope(
  personalityId: string,
  capabilitySkillDescriptions: string[],
): string {
  const personality = getWorkspacePersonality(personalityId);
  const skills =
    capabilitySkillDescriptions.length > 0
      ? `\n\nCapability skills:\n- ${capabilitySkillDescriptions.join('\n- ')}`
      : '';
  return `${personality.aiInstructions}${skills}`;
}
