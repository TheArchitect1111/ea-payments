export type ActiveSavePurpose =
  | 'review-later'
  | 'visit-later'
  | 'potential-opportunity'
  | 'research-further'
  | 'share-soon';

export type ActiveSavePurposeOption = {
  id: ActiveSavePurpose;
  label: string;
  daysUntilDue: number;
  nextAction: string;
};

export const ACTIVE_SAVE_PURPOSES: ActiveSavePurposeOption[] = [
  {
    id: 'review-later',
    label: 'Review Later',
    daysUntilDue: 14,
    nextAction: 'Review this capture and decide next step',
  },
  {
    id: 'visit-later',
    label: 'Visit Later',
    daysUntilDue: 30,
    nextAction: 'Visit, tour, or engage in person',
  },
  {
    id: 'potential-opportunity',
    label: 'Potential Opportunity',
    daysUntilDue: 7,
    nextAction: 'Evaluate fit and schedule follow-up',
  },
  {
    id: 'research-further',
    label: 'Research Further',
    daysUntilDue: 10,
    nextAction: 'Dig deeper before committing time',
  },
  {
    id: 'share-soon',
    label: 'Share Soon',
    daysUntilDue: 3,
    nextAction: 'Share Magnifi story with stakeholder',
  },
];

export type CaptureOutcome = 'won' | 'lost' | 'passed' | 'in_progress';

export const OUTCOME_OPTIONS: { id: CaptureOutcome; label: string }[] = [
  { id: 'in_progress', label: 'In progress' },
  { id: 'won', label: 'Won' },
  { id: 'lost', label: 'Lost' },
  { id: 'passed', label: 'Passed' },
];
