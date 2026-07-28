import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * @param {string} certRoot
 */
export function ensureCertDirs(certRoot) {
  mkdirSync(join(certRoot, 'history'), { recursive: true });
}

/**
 * @param {string} certRoot
 * @param {object} report
 */
export function persistCertReport(certRoot, report) {
  ensureCertDirs(certRoot);
  const stamp = report.metadata.timestamp.replace(/[-:.]/g, '').replace('T', 'T').slice(0, 15);
  const sha = report.metadata.git.short || 'nosha';
  const fileName = `cert-${stamp}-${sha}.json`;
  const historyPath = join(certRoot, 'history', fileName);
  const latestPath = join(certRoot, 'latest.json');
  const payload = JSON.stringify(report, null, 2);
  writeFileSync(historyPath, payload);
  writeFileSync(latestPath, payload);
  return { historyPath, latestPath, fileName };
}

/**
 * @param {string} certRoot
 * @param {number} [limit]
 */
export function loadCertHistory(certRoot, limit = 20) {
  const dir = join(certRoot, 'history');
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.startsWith('cert-') && f.endsWith('.json'))
    .sort()
    .reverse()
    .slice(0, limit);
  return files.map((f) => {
    try {
      return JSON.parse(readFileSync(join(dir, f), 'utf8'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

/**
 * Compare current overall score to previous latest (excluding current write).
 * @param {object[]} history
 * @param {number} currentOverall
 */
export function detectRegression(history, currentOverall) {
  if (!history || history.length < 2) {
    return { hasRegression: false, delta: 0, previous: null };
  }
  // history[0] is current after persist; use history[1]
  const previous = history[1];
  const prevScore = previous?.scores?.overall;
  if (typeof prevScore !== 'number') {
    return { hasRegression: false, delta: 0, previous: null };
  }
  const delta = Math.round((currentOverall - prevScore) * 10) / 10;
  return {
    hasRegression: delta <= -5,
    delta,
    previous: {
      timestamp: previous.metadata?.timestamp,
      overall: prevScore,
      classification: previous.scores?.classification,
      git: previous.metadata?.git?.short,
    },
  };
}
