import type { SimplifiObject } from './simplifi-objects';
import type { PriorityScore } from './priority-engine';

export type EvaluationVerdict = 'Pursue' | 'Review' | 'Monitor' | 'Pass';

export interface EvaluationSummary {
  whatThisIs: string;
  verdict: EvaluationVerdict;
  whyItMatters: string[];
  nextMove: string;
  nextSteps: string[];
}

function plainType(type: SimplifiObject['type']): string {
  const normalized = String(type || 'item').replace(/[-_]/g, ' ').trim().toLowerCase();
  return normalized || 'item';
}

function verdictFor(obj: SimplifiObject, priority: PriorityScore): EvaluationVerdict {
  if (obj.outcomeStatus === 'passed' || obj.status === 'archived') return 'Pass';
  if (obj.priority === 'High' || (obj.opportunityScore ?? 0) >= 70 || priority.level === 'critical') {
    return 'Pursue';
  }
  if ((obj.opportunityScore ?? 0) >= 50 || obj.dueDate || obj.savePurpose) return 'Review';
  return 'Monitor';
}

export function buildEvaluationSummary(
  obj: SimplifiObject,
  priority: PriorityScore,
): EvaluationSummary {
  const verdict = verdictFor(obj, priority);
  const type = plainType(obj.type);
  const whatThisIs = `${obj.title} is a saved ${type} being evaluated for its value to this EA project.`;
  const whyItMatters = priority.reasons.slice(0, 3);

  if (whyItMatters.length === 0) {
    whyItMatters.push(
      obj.opportunityScore != null
        ? `Simplifi scored its opportunity potential at ${obj.opportunityScore} out of 100.`
        : 'It was saved for review, but no urgent signal has been identified.',
    );
  }

  const nextMove = obj.nextAction || 'Review this item and decide whether to pursue it.';
  const nextStepsByVerdict: Record<EvaluationVerdict, string[]> = {
    Pursue: [
      nextMove,
      'Confirm the source and project fit.',
      'Set the owner and follow-up date.',
    ],
    Review: [
      nextMove,
      'Confirm that this is a real opportunity for the project.',
      'Choose Pursue, Monitor, or Pass.',
    ],
    Monitor: [
      'Confirm that this item is worth tracking.',
      'Set a follow-up date if more information is expected.',
      'Pass or archive it if no action is needed.',
    ],
    Pass: [
      'Confirm that no further action is needed.',
      'Archive the item.',
      'Return to Today’s Brief.',
    ],
  };

  return {
    whatThisIs,
    verdict,
    whyItMatters,
    nextMove,
    nextSteps: nextStepsByVerdict[verdict],
  };
}
