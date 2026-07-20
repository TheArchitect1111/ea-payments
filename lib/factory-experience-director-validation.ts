/**
 * Experience Director — Phase 1 Validation Framework.
 * Append-only validation log to improve Director quality before automation.
 * Does not register Factory capabilities, change Launch orchestration, or alter publish.
 */
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { computeReviewConfidence } from '@/lib/factory-experience-director-confidence';
import {
  isExperienceDirectorApprovalStatus,
  type ExperienceDirectorApprovalStatus,
  type ExperienceReviewAnswers,
  type ExperienceReviewData,
  type ExperienceReviewScores,
} from '@/lib/factory-experience-review';

export const EXPERIENCE_DIRECTOR_VALIDATION_SCHEMA_VERSION = 1;

export const CONSTITUTION_RULES = [
  { id: 'story', label: 'Storytelling' },
  { id: 'originality', label: 'Originality' },
  { id: 'swapTest', label: 'Swap Test' },
  { id: 'visualCraftsmanship', label: 'Visual Craftsmanship' },
  { id: 'storyRhythm', label: 'Story Rhythm' },
  { id: 'wowFactor', label: 'Wow Factor' },
  { id: 'portalExperience', label: 'Portal Experience' },
] as const;

export type ConstitutionRuleId = (typeof CONSTITUTION_RULES)[number]['id'];

export type ExperienceDirectorValidationEntry = {
  id: string;
  schemaVersion: number;
  validationMode: true;
  projectId: string;
  client: string;
  industry: string;
  artifactId?: string;
  blueprintVersion: string;
  blueprintRef: string;
  reviewedAt: string;
  reviewer: string;
  approvalStatus: ExperienceDirectorApprovalStatus;
  scores: ExperienceReviewScores;
  answers: ExperienceReviewAnswers;
  requiredImprovements: string[];
  rationale: string;
  failedConstitutionRules: ConstitutionRuleId[];
  rejectionReasons: string[];
  confidence?: {
    level: 'Very High' | 'High' | 'Medium' | 'Low';
    score: number;
    reasons: string[];
  };
};

export type ExperienceDirectorValidationStore = {
  version: number;
  updatedAt: string;
  entries: ExperienceDirectorValidationEntry[];
};

export type FrequencyRow = { label: string; count: number };

export type ScoreAverages = {
  overall: number;
  story: number;
  visual: number;
  originality: number;
  executiveExperience: number;
  wow: number;
};

export type TrendPoint = {
  period: string;
  count: number;
  averageOverall: number;
};

export type IndustryScoreRow = {
  industry: string;
  count: number;
  averageOverall: number;
  averages: ScoreAverages;
};

export type ExperienceDirectorValidationAnalytics = {
  reviewCount: number;
  projectCount: number;
  averages: ScoreAverages;
  statusCounts: Record<ExperienceDirectorApprovalStatus, number>;
  mostCommonRejectionReasons: FrequencyRow[];
  mostCommonRequiredImprovements: FrequencyRow[];
  constitutionRulesFailingMost: FrequencyRow[];
  trends: {
    improvingOverTime: boolean | null;
    trendDelta: number | null;
    byPeriod: TrendPoint[];
    weakestCategories: Array<{ category: keyof ScoreAverages; average: number }>;
    industriesScoringLower: IndustryScoreRow[];
  };
  entries: ExperienceDirectorValidationEntry[];
};

const DEFAULT_STORE: ExperienceDirectorValidationStore = {
  version: 0,
  updatedAt: '',
  entries: [],
};

const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'experience-director-validation.json')
  : path.join(
      /* turbopackIgnore: true */ process.cwd(),
      '.data',
      'experience-director-validation.json',
    );

/** Serialize appends so concurrent writes cannot drop entries. */
let appendChain: Promise<unknown> = Promise.resolve();

function clamp(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return clamp(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function normalizeScores(raw: unknown): ExperienceReviewScores {
  const s = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    overall: clamp(s.overall),
    story: clamp(s.story),
    visual: clamp(s.visual),
    originality: clamp(s.originality),
    executiveExperience: clamp(s.executiveExperience),
    wow: clamp(s.wow),
  };
}

function normalizeAnswers(raw: unknown): ExperienceReviewAnswers {
  const a = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    story: a.story === true,
    originality: a.originality === true,
    swapTest: a.swapTest === true,
    visualCraftsmanship: a.visualCraftsmanship === true,
    storyRhythm: a.storyRhythm === true,
    wowFactor: a.wowFactor === true,
    portalExperience: a.portalExperience === true,
  };
}

function scoreAveragesFrom(entries: ExperienceDirectorValidationEntry[]): ScoreAverages {
  return {
    overall: avg(entries.map((e) => e.scores.overall)),
    story: avg(entries.map((e) => e.scores.story)),
    visual: avg(entries.map((e) => e.scores.visual)),
    originality: avg(entries.map((e) => e.scores.originality)),
    executiveExperience: avg(entries.map((e) => e.scores.executiveExperience)),
    wow: avg(entries.map((e) => e.scores.wow)),
  };
}

function frequency(items: string[], limit = 12): FrequencyRow[] {
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

function ruleLabel(id: ConstitutionRuleId): string {
  return CONSTITUTION_RULES.find((r) => r.id === id)?.label || id;
}

export function failedConstitutionRulesFromAnswers(
  answers: ExperienceReviewAnswers,
): ConstitutionRuleId[] {
  return CONSTITUTION_RULES.filter((rule) => !answers[rule.id]).map((rule) => rule.id);
}

export function buildDirectorRationale(input: {
  approvalStatus: ExperienceDirectorApprovalStatus;
  scores: ExperienceReviewScores;
  failedRules: ConstitutionRuleId[];
  requiredImprovements: string[];
}): string {
  const failedLabels = input.failedRules.map(ruleLabel).join(', ');
  const extras = input.requiredImprovements.slice(0, 3).join(' ');

  if (input.approvalStatus === 'Approved') {
    return `Approved. Overall ${input.scores.overall}/100. Constitution checks passed; craftsmanship bar cleared.`;
  }
  if (input.approvalStatus === 'Rejected') {
    return `Rejected. Overall ${input.scores.overall}/100. Failed critical constitution checks: ${
      failedLabels || 'originality / swap test / wow'
    }. ${extras}`.trim();
  }
  return `Needs refinement. Overall ${input.scores.overall}/100. Weak areas: ${
    failedLabels || 'see required improvements'
  }. ${extras}`.trim();
}

export function rejectionReasonsFromEntry(input: {
  approvalStatus: ExperienceDirectorApprovalStatus;
  failedRules: ConstitutionRuleId[];
  requiredImprovements: string[];
}): string[] {
  if (input.approvalStatus !== 'Rejected') return [];
  const reasons = input.failedRules.map(ruleLabel);
  return reasons.length ? reasons : input.requiredImprovements.slice(0, 5);
}

function normalizeConfidence(
  raw: unknown,
): ExperienceDirectorValidationEntry['confidence'] | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const c = raw as Record<string, unknown>;
  const level = c.level;
  if (level !== 'Very High' && level !== 'High' && level !== 'Medium' && level !== 'Low') {
    return undefined;
  }
  return {
    level,
    score: clamp(c.score),
    reasons: Array.isArray(c.reasons)
      ? c.reasons.map((r) => String(r).trim()).filter(Boolean)
      : [],
  };
}

function normalizeEntry(
  raw: Partial<ExperienceDirectorValidationEntry>,
): ExperienceDirectorValidationEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.projectId || !isExperienceDirectorApprovalStatus(raw.approvalStatus)) return null;

  const answers = normalizeAnswers(raw.answers);
  const scores = normalizeScores(raw.scores);
  const requiredImprovements = Array.isArray(raw.requiredImprovements)
    ? raw.requiredImprovements.map((item) => String(item).trim()).filter(Boolean)
    : [];

  const failed =
    Array.isArray(raw.failedConstitutionRules) && raw.failedConstitutionRules.length
      ? raw.failedConstitutionRules.filter((id): id is ConstitutionRuleId =>
          CONSTITUTION_RULES.some((rule) => rule.id === id),
        )
      : failedConstitutionRulesFromAnswers(answers);

  const rationale =
    String(raw.rationale || '').trim() ||
    buildDirectorRationale({
      approvalStatus: raw.approvalStatus,
      scores,
      failedRules: failed,
      requiredImprovements,
    });

  const rejectionReasons = Array.isArray(raw.rejectionReasons)
    ? raw.rejectionReasons.map((item) => String(item).trim()).filter(Boolean)
    : rejectionReasonsFromEntry({
        approvalStatus: raw.approvalStatus,
        failedRules: failed,
        requiredImprovements,
      });

  const reviewedAtRaw = String(raw.reviewedAt || '').trim();
  const reviewedAt =
    reviewedAtRaw && !Number.isNaN(new Date(reviewedAtRaw).getTime())
      ? reviewedAtRaw
      : new Date().toISOString();

  return {
    id: String(raw.id || `xd-val-${crypto.randomBytes(4).toString('hex')}`),
    schemaVersion: Number(raw.schemaVersion) || EXPERIENCE_DIRECTOR_VALIDATION_SCHEMA_VERSION,
    validationMode: true,
    projectId: String(raw.projectId).trim(),
    client: String(raw.client || raw.projectId).trim() || String(raw.projectId),
    industry: String(raw.industry || 'Unspecified').trim() || 'Unspecified',
    artifactId: raw.artifactId ? String(raw.artifactId) : undefined,
    blueprintVersion: String(raw.blueprintVersion || raw.blueprintRef || 'unknown'),
    blueprintRef: String(raw.blueprintRef || raw.blueprintVersion || 'unknown'),
    reviewedAt,
    reviewer: String(raw.reviewer || 'Experience Director').trim() || 'Experience Director',
    approvalStatus: raw.approvalStatus,
    scores,
    answers,
    requiredImprovements,
    rationale,
    failedConstitutionRules: failed,
    rejectionReasons,
    confidence: normalizeConfidence(raw.confidence),
  };
}

function normalizeStore(
  raw: Partial<ExperienceDirectorValidationStore>,
): ExperienceDirectorValidationStore {
  const entries = Array.isArray(raw.entries)
    ? (raw.entries.map((e) => normalizeEntry(e)).filter(Boolean) as ExperienceDirectorValidationEntry[])
    : [];
  return {
    version: Number(raw.version) || 0,
    updatedAt: String(raw.updatedAt || ''),
    entries,
  };
}

async function quarantineCorruptStore(err: unknown): Promise<void> {
  try {
    const stamp = Date.now();
    await rename(STORE_FILE, `${STORE_FILE}.corrupt.${stamp}`);
    console.error(
      '[experience-director-validation] quarantined corrupt store:',
      err instanceof Error ? err.message : err,
    );
  } catch {
    // ignore quarantine failures (missing file, permissions)
  }
}

export async function readExperienceDirectorValidationStore(): Promise<ExperienceDirectorValidationStore> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    try {
      return normalizeStore(JSON.parse(raw) as Partial<ExperienceDirectorValidationStore>);
    } catch (parseErr) {
      await quarantineCorruptStore(parseErr);
      return structuredClone(DEFAULT_STORE);
    }
  } catch (err) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
    if (code === 'ENOENT') return structuredClone(DEFAULT_STORE);
    throw err;
  }
}

async function writeStoreAtomic(data: ExperienceDirectorValidationStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  const payload = `${JSON.stringify(data, null, 2)}\n`;
  const tmp = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, payload, 'utf8');
  try {
    await rename(tmp, STORE_FILE);
  } catch {
    // Windows cannot rename over an existing file — replace in place after temp write.
    await writeFile(STORE_FILE, payload, 'utf8');
    await unlink(tmp).catch(() => undefined);
  }
}

export async function appendExperienceDirectorValidationEntry(
  input: Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'> & {
    id?: string;
  },
): Promise<ExperienceDirectorValidationEntry> {
  const run = async () => {
    const entry = normalizeEntry({
      ...input,
      id: input.id || `xd-val-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
      schemaVersion: EXPERIENCE_DIRECTOR_VALIDATION_SCHEMA_VERSION,
      validationMode: true,
    });
    if (!entry) {
      throw new Error('Invalid validation entry — projectId, scores, answers, and approvalStatus are required.');
    }

    const store = await readExperienceDirectorValidationStore();
    store.entries.push(entry);
    store.version += 1;
    store.updatedAt = new Date().toISOString();
    await writeStoreAtomic(store);
    return entry;
  };

  const queued = appendChain.then(run, run);
  appendChain = queued.then(
    () => undefined,
    () => undefined,
  );
  return queued;
}

export function buildValidationAnalytics(
  entries: ExperienceDirectorValidationEntry[],
): ExperienceDirectorValidationAnalytics {
  const list = [...entries].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
  const averages = scoreAveragesFrom(list);

  const statusCounts: Record<ExperienceDirectorApprovalStatus, number> = {
    Approved: 0,
    'Needs Refinement': 0,
    Rejected: 0,
  };
  for (const e of list) {
    statusCounts[e.approvalStatus] += 1;
  }

  const byPeriodMap = new Map<string, number[]>();
  for (const e of list) {
    const key = weekKey(e.reviewedAt);
    const arr = byPeriodMap.get(key) || [];
    arr.push(e.scores.overall);
    byPeriodMap.set(key, arr);
  }
  const byPeriod: TrendPoint[] = [...byPeriodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, scores]) => ({
      period,
      count: scores.length,
      averageOverall: avg(scores),
    }));

  let improvingOverTime: boolean | null = null;
  let trendDelta: number | null = null;
  if (byPeriod.length >= 2) {
    trendDelta = byPeriod[byPeriod.length - 1].averageOverall - byPeriod[0].averageOverall;
    improvingOverTime = trendDelta === 0 ? null : trendDelta > 0;
  }

  const weakestCategories = (Object.keys(averages) as Array<keyof ScoreAverages>)
    .filter((key) => key !== 'overall')
    .map((category) => ({ category, average: averages[category] }))
    .sort((a, b) => a.average - b.average);

  const industryMap = new Map<string, ExperienceDirectorValidationEntry[]>();
  for (const e of list) {
    const key = e.industry || 'Unspecified';
    const arr = industryMap.get(key) || [];
    arr.push(e);
    industryMap.set(key, arr);
  }
  const industriesScoringLower: IndustryScoreRow[] = [...industryMap.entries()]
    .map(([industry, rows]) => {
      const rowAverages = scoreAveragesFrom(rows);
      return {
        industry,
        count: rows.length,
        averageOverall: rowAverages.overall,
        averages: rowAverages,
      };
    })
    .sort((a, b) => a.averageOverall - b.averageOverall || b.count - a.count);

  return {
    reviewCount: list.length,
    projectCount: new Set(list.map((e) => e.projectId)).size,
    averages,
    statusCounts,
    mostCommonRejectionReasons: frequency(list.flatMap((e) => e.rejectionReasons)),
    mostCommonRequiredImprovements: frequency(list.flatMap((e) => e.requiredImprovements)),
    constitutionRulesFailingMost: frequency(
      list.flatMap((e) => e.failedConstitutionRules.map(ruleLabel)),
    ),
    trends: {
      improvingOverTime,
      trendDelta,
      byPeriod,
      weakestCategories,
      industriesScoringLower,
    },
    entries: [...list].reverse(),
  };
}

export async function getExperienceDirectorValidationAnalytics(): Promise<ExperienceDirectorValidationAnalytics> {
  const store = await readExperienceDirectorValidationStore();
  return buildValidationAnalytics(store.entries);
}

/** Append a validation entry and return analytics from the updated in-memory list (one store read). */
export async function appendValidationEntryAndAnalytics(
  input: Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'> & {
    id?: string;
  },
): Promise<{ entry: ExperienceDirectorValidationEntry; analytics: ExperienceDirectorValidationAnalytics }> {
  const entry = await appendExperienceDirectorValidationEntry(input);
  const store = await readExperienceDirectorValidationStore();
  return { entry, analytics: buildValidationAnalytics(store.entries) };
}

export async function listValidationEntriesForComparison(
  ids?: string[],
): Promise<ExperienceDirectorValidationEntry[]> {
  const store = await readExperienceDirectorValidationStore();
  if (!ids?.length) return [...store.entries].reverse();
  const set = new Set(ids);
  return store.entries.filter((e) => set.has(e.id)).reverse();
}

export function createValidationEntryFromReview(input: {
  projectId: string;
  client: string;
  industry?: string;
  artifactId?: string;
  blueprintVersion?: string;
  review: ExperienceReviewData;
  reviewer: string;
  rationale?: string;
}): Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'> {
  const answers = normalizeAnswers(input.review.answers);
  const scores = normalizeScores(input.review.scores);
  const failed = failedConstitutionRulesFromAnswers(answers);
  const requiredImprovements = Array.isArray(input.review.requiredImprovements)
    ? input.review.requiredImprovements.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const rationale =
    input.rationale?.trim() ||
    buildDirectorRationale({
      approvalStatus: input.review.approvalStatus,
      scores,
      failedRules: failed,
      requiredImprovements,
    });

  return {
    projectId: input.projectId,
    client: input.client,
    industry: input.industry?.trim() || 'Unspecified',
    artifactId: input.artifactId,
    blueprintVersion:
      input.blueprintVersion || input.review.blueprintRef || `blueprint:${input.projectId}`,
    blueprintRef: input.review.blueprintRef,
    reviewedAt: input.review.evaluatedAt || new Date().toISOString(),
    reviewer: input.reviewer.trim() || 'Experience Director',
    approvalStatus: input.review.approvalStatus,
    scores,
    answers,
    requiredImprovements,
    rationale,
    failedConstitutionRules: failed,
    rejectionReasons: rejectionReasonsFromEntry({
      approvalStatus: input.review.approvalStatus,
      failedRules: failed,
      requiredImprovements,
    }),
    confidence: computeReviewConfidence({
      scores,
      answers,
      requiredImprovements,
      rationale,
    }),
  };
}
