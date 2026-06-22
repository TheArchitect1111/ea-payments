import type { SimplifiObject } from './simplifi-objects';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface PriorityScore {
  score: number;
  level: PriorityLevel;
  reasons: string[];
}

function daysUntil(dueDate?: string): number | null {
  if (!dueDate) return null;
  const due = new Date(dueDate).getTime();
  if (Number.isNaN(due)) return null;
  return Math.ceil((due - Date.now()) / (1000 * 60 * 60 * 24));
}

export function computePriorityScore(obj: SimplifiObject): PriorityScore {
  let score = 0;
  const reasons: string[] = [];

  const opp = obj.opportunityScore ?? 0;
  if (opp >= 70) {
    score += 28;
    reasons.push('High opportunity score');
  } else if (opp >= 50) {
    score += 16;
    reasons.push('Solid opportunity momentum');
  }

  if (obj.priority === 'High') {
    score += 18;
    reasons.push('Marked high priority');
  } else if (obj.priority === 'Low') {
    score -= 6;
  }

  const dueIn = daysUntil(obj.dueDate);
  if (dueIn != null) {
    if (dueIn < 0) {
      score += 30;
      reasons.push('Past due date');
    } else if (dueIn <= 3) {
      score += 22;
      reasons.push('Due within 3 days');
    } else if (dueIn <= 7) {
      score += 12;
      reasons.push('Due this week');
    }
  }

  if (obj.savePurpose) {
    score += 8;
    reasons.push('Active Save in play');
  }

  if (obj.status === 'analyzing') {
    score += 14;
    reasons.push('Analysis in progress');
  }

  score = Math.max(0, Math.min(100, score));

  let level: PriorityLevel = 'low';
  if (score >= 75) level = 'critical';
  else if (score >= 55) level = 'high';
  else if (score >= 30) level = 'medium';

  return { score, level, reasons };
}

export function priorityLevelLabel(level: PriorityLevel): string {
  return { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' }[level];
}
