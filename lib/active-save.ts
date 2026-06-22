export type ActiveSavePurpose =
  | 'review-later'
  | 'visit-later'
  | 'potential-opportunity'
  | 'research-further'
  | 'share-soon';

export interface ActiveSavePurposeOption {
  id: ActiveSavePurpose;
  label: string;
  daysUntilDue: number;
  nextAction: string;
}

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

export function getActiveSavePurpose(id: string): ActiveSavePurposeOption | undefined {
  return ACTIVE_SAVE_PURPOSES.find((p) => p.id === id);
}

export function defaultDueDateForPurpose(purposeId: ActiveSavePurpose): string {
  const option = getActiveSavePurpose(purposeId);
  const days = option?.daysUntilDue ?? 14;
  const due = new Date();
  due.setDate(due.getDate() + days);
  return due.toISOString().slice(0, 10);
}

export function activeSaveLabel(purposeId?: string): string | undefined {
  return getActiveSavePurpose(purposeId ?? '')?.label;
}
