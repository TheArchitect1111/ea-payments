/** EA OS Phase 1 — client lifecycle fields on Airtable Client Records */

export type LifecycleStage =
  | 'Prospect'
  | 'Discovery'
  | 'Blueprint'
  | 'Agreement'
  | 'Onboarding'
  | 'Build'
  | 'Launch'
  | 'Adoption'
  | 'Optimization';

export type DiscoveryStatus =
  | 'Not Scheduled'
  | 'Scheduled'
  | 'Completed'
  | 'No Show'
  | 'Follow-Up Needed';

export type BuildStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting Client'
  | 'Internal Review'
  | 'Client Review'
  | 'Approved'
  | 'Ready For Launch';

export type LaunchStatus =
  | 'Not Scheduled'
  | 'Scheduled'
  | 'Launched'
  | 'Adoption In Progress';

export interface ClientLifecycleFields {
  lifecycleStage?: LifecycleStage;
  discoveryStatus?: DiscoveryStatus;
  buildStatus?: BuildStatus;
  launchStatus?: LaunchStatus;
}

const LIFECYCLE_FIELD = 'Lifecycle Stage';
const DISCOVERY_FIELD = 'Discovery Status';
const BUILD_FIELD = 'Build Status';
const LAUNCH_FIELD = 'Launch Status';

export function lifecycleFieldsToAirtable(
  fields: ClientLifecycleFields,
): Record<string, string> {
  const raw: Record<string, string> = {};
  if (fields.lifecycleStage) raw[LIFECYCLE_FIELD] = fields.lifecycleStage;
  if (fields.discoveryStatus) raw[DISCOVERY_FIELD] = fields.discoveryStatus;
  if (fields.buildStatus) raw[BUILD_FIELD] = fields.buildStatus;
  if (fields.launchStatus) raw[LAUNCH_FIELD] = fields.launchStatus;
  return raw;
}

export function lifecycleFieldsFromAirtable(
  f: Record<string, unknown>,
): ClientLifecycleFields {
  return {
    lifecycleStage: (f[LIFECYCLE_FIELD] as LifecycleStage) || undefined,
    discoveryStatus: (f[DISCOVERY_FIELD] as DiscoveryStatus) || undefined,
    buildStatus: (f[BUILD_FIELD] as BuildStatus) || undefined,
    launchStatus: (f[LAUNCH_FIELD] as LaunchStatus) || undefined,
  };
}

/** Defaults written when a Stripe payment creates or updates a client */
export function lifecycleForPaidClient(
  packagePurchased: string,
): ClientLifecycleFields {
  if (packagePurchased === 'Launch Verification') {
    return {
      lifecycleStage: 'Onboarding',
      discoveryStatus: 'Completed',
      buildStatus: 'Not Started',
      launchStatus: 'Not Scheduled',
    };
  }
  return {
    lifecycleStage: 'Onboarding',
    discoveryStatus: 'Completed',
    buildStatus: 'Not Started',
    launchStatus: 'Not Scheduled',
  };
}

/** Defaults for assessment / lead capture */
export function lifecycleForProspect(): ClientLifecycleFields {
  return {
    lifecycleStage: 'Prospect',
    discoveryStatus: 'Not Scheduled',
    buildStatus: 'Not Started',
    launchStatus: 'Not Scheduled',
  };
}

export function lifecycleForDiscoveryScheduled(): ClientLifecycleFields {
  return {
    lifecycleStage: 'Discovery',
    discoveryStatus: 'Scheduled',
  };
}

export function lifecycleForDiscoveryBooked(): ClientLifecycleFields {
  return {
    lifecycleStage: 'Discovery',
    discoveryStatus: 'Scheduled',
  };
}

export const LIFECYCLE_AIRTABLE_FIELDS = [
  LIFECYCLE_FIELD,
  DISCOVERY_FIELD,
  BUILD_FIELD,
  LAUNCH_FIELD,
] as const;
