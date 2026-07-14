import type { DiscoveryAnswers, DiscoveryMultiTextValue } from '@/lib/discovery-engine';

export type ScoreConfidence = 'High' | 'Medium' | 'Limited';
export type OperationalHealthVerdict = 'Strong' | 'Promising, With Gaps' | 'Needs Focus' | 'At Risk';

export type CtpAreaScore = {
  label: 'Capacity' | 'Visibility' | 'Time Leakage' | 'Growth Readiness';
  score: number;
  confidence: ScoreConfidence;
  why: string;
  evidence: string[];
  improve: string[];
};

export type CtpExecutiveScore = {
  scoringVersion: 'ctp-c-1.0';
  operationalHealthScore: number;
  verdict: OperationalHealthVerdict;
  confidence: ScoreConfidence;
  why: string;
  biggestOpportunity: string;
  whatsWorking: string[];
  whatsHoldingYouBack: string[];
  opportunityEstimate: {
    label: string;
    detail: string;
    confidence: ScoreConfidence;
  };
  recommendedStartingPoint: string;
  prioritizedNextSteps: string[];
  areaScores: {
    capacity: CtpAreaScore;
    visibility: CtpAreaScore;
    timeLeakage: CtpAreaScore;
    growthReadiness: CtpAreaScore;
  };
};

type AreaKey = keyof CtpExecutiveScore['areaScores'];
type AreaDraft = {
  label: CtpAreaScore['label'];
  score: number;
  evidence: string[];
  improve: string[];
  whyGood: string;
  whyRisk: string;
};

const SCORE_FLOOR = 20;

function arrayAnswer(answers: DiscoveryAnswers, key: string): string[] {
  const value = answers[key];
  return Array.isArray(value) ? value : [];
}

function stringAnswer(answers: DiscoveryAnswers, key: string): string {
  const value = answers[key];
  return typeof value === 'string' ? value.trim() : '';
}

function multiTextSelected(answers: DiscoveryAnswers, key: string): string[] {
  const value = answers[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const multi = value as DiscoveryMultiTextValue;
  return multi.selected ?? [];
}

function hasTextNote(answers: DiscoveryAnswers, key: string): boolean {
  const value = answers[key];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const multi = value as DiscoveryMultiTextValue;
  return Boolean(multi.note?.trim());
}

function countAnswered(answers: DiscoveryAnswers, keys: string[]): number {
  return keys.filter((key) => {
    const value = answers[key];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'number') return true;
    if (value && typeof value === 'object') {
      const multi = value as DiscoveryMultiTextValue;
      return Boolean(multi.selected?.length || multi.note?.trim() || Object.keys(value).length);
    }
    return false;
  }).length;
}

function confidence(answered: number, expected: number, riskEvidence: number): ScoreConfidence {
  if (answered >= expected && riskEvidence >= 2) return 'High';
  if (answered >= Math.max(1, expected - 1) || riskEvidence >= 1) return 'Medium';
  return 'Limited';
}

function overallConfidence(areaScores: CtpAreaScore[]): ScoreConfidence {
  const values = areaScores.map((area) => area.confidence);
  if (values.every((item) => item === 'High')) return 'High';
  if (values.some((item) => item === 'Limited')) return 'Limited';
  return 'Medium';
}

function clampScore(score: number): number {
  return Math.max(SCORE_FLOOR, Math.min(100, Math.round(score)));
}

function addRisk(draft: AreaDraft, points: number, evidence: string, improve: string): void {
  draft.score -= points;
  draft.evidence.push(evidence);
  if (!draft.improve.includes(improve)) draft.improve.push(improve);
}

function addStrength(draft: AreaDraft, points: number, evidence: string): void {
  draft.score += points;
  draft.evidence.push(evidence);
}

function finalizeArea(
  draft: AreaDraft,
  answers: DiscoveryAnswers,
  evidenceKeys: string[],
): CtpAreaScore {
  const score = clampScore(draft.score);
  const riskEvidence = draft.improve.length;
  const areaConfidence = confidence(countAnswered(answers, evidenceKeys), evidenceKeys.length, riskEvidence);
  const why = score >= 75
    ? draft.whyGood
    : draft.whyRisk;

  return {
    label: draft.label,
    score,
    confidence: areaConfidence,
    why,
    evidence: draft.evidence.slice(0, 5),
    improve: draft.improve.slice(0, 5),
  };
}

function scoreCapacity(answers: DiscoveryAnswers): CtpAreaScore {
  const challenges = arrayAnswer(answers, 'operational_challenges');
  const repeated = arrayAnswer(answers, 'repeated_work');
  const mistakePoints = arrayAnswer(answers, 'mistake_points');
  const desired = arrayAnswer(answers, 'desired_experiences');
  const teamSize = stringAnswer(answers, 'team_size');
  const draft: AreaDraft = {
    label: 'Capacity',
    score: 88,
    evidence: [],
    improve: [],
    whyGood: 'Your answers show a workable operating base with enough structure to build on.',
    whyRisk: 'Your capacity score reflects signs that repeatable work, handoffs, or onboarding could be consuming leadership and team bandwidth.',
  };

  if (teamSize) addStrength(draft, 2, `Team size provided: ${teamSize}.`);
  if (['6-15 people', '16-50 people', 'More than 50 people'].includes(teamSize)) {
    addRisk(draft, 5, 'A larger team increases the need for clear ownership and repeatable systems.', 'Clarify ownership, handoffs, and repeatable operating rhythms.');
  }
  if (challenges.includes('manual_onboarding')) addRisk(draft, 12, 'Manual onboarding was selected as a growth challenge.', 'Create a repeatable onboarding path.');
  if (challenges.includes('no_sops')) addRisk(draft, 12, 'Reusable process guidance was selected as a need.', 'Document the core workflows people repeat most often.');
  if (challenges.includes('project_tracking_gaps')) addRisk(draft, 10, 'Cleaner request and project tracking was selected.', 'Create one visible place to track requests, owners, and next steps.');
  if (mistakePoints.includes('handoffs')) addRisk(draft, 10, 'Handoffs were selected as a place where people need better support.', 'Make handoffs explicit with triggers, owners, and status.');
  if (mistakePoints.includes('approvals')) addRisk(draft, 8, 'Approvals or decisions were selected as a support gap.', 'Define approval paths before work stalls.');
  if (repeated.includes('explaining-next-steps')) addRisk(draft, 7, 'Explaining next steps was selected as repeated work.', 'Turn common explanations into guided next steps.');
  if (desired.includes('operations')) addRisk(draft, 6, 'Making daily work easier was selected as a desired experience.', 'Start with the operating workflow that creates the most drag.');

  return finalizeArea(draft, answers, ['team_size', 'operational_challenges', 'repeated_work', 'mistake_points']);
}

function scoreVisibility(answers: DiscoveryAnswers): CtpAreaScore {
  const currentState = arrayAnswer(answers, 'current_experience_state');
  const challenges = arrayAnswer(answers, 'operational_challenges');
  const repeated = arrayAnswer(answers, 'repeated_work');
  const mistakePoints = arrayAnswer(answers, 'mistake_points');
  const priorities = arrayAnswer(answers, 'top_priorities');
  const future = arrayAnswer(answers, 'ai_247');
  const draft: AreaDraft = {
    label: 'Visibility',
    score: 88,
    evidence: [],
    improve: [],
    whyGood: 'Your answers suggest people can get enough context to move forward, with room to make visibility sharper.',
    whyRisk: 'Your visibility score reflects signals that status, reporting, or decision context may not be easy to see in one place.',
  };

  if (currentState.includes('track-progress')) addRisk(draft, 13, 'Tracking progress or status was selected as something to make easier.', 'Give people a clear status view.');
  if (currentState.includes('receive-updates')) addRisk(draft, 8, 'Clear updates were selected as an experience need.', 'Create a simple update rhythm people can trust.');
  if (challenges.includes('no_centralized_reporting')) addRisk(draft, 16, 'A clearer dashboard for decisions was selected.', 'Build a decision dashboard around the few metrics that matter.');
  if (challenges.includes('project_tracking_gaps')) addRisk(draft, 10, 'Request and project tracking gaps were selected.', 'Make active work visible by owner, status, and next action.');
  if (repeated.includes('creating-reports')) addRisk(draft, 8, 'Creating updates or reports faster was selected.', 'Automate recurring reporting where possible.');
  if (mistakePoints.includes('status-updates')) addRisk(draft, 10, 'Status updates were selected as a support gap.', 'Move status out of memory, messages, and meetings.');
  if (priorities.includes('increase-visibility')) addRisk(draft, 8, 'Increasing visibility was selected as a top priority.', 'Prioritize the visibility layer before adding complexity.');
  if (future.includes('summarize-activity') || future.includes('surface-risks')) {
    addRisk(draft, 6, 'Future AI support was tied to summaries, risks, or missing items.', 'Use intelligence to surface what leadership should not miss.');
  }

  return finalizeArea(draft, answers, ['current_experience_state', 'operational_challenges', 'mistake_points', 'top_priorities']);
}

function scoreTimeLeakage(answers: DiscoveryAnswers): CtpAreaScore {
  const systems = arrayAnswer(answers, 'current_systems');
  const challenges = arrayAnswer(answers, 'operational_challenges');
  const repeated = arrayAnswer(answers, 'repeated_work');
  const desired = arrayAnswer(answers, 'desired_experiences');
  const draft: AreaDraft = {
    label: 'Time Leakage',
    score: 90,
    evidence: [],
    improve: [],
    whyGood: 'Your answers show opportunities to improve efficiency, but the core experience does not appear dominated by manual drag.',
    whyRisk: 'Your time leakage score reflects repeated manual work, disconnected tools, or follow-up tasks that can quietly consume hours.',
  };

  if (systems.length >= 5) addRisk(draft, 10, `${systems.length} current systems were selected.`, 'Reduce tool switching or connect the systems that matter.');
  if (systems.includes('Everything is mostly manual')) addRisk(draft, 16, 'The current setup was described as mostly manual.', 'Replace the most repetitive manual step first.');
  if (challenges.includes('manual_data_entry')) addRisk(draft, 15, 'Less repeated data entry was selected as a growth improvement.', 'Eliminate duplicate data entry.');
  if (challenges.includes('manual_scheduling')) addRisk(draft, 10, 'Easier scheduling and booking was selected.', 'Automate scheduling and reminders.');
  if (challenges.includes('manual_invoicing')) addRisk(draft, 9, 'Smoother payments or billing was selected.', 'Connect payment, billing, and follow-up steps.');
  if (challenges.includes('disconnected_systems')) addRisk(draft, 14, 'Better connection between tools was selected.', 'Connect tools around one source of truth.');
  if (repeated.includes('copying-data')) addRisk(draft, 14, 'Moving information between tools was selected as repeated work.', 'Automate data movement between systems.');
  if (repeated.includes('sending-reminders')) addRisk(draft, 8, 'Sending reminders was selected as repeated work.', 'Create automated reminder paths.');
  if (desired.includes('automation')) addRisk(draft, 7, 'Saving time with automation was selected as a desired experience.', 'Start with one high-volume automation.');

  return finalizeArea(draft, answers, ['current_systems', 'operational_challenges', 'repeated_work', 'desired_experiences']);
}

function scoreGrowthReadiness(answers: DiscoveryAnswers): CtpAreaScore {
  const desired = arrayAnswer(answers, 'desired_experiences');
  const priorities = arrayAnswer(answers, 'top_priorities');
  const challenges = arrayAnswer(answers, 'operational_challenges');
  const currentState = arrayAnswer(answers, 'current_experience_state');
  const revenueRange = stringAnswer(answers, 'revenue_range');
  const success = stringAnswer(answers, 'success_definition');
  const draft: AreaDraft = {
    label: 'Growth Readiness',
    score: 86,
    evidence: [],
    improve: [],
    whyGood: 'Your answers show clear ambition and enough direction to shape a practical first build.',
    whyRisk: 'Your growth readiness score reflects a gap between what you want to grow into and the current intake, follow-up, or experience layer supporting it.',
  };

  if (desired.length) addStrength(draft, 4, `Desired experiences selected: ${desired.slice(0, 4).join(', ')}.`);
  if (revenueRange) addStrength(draft, 2, `Organization size provided: ${revenueRange}.`);
  if (success) addStrength(draft, 2, `Success definition provided: ${success}.`);
  if (priorities.includes('generate-leads')) addRisk(draft, 8, 'Generating better leads was selected as a top priority.', 'Sharpen the public path from interest to action.');
  if (priorities.includes('launch-offer')) addRisk(draft, 7, 'Launching a new offer or program was selected.', 'Make the first offer path clear before expanding.');
  if (challenges.includes('inconsistent_follow_up')) addRisk(draft, 12, 'More consistent follow-up was selected.', 'Create a follow-up rhythm that does not depend on memory.');
  if (challenges.includes('no_client_database')) addRisk(draft, 10, 'A clearer people or client hub was selected.', 'Centralize contacts, relationships, and next steps.');
  if (currentState.includes('find-next-step')) addRisk(draft, 8, 'Helping people know what to do next was selected.', 'Clarify the next step at each point in the journey.');
  if (currentState.includes('understand-value')) addRisk(draft, 7, 'Helping people understand value quickly was selected.', 'Tighten the message around value and action.');
  if (desired.includes('portal')) addRisk(draft, 5, 'A portal was selected as a desired experience.', 'Make sure the private experience supports growth, not just access.');

  return finalizeArea(draft, answers, ['desired_experiences', 'top_priorities', 'success_definition', 'revenue_range', 'current_experience_state']);
}

function verdict(score: number): OperationalHealthVerdict {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Promising, With Gaps';
  if (score >= 40) return 'Needs Focus';
  return 'At Risk';
}

function opportunityEstimate(
  answers: DiscoveryAnswers,
  areaScores: CtpExecutiveScore['areaScores'],
): CtpExecutiveScore['opportunityEstimate'] {
  const teamSize = stringAnswer(answers, 'team_size');
  const systems = arrayAnswer(answers, 'current_systems').length;
  const repeated = arrayAnswer(answers, 'repeated_work').length;
  const challenges = arrayAnswer(answers, 'operational_challenges').length;
  const leakage = 100 - areaScores.timeLeakage.score;
  const capacity = 100 - areaScores.capacity.score;
  const severity = leakage + capacity + repeated * 4 + challenges * 3 + Math.max(0, systems - 3) * 2;

  const label = severity >= 90
    ? 'High opportunity to recover time and decision capacity'
    : severity >= 55
      ? 'Moderate opportunity to recover time and focus'
      : 'Focused opportunity to sharpen the operating experience';
  const detail = teamSize
    ? `Based on a ${teamSize} team profile, selected systems, repeated work, and operating challenges, the strongest opportunity is to reduce manual drag before it compounds.`
    : 'Based on selected systems, repeated work, and operating challenges, the strongest opportunity is to reduce manual drag before it compounds.';
  const estimateConfidence = teamSize && (repeated || challenges) ? 'High' : systems || repeated || challenges ? 'Medium' : 'Limited';

  return { label, detail, confidence: estimateConfidence };
}

function recommendedStartingPoint(
  answers: DiscoveryAnswers,
  orderedAreas: CtpAreaScore[],
): string {
  const desired = arrayAnswer(answers, 'desired_experiences');
  const portalModules = arrayAnswer(answers, 'portal_modules');
  const challenges = arrayAnswer(answers, 'operational_challenges');
  const lowest = orderedAreas[0]?.label;

  if (lowest === 'Visibility' || challenges.includes('no_centralized_reporting')) return 'Operational Dashboard';
  if (lowest === 'Time Leakage' || desired.includes('automation')) return 'Automation Layer';
  if (desired.includes('portal') || portalModules.length) return 'Client Portal';
  if (desired.includes('training')) return 'Training / Onboarding System';
  if (desired.includes('communication')) return 'Communication System';
  if (desired.includes('landing-page')) return 'Landing Page / Sales Page';
  if (desired.includes('connect')) return 'Connect Profile';
  if (orderedAreas.filter((area) => area.score < 60).length >= 2) return 'Website + Portal Bundle';
  return 'Operational Systems Review';
}

function topNextSteps(areas: CtpAreaScore[], recommendation: string): string[] {
  const steps = areas.flatMap((area) => area.improve.map((item) => `${area.label}: ${item}`));
  const unique = [...new Set(steps)];
  unique.push(`Start with ${recommendation} so the first build addresses the strongest evidence from your discovery.`);
  return unique.slice(0, 5);
}

function whatsWorking(answers: DiscoveryAnswers, areas: CtpAreaScore[]): string[] {
  const working: string[] = [];
  const desired = arrayAnswer(answers, 'desired_experiences');
  const priorities = arrayAnswer(answers, 'top_priorities');
  if (desired.length) working.push('You named the experiences that would be most useful, which gives the blueprint a clear direction.');
  if (priorities.length) working.push('You identified first priorities, so the work can start with focus instead of guessing.');
  for (const area of areas.filter((item) => item.score >= 75).slice(0, 2)) {
    working.push(`${area.label} has a workable foundation to build from.`);
  }
  if (!working.length) working.push('You gave enough context to identify practical next steps.');
  return working.slice(0, 4);
}

export function buildCtpExecutiveScore(answers: DiscoveryAnswers): CtpExecutiveScore {
  const capacity = scoreCapacity(answers);
  const visibility = scoreVisibility(answers);
  const timeLeakage = scoreTimeLeakage(answers);
  const growthReadiness = scoreGrowthReadiness(answers);
  const areaScores = { capacity, visibility, timeLeakage, growthReadiness };
  const orderedAreas = Object.values(areaScores).sort((a, b) => a.score - b.score);
  const operationalHealthScore = clampScore(
    visibility.score * 0.3 +
    capacity.score * 0.25 +
    timeLeakage.score * 0.25 +
    growthReadiness.score * 0.2,
  );
  const recommendation = recommendedStartingPoint(answers, orderedAreas);
  const confidenceValue = overallConfidence(Object.values(areaScores));
  const holdingBack = orderedAreas
    .filter((area) => area.score < 78)
    .flatMap((area) => area.evidence.slice(0, 2))
    .slice(0, 4);

  return {
    scoringVersion: 'ctp-c-1.0',
    operationalHealthScore,
    verdict: verdict(operationalHealthScore),
    confidence: confidenceValue,
    why: `Your Operational Health Score™ weighs visibility, capacity, time leakage, and growth readiness using only the evidence you provided in this discovery.`,
    biggestOpportunity: `${orderedAreas[0].label} is the clearest opportunity because it shows the strongest evidence of drag or risk right now.`,
    whatsWorking: whatsWorking(answers, Object.values(areaScores)),
    whatsHoldingYouBack: holdingBack.length ? holdingBack : ['The clearest gaps will emerge as more operating evidence is collected.'],
    opportunityEstimate: opportunityEstimate(answers, areaScores),
    recommendedStartingPoint: recommendation,
    prioritizedNextSteps: topNextSteps(orderedAreas, recommendation),
    areaScores,
  };
}
