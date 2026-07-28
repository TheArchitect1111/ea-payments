/**
 * Simplifi OS Certification — shared types & scoring (permanent release gate).
 *
 * Classification:
 *   CERTIFIED              overall >= 90 and no blocking fails
 *   CERTIFIED WITH WARNINGS overall >= 75 and no blocking fails
 *   NOT CERTIFIED          otherwise
 */

/** @typedef {'PASS'|'FAIL'|'WARNING'|'SKIP'|'BLOCKED'} CheckStatus */
/** @typedef {'functional'|'security'|'performance'|'reliability'|'intelligence'} Subsystem */

/**
 * @typedef {{
 *   id: string,
 *   subsystem: Subsystem,
 *   title: string,
 *   status: CheckStatus,
 *   score: number,
 *   maxScore: number,
 *   blocking: boolean,
 *   evidence: string,
 *   latencyMs?: number,
 *   metrics?: Record<string, number|string|boolean|null>,
 * }} CertCheck
 */

export const SUBSYSTEMS = /** @type {const} */ ([
  'functional',
  'security',
  'performance',
  'reliability',
  'intelligence',
]);

/** Weights for overall 0–100 (sum = 1). */
export const SUBSYSTEM_WEIGHTS = {
  functional: 0.28,
  security: 0.22,
  performance: 0.15,
  reliability: 0.15,
  intelligence: 0.2,
};

/**
 * @param {CertCheck[]} checks
 * @param {Subsystem} subsystem
 */
export function scoreSubsystem(checks, subsystem) {
  const subset = checks.filter((c) => c.subsystem === subsystem);
  if (subset.length === 0) {
    return { score: 0, maxScore: 0, pass: 0, fail: 0, warning: 0, skip: 0, blockingFails: 0 };
  }
  let score = 0;
  let maxScore = 0;
  let pass = 0;
  let fail = 0;
  let warning = 0;
  let skip = 0;
  let blockingFails = 0;
  for (const c of subset) {
    maxScore += c.maxScore;
    if (c.status === 'SKIP') {
      skip += 1;
      // Skipped checks do not count against max for ratio, but reduce available points
      continue;
    }
    score += c.score;
    if (c.status === 'PASS') pass += 1;
    else if (c.status === 'WARNING') warning += 1;
    else if (c.status === 'FAIL' || c.status === 'BLOCKED') {
      fail += 1;
      if (c.blocking) blockingFails += 1;
    }
  }
  const rated = subset.filter((c) => c.status !== 'SKIP');
  const ratedMax = rated.reduce((s, c) => s + c.maxScore, 0);
  const pct = ratedMax > 0 ? Math.round((score / ratedMax) * 1000) / 10 : 0;
  return { score, maxScore: ratedMax, pct, pass, fail, warning, skip, blockingFails };
}

/**
 * @param {CertCheck[]} checks
 */
export function scoreOverall(checks) {
  /** @type {Record<string, ReturnType<typeof scoreSubsystem>>} */
  const bySubsystem = {};
  for (const s of SUBSYSTEMS) {
    bySubsystem[s] = scoreSubsystem(checks, s);
  }

  let weighted = 0;
  let weightUsed = 0;
  for (const s of SUBSYSTEMS) {
    const sub = bySubsystem[s];
    if (sub.maxScore <= 0) continue;
    weighted += sub.pct * SUBSYSTEM_WEIGHTS[s];
    weightUsed += SUBSYSTEM_WEIGHTS[s];
  }
  const overall = weightUsed > 0 ? Math.round((weighted / weightUsed) * 10) / 10 : 0;

  const blockingFails = checks.filter(
    (c) => c.blocking && (c.status === 'FAIL' || c.status === 'BLOCKED'),
  ).length;
  const warnings = checks.filter((c) => c.status === 'WARNING').length;

  /** @type {'CERTIFIED'|'CERTIFIED WITH WARNINGS'|'NOT CERTIFIED'} */
  let classification = 'NOT CERTIFIED';
  if (blockingFails === 0 && overall >= 90) classification = 'CERTIFIED';
  else if (blockingFails === 0 && overall >= 75) classification = 'CERTIFIED WITH WARNINGS';

  return { overall, bySubsystem, blockingFails, warnings, classification };
}

/**
 * @param {Partial<CertCheck> & { id: string, subsystem: Subsystem, title: string, status: CheckStatus }} partial
 * @returns {CertCheck}
 */
export function check(partial) {
  const maxScore = partial.maxScore ?? 10;
  let score = partial.score;
  if (score === undefined) {
    if (partial.status === 'PASS') score = maxScore;
    else if (partial.status === 'WARNING') score = Math.round(maxScore * 0.6);
    else if (partial.status === 'SKIP') score = 0;
    else score = 0;
  }
  return {
    maxScore,
    score,
    blocking: partial.blocking ?? false,
    evidence: partial.evidence ?? '',
    ...partial,
    score,
    maxScore,
  };
}
