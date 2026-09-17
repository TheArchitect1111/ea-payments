import { classifyAmandaChange, type AmandaChangeArea } from './update-governance';

export type AmandaEvaCapability = 'read' | 'request-change';
export const AMANDA_EVA_OWNER_CAPABILITIES: AmandaEvaCapability[] = ['read', 'request-change'];

export const AMANDA_EVA_EXAMPLES = [
  'Show this month’s enrollments',
  'Show my Academy courses',
  'Open my Jane appointments',
  'Change this paragraph on the website',
  'Replace this image',
  'Change the price of a course',
  'Add a new Academy course',
] as const;

export function routeAmandaEvaChange(area: AmandaChangeArea) {
  const classification = classifyAmandaChange(area);
  return {
    classification,
    destination: classification === 'paid-change' ? 'ea-paid-change-approval' : 'amanda-update-hub',
    automaticProductionMutation: false,
    requiresVerificationBeforeClose: true,
  } as const;
}
