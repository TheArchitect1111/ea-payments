export type OutcomeStatus = 'open' | 'in_progress' | 'won' | 'lost' | 'passed';

export const OUTCOME_LABELS: Record<OutcomeStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  won: 'Won',
  lost: 'Lost',
  passed: 'Passed',
};

export function outcomeLabel(status?: string): string | undefined {
  if (!status) return undefined;
  const key = status.toLowerCase().replace(/\s+/g, '_') as OutcomeStatus;
  return OUTCOME_LABELS[key] ?? status;
}

export function isTerminalOutcome(status?: string): boolean {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return ['won', 'lost', 'passed', 'archived'].includes(normalized);
}

export function nextActionForOutcome(status: OutcomeStatus): string {
  switch (status) {
    case 'won':
      return 'Document win and plan follow-through';
    case 'lost':
      return 'Archive learnings for future reference';
    case 'passed':
      return 'No further action — moved on';
    case 'in_progress':
      return 'Continue active pursuit';
    default:
      return 'Review and decide next step';
  }
}
