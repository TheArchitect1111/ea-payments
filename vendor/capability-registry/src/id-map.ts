/**
 * Cross-system ID map.
 *
 * Three ID spaces exist today:
 * 1. portal ModuleId     — ea-payments/lib/modules/registry.ts
 * 2. CapabilityId        — ea-payments/lib/experience-registry.ts
 * 3. workspace enableKey — next-steps-pro clientConfigs / moduleRegistry
 *
 * Plus CPR hubModuleId — cpr tenant-presets / portal-hub-modules.
 *
 * Canonical platform id = CapabilityManifest.id (kebab-case, stable).
 */

export type IdMapRow = {
  /** Canonical capability id for the Capability Framework. */
  capabilityId: string;
  /** EA portal technical module id (MODULE_IDS). */
  moduleId?: string;
  /** EA experience-registry CapabilityId. */
  experienceCapabilityId?: string;
  /** Workspace enable key (camelCase in clientConfigs). */
  enableKey?: string;
  /** CPR hub module id. */
  hubModuleId?: string;
  /** Marketplace category. */
  category: string;
  /** Notes / mapping caveats. */
  notes?: string;
};

/**
 * Seed map — evidence from ea-payments registries + workspace clientConfigs + CPR presets.
 * Rows without reuse evidence stay Planning and must not be Certified.
 */
export const CAPABILITY_ID_MAP: IdMapRow[] = [
  {
    capabilityId: 'command-view',
    moduleId: 'dashboard',
    experienceCapabilityId: 'command-view',
    enableKey: undefined,
    hubModuleId: 'dashboard',
    category: 'Dashboard',
  },
  {
    capabilityId: 'organization-health',
    moduleId: 'pulse',
    experienceCapabilityId: 'organization-health',
    enableKey: 'pulse',
    category: 'Analytics',
  },
  {
    capabilityId: 'opportunity-capture',
    moduleId: 'simplifi',
    experienceCapabilityId: 'opportunity-capture',
    enableKey: undefined,
    category: 'Opportunities',
    notes: 'Simplifi™ engine — EA growth pack',
  },
  {
    capabilityId: 'amplification',
    moduleId: 'amplifi',
    experienceCapabilityId: 'amplification',
    enableKey: 'amplifi',
    hubModuleId: 'amplifi',
    category: 'Messaging',
  },
  {
    capabilityId: 'advisor-activity',
    moduleId: 'update-hub',
    experienceCapabilityId: 'advisor-activity',
    enableKey: 'updateHub',
    hubModuleId: 'updates',
    category: 'Notifications',
  },
  {
    capabilityId: 'messaging',
    moduleId: 'messaging',
    experienceCapabilityId: 'messaging',
    enableKey: 'messaging',
    hubModuleId: 'messaging',
    category: 'Messaging',
  },
  {
    capabilityId: 'documents',
    moduleId: 'documents',
    experienceCapabilityId: 'documents',
    enableKey: 'documents',
    hubModuleId: 'documents',
    category: 'Documents',
  },
  {
    capabilityId: 'learning',
    moduleId: 'training',
    experienceCapabilityId: 'learning',
    enableKey: 'training',
    hubModuleId: 'training',
    category: 'Training',
  },
  {
    capabilityId: 'events',
    moduleId: 'events',
    experienceCapabilityId: 'events',
    enableKey: 'events',
    hubModuleId: 'events',
    category: 'Events',
  },
  {
    capabilityId: 'resources',
    moduleId: 'resources',
    experienceCapabilityId: 'resources',
    hubModuleId: 'resource-library',
    category: 'Knowledge Base',
  },
  {
    capabilityId: 'ask-advisor',
    moduleId: 'ask',
    experienceCapabilityId: 'ask-advisor',
    enableKey: 'aiAdvisor',
    hubModuleId: 'ask-guide',
    category: 'AI Advisor',
    notes: 'Workspace aiAdvisor maps to Guide™ / ask module',
  },
  {
    capabilityId: 'relationship-capture',
    moduleId: 'connect',
    experienceCapabilityId: 'relationship-capture',
    enableKey: 'connections',
    category: 'CRM',
    notes: 'connections enableKey is broader (integrations); connect module is in-person capture',
  },
  {
    capabilityId: 'guided-discovery',
    moduleId: 'discovery',
    experienceCapabilityId: 'guided-discovery',
    category: 'Assessments',
  },
  {
    capabilityId: 'your-build',
    moduleId: 'ctp',
    experienceCapabilityId: 'your-build',
    category: 'Workflow',
  },
  {
    capabilityId: 'member-experience',
    moduleId: 'member',
    experienceCapabilityId: 'member-experience',
    category: 'Workflow',
    notes: 'OIB Member Experience → portal member home',
  },
  {
    capabilityId: 'landing-pages',
    moduleId: 'landing',
    experienceCapabilityId: 'landing-pages',
    category: 'Branding',
  },
  {
    capabilityId: 'billing',
    moduleId: 'billing',
    experienceCapabilityId: 'billing',
    enableKey: 'payments',
    category: 'Payments',
    notes: 'CPR payments (fee stages) and EA billing share this capability id after contract unify',
  },

  // Workspace-only / vertical (no EA portal ModuleId yet)
  {
    capabilityId: 'clients',
    enableKey: 'clients',
    category: 'Organizations',
    notes: 'EA Command Center admin module',
  },
  {
    capabilityId: 'magnifi',
    enableKey: 'magnifi',
    category: 'Assessments',
    notes: 'Experience/scoring layer — overlaps discovery + simplifi; not a portal ModuleId',
  },
  {
    capabilityId: 'growth-portal',
    enableKey: 'growthPortal',
    category: 'Portal',
  },
  {
    capabilityId: 'player-profiles',
    enableKey: 'playerProfiles',
    category: 'Profiles',
    notes: 'CPR vertical pack',
  },
  {
    capabilityId: 'recruiting',
    enableKey: 'recruiting',
    hubModuleId: 'recruiting-timeline',
    category: 'Recruiting',
    notes: 'CPR vertical pack',
  },
  {
    capabilityId: 'eligibility',
    enableKey: 'eligibility',
    hubModuleId: 'eligibility-center',
    category: 'Eligibility',
    notes: 'CPR vertical pack',
  },
  {
    capabilityId: 'scholarship-center',
    hubModuleId: 'scholarship-center',
    category: 'Recruiting',
    notes: 'CPR hub only — no workspace enableKey yet',
  },
  {
    capabilityId: 'coach-notes',
    enableKey: 'coachNotes',
    category: 'CRM',
    notes: 'CPR vertical pack',
  },
  {
    capabilityId: 'video',
    enableKey: 'video',
    hubModuleId: 'video-learning',
    category: 'Video',
  },
  {
    capabilityId: 'calendar',
    enableKey: 'calendar',
    hubModuleId: 'family-calendar',
    category: 'Calendar',
  },
  {
    capabilityId: 'family-portal',
    enableKey: 'familyPortal',
    category: 'Portal',
    notes: 'CPR family hub preset',
  },
  {
    capabilityId: 'evidence-library',
    enableKey: 'evidenceLibrary',
    category: 'Compliance',
    notes: 'Planned — 3HC / Bob Rumball',
  },
  {
    capabilityId: 'financial-blueprint',
    enableKey: 'financialBlueprint',
    category: 'Assessments',
    notes: 'Planned — ETFM',
  },
  {
    capabilityId: 'opportunities-resources',
    hubModuleId: 'opportunities-resources',
    category: 'Opportunities',
    notes: 'CPR hub module',
  },
];

const byCapabilityId = new Map(CAPABILITY_ID_MAP.map((r) => [r.capabilityId, r]));
const byModuleId = new Map(
  CAPABILITY_ID_MAP.filter((r) => r.moduleId).map((r) => [r.moduleId!, r]),
);
const byEnableKey = new Map(
  CAPABILITY_ID_MAP.filter((r) => r.enableKey).map((r) => [r.enableKey!, r]),
);
const byHubModuleId = new Map(
  CAPABILITY_ID_MAP.filter((r) => r.hubModuleId).map((r) => [r.hubModuleId!, r]),
);
const byExperienceId = new Map(
  CAPABILITY_ID_MAP.filter((r) => r.experienceCapabilityId).map(
    (r) => [r.experienceCapabilityId!, r],
  ),
);

export function getMapRowByCapabilityId(id: string): IdMapRow | undefined {
  return byCapabilityId.get(id);
}

export function getMapRowByModuleId(moduleId: string): IdMapRow | undefined {
  return byModuleId.get(moduleId);
}

export function getMapRowByEnableKey(enableKey: string): IdMapRow | undefined {
  return byEnableKey.get(enableKey);
}

export function getMapRowByHubModuleId(hubModuleId: string): IdMapRow | undefined {
  return byHubModuleId.get(hubModuleId);
}

export function getMapRowByExperienceCapabilityId(id: string): IdMapRow | undefined {
  return byExperienceId.get(id);
}

/** Resolve any known id space → canonical capability id. */
export function resolveCanonicalCapabilityId(input: {
  capabilityId?: string;
  moduleId?: string;
  enableKey?: string;
  hubModuleId?: string;
  experienceCapabilityId?: string;
}): string | undefined {
  if (input.capabilityId && byCapabilityId.has(input.capabilityId)) {
    return input.capabilityId;
  }
  if (input.moduleId) {
    const row = byModuleId.get(input.moduleId);
    if (row) return row.capabilityId;
  }
  if (input.enableKey) {
    const row = byEnableKey.get(input.enableKey);
    if (row) return row.capabilityId;
  }
  if (input.hubModuleId) {
    const row = byHubModuleId.get(input.hubModuleId);
    if (row) return row.capabilityId;
  }
  if (input.experienceCapabilityId) {
    const row = byExperienceId.get(input.experienceCapabilityId);
    if (row) return row.capabilityId;
  }
  return undefined;
}

/** Map workspace enabledModuleKeys → canonical capability ids (skips unknown). */
export function enableKeysToCapabilityIds(enableKeys: string[]): string[] {
  const out: string[] = [];
  for (const key of enableKeys) {
    const row = byEnableKey.get(key);
    if (row) out.push(row.capabilityId);
  }
  return out;
}

/** Map portal module ids → canonical capability ids. */
export function moduleIdsToCapabilityIds(moduleIds: string[]): string[] {
  const out: string[] = [];
  for (const id of moduleIds) {
    const row = byModuleId.get(id);
    if (row) out.push(row.capabilityId);
  }
  return out;
}

/** Integrity check for duplicate keys within each id space. */
export function validateIdMapIntegrity(): string[] {
  const errors: string[] = [];
  const seenCapability = new Set<string>();
  const seenModule = new Set<string>();
  const seenEnable = new Set<string>();
  const seenHub = new Set<string>();
  const seenExperience = new Set<string>();

  for (const row of CAPABILITY_ID_MAP) {
    if (seenCapability.has(row.capabilityId)) {
      errors.push(`Duplicate capabilityId: ${row.capabilityId}`);
    }
    seenCapability.add(row.capabilityId);

    if (row.moduleId) {
      if (seenModule.has(row.moduleId)) errors.push(`Duplicate moduleId: ${row.moduleId}`);
      seenModule.add(row.moduleId);
    }
    if (row.enableKey) {
      if (seenEnable.has(row.enableKey)) errors.push(`Duplicate enableKey: ${row.enableKey}`);
      seenEnable.add(row.enableKey);
    }
    if (row.hubModuleId) {
      if (seenHub.has(row.hubModuleId)) errors.push(`Duplicate hubModuleId: ${row.hubModuleId}`);
      seenHub.add(row.hubModuleId);
    }
    if (row.experienceCapabilityId) {
      if (seenExperience.has(row.experienceCapabilityId)) {
        errors.push(`Duplicate experienceCapabilityId: ${row.experienceCapabilityId}`);
      }
      seenExperience.add(row.experienceCapabilityId);
    }
  }

  return errors;
}
