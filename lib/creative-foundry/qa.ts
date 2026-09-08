import type { CreativeQAScore, CreativeQAResult, CreativeSpecification } from "./types";

export const DEFAULT_CREATIVE_QA_THRESHOLD = 8.5;

const WEIGHTS: Record<keyof Omit<CreativeQAScore, "overall">, number> = {
  strategyRelevance: 0.2,
  composition: 0.2,
  brandConsistency: 0.15,
  readability: 0.15,
  emotionalResonance: 0.15,
  technicalQuality: 0.15,
};

export function calculateCreativeOverall(
  score: Omit<CreativeQAScore, "overall">,
): number {
  const total = (Object.keys(WEIGHTS) as Array<keyof typeof WEIGHTS>).reduce(
    (sum, key) => sum + score[key] * WEIGHTS[key],
    0,
  );
  return Math.round(total * 100) / 100;
}

export function runMechanicalCreativeQA(spec: CreativeSpecification): string[] {
  const violations: string[] = [];
  if (!spec.visualDirection.trim()) violations.push("visual-direction-missing");
  if (!spec.layoutFamily.trim()) violations.push("layout-family-missing");
  if (spec.width < 320 || spec.height < 320) violations.push("resolution-too-small");
  if (spec.headline && spec.headline.length > 110) violations.push("headline-too-long");
  if (spec.callToAction && spec.callToAction.length > 80) violations.push("cta-too-long");
  if (spec.format === "short-video" && (!spec.durationSeconds || spec.durationSeconds <= 0)) {
    violations.push("video-duration-missing");
  }
  return violations;
}

export function evaluateCreativeQA(
  spec: CreativeSpecification,
  dimensions: Omit<CreativeQAScore, "overall">,
  recommendations: string[] = [],
  threshold = DEFAULT_CREATIVE_QA_THRESHOLD,
): CreativeQAResult {
  const violations = runMechanicalCreativeQA(spec);
  const overall = calculateCreativeOverall(dimensions);
  const score: CreativeQAScore = { ...dimensions, overall };

  return {
    passed: violations.length === 0 && overall >= threshold,
    threshold,
    score,
    violations,
    recommendations,
  };
}

export function shouldRegenerateCreative(result: CreativeQAResult): boolean {
  return !result.passed;
}
