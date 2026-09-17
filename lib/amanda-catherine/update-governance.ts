export type AmandaChangeClass = 'standard' | 'review' | 'paid-change';
export type AmandaChangeArea = 'content' | 'image' | 'course' | 'price' | 'layout' | 'integration' | 'new-feature';

export const AMANDA_UPDATE_POLICY = {
  standard: ['content', 'image'] as AmandaChangeArea[],
  review: ['course', 'price'] as AmandaChangeArea[],
  paid: ['layout', 'integration', 'new-feature'] as AmandaChangeArea[],
} as const;

export function classifyAmandaChange(area: AmandaChangeArea): AmandaChangeClass {
  if ((AMANDA_UPDATE_POLICY.standard as readonly AmandaChangeArea[]).includes(area)) return 'standard';
  if ((AMANDA_UPDATE_POLICY.review as readonly AmandaChangeArea[]).includes(area)) return 'review';
  return 'paid-change';
}

export const AMANDA_UPDATE_FLOW = [
  'Request received by Eva or Update Hub',
  'Scope and risk classified',
  'Standard changes enter governed execution queue',
  'Course and price changes require confirmation before mutation',
  'Structural, integration and new-feature work routes to EA paid-change approval',
  'Approved work executes against the canonical source',
  'Deployment is verified before the request is closed',
  'Amanda receives completion status',
] as const;
