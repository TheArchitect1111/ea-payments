import { emitPulseEvent, type PulseProduct } from './pulse-bus';

export type EAExperienceType =
  | 'connect'
  | 'training-transformation'
  | 'landing-page'
  | 'client-portal'
  | 'update-hub'
  | 'pulse-command-center'
  | 'simplifi-capture'
  | 'custom';

export type EACaptureKind =
  | 'text'
  | 'voice'
  | 'image'
  | 'pdf'
  | 'word'
  | 'powerpoint'
  | 'video'
  | 'link'
  | 'website'
  | 'email'
  | 'form'
  | 'connect-submission'
  | 'intake-data';

export interface EACaptureInput {
  kind: EACaptureKind;
  title?: string;
  text?: string;
  fileName?: string;
  mimeType?: string;
  sourceUrl?: string;
  product?: PulseProduct;
  tenantId?: string;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface EAUnderstanding {
  summary: string;
  topics: string[];
  people: string[];
  organizations: string[];
  goals: string[];
  problems: string[];
  opportunities: string[];
  tasks: string[];
  risks: string[];
  requiredActions: string[];
  knowledgeGaps: string[];
  suggestedNextSteps: string[];
}

export interface EARecommendation {
  recommendation: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: string;
  experience: EAExperienceType;
}

export interface EAGeneratedOutput {
  type:
    | 'lesson'
    | 'quiz'
    | 'checklist'
    | 'knowledge-base-article'
    | 'manager-summary'
    | 'landing-page-brief'
    | 'portal-brief'
    | 'email'
    | 'report';
  title: string;
  body: string;
  publishTargets: string[];
}

export interface EAWorkflowResult {
  input: EACaptureInput;
  understanding: EAUnderstanding;
  recommendations: EARecommendation[];
  outputs: EAGeneratedOutput[];
  publishTargets: string[];
  pulseActivityId: string;
  measuredSignals: string[];
}

export interface NewExperienceInput {
  goals: string[];
  audience: string[];
  organizationType?: string;
  materials?: EACaptureInput[];
  notes?: string;
}

export interface NewExperiencePlan {
  bestExperience: EAExperienceType;
  requiredComponents: string[];
  suggestedPages: string[];
  suggestedAutomations: string[];
  suggestedTraining: string[];
  suggestedCommunications: string[];
  suggestedDashboard: string[];
  expectedOutcomes: string[];
  recommendations: EARecommendation[];
}

const EXPERIENCE_LABELS: Record<EAExperienceType, string> = {
  connect: 'Connect Experience',
  'training-transformation': 'Training Transformation',
  'landing-page': 'Landing Page Chassis',
  'client-portal': 'Client Portal',
  'update-hub': 'Update Hub',
  'pulse-command-center': 'Pulse Command Center',
  'simplifi-capture': 'Simplifi Capture',
  custom: 'Custom EA Experience',
};

export function captureEAInput(input: EACaptureInput): EACaptureInput {
  return {
    ...input,
    title: clean(input.title || input.fileName || input.sourceUrl || 'EA intelligence input'),
    text: clean(input.text || ''),
    metadata: input.metadata ?? {},
  };
}

export function understandEAInput(input: EACaptureInput): EAUnderstanding {
  const text = `${input.title ?? ''}\n${input.text ?? ''}\n${input.fileName ?? ''}\n${input.sourceUrl ?? ''}`;
  const normalized = text.toLowerCase();
  const topics = pickTopics(normalized);
  const trainingSignals = includesAny(normalized, ['training', 'lesson', 'quiz', 'onboarding', 'sop', 'policy', 'powerpoint', 'video']);
  const portalSignals = includesAny(normalized, ['portal', 'dashboard', 'client access', 'member', 'resource library']);
  const communicationSignals = includesAny(normalized, ['email', 'sms', 'update', 'announcement', 'reminder', 'follow-up']);
  const landingSignals = includesAny(normalized, ['landing', 'offer', 'conversion', 'lead', 'prospect']);

  return {
    summary: summarize(input),
    topics,
    people: extractCapitalized(text).filter((item) => item.split(' ').length <= 3).slice(0, 8),
    organizations: extractOrganizations(text),
    goals: [
      trainingSignals ? 'Help people learn and perform with more confidence.' : '',
      portalSignals ? 'Create a clearer place for people to find what they need.' : '',
      communicationSignals ? 'Make communication and follow-up easier to trust.' : '',
      landingSignals ? 'Clarify the offer and guide people to one next step.' : '',
    ].filter(Boolean),
    problems: [
      trainingSignals ? 'Important knowledge may be trapped in scattered files, videos, or informal explanations.' : '',
      communicationSignals ? 'Follow-up may depend on memory instead of a shared system.' : '',
      portalSignals ? 'People may not have one reliable place to return for updates and resources.' : '',
    ].filter(Boolean),
    opportunities: [
      trainingSignals ? 'Turn existing material into lessons, quizzes, checklists, and manager visibility.' : '',
      portalSignals ? 'Publish useful resources into a guided portal experience.' : '',
      communicationSignals ? 'Add reminders, owner notifications, and daily or weekly briefs.' : '',
      landingSignals ? 'Create a conversion-focused page with trust builders and a clear action.' : '',
      'Ask what becomes possible now and recommend the smallest useful starting point.',
    ].filter(Boolean),
    tasks: [
      'Confirm audience and desired outcome.',
      'Identify missing materials or unanswered questions.',
      'Generate a first useful version for review.',
    ],
    risks: [
      'Building too much before the first workflow works end-to-end.',
      'Creating duplicate AI logic inside a product instead of using the shared engine.',
    ],
    requiredActions: [
      'Route this through the shared EA Intelligence Engine.',
      'Keep every recommendation explainable with reason, confidence, and suggested action.',
    ],
    knowledgeGaps: [
      !input.text && !input.sourceUrl ? 'Need source material or notes to ground the output.' : '',
      'Need approval before publishing generated outputs.',
    ].filter(Boolean),
    suggestedNextSteps: [
      trainingSignals ? 'Start with Training Transformation MVP.' : '',
      'Review recommended outputs before publishing.',
      'Publish approved artifacts into the right EA experience.',
    ].filter(Boolean),
  };
}

export function recommendEAActions(input: EACaptureInput, understanding: EAUnderstanding): EARecommendation[] {
  const text = `${input.title ?? ''} ${input.text ?? ''} ${understanding.topics.join(' ')}`.toLowerCase();
  const recommendations: EARecommendation[] = [];

  if (includesAny(text, ['training', 'lesson', 'quiz', 'onboarding', 'sop', 'policy', 'powerpoint', 'video'])) {
    recommendations.push({
      recommendation: 'Start with Training Transformation.',
      reason: 'The material has learning, onboarding, policy, SOP, or video signals that can become lessons, quizzes, checklists, and manager summaries.',
      confidence: 'high',
      suggestedAction: 'Generate the Training Transformation first version and review it before publishing.',
      experience: 'training-transformation',
    });
  }

  if (includesAny(text, ['portal', 'dashboard', 'resource', 'member', 'client'])) {
    recommendations.push({
      recommendation: 'Add a portal layer after the first useful output exists.',
      reason: 'The input points to repeat access, visibility, or shared resources, which are better served in a guided portal than one-off files.',
      confidence: 'medium',
      suggestedAction: 'Create a portal brief with pages, permissions, resources, and Pulse signals.',
      experience: 'client-portal',
    });
  }

  if (includesAny(text, ['follow-up', 'announcement', 'update', 'email', 'sms', 'reminder'])) {
    recommendations.push({
      recommendation: 'Use Update Hub and notification workflows.',
      reason: 'Communication signals suggest people need reminders, updates, or owner visibility after the first capture.',
      confidence: 'medium',
      suggestedAction: 'Define the first message, audience, cadence, and owner notification.',
      experience: 'update-hub',
    });
  }

  if (includesAny(text, ['landing', 'offer', 'lead', 'prospect', 'conversion'])) {
    recommendations.push({
      recommendation: 'Create a Landing Page Chassis.',
      reason: 'Offer and prospect signals suggest the highest leverage first output is a focused page with trust builders and one action.',
      confidence: 'medium',
      suggestedAction: 'Draft the offer, audience, proof, objections, and primary CTA.',
      experience: 'landing-page',
    });
  }

  recommendations.push({
    recommendation: 'Record this in Pulse so the organization memory improves over time.',
    reason: 'Every useful input should leave behind an activity record that can be measured, revisited, and connected to future recommendations.',
    confidence: 'high',
    suggestedAction: 'Emit a Pulse activity with product, tenant, input type, recommendation, and publish targets.',
    experience: 'pulse-command-center',
  });

  return rankRecommendations(recommendations);
}

export function generateTrainingTransformationOutputs(
  input: EACaptureInput,
  understanding: EAUnderstanding,
): EAGeneratedOutput[] {
  const title = input.title || 'Training Transformation';
  const goals = understanding.goals.length ? understanding.goals : ['Help people understand what to do next and why it matters.'];
  const opportunities = understanding.opportunities.slice(0, 4);

  return [
    {
      type: 'lesson',
      title: `${title}: Guided Lesson`,
      body: [
        `Purpose: ${goals[0]}`,
        '',
        'Learners should understand:',
        ...opportunities.map((item) => `- ${item}`),
        '',
        'First activity: Review the source material, identify the right next action, and explain why it matters.',
      ].join('\n'),
      publishTargets: ['Training Hub', 'Client Portal'],
    },
    {
      type: 'quiz',
      title: `${title}: Knowledge Check`,
      body: [
        '1. What is the most important outcome this material should support?',
        '2. Which action should happen next?',
        '3. What risk appears if the process is not followed?',
        '4. Where should someone go when they need help?',
      ].join('\n'),
      publishTargets: ['Training Hub'],
    },
    {
      type: 'checklist',
      title: `${title}: Action Checklist`,
      body: [
        '- Confirm the learner knows the goal.',
        '- Confirm required documents or tools are available.',
        '- Complete the core action.',
        '- Record completion or open questions.',
        '- Escalate anything unclear to the owner.',
      ].join('\n'),
      publishTargets: ['Training Hub', 'Pulse'],
    },
    {
      type: 'knowledge-base-article',
      title: `${title}: Knowledge Base Article`,
      body: [
        understanding.summary,
        '',
        'What this makes easier:',
        ...opportunities.map((item) => `- ${item}`),
        '',
        'Open questions:',
        ...understanding.knowledgeGaps.map((item) => `- ${item}`),
      ].join('\n'),
      publishTargets: ['Knowledge Base', 'Client Portal'],
    },
    {
      type: 'manager-summary',
      title: `${title}: Manager Summary`,
      body: [
        'Recommended starting point: onboarding or first-week performance support.',
        `Why: ${understanding.opportunities[0] ?? 'The material can become a repeatable learning experience.'}`,
        'Pulse should track: completion, repeated questions, low quiz scores, missed follow-ups, and stale content.',
      ].join('\n'),
      publishTargets: ['Pulse', 'Manager Dashboard'],
    },
  ];
}

export async function runTrainingTransformationWorkflow(input: EACaptureInput): Promise<EAWorkflowResult> {
  const captured = captureEAInput(input);
  const understanding = understandEAInput(captured);
  const recommendations = recommendEAActions(captured, understanding);
  const outputs = generateTrainingTransformationOutputs(captured, understanding);
  const publishTargets = [...new Set(outputs.flatMap((output) => output.publishTargets))];
  const pulseActivityId = `pulse-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await emitPulseEvent({
    product: captured.product ?? 'ea-platform',
    type: 'capture.completed',
    title: `Training Transformation analyzed: ${captured.title}`,
    detail: recommendations[0]?.recommendation,
    priority: recommendations[0]?.confidence === 'high' ? 'high' : 'medium',
    tenantId: captured.tenantId,
    objectId: pulseActivityId,
    metadata: {
      engine: 'ea-intelligence',
      workflow: 'training-transformation',
      inputKind: captured.kind,
      outputCount: outputs.length,
    },
  });

  return {
    input: captured,
    understanding,
    recommendations,
    outputs,
    publishTargets,
    pulseActivityId,
    measuredSignals: ['completion', 'quiz-score', 'repeated-questions', 'missed-follow-ups', 'training-gaps'],
  };
}

export function planNewExperience(input: NewExperienceInput): NewExperiencePlan {
  const materialText = (input.materials ?? []).map((item) => `${item.title ?? ''} ${item.text ?? ''} ${item.fileName ?? ''}`).join('\n');
  const combined = `${input.goals.join(' ')} ${input.audience.join(' ')} ${input.organizationType ?? ''} ${input.notes ?? ''} ${materialText}`.toLowerCase();
  const captured = captureEAInput({
    kind: input.materials?.[0]?.kind ?? 'intake-data',
    title: `New Experience: ${input.organizationType || 'Organization'}`,
    text: combined,
    product: 'ea-platform',
  });
  const understanding = understandEAInput(captured);
  const recommendations = recommendEAActions(captured, understanding);
  const bestExperience = chooseBestExperience(combined, recommendations);

  return {
    bestExperience,
    requiredComponents: componentsForExperience(bestExperience),
    suggestedPages: pagesForExperience(bestExperience),
    suggestedAutomations: automationsForExperience(bestExperience),
    suggestedTraining: trainingForExperience(combined, bestExperience),
    suggestedCommunications: communicationsForExperience(combined, bestExperience),
    suggestedDashboard: dashboardForExperience(bestExperience),
    expectedOutcomes: outcomesForExperience(bestExperience, input.goals),
    recommendations,
  };
}

function chooseBestExperience(text: string, recommendations: EARecommendation[]): EAExperienceType {
  const firstSpecific = recommendations.find((item) => item.experience !== 'pulse-command-center');
  if (firstSpecific) return firstSpecific.experience;
  if (includesAny(text, ['train', 'staff', 'volunteers', 'students'])) return 'training-transformation';
  if (includesAny(text, ['communicate', 'updates', 'parents', 'members', 'donors'])) return 'update-hub';
  if (includesAny(text, ['clients', 'customers', 'patients', 'resources'])) return 'client-portal';
  if (includesAny(text, ['prospects', 'grow', 'profitability', 'offer'])) return 'landing-page';
  return 'connect';
}

function componentsForExperience(experience: EAExperienceType) {
  const shared = ['Capture intake', 'Understanding summary', 'Explainable recommendations', 'Review before publish', 'Pulse activity record'];
  const byExperience: Record<EAExperienceType, string[]> = {
    connect: ['Profile page', 'QR submission', 'Lead classification', 'Destination routing'],
    'training-transformation': ['Upload intake', 'Lesson generator', 'Quiz generator', 'Checklist generator', 'Manager summary'],
    'landing-page': ['Offer brief', 'Trust builders', 'Primary CTA', 'Lead capture'],
    'client-portal': ['Dashboard home', 'Resource library', 'Update Hub', 'Role-aware navigation'],
    'update-hub': ['Update composer', 'Audience selection', 'Notification workflow', 'Read tracking'],
    'pulse-command-center': ['Activity feed', 'Attention scoring', 'Prediction panel', 'Owner actions'],
    'simplifi-capture': ['Browser capture', 'Opportunity scoring', 'Blueprint stub', 'Follow-up guidance'],
    custom: ['Experience brief', 'Workflow map', 'Publishing target', 'Analytics contract'],
  };
  return [...shared, ...byExperience[experience]];
}

function pagesForExperience(experience: EAExperienceType) {
  if (experience === 'training-transformation') return ['Learning path', 'Lesson detail', 'Quiz', 'Checklist', 'Manager summary'];
  if (experience === 'client-portal') return ['Portal home', 'Resources', 'Updates', 'Learning', 'Pulse'];
  if (experience === 'landing-page') return ['Landing page', 'Thank-you page', 'Review/blueprint preview'];
  if (experience === 'update-hub') return ['Update feed', 'New update', 'Audience preferences'];
  if (experience === 'connect') return ['Connect profile', 'Submission confirmation', 'Owner dashboard'];
  return ['Command center', 'Review queue', 'Published output'];
}

function automationsForExperience(experience: EAExperienceType) {
  if (experience === 'training-transformation') return ['Notify manager when training is generated', 'Flag low quiz scores', 'Remind incomplete learners'];
  if (experience === 'connect') return ['Route new submission', 'Notify owner', 'Create follow-up task'];
  if (experience === 'landing-page') return ['Send inquiry confirmation', 'Notify owner', 'Create lead follow-up'];
  return ['Owner notification', 'Follow-up reminder', 'Pulse activity emission'];
}

function trainingForExperience(text: string, experience: EAExperienceType) {
  if (experience === 'training-transformation') return ['Onboarding lesson', 'Role checklist', 'Knowledge check', 'Manager coaching notes'];
  if (includesAny(text, ['train', 'staff', 'volunteer', 'student'])) return ['Intro lesson', 'Quick-start checklist'];
  return ['Internal handoff note'];
}

function communicationsForExperience(text: string, experience: EAExperienceType) {
  const base = ['Owner notification', 'Review-ready message'];
  if (experience === 'update-hub' || includesAny(text, ['communicate', 'updates', 'email', 'sms'])) {
    return [...base, 'Audience announcement', 'Reminder sequence'];
  }
  return base;
}

function dashboardForExperience(experience: EAExperienceType) {
  if (experience === 'training-transformation') return ['Completion', 'Quiz scores', 'Repeated questions', 'Training gaps'];
  if (experience === 'landing-page') return ['Views', 'Clicks', 'Conversions', 'Follow-ups'];
  if (experience === 'connect') return ['Submissions', 'Classification', 'Response status', 'Destination'];
  return ['Activity', 'Engagement', 'Bottlenecks', 'Recommended next actions'];
}

function outcomesForExperience(experience: EAExperienceType, goals: string[]) {
  return [
    `${EXPERIENCE_LABELS[experience]} first version ready for review.`,
    'Clear next action with reason and confidence.',
    'Reusable organization memory entry created.',
    goals.length ? `Supports goals: ${goals.join(', ')}.` : 'Supports a clearer path to what becomes possible next.',
  ];
}

function summarize(input: EACaptureInput) {
  const text = clean(input.text || input.title || input.fileName || input.sourceUrl || '');
  if (!text) return 'Captured material is ready for EA Intelligence analysis.';
  return text.length > 260 ? `${text.slice(0, 257)}...` : text;
}

function pickTopics(text: string) {
  const topicMap: Array<[string, string[]]> = [
    ['training', ['training', 'lesson', 'quiz', 'onboarding', 'sop', 'policy']],
    ['communication', ['email', 'sms', 'update', 'announcement', 'reminder']],
    ['portal', ['portal', 'dashboard', 'resource', 'member', 'client']],
    ['growth', ['grow', 'profit', 'revenue', 'lead', 'prospect', 'conversion']],
    ['automation', ['automatic', 'automate', 'workflow', 'follow-up', 'reminder']],
    ['knowledge', ['knowledge', 'document', 'pdf', 'word', 'powerpoint', 'video']],
  ];
  const topics = topicMap.filter(([, needles]) => includesAny(text, needles)).map(([topic]) => topic);
  return topics.length ? topics : ['possibilities'];
}

function rankRecommendations(recommendations: EARecommendation[]) {
  const score = { high: 3, medium: 2, low: 1 };
  return [...recommendations].sort((a, b) => score[b.confidence] - score[a.confidence]);
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function extractCapitalized(text: string) {
  const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}\b/g) ?? [];
  return [...new Set(matches)].slice(0, 12);
}

function extractOrganizations(text: string) {
  const matches = text.match(/\b[A-Z][A-Za-z&.'-]+(?:\s+[A-Z][A-Za-z&.'-]+){0,5}\s+(?:Inc|LLC|Centre|Center|Church|School|Academy|Foundation|Club|Clinic|Group|Company)\b/g) ?? [];
  return [...new Set(matches)].slice(0, 8);
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}
