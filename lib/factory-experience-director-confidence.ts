/**
 * Experience Director review confidence — Phase 2.
 * Pure helper; does not change scores, approval, publish, or Launch.
 */
import {
  CONSTITUTION_RULES,
  failedConstitutionRulesFromAnswers,
} from '@/lib/factory-experience-director-validation';
import type {
  ExperienceReviewAnswers,
  ExperienceReviewScores,
} from '@/lib/factory-experience-review';

export type ReviewConfidenceLevel = 'Very High' | 'High' | 'Medium' | 'Low';

export type ReviewConfidence = {
  level: ReviewConfidenceLevel;
  score: number;
  reasons: string[];
};

function clamp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Confidence for an AI review — does not change scores or approval.
 * Based on category consistency, rule certainty, violation count, evidence strength.
 */
export function computeReviewConfidence(input: {
  scores: ExperienceReviewScores;
  answers: ExperienceReviewAnswers;
  requiredImprovements?: string[];
  rationale?: string;
}): ReviewConfidence {
  const reasons: string[] = [];
  const categoryScores = [
    input.scores.story,
    input.scores.visual,
    input.scores.originality,
    input.scores.executiveExperience,
    input.scores.wow,
  ];
  const mean = categoryScores.reduce((a, b) => a + b, 0) / categoryScores.length;
  const variance =
    categoryScores.reduce((a, b) => a + (b - mean) ** 2, 0) / categoryScores.length;
  const stdev = Math.sqrt(variance);

  let score = 100;

  if (stdev <= 8) {
    reasons.push('Category scores are consistent (low spread).');
  } else if (stdev <= 15) {
    reasons.push('Moderate spread across category scores.');
    score -= 12;
  } else {
    reasons.push('High inconsistency across category scores.');
    score -= 28;
  }

  const failed = failedConstitutionRulesFromAnswers(input.answers);
  const passCount = CONSTITUTION_RULES.length - failed.length;
  const ruleCertainty = passCount / CONSTITUTION_RULES.length;
  if (ruleCertainty >= 0.85) {
    reasons.push('High rule certainty — most Constitution checks passed.');
  } else if (ruleCertainty >= 0.5) {
    reasons.push('Mixed rule certainty — several Constitution checks failed.');
    score -= 15;
  } else {
    reasons.push('Low rule certainty — many Constitution violations.');
    score -= 30;
  }

  if (failed.length === 0) {
    reasons.push('No Constitution violations detected.');
  } else if (failed.length <= 2) {
    reasons.push(`${failed.length} Constitution violation(s).`);
    score -= 8 * failed.length;
  } else {
    reasons.push(`${failed.length} Constitution violations weaken confidence.`);
    score -= 10 + failed.length * 6;
  }

  const evidenceBits =
    (input.rationale && input.rationale.trim().length >= 40 ? 1 : 0) +
    (Array.isArray(input.requiredImprovements) && input.requiredImprovements.length > 0 ? 1 : 0) +
    (input.scores.overall > 0 ? 1 : 0);
  if (evidenceBits >= 3) {
    reasons.push('Strong detected evidence (rationale + improvements + scores).');
  } else if (evidenceBits === 2) {
    reasons.push('Moderate evidence strength.');
    score -= 8;
  } else {
    reasons.push('Limited detected evidence.');
    score -= 18;
  }

  score = clamp(score);
  let level: ReviewConfidenceLevel;
  if (score >= 85) level = 'Very High';
  else if (score >= 70) level = 'High';
  else if (score >= 50) level = 'Medium';
  else level = 'Low';

  reasons.unshift(`Confidence ${level} (${score}/100).`);
  return { level, score, reasons };
}
