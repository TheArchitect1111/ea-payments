export type AmplifiFeature =
  | 'social'
  | 'brand-profile'
  | 'calendar'
  | 'scheduling'
  | 'publishing'
  | 'analytics'
  | 'smart-research'
  | 'content-engine'
  | 'campaign-architect'
  | 'autopilot';

const SOCIAL_FEATURES: AmplifiFeature[] = [
  'social',
  'brand-profile',
  'calendar',
  'scheduling',
  'publishing',
  'analytics',
];

const COMPLETE_FEATURES: AmplifiFeature[] = [
  ...SOCIAL_FEATURES,
  'smart-research',
  'content-engine',
  'campaign-architect',
  'autopilot',
];

export type AmplifiPlanSummary = {
  planId: string;
  displayName: string;
  features: AmplifiFeature[];
  isComplete: boolean;
};

/**
 * Product-level feature gates live here, separate from portal module gates.
 * This lets Amplifi stay one portal module while Smartchitecture capabilities
 * are enabled by the customer's commercial plan.
 */
export function resolveAmplifiPlan(planId?: string | null): AmplifiPlanSummary {
  const normalized = (planId || '').trim().toLowerCase();

  if (
    normalized === 'amplifi_complete' ||
    normalized === 'platform_monthly' ||
    normalized === 'platform_annual'
  ) {
    return {
      planId: normalized || 'amplifi_complete',
      displayName: normalized.startsWith('platform_') ? 'EA Platform' : 'Amplifi Complete',
      features: [...COMPLETE_FEATURES],
      isComplete: true,
    };
  }

  return {
    planId: normalized || 'amplifi_social',
    displayName: 'Amplifi Social',
    features: [...SOCIAL_FEATURES],
    isComplete: false,
  };
}

export function hasAmplifiFeature(
  planId: string | null | undefined,
  feature: AmplifiFeature,
): boolean {
  return resolveAmplifiPlan(planId).features.includes(feature);
}
