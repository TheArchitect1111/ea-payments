// lib/analysis-engine.ts
//
// Phase E scoring engine. All numeric constants are marked CALIBRATE.
// Run the three fictitious examples through analyzeAssessment() to verify
// outputs before adjusting constants for real client data.

export type RevenueRange =
  | 'under_100k'
  | '100k_500k'
  | '500k_1m'
  | '1m_5m'
  | '5m_plus';

export type Complexity = 'low' | 'medium' | 'high';

export type ProjectType =
  | 'workflow_optimization'
  | 'operational_systems'
  | 'business_transformation'
  | 'enterprise_solution';

export type ConstraintCategory =
  | 'manual_process'
  | 'disconnected_systems'
  | 'visibility_gaps'
  | 'workflow_inconsistency'
  | 'scaling_bottleneck';

export type ScoreBand = 'healthy' | 'strained' | 'critical' | 'severe';

// Full challenge list shared with the assessment form (E1).
// Add new entries here; CHALLENGE_CATEGORY_MAP below must stay in sync.
export const OPERATIONAL_CHALLENGES = [
  { id: 'manual_scheduling',           label: 'Manual scheduling and booking' },
  { id: 'no_client_database',          label: 'No centralized client or customer database' },
  { id: 'inconsistent_follow_up',      label: 'Inconsistent follow-up with leads or clients' },
  { id: 'manual_invoicing',            label: 'Manual invoicing or billing processes' },
  { id: 'disconnected_systems',        label: 'Disconnected systems requiring duplicate data entry' },
  { id: 'no_centralized_reporting',    label: 'No centralized reporting or performance dashboards' },
  { id: 'leadership_lacks_visibility', label: 'Leadership lacks real-time operational data' },
  { id: 'manual_data_entry',           label: 'Manual data entry between multiple tools' },
  { id: 'inconsistent_communication',  label: 'Inconsistent client or customer communication' },
  { id: 'manual_onboarding',           label: 'Manual onboarding or offboarding processes' },
  { id: 'compliance_reporting',        label: 'Compliance or regulatory reporting done manually' },
  { id: 'vendor_management_manual',    label: 'Vendor or supplier management in spreadsheets' },
  { id: 'team_scaling_issues',         label: 'Difficulty scaling operations with team growth' },
  { id: 'no_sops',                     label: 'No documented standard operating procedures' },
  { id: 'project_tracking_gaps',       label: 'Project or task tracking gaps' },
] as const;

export type ChallengeId = typeof OPERATIONAL_CHALLENGES[number]['id'];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  workflow_optimization:   'Workflow Optimization',
  operational_systems:     'Operational Systems',
  business_transformation: 'Business Transformation',
  enterprise_solution:     'Enterprise Solution',
};

export interface AssessmentInput {
  teamSize: number;
  revenueRange: RevenueRange;
  systemsCount: number;
  operationalChallenges: string[];
  complexity: Complexity;
}

export interface AnalysisResult {
  capacityScore: number;
  scoreBand: ScoreBand;
  primaryConstraint: string;
  weeklyTimeRecovery: number;
  opportunityLow: number;
  opportunityHigh: number;
  recommendedProjectType: ProjectType;
}

// --- CHALLENGE CATEGORY MAP ---
// Unknown challenge IDs are skipped silently so new form options do not crash the engine.
const CHALLENGE_CATEGORY_MAP: Partial<Record<string, ConstraintCategory>> = {
  manual_scheduling:           'manual_process',
  no_client_database:          'manual_process',
  inconsistent_follow_up:      'workflow_inconsistency',
  manual_invoicing:            'manual_process',
  disconnected_systems:        'disconnected_systems',
  no_centralized_reporting:    'visibility_gaps',
  leadership_lacks_visibility: 'visibility_gaps',
  manual_data_entry:           'disconnected_systems',
  inconsistent_communication:  'workflow_inconsistency',
  manual_onboarding:           'manual_process',
  compliance_reporting:        'visibility_gaps',
  vendor_management_manual:    'workflow_inconsistency',
  team_scaling_issues:         'scaling_bottleneck',
  no_sops:                     'workflow_inconsistency',
  project_tracking_gaps:       'visibility_gaps',
};

const CONSTRAINT_LABELS: Record<ConstraintCategory, string> = {
  manual_process:         'Manual Process Overload',
  disconnected_systems:   'Disconnected Systems Creating Duplicate Work',
  visibility_gaps:        'Lack of Centralized Visibility and Reporting',
  workflow_inconsistency: 'Inconsistent Client and Delivery Workflows',
  scaling_bottleneck:     'Team Scaling Bottleneck',
};

// --- CAPACITY SCORE ---
// Higher score = more capacity being lost = greater opportunity for EA.
// Range: 0-100. All numeric constants are CALIBRATE.
function calculateCapacityScore(input: AssessmentInput): number {
  // Challenges: primary driver. CALIBRATE: pts-per-challenge (8) and cap (6)
  const challengePts = Math.min(input.operationalChallenges.length, 6) * 8;

  // Systems friction. CALIBRATE: thresholds and point values
  let systemsPts = 0;
  if (input.systemsCount >= 7) systemsPts = 12;
  else if (input.systemsCount >= 5) systemsPts = 8;
  else if (input.systemsCount >= 3) systemsPts = 5;

  // Team size scales the severity of operational drag. CALIBRATE: thresholds and points
  let teamPts = 0;
  if (input.teamSize >= 16) teamPts = 12;
  else if (input.teamSize >= 6) teamPts = 8;
  else teamPts = 2;

  // Complexity amplifier. CALIBRATE: point values
  const complexityPts: Record<Complexity, number> = { low: 2, medium: 6, high: 10 };

  return Math.min(100, challengePts + systemsPts + teamPts + complexityPts[input.complexity]);
}

function getScoreBand(score: number): ScoreBand {
  // CALIBRATE: band thresholds
  if (score >= 76) return 'severe';
  if (score >= 56) return 'critical';
  if (score >= 31) return 'strained';
  return 'healthy';
}

// --- PRIMARY CONSTRAINT ---
function selectPrimaryConstraint(input: AssessmentInput): string {
  const counts: Partial<Record<ConstraintCategory, number>> = {};

  for (const challenge of input.operationalChallenges) {
    const category = CHALLENGE_CATEGORY_MAP[challenge];
    if (category !== undefined) {
      counts[category] = (counts[category] ?? 0) + 1;
    }
  }

  // Boost disconnected_systems when many tools in use
  if (input.systemsCount >= 5) {
    counts.disconnected_systems = (counts.disconnected_systems ?? 0) + 1;
  }

  // Boost scaling_bottleneck for large teams with broad challenge spread
  if (input.teamSize >= 30 && Object.keys(counts).length >= 3) {
    counts.scaling_bottleneck = (counts.scaling_bottleneck ?? 0) + 1;
  }

  // Tiebreaker priority: first entry wins when counts are equal
  const priority: ConstraintCategory[] = [
    'visibility_gaps',
    'disconnected_systems',
    'manual_process',
    'workflow_inconsistency',
    'scaling_bottleneck',
  ];

  let topCategory: ConstraintCategory = 'manual_process';
  let topCount = 0;

  for (const category of priority) {
    const count = counts[category] ?? 0;
    if (count > topCount) {
      topCount = count;
      topCategory = category;
    }
  }

  return CONSTRAINT_LABELS[topCategory];
}

// --- WEEKLY TIME RECOVERY ---
// CALIBRATE: BASE_HOURS_PER_CHALLENGE and teamMultiplier values
const BASE_HOURS_PER_CHALLENGE = 4;

function calculateWeeklyTimeRecovery(input: AssessmentInput): number {
  // CALIBRATE: team size thresholds and multipliers
  let teamMultiplier: number;
  if (input.teamSize >= 16) teamMultiplier = 1.5;
  else if (input.teamSize >= 6) teamMultiplier = 0.9;
  else teamMultiplier = 0.5;

  const raw = input.operationalChallenges.length * BASE_HOURS_PER_CHALLENGE * teamMultiplier;
  // CALIBRATE: min/max sanity bounds
  return Math.min(50, Math.max(2, Math.round(raw)));
}

// --- ANNUAL FINANCIAL OPPORTUNITY ---
// Rates represent effective value per hour of recovered capacity at each revenue scale.
// Display as a range: opportunityLow to opportunityHigh.
// CALIBRATE: all rate values
const OPPORTUNITY_RATES: Record<RevenueRange, { low: number; high: number }> = {
  under_100k:  { low: 25,  high: 48  },
  '100k_500k': { low: 30,  high: 60  },
  '500k_1m':   { low: 37,  high: 69  },
  '1m_5m':     { low: 45,  high: 90  },
  '5m_plus':   { low: 55,  high: 128 },
};

function calculateOpportunity(
  weeklyHours: number,
  revenueRange: RevenueRange
): { low: number; high: number } {
  const rates = OPPORTUNITY_RATES[revenueRange];
  const rawLow  = weeklyHours * 52 * rates.low;
  const rawHigh = weeklyHours * 52 * rates.high;

  // Round to nearest $1,000 for clean display. CALIBRATE: floor values
  const low  = Math.max(5000,  Math.round(rawLow  / 1000) * 1000);
  const high = Math.max(10000, Math.round(rawHigh / 1000) * 1000);
  return { low, high };
}

// --- RECOMMENDED PROJECT TYPE ---
// Evaluated top-to-bottom; first matching condition wins.
// CALIBRATE: all thresholds
function recommendProjectType(
  score: number,
  teamSize: number,
  complexity: Complexity
): ProjectType {
  if (score <= 55 && teamSize <= 10 && complexity === 'low') {
    return 'workflow_optimization';
  }
  if (score <= 65 && teamSize <= 25) {
    return 'operational_systems';
  }
  if (score <= 78 && teamSize <= 60) {
    return 'business_transformation';
  }
  return 'enterprise_solution';
}

// --- MAIN EXPORT ---
export function analyzeAssessment(input: AssessmentInput): AnalysisResult {
  const capacityScore          = calculateCapacityScore(input);
  const scoreBand              = getScoreBand(capacityScore);
  const primaryConstraint      = selectPrimaryConstraint(input);
  const weeklyTimeRecovery     = calculateWeeklyTimeRecovery(input);
  const { low: opportunityLow, high: opportunityHigh } = calculateOpportunity(
    weeklyTimeRecovery,
    input.revenueRange
  );
  const recommendedProjectType = recommendProjectType(
    capacityScore,
    input.teamSize,
    input.complexity
  );

  return {
    capacityScore,
    scoreBand,
    primaryConstraint,
    weeklyTimeRecovery,
    opportunityLow,
    opportunityHigh,
    recommendedProjectType,
  };
}
