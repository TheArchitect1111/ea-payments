/**
 * Experience Director — Phase 1 Validation Framework.
 * Append-only validation log to improve Director quality before automation.
 * Does not register Factory capabilities, change Launch orchestration, or alter publish.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
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
  /** Always true for Phase 1 validation workflow entries */
  validationMode: true;
  projectId: string;
  client: string;
  industry: string;
  artifactId?: string;
  /** Experience Blueprint / website_site version reference */
  blueprintVersion: string;
  blueprintRef: string;
  reviewedAt: string;
  reviewer: string;
  approvalStatus: ExperienceDirectorApprovalStatus;
  scores: ExperienceReviewScores;
  answers: ExperienceReviewAnswers;
  requiredImprovements: string[];
  /** Written rationale (human and/or Director-generated) */
  rationale: string;
  /** Constitution rules that failed on this review */
  failedConstitutionRules: ConstitutionRuleId[];
  rejectionReasons: string[];
  /** Phase 2 — AI review confidence (does not affect scores or publish) */
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

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return clamp(nums.reduce((a, b) => a + b, 0) / nums.length);
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

export function failedConstitutionRulesFromAnswers(
  answers: ExperienceReviewAnswers,
): ConstitutionRuleId[] {
  const failed: ConstitutionRuleId[] = [];
  for (const rule of CONSTITUTION_RULES) {
    if (!answers[rule.id]) failed.push(rule.id);
  }
  return failed;
}

export function buildDirectorRationale(input: {
  approvalStatus: ExperienceDirectorApprovalStatus;
  scores: ExperienceReviewScores;
  failedRules: ConstitutionRuleId[];
  requiredImprovements: string[];
}): string {
  const failedLabels = input.failedRules
    .map((id) => CONSTITUTION_RULES.find((r) => r.id === id)?.label || id)
    .join(', ');

  if (input.approvalStatus === 'Approved') {
    return `Approved. Overall ${input.scores.overall}/100. Constitution checks passed; craftsmanship bar cleared.`;
  }
  if (input.approvalStatus === 'Rejected') {
    return `Rejected. Overall ${input.scores.overall}/100. Failed critical constitution checks: ${
      failedLabels || 'originality / swap test / wow'
    }. ${input.requiredImprovements.slice(0, 3).join(' ')}`.trim();
  }
  return `Needs refinement. Overall ${input.scores.overall}/100. Weak areas: ${
    failedLabels || 'see required improvements'
  }. ${input.requiredImprovements.slice(0, 3).join(' ')}`.trim();
}

export function rejectionReasonsFromEntry(input: {
  approvalStatus: ExperienceDirectorApprovalStatus;
  failedRules: ConstitutionRuleId[];
  requiredImprovements: string[];
}): string[] {
  if (input.approvalStatus !== 'Rejected') return [];
  const reasons = input.failedRules.map(
    (id) => CONSTITUTION_RULES.find((r) => r.id === id)?.label || id,
  );
  if (reasons.length) return reasons;
  return input.requiredImprovements.slice(0, 5);
}

function normalizeEntry(raw: Partial<ExperienceDirectorValidationEntry>): ExperienceDirectorValidationEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.projectId || !raw.scores || !raw.answers || !raw.approvalStatus) return null;
  const failed =
    Array.isArray(raw.failedConstitutionRules) && raw.failedConstitutionRules.length
      ? (raw.failedConstitutionRules as ConstitutionRuleId[])
      : failedConstitutionRulesFromAnswers(raw.answers as ExperienceReviewAnswers);

  return {
    id: String(raw.id || `xd-val-${crypto.randomBytes(4).toString('hex')}`),
    schemaVersion: Number(raw.schemaVersion) || EXPERIENCE_DIRECTOR_VALIDATION_SCHEMA_VERSION,
    validationMode: true,
    projectId: String(raw.projectId),
    client: String(raw.client || raw.projectId),
    industry: String(raw.industry || 'Unspecified').trim() || 'Unspecified',
    artifactId: raw.artifactId ? String(raw.artifactId) : undefined,
    blueprintVersion: String(raw.blueprintVersion || raw.blueprintRef || 'unknown'),
    blueprintRef: String(raw.blueprintRef || raw.blueprintVersion || 'unknown'),
    reviewedAt: String(raw.reviewedAt || new Date().toISOString()),
    reviewer: String(raw.reviewer || 'Experience Director').trim() || 'Experience Director',
    approvalStatus: raw.approvalStatus as ExperienceDirectorApprovalStatus,
    scores: raw.scores as ExperienceReviewScores,
    answers: raw.answers as ExperienceReviewAnswers,
    requiredImprovements: Array.isArray(raw.requiredImprovements)
      ? raw.requiredImprovements.map(String)
      : [],
    rationale: String(raw.rationale || '').trim(),
    failedConstitutionRules: failed,
    rejectionReasons: Array.isArray(raw.rejectionReasons)
      ? raw.rejectionReasons.map(String)
      : rejectionReasonsFromEntry({
          approvalStatus: raw.approvalStatus as ExperienceDirectorApprovalStatus,
          failedRules: failed,
          requiredImprovements: Array.isArray(raw.requiredImprovements)
            ? raw.requiredImprovements.map(String)
            : [],
        }),
    confidence:
      raw.confidence && typeof raw.confidence === 'object'
        ? (raw.confidence as ExperienceDirectorValidationEntry['confidence'])
        : undefined,
  };
}

function normalizeStore(raw: Partial<ExperienceDirectorValidationStore>): ExperienceDirectorValidationStore {
  const entries = Array.isArray(raw.entries)
    ? raw.entries.map((e) => normalizeEntry(e)).filter(Boolean) as ExperienceDirectorValidationEntry[]
    : [];
  return {
    version: Number(raw.version) || 0,
    updatedAt: String(raw.updatedAt || ''),
    entries,
  };
}

export async function readExperienceDirectorValidationStore(): Promise<ExperienceDirectorValidationStore> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<ExperienceDirectorValidationStore>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

async function writeStore(data: ExperienceDirectorValidationStore): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function appendExperienceDirectorValidationEntry(
  input: Omit<ExperienceDirectorValidationEntry, 'id' | 'schemaVersion' | 'validationMode'> & {
    id?: string;
  },
): Promise<ExperienceDirectorValidationEntry> {
  const failed =
    input.failedConstitutionRules?.length > 0
      ? input.failedConstitutionRules
      : failedConstitutionRulesFromAnswers(input.answers);

  const entry = normalizeEntry({
    ...input,
    id: input.id || `xd-val-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`,
    schemaVersion: EXPERIENCE_DIRECTOR_VALIDATION_SCHEMA_VERSION,
    validationMode: true,
    failedConstitutionRules: failed,
    rejectionReasons:
      input.rejectionReasons?.length > 0
        ? input.rejectionReasons
        : rejectionReasonsFromEntry({
            approvalStatus: input.approvalStatus,
            failedRules: failed,
            requiredImprovements: input.requiredImprovements || [],
          }),
    rationale:
      input.rationale?.trim() ||
      buildDirectorRationale({
        approvalStatus: input.approvalStatus,
        scores: input.scores,
        failedRules: failed,
        requiredImprovements: input.requiredImprovements || [],
      }),
  });

  if (!entry) {
    throw new Error('Invalid validation entry');
  }

  const store = await readExperienceDirectorValidationStore();
  store.entries.push(entry);
  store.version += 1;
  store.updatedAt = new Date().toISOString();
  await writeStore(store);
  return entry;
}

export function buildValidationAnalytics(
  entries: ExperienceDirectorValidationEntry[],
): ExperienceDirectorValidationAnalytics {
  const list = [...entries].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));

  const averages: ScoreAverages = {
    overall: avg(list.map((e) => e.scores.overall)),
    story: avg(list.map((e) => e.scores.story)),
    visual: avg(list.map((e) => e.scores.visual)),
    originality: avg(list.map((e) => e.scores.originality)),
    executiveExperience: avg(list.map((e) => e.scores.executiveExperience)),
    wow: avg(list.map((e) => e.scores.wow)),
  };

  const statusCounts: Record<ExperienceDirectorApprovalStatus, number> = {
    Approved: 0,
    'Needs Refinement': 0,
    Rejected: 0,
  };
  for (const e of list) {
    statusCounts[e.approvalStatus] = (statusCounts[e.approvalStatus] || 0) + 1;
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
    const first = byPeriod[0].averageOverall;
    const last = byPeriod[byPeriod.length - 1].averageOverall;
    trendDelta = last - first;
    improvingOverTime = trendDelta > 0;
  }

  const weakestCategories = (
    Object.entries(averages) as Array<[keyof ScoreAverages, number]>
  )
    .filter(([key]) => key !== 'overall')
    .map(([category, average]) => ({ category, average }))
    .sort((a, b) => a.average - b.average);

  const industryMap = new Map<string, ExperienceDirectorValidationEntry[]>();
  for (const e of list) {
    const key = e.industry || 'Unspecified';
    const arr = industryMap.get(key) || [];
    arr.push(e);
    industryMap.set(key, arr);
  }
  const industriesScoringLower: IndustryScoreRow[] = [...industryMap.entries()]
    .map(([industry, rows]) => ({
      industry,
      count: rows.length,
      averageOverall: avg(rows.map((r) => r.scores.overall)),
      averages: {
        overall: avg(rows.map((r) => r.scores.overall)),
        story: avg(rows.map((r) => r.scores.story)),
        visual: avg(rows.map((r) => r.scores.visual)),
        originality: avg(rows.map((r) => r.scores.originality)),
        executiveExperience: avg(rows.map((r) => r.scores.executiveExperience)),
        wow: avg(rows.map((r) => r.scores.wow)),
      },
    }))
    .sort((a, b) => a.averageOverall - b.averageOverall || b.count - a.count);

  const ruleCounts = frequency(
    list.flatMap((e) =>
      e.failedConstitutionRules.map(
        (id) => CONSTITUTION_RULES.find((r) => r.id === id)?.label || id,
      ),
    ),
  );

  return {
    reviewCount: list.length,
    projectCount: new Set(list.map((e) => e.projectId)).size,
    averages,
    statusCounts,
    mostCommonRejectionReasons: frequency(list.flatMap((e) => e.rejectionReasons)),
    mostCommonRequiredImprovements: frequency(list.flatMap((e) => e.requiredImprovements)),
    constitutionRulesFailingMost: ruleCounts,
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
  const failed = failedConstitutionRulesFromAnswers(input.review.answers);
  const requiredImprovements = input.review.requiredImprovements || [];
  const rationale =
    input.rationale?.trim() ||
    buildDirectorRationale({
      approvalStatus: input.review.approvalStatus,
      scores: input.review.scores,
      failedRules: failed,
      requiredImprovements,
    });

  return {
    projectId: input.projectId,
    client: input.client,
    industry: input.industry?.trim() || 'Unspecified',
    artifactId: input.artifactId,
    blueprintVersion:
      input.blueprintVersion ||
      input.review.blueprintRef ||
      `blueprint:${input.projectId}`,
    blueprintRef: input.review.blueprintRef,
    reviewedAt: input.review.evaluatedAt || new Date().toISOString(),
    reviewer: input.reviewer.trim() || 'Experience Director',
    approvalStatus: input.review.approvalStatus,
    scores: input.review.scores,
    answers: input.review.answers,
    requiredImprovements,
    rationale,
    failedConstitutionRules: failed,
    rejectionReasons: rejectionReasonsFromEntry({
      approvalStatus: input.review.approvalStatus,
      failedRules: failed,
      requiredImprovements,
    }),
  };
}
