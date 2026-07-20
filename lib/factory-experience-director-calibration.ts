/**
 * Experience Director — Phase 2 Calibration & Benchmarking.
 * Gold-standard dataset + AI/human comparison + confidence + analytics.
 * Append-only. Separate from Phase 1 validation logs.
 * Does not change publish, Launch, orchestration, or review scoring behavior.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  CONSTITUTION_RULES,
  type ConstitutionRuleId,
  type ExperienceDirectorValidationEntry,
  type FrequencyRow,
  type ScoreAverages,
  failedConstitutionRulesFromAnswers,
  readExperienceDirectorValidationStore,
} from '@/lib/factory-experience-director-validation';
import {
  type ExperienceDirectorApprovalStatus,
  type ExperienceReviewAnswers,
  type ExperienceReviewScores,
} from '@/lib/factory-experience-review';
import {
  computeReviewConfidence,
  type ReviewConfidence,
  type ReviewConfidenceLevel,
} from '@/lib/factory-experience-director-confidence';

export type { ReviewConfidence, ReviewConfidenceLevel };
export { computeReviewConfidence };

export const EXPERIENCE_DIRECTOR_GOLD_SCHEMA_VERSION = 1;
export const EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION = 'constitution-v1';
export const EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID = 'heuristic-director-v1';

export type ConsensusLevel = 'Strong' | 'Moderate' | 'Weak';

export type OrganizationSize = 'Solo' | 'Small' | 'Mid' | 'Enterprise' | 'Unspecified';
export type ProjectType =
  | 'Website'
  | 'Portal'
  | 'Website + Portal'
  | 'Experience'
  | 'Unspecified';

/** Reserved for future ML / adaptive scoring — unused by current review path. */
export type CalibrationModelMeta = {
  modelId: string;
  ruleVersion: string;
  /** Future: reviewer weighting scheme id */
  reviewerWeightSchemeId?: string;
  /** Future: historical model comparison key */
  modelGeneration?: string;
  /** Future: adaptive scoring profile */
  adaptiveProfileId?: string;
};

export type GoldStandardHumanReview = {
  id: string;
  schemaVersion: number;
  /** Append-only gold standard — never mutates prior entries */
  kind: 'gold_standard';
  projectId: string;
  client: string;
  industry: string;
  organizationSize: OrganizationSize;
  projectType: ProjectType;
  blueprintVersion: string;
  humanReviewer: string;
  humanOverallScore: number;
  humanCategoryScores: ExperienceReviewScores;
  humanWrittenRationale: string;
  approvalStatus: ExperienceDirectorApprovalStatus;
  humanAnswers?: ExperienceReviewAnswers;
  failedConstitutionRules: ConstitutionRuleId[];
  reviewedAt: string;
  /** Optional link back to Phase 1 validation import */
  importedFromValidationId?: string;
  notes?: string;
  /** Future-ready metadata (ignored by current scoring) */
  meta?: CalibrationModelMeta;
};

export type AiHumanComparisonRecord = {
  id: string;
  schemaVersion: number;
  kind: 'ai_human_comparison';
  goldStandardId: string;
  projectId: string;
  client: string;
  industry: string;
  blueprintVersion: string;
  createdAt: string;
  humanReviewer: string;
  humanScores: ExperienceReviewScores;
  humanApprovalStatus: ExperienceDirectorApprovalStatus;
  aiScores: ExperienceReviewScores;
  aiApprovalStatus: ExperienceDirectorApprovalStatus;
  aiConfidence: ReviewConfidence;
  overallDifference: number;
  categoryDifferences: ExperienceReviewScores;
  agreementPercent: number;
  approvalMatch: boolean;
  highDisagreementCategories: Array<{ category: keyof ExperienceReviewScores; difference: number }>;
  validationEntryId?: string;
  meta: CalibrationModelMeta;
};

export type ExperienceDirectorGoldStore = {
  version: number;
  updatedAt: string;
  /** Future: active rule/model pointers without rewriting history */
  activeModel: CalibrationModelMeta;
  goldStandards: GoldStandardHumanReview[];
  comparisons: AiHumanComparisonRecord[];
};

const DEFAULT_STORE: ExperienceDirectorGoldStore = {
  version: 0,
  updatedAt: '',
  activeModel: {
    modelId: EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID,
    ruleVersion: EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION,
  },
  goldStandards: [],
  comparisons: [],
};

const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'experience-director-gold-standard.json')
  : path.join(
      /* turbopackIgnore: true */ process.cwd(),
      '.data',
      'experience-director-gold-standard.json',
    );

const SCORE_KEYS: Array<keyof ExperienceReviewScores> = [
  'overall',
  'story',
  'visual',
  'originality',
  'executiveExperience',
  'wow',
];

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return clamp(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function nonce(): string {
  return crypto.randomBytes(3).toString('hex');
}

function emptyScores(): ExperienceReviewScores {
  return {
    overall: 0,
    story: 0,
    visual: 0,
    originality: 0,
    executiveExperience: 0,
    wow: 0,
  };
}

function normalizeScores(raw: Partial<ExperienceReviewScores> | undefined): ExperienceReviewScores {
  const s = raw || {};
  return {
    overall: clamp(Number(s.overall) || 0),
    story: clamp(Number(s.story) || 0),
    visual: clamp(Number(s.visual) || 0),
    originality: clamp(Number(s.originality) || 0),
    executiveExperience: clamp(Number(s.executiveExperience) || 0),
    wow: clamp(Number(s.wow) || 0),
  };
}

function frequency(items: string[], limit = 20): FrequencyRow[] {
  const map = new Map<string, number>();
  for (const raw of items) {
    const label = String(raw || '').trim();
    if (!label) continue;
    map.set(label, (map.get(label) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function weekKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'unknown';
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function pearson(xs: number[], ys: number[]): number | null {
  if (xs.length < 3 || xs.length !== ys.length) return null;
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  if (!den) return null;
  return Math.round((num / den) * 1000) / 1000;
}

export function computeAiHumanComparison(input: {
  gold: GoldStandardHumanReview;
  aiScores: ExperienceReviewScores;
  aiApprovalStatus: ExperienceDirectorApprovalStatus;
  aiAnswers: ExperienceReviewAnswers;
  aiImprovements?: string[];
  aiRationale?: string;
  validationEntryId?: string;
}): Omit<AiHumanComparisonRecord, 'id' | 'schemaVersion' | 'kind' | 'createdAt'> {
  const human = input.gold.humanCategoryScores;
  const ai = normalizeScores(input.aiScores);
  const categoryDifferences = emptyScores();
  const highDisagreementCategories: AiHumanComparisonRecord['highDisagreementCategories'] = [];
  let absSum = 0;

  for (const key of SCORE_KEYS) {
    const diff = ai[key] - human[key];
    categoryDifferences[key] = diff;
    absSum += Math.abs(diff);
    if (Math.abs(diff) > 10 && key !== 'overall') {
      highDisagreementCategories.push({ category: key, difference: diff });
    }
  }
  if (Math.abs(categoryDifferences.overall) > 10) {
    highDisagreementCategories.unshift({
      category: 'overall',
      difference: categoryDifferences.overall,
    });
  }

  const maxPossible = 100 * SCORE_KEYS.length;
  const agreementPercent = clamp(100 - (absSum / maxPossible) * 100);
  const confidence = computeReviewConfidence({
    scores: ai,
    answers: input.aiAnswers,
    requiredImprovements: input.aiImprovements,
    rationale: input.aiRationale,
  });

  return {
    goldStandardId: input.gold.id,
    projectId: input.gold.projectId,
    client: input.gold.client,
    industry: input.gold.industry,
    blueprintVersion: input.gold.blueprintVersion,
    humanReviewer: input.gold.humanReviewer,
    humanScores: human,
    humanApprovalStatus: input.gold.approvalStatus,
    aiScores: ai,
    aiApprovalStatus: input.aiApprovalStatus,
    aiConfidence: confidence,
    overallDifference: categoryDifferences.overall,
    categoryDifferences,
    agreementPercent,
    approvalMatch: input.gold.approvalStatus === input.aiApprovalStatus,
    highDisagreementCategories,
    validationEntryId: input.validationEntryId,
    meta: {
      modelId: EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID,
      ruleVersion: EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION,
    },
  };
}

function normalizeOrgSize(v: unknown): OrganizationSize {
  const s = String(v || '').trim();
  if (s === 'Solo' || s === 'Small' || s === 'Mid' || s === 'Enterprise') return s;
  return 'Unspecified';
}

function normalizeProjectType(v: unknown): ProjectType {
  const s = String(v || '').trim();
  if (
    s === 'Website' ||
    s === 'Portal' ||
    s === 'Website + Portal' ||
    s === 'Experience'
  ) {
    return s;
  }
  return 'Unspecified';
}

function normalizeGold(raw: Partial<GoldStandardHumanReview>): GoldStandardHumanReview | null {
  if (!raw?.projectId || !raw.humanReviewer || !raw.approvalStatus) return null;
  const humanCategoryScores = normalizeScores(
    raw.humanCategoryScores ||
      ({
        overall: raw.humanOverallScore,
        story: raw.humanOverallScore,
        visual: raw.humanOverallScore,
        originality: raw.humanOverallScore,
        executiveExperience: raw.humanOverallScore,
        wow: raw.humanOverallScore,
      } as ExperienceReviewScores),
  );
  const answers = raw.humanAnswers;
  const failed = Array.isArray(raw.failedConstitutionRules)
    ? (raw.failedConstitutionRules as ConstitutionRuleId[])
    : answers
      ? failedConstitutionRulesFromAnswers(answers)
      : [];

  return {
    id: String(raw.id || `gold-${Date.now().toString(36)}-${nonce()}`),
    schemaVersion: Number(raw.schemaVersion) || EXPERIENCE_DIRECTOR_GOLD_SCHEMA_VERSION,
    kind: 'gold_standard',
    projectId: String(raw.projectId),
    client: String(raw.client || raw.projectId),
    industry: String(raw.industry || 'Unspecified').trim() || 'Unspecified',
    organizationSize: normalizeOrgSize(raw.organizationSize),
    projectType: normalizeProjectType(raw.projectType),
    blueprintVersion: String(raw.blueprintVersion || 'unknown'),
    humanReviewer: String(raw.humanReviewer),
    humanOverallScore: clamp(Number(raw.humanOverallScore) || humanCategoryScores.overall),
    humanCategoryScores,
    humanWrittenRationale: String(raw.humanWrittenRationale || ''),
    approvalStatus: raw.approvalStatus as ExperienceDirectorApprovalStatus,
    humanAnswers: answers,
    failedConstitutionRules: failed,
    reviewedAt: String(raw.reviewedAt || new Date().toISOString()),
    importedFromValidationId: raw.importedFromValidationId
      ? String(raw.importedFromValidationId)
      : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    meta: raw.meta || {
      modelId: EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID,
      ruleVersion: EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION,
    },
  };
}

function normalizeComparison(
  raw: Partial<AiHumanComparisonRecord>,
): AiHumanComparisonRecord | null {
  if (!raw?.goldStandardId || !raw.projectId) return null;
  return {
    id: String(raw.id || `cmp-${Date.now().toString(36)}-${nonce()}`),
    schemaVersion: Number(raw.schemaVersion) || EXPERIENCE_DIRECTOR_GOLD_SCHEMA_VERSION,
    kind: 'ai_human_comparison',
    goldStandardId: String(raw.goldStandardId),
    projectId: String(raw.projectId),
    client: String(raw.client || ''),
    industry: String(raw.industry || 'Unspecified'),
    blueprintVersion: String(raw.blueprintVersion || 'unknown'),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    humanReviewer: String(raw.humanReviewer || ''),
    humanScores: normalizeScores(raw.humanScores),
    humanApprovalStatus: (raw.humanApprovalStatus || 'Needs Refinement') as ExperienceDirectorApprovalStatus,
    aiScores: normalizeScores(raw.aiScores),
    aiApprovalStatus: (raw.aiApprovalStatus || 'Needs Refinement') as ExperienceDirectorApprovalStatus,
    aiConfidence: raw.aiConfidence || {
      level: 'Medium',
      score: 50,
      reasons: ['Confidence not recorded.'],
    },
    overallDifference: Number(raw.overallDifference) || 0,
    categoryDifferences: normalizeScores(raw.categoryDifferences),
    agreementPercent: clamp(Number(raw.agreementPercent) || 0),
    approvalMatch: Boolean(raw.approvalMatch),
    highDisagreementCategories: Array.isArray(raw.highDisagreementCategories)
      ? raw.highDisagreementCategories
      : [],
    validationEntryId: raw.validationEntryId ? String(raw.validationEntryId) : undefined,
    meta: raw.meta || {
      modelId: EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID,
      ruleVersion: EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION,
    },
  };
}

function normalizeStore(raw: Partial<ExperienceDirectorGoldStore>): ExperienceDirectorGoldStore {
  return {
    version: Number(raw.version) || 0,
    updatedAt: String(raw.updatedAt || ''),
    activeModel: raw.activeModel || { ...DEFAULT_STORE.activeModel },
    goldStandards: Array.isArray(raw.goldStandards)
      ? (raw.goldStandards.map(normalizeGold).filter(Boolean) as GoldStandardHumanReview[])
      : [],
    comparisons: Array.isArray(raw.comparisons)
      ? (raw.comparisons.map(normalizeComparison).filter(Boolean) as AiHumanComparisonRecord[])
      : [],
  };
}

export async function readExperienceDirectorGoldStore(): Promise<ExperienceDirectorGoldStore> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<ExperienceDirectorGoldStore>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

async function writeStore(data: ExperienceDirectorGoldStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function appendGoldStandardReview(
  input: Omit<GoldStandardHumanReview, 'id' | 'schemaVersion' | 'kind'> & { id?: string },
): Promise<GoldStandardHumanReview> {
  const entry = normalizeGold({
    ...input,
    id: input.id || `gold-${Date.now().toString(36)}-${nonce()}`,
    schemaVersion: EXPERIENCE_DIRECTOR_GOLD_SCHEMA_VERSION,
    kind: 'gold_standard',
  });
  if (!entry) throw new Error('Invalid gold standard entry');

  const store = await readExperienceDirectorGoldStore();
  store.goldStandards.push(entry);
  store.version += 1;
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
  return entry;
}

export async function appendAiHumanComparison(
  input: Omit<AiHumanComparisonRecord, 'id' | 'schemaVersion' | 'kind' | 'createdAt'> & {
    id?: string;
    createdAt?: string;
  },
): Promise<AiHumanComparisonRecord> {
  const entry = normalizeComparison({
    ...input,
    id: input.id || `cmp-${Date.now().toString(36)}-${nonce()}`,
    schemaVersion: EXPERIENCE_DIRECTOR_GOLD_SCHEMA_VERSION,
    kind: 'ai_human_comparison',
    createdAt: input.createdAt || new Date().toISOString(),
  });
  if (!entry) throw new Error('Invalid comparison entry');

  const store = await readExperienceDirectorGoldStore();
  store.comparisons.push(entry);
  store.version += 1;
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
  return entry;
}

export function goldFromValidationEntry(
  entry: ExperienceDirectorValidationEntry,
  overrides?: {
    organizationSize?: OrganizationSize;
    projectType?: ProjectType;
    humanReviewer?: string;
  },
): Omit<GoldStandardHumanReview, 'id' | 'schemaVersion' | 'kind'> {
  return {
    projectId: entry.projectId,
    client: entry.client,
    industry: entry.industry,
    organizationSize: overrides?.organizationSize || 'Unspecified',
    projectType: overrides?.projectType || 'Unspecified',
    blueprintVersion: entry.blueprintVersion,
    humanReviewer: overrides?.humanReviewer || entry.reviewer,
    humanOverallScore: entry.scores.overall,
    humanCategoryScores: entry.scores,
    humanWrittenRationale: entry.rationale,
    approvalStatus: entry.approvalStatus,
    humanAnswers: entry.answers,
    failedConstitutionRules: entry.failedConstitutionRules,
    reviewedAt: entry.reviewedAt,
    importedFromValidationId: entry.id,
    meta: {
      modelId: EXPERIENCE_DIRECTOR_CALIBRATION_MODEL_ID,
      ruleVersion: EXPERIENCE_DIRECTOR_CALIBRATION_RULE_VERSION,
    },
  };
}

/** Import validation log entries into gold standard (append-only; skips already-imported ids). */
export async function importValidationEntriesToGoldStandard(options?: {
  validationIds?: string[];
  organizationSize?: OrganizationSize;
  projectType?: ProjectType;
}): Promise<{ imported: GoldStandardHumanReview[]; skipped: number }> {
  const validation = await readExperienceDirectorValidationStore();
  const store = await readExperienceDirectorGoldStore();
  const already = new Set(
    store.goldStandards.map((g) => g.importedFromValidationId).filter(Boolean) as string[],
  );

  const candidates = options?.validationIds?.length
    ? validation.entries.filter((e) => options.validationIds!.includes(e.id))
    : validation.entries;

  const imported: GoldStandardHumanReview[] = [];
  let skipped = 0;

  for (const entry of candidates) {
    if (already.has(entry.id)) {
      skipped += 1;
      continue;
    }
    const gold = await appendGoldStandardReview(
      goldFromValidationEntry(entry, {
        organizationSize: options?.organizationSize,
        projectType: options?.projectType,
      }),
    );
    imported.push(gold);
    already.add(entry.id);
  }

  return { imported, skipped };
}

export type ReviewerAgreementGroup = {
  blueprintVersion: string;
  projectId: string;
  client: string;
  industry: string;
  reviewCount: number;
  reviewers: string[];
  agreementPercent: number;
  variance: number;
  consensusLevel: ConsensusLevel;
  scores: ExperienceReviewScores[];
  averageScores: ScoreAverages;
};

export function computeReviewerAgreementGroups(
  gold: GoldStandardHumanReview[],
): ReviewerAgreementGroup[] {
  const map = new Map<string, GoldStandardHumanReview[]>();
  for (const g of gold) {
    const key = `${g.projectId}::${g.blueprintVersion}`;
    const arr = map.get(key) || [];
    arr.push(g);
    map.set(key, arr);
  }

  const groups: ReviewerAgreementGroup[] = [];
  for (const rows of map.values()) {
    if (rows.length < 2) continue;
    const overalls = rows.map((r) => r.humanOverallScore);
    const mean = overalls.reduce((a, b) => a + b, 0) / overalls.length;
    const variance =
      overalls.reduce((a, b) => a + (b - mean) ** 2, 0) / overalls.length;
    const maxPairGap = Math.max(
      ...overalls.flatMap((a, i) => overalls.slice(i + 1).map((b) => Math.abs(a - b))),
      0,
    );
    const agreementPercent = clamp(100 - maxPairGap);
    let consensusLevel: ConsensusLevel;
    if (agreementPercent >= 85 && variance <= 25) consensusLevel = 'Strong';
    else if (agreementPercent >= 70 && variance <= 100) consensusLevel = 'Moderate';
    else consensusLevel = 'Weak';

    groups.push({
      blueprintVersion: rows[0].blueprintVersion,
      projectId: rows[0].projectId,
      client: rows[0].client,
      industry: rows[0].industry,
      reviewCount: rows.length,
      reviewers: [...new Set(rows.map((r) => r.humanReviewer))],
      agreementPercent,
      variance: Math.round(variance * 10) / 10,
      consensusLevel,
      scores: rows.map((r) => r.humanCategoryScores),
      averageScores: {
        overall: avg(rows.map((r) => r.humanCategoryScores.overall)),
        story: avg(rows.map((r) => r.humanCategoryScores.story)),
        visual: avg(rows.map((r) => r.humanCategoryScores.visual)),
        originality: avg(rows.map((r) => r.humanCategoryScores.originality)),
        executiveExperience: avg(rows.map((r) => r.humanCategoryScores.executiveExperience)),
        wow: avg(rows.map((r) => r.humanCategoryScores.wow)),
      },
    });
  }

  return groups.sort((a, b) => a.agreementPercent - b.agreementPercent);
}

export type SegmentBenchmarkRow = {
  segment: string;
  count: number;
  averages: ScoreAverages;
};

function segmentAverages(
  rows: GoldStandardHumanReview[],
  keyFn: (g: GoldStandardHumanReview) => string,
): SegmentBenchmarkRow[] {
  const map = new Map<string, GoldStandardHumanReview[]>();
  for (const g of rows) {
    const key = keyFn(g) || 'Unspecified';
    const arr = map.get(key) || [];
    arr.push(g);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([segment, list]) => ({
      segment,
      count: list.length,
      averages: {
        overall: avg(list.map((r) => r.humanCategoryScores.overall)),
        story: avg(list.map((r) => r.humanCategoryScores.story)),
        visual: avg(list.map((r) => r.humanCategoryScores.visual)),
        originality: avg(list.map((r) => r.humanCategoryScores.originality)),
        executiveExperience: avg(list.map((r) => r.humanCategoryScores.executiveExperience)),
        wow: avg(list.map((r) => r.humanCategoryScores.wow)),
      },
    }))
    .sort((a, b) => a.averages.overall - b.averages.overall);
}

export type CorrelationPair = {
  id: string;
  label: string;
  xKey: keyof ExperienceReviewScores | 'approvalNumeric';
  yKey: keyof ExperienceReviewScores | 'approvalNumeric';
  coefficient: number | null;
  points: Array<{ x: number; y: number }>;
};

export type ConstitutionFailureAnalytics = {
  mostCommonFailures: FrequencyRow[];
  failureFrequency: FrequencyRow[];
  improvementOverTime: Array<{ period: string; failureRate: number; count: number }>;
  failureByIndustry: Array<{ industry: string; topFailure: string; count: number }>;
  failureByBlueprintVersion: Array<{ blueprintVersion: string; topFailure: string; count: number }>;
};

export type CalibrationDashboard = {
  datasetHealth: {
    goldCount: number;
    comparisonCount: number;
    projectCount: number;
    industryCount: number;
    multiReviewerBlueprints: number;
    importedFromValidation: number;
    activeModel: CalibrationModelMeta;
  };
  agreementPercent: number;
  averageScoreDifference: number;
  confidenceDistribution: Record<ReviewConfidenceLevel, number>;
  topReviewerDisagreements: AiHumanComparisonRecord[];
  mostReliableCategories: Array<{ category: keyof ExperienceReviewScores; meanAbsDiff: number }>;
  leastReliableCategories: Array<{ category: keyof ExperienceReviewScores; meanAbsDiff: number }>;
  recentActivity: Array<{
    at: string;
    kind: string;
    label: string;
  }>;
  comparisons: AiHumanComparisonRecord[];
  goldStandards: GoldStandardHumanReview[];
  industryBenchmarks: SegmentBenchmarkRow[];
  organizationSizeBenchmarks: SegmentBenchmarkRow[];
  projectTypeBenchmarks: SegmentBenchmarkRow[];
  reviewerAgreement: ReviewerAgreementGroup[];
  constitution: ConstitutionFailureAnalytics;
  correlations: CorrelationPair[];
};

function approvalNumeric(status: ExperienceDirectorApprovalStatus): number {
  if (status === 'Approved') return 100;
  if (status === 'Needs Refinement') return 50;
  return 0;
}

export function buildCalibrationDashboard(store: ExperienceDirectorGoldStore): CalibrationDashboard {
  const gold = store.goldStandards;
  const comparisons = [...store.comparisons].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  const agreementPercent = comparisons.length
    ? avg(comparisons.map((c) => c.agreementPercent))
    : 0;
  const averageScoreDifference = comparisons.length
    ? Math.round(
        (comparisons.reduce((a, c) => a + Math.abs(c.overallDifference), 0) / comparisons.length) *
          10,
      ) / 10
    : 0;

  const confidenceDistribution: Record<ReviewConfidenceLevel, number> = {
    'Very High': 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  for (const c of comparisons) {
    confidenceDistribution[c.aiConfidence.level] =
      (confidenceDistribution[c.aiConfidence.level] || 0) + 1;
  }

  const categoryReliability = SCORE_KEYS.filter((k) => k !== 'overall').map((category) => {
    const diffs = comparisons.map((c) => Math.abs(c.categoryDifferences[category]));
    return {
      category,
      meanAbsDiff: diffs.length ? Math.round((diffs.reduce((a, b) => a + b, 0) / diffs.length) * 10) / 10 : 0,
    };
  });
  const sortedRel = [...categoryReliability].sort((a, b) => a.meanAbsDiff - b.meanAbsDiff);

  const allFailures = gold.flatMap((g) =>
    g.failedConstitutionRules.map(
      (id) => CONSTITUTION_RULES.find((r) => r.id === id)?.label || id,
    ),
  );
  const mostCommonFailures = frequency(allFailures);

  const byPeriod = new Map<string, { failures: number; total: number }>();
  for (const g of gold) {
    const period = weekKey(g.reviewedAt);
    const row = byPeriod.get(period) || { failures: 0, total: 0 };
    row.total += 1;
    row.failures += g.failedConstitutionRules.length > 0 ? 1 : 0;
    byPeriod.set(period, row);
  }
  const improvementOverTime = [...byPeriod.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, row]) => ({
      period,
      count: row.total,
      failureRate: row.total ? Math.round((row.failures / row.total) * 100) : 0,
    }));

  const failureByIndustry = segmentTopFailure(gold, (g) => g.industry).map((r) => ({
    industry: r.segment,
    topFailure: r.topFailure,
    count: r.count,
  }));
  const failureByBlueprintVersion = segmentTopFailure(gold, (g) => g.blueprintVersion).map(
    (r) => ({
      blueprintVersion: r.segment,
      topFailure: r.topFailure,
      count: r.count,
    }),
  );

  const correlations: CorrelationPair[] = [
    buildCorrelation('story-overall', 'Story vs Overall', gold, 'story', 'overall'),
    buildCorrelation('story-wow', 'Story vs Wow', gold, 'story', 'wow'),
    buildCorrelation(
      'visual-executive',
      'Visual vs Executive Experience',
      gold,
      'visual',
      'executiveExperience',
    ),
    buildCorrelationApproval('originality-approval', 'Originality vs Approval', gold),
  ];

  const recentActivity = [
    ...gold.map((g) => ({
      at: g.reviewedAt,
      kind: 'gold_standard',
      label: `Human review · ${g.client} · ${g.humanReviewer}`,
    })),
    ...comparisons.map((c) => ({
      at: c.createdAt,
      kind: 'ai_human_comparison',
      label: `AI vs Human · ${c.client} · ${c.agreementPercent}% agree`,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 20);

  return {
    datasetHealth: {
      goldCount: gold.length,
      comparisonCount: comparisons.length,
      projectCount: new Set(gold.map((g) => g.projectId)).size,
      industryCount: new Set(gold.map((g) => g.industry)).size,
      multiReviewerBlueprints: computeReviewerAgreementGroups(gold).length,
      importedFromValidation: gold.filter((g) => g.importedFromValidationId).length,
      activeModel: store.activeModel,
    },
    agreementPercent,
    averageScoreDifference,
    confidenceDistribution,
    topReviewerDisagreements: comparisons
      .filter((c) => c.highDisagreementCategories.length > 0 || !c.approvalMatch)
      .sort((a, b) => Math.abs(b.overallDifference) - Math.abs(a.overallDifference))
      .slice(0, 10),
    mostReliableCategories: sortedRel.slice(0, 3),
    leastReliableCategories: [...sortedRel].reverse().slice(0, 3),
    recentActivity,
    comparisons,
    goldStandards: [...gold].reverse(),
    industryBenchmarks: segmentAverages(gold, (g) => g.industry),
    organizationSizeBenchmarks: segmentAverages(gold, (g) => g.organizationSize),
    projectTypeBenchmarks: segmentAverages(gold, (g) => g.projectType),
    reviewerAgreement: computeReviewerAgreementGroups(gold),
    constitution: {
      mostCommonFailures,
      failureFrequency: mostCommonFailures,
      improvementOverTime,
      failureByIndustry,
      failureByBlueprintVersion,
    },
    correlations,
  };
}

function segmentTopFailure(
  gold: GoldStandardHumanReview[],
  keyFn: (g: GoldStandardHumanReview) => string,
): Array<{ segment: string; topFailure: string; count: number }> {
  const map = new Map<string, string[]>();
  for (const g of gold) {
    const key = keyFn(g) || 'Unspecified';
    const fails = g.failedConstitutionRules.map(
      (id) => CONSTITUTION_RULES.find((r) => r.id === id)?.label || id,
    );
    const arr = map.get(key) || [];
    arr.push(...fails);
    map.set(key, arr);
  }
  return [...map.entries()]
    .map(([segment, fails]) => {
      const top = frequency(fails, 1)[0];
      return {
        segment,
        topFailure: top?.label || '—',
        count: top?.count || 0,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
}

function buildCorrelation(
  id: string,
  label: string,
  gold: GoldStandardHumanReview[],
  xKey: keyof ExperienceReviewScores,
  yKey: keyof ExperienceReviewScores,
): CorrelationPair {
  const points = gold.map((g) => ({
    x: g.humanCategoryScores[xKey],
    y: g.humanCategoryScores[yKey],
  }));
  return {
    id,
    label,
    xKey,
    yKey,
    coefficient: pearson(
      points.map((p) => p.x),
      points.map((p) => p.y),
    ),
    points,
  };
}

function buildCorrelationApproval(
  id: string,
  label: string,
  gold: GoldStandardHumanReview[],
): CorrelationPair {
  const points = gold.map((g) => ({
    x: g.humanCategoryScores.originality,
    y: approvalNumeric(g.approvalStatus),
  }));
  return {
    id,
    label,
    xKey: 'originality',
    yKey: 'approvalNumeric',
    coefficient: pearson(
      points.map((p) => p.x),
      points.map((p) => p.y),
    ),
    points,
  };
}

export async function getCalibrationDashboard(): Promise<CalibrationDashboard> {
  const store = await readExperienceDirectorGoldStore();
  return buildCalibrationDashboard(store);
}

/** Pair latest matching validation (AI) entry with a gold standard for comparison. */
export async function compareGoldWithValidationAi(
  goldStandardId: string,
  validationEntryId?: string,
): Promise<AiHumanComparisonRecord | null> {
  const store = await readExperienceDirectorGoldStore();
  const gold = store.goldStandards.find((g) => g.id === goldStandardId);
  if (!gold) return null;

  const validation = await readExperienceDirectorValidationStore();
  const aiEntry = validationEntryId
    ? validation.entries.find((e) => e.id === validationEntryId)
    : [...validation.entries]
        .reverse()
        .find(
          (e) =>
            e.projectId === gold.projectId &&
            (e.blueprintVersion === gold.blueprintVersion ||
              e.blueprintRef === gold.blueprintVersion),
        );

  if (!aiEntry) return null;

  const payload = computeAiHumanComparison({
    gold,
    aiScores: aiEntry.scores,
    aiApprovalStatus: aiEntry.approvalStatus,
    aiAnswers: aiEntry.answers,
    aiImprovements: aiEntry.requiredImprovements,
    aiRationale: aiEntry.rationale,
    validationEntryId: aiEntry.id,
  });

  return appendAiHumanComparison(payload);
}
