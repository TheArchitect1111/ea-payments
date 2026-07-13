/**
 * CPR readiness ? hubModuleId coverage against the Capability ID map.
 * Does NOT migrate CPR. Prepares for a future CPR ? platform cutover.
 */

import { getMapRowByHubModuleId, validateIdMapIntegrity } from './id-map.js';

/** Canonical CPR / family-hub portal hub module ids (cpr-governance-baseline). */
export const CPR_HUB_MODULE_IDS = [
  'dashboard',
  'amplifi',
  'updates',
  'recruiting-timeline',
  'eligibility-center',
  'scholarship-center',
  'training',
  'video-learning',
  'resource-library',
  'ask-guide',
  'messaging',
  'documents',
  'events',
  'family-calendar',
  'opportunities-resources',
] as const;

export type CprHubModuleId = (typeof CPR_HUB_MODULE_IDS)[number];

export const CPR_TENANT_HUB_MODULE_IDS: readonly CprHubModuleId[] = [
  'dashboard',
  'amplifi',
  'updates',
  'recruiting-timeline',
  'eligibility-center',
  'scholarship-center',
  'training',
  'video-learning',
  'resource-library',
  'ask-guide',
  'messaging',
  'documents',
  'events',
  'opportunities-resources',
];

export const FAMILY_HUB_MODULE_IDS: readonly CprHubModuleId[] = [
  'dashboard',
  'updates',
  'training',
  'video-learning',
  'resource-library',
  'ask-guide',
  'messaging',
  'documents',
  'events',
  'family-calendar',
  'opportunities-resources',
];

export type CprHubReadiness = {
  ok: boolean;
  mapped: string[];
  unmapped: string[];
  idMapErrors: string[];
  rows: Array<{
    hubModuleId: string;
    capabilityId: string | null;
    moduleId: string | null;
    enableKey: string | null;
  }>;
};

export function getCprHubReadiness(
  hubModuleIds: readonly string[] = CPR_HUB_MODULE_IDS,
): CprHubReadiness {
  const idMapErrors = validateIdMapIntegrity();
  const mapped: string[] = [];
  const unmapped: string[] = [];
  const rows: CprHubReadiness['rows'] = [];

  for (const hubModuleId of hubModuleIds) {
    const row = getMapRowByHubModuleId(hubModuleId);
    if (row) {
      mapped.push(hubModuleId);
      rows.push({
        hubModuleId,
        capabilityId: row.capabilityId,
        moduleId: row.moduleId ?? null,
        enableKey: row.enableKey ?? null,
      });
    } else {
      unmapped.push(hubModuleId);
      rows.push({
        hubModuleId,
        capabilityId: null,
        moduleId: null,
        enableKey: null,
      });
    }
  }

  return {
    ok: unmapped.length === 0 && idMapErrors.length === 0,
    mapped,
    unmapped,
    idMapErrors,
    rows,
  };
}

export function resolveCprHubCapabilityIds(
  hubModuleIds: readonly string[],
): string[] {
  const ids: string[] = [];
  for (const hubModuleId of hubModuleIds) {
    const row = getMapRowByHubModuleId(hubModuleId);
    if (row?.capabilityId) ids.push(row.capabilityId);
  }
  return [...new Set(ids)];
}
