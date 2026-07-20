/**
 * Experience Review artifact — output of the Experience Director evaluator.
 * Publish is allowed only when approvalStatus === 'Approved'.
 * Does not generate or deploy experiences.
 */

export const EXPERIENCE_REVIEW_KIND = 'experience_review' as const;
export const EXPERIENCE_REVIEW_SCHEMA_VERSION = 1;

export type ExperienceDirectorApprovalStatus =
  | 'Approved'
  | 'Needs Refinement'
  | 'Rejected';

export type ExperienceReviewScores = {
  overall: number;
  story: number;
  visual: number;
  originality: number;
  executiveExperience: number;
  wow: number;
};

export type ExperienceReviewAnswers = {
  story: boolean;
  originality: boolean;
  swapTest: boolean;
  visualCraftsmanship: boolean;
  storyRhythm: boolean;
  wowFactor: boolean;
  portalExperience: boolean;
};

export type ExperienceReviewData = {
  kind: typeof EXPERIENCE_REVIEW_KIND;
  schemaVersion: number;
  projectId: string;
  blueprintRef: string;
  evaluatedAt: string;
  scores: ExperienceReviewScores;
  answers: ExperienceReviewAnswers;
  requiredImprovements: string[];
  notes?: string;
  approvalStatus: ExperienceDirectorApprovalStatus;
};

export type ExperienceReviewSummary = {
  artifactId: string;
  projectId: string;
  client: string;
  createdAt: string;
  review: ExperienceReviewData;
  canPublish: boolean;
};

function clampScore(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function asBool(v: unknown): boolean {
  return v === true;
}

export function isExperienceDirectorApprovalStatus(
  value: unknown,
): value is ExperienceDirectorApprovalStatus {
  return value === 'Approved' || value === 'Needs Refinement' || value === 'Rejected';
}

export function parseExperienceReviewData(
  raw: unknown,
  fallbacks?: { projectId?: string; blueprintRef?: string },
): ExperienceReviewData | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Record<string, unknown>;
  const scoresRaw = (data.scores && typeof data.scores === 'object' ? data.scores : {}) as Record<
    string,
    unknown
  >;
  const answersRaw = (data.answers && typeof data.answers === 'object' ? data.answers : {}) as Record<
    string,
    unknown
  >;
  const status = data.approvalStatus;
  if (!isExperienceDirectorApprovalStatus(status)) return null;

  const improvements = Array.isArray(data.requiredImprovements)
    ? data.requiredImprovements.map((item) => String(item).trim()).filter(Boolean)
    : [];

  return {
    kind: EXPERIENCE_REVIEW_KIND,
    schemaVersion: Number(data.schemaVersion) || EXPERIENCE_REVIEW_SCHEMA_VERSION,
    projectId: String(data.projectId || fallbacks?.projectId || '').trim(),
    blueprintRef: String(data.blueprintRef || fallbacks?.blueprintRef || '').trim(),
    evaluatedAt: String(data.evaluatedAt || '').trim() || new Date().toISOString(),
    scores: {
      overall: clampScore(scoresRaw.overall),
      story: clampScore(scoresRaw.story),
      visual: clampScore(scoresRaw.visual),
      originality: clampScore(scoresRaw.originality),
      executiveExperience: clampScore(scoresRaw.executiveExperience),
      wow: clampScore(scoresRaw.wow),
    },
    answers: {
      story: asBool(answersRaw.story),
      originality: asBool(answersRaw.originality),
      swapTest: asBool(answersRaw.swapTest),
      visualCraftsmanship: asBool(answersRaw.visualCraftsmanship),
      storyRhythm: asBool(answersRaw.storyRhythm),
      wowFactor: asBool(answersRaw.wowFactor),
      portalExperience: asBool(answersRaw.portalExperience),
    },
    requiredImprovements: improvements,
    notes: data.notes != null ? String(data.notes) : undefined,
    approvalStatus: status,
  };
}

export function canPublishFromExperienceReview(
  review: ExperienceReviewData | null | undefined,
): boolean {
  return review?.approvalStatus === 'Approved';
}

export function assertExperienceDirectorPublishGate(review: ExperienceReviewData | null): {
  ok: boolean;
  error?: string;
  approvalStatus?: ExperienceDirectorApprovalStatus | 'Missing';
} {
  if (!review) {
    return {
      ok: false,
      approvalStatus: 'Missing',
      error:
        'Experience Director has not approved this experience. Run a review and reach Approved before publish.',
    };
  }
  if (review.approvalStatus !== 'Approved') {
    return {
      ok: false,
      approvalStatus: review.approvalStatus,
      error: `Publish blocked — Experience Director status is ${review.approvalStatus}. Only Approved experiences may publish.`,
    };
  }
  return { ok: true, approvalStatus: 'Approved' };
}

export function averageScore(scores: Omit<ExperienceReviewScores, 'overall'>): number {
  const values = [
    scores.story,
    scores.visual,
    scores.originality,
    scores.executiveExperience,
    scores.wow,
  ];
  return clampScore(values.reduce((a, b) => a + b, 0) / values.length);
}

export function deriveApprovalStatus(input: {
  answers: ExperienceReviewAnswers;
  scores: Omit<ExperienceReviewScores, 'overall'>;
  requiredImprovements: string[];
}): ExperienceDirectorApprovalStatus {
  const { answers, scores, requiredImprovements } = input;
  const allYes = Object.values(answers).every(Boolean);
  const overall = averageScore(scores);

  if (!answers.originality || !answers.swapTest || !answers.wowFactor) {
    return 'Rejected';
  }
  if (!allYes || overall < 70 || requiredImprovements.length > 0) {
    return 'Needs Refinement';
  }
  if (overall < 80) {
    return 'Needs Refinement';
  }
  return 'Approved';
}
