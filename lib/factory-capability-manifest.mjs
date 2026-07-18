/**
 * Capability Manifest — declarative execution order and dependencies.
 * Machine-readable companion to docs/architecture/capability-manifest.md
 */
export const CAPABILITY_MANIFEST_SCHEMA_VERSION = 1;

/**
 * Declared Phase-3 capabilities (implemented + reserved).
 * `order` is ascending execution preference when multiple canRun.
 * `dependencies` are capability ids whose outputs must exist before run.
 */
export const CAPABILITY_MANIFEST = {
  schemaVersion: CAPABILITY_MANIFEST_SCHEMA_VERSION,
  capabilities: [
    {
      id: 'intake',
      order: 10,
      dependencies: [],
      implemented: true,
      role: 'worker',
      summary: 'Classify launch seed and append intake output',
      terminalStatuses: ['INTAKE_COMPLETE'],
    },
    {
      id: 'research',
      order: 20,
      dependencies: ['intake'],
      implemented: true,
      role: 'worker',
      summary:
        'Provider-based research — Website/Organization/Document/Branding/Metadata → artifacts (no AI)',
      terminalStatuses: ['RESEARCHING'],
    },
    {
      id: 'discovery',
      order: 30,
      dependencies: ['research'],
      implemented: true,
      role: 'worker',
      summary:
        'Derive Discovery artifacts from Research artifacts only (no network / no AI)',
      terminalStatuses: ['DISCOVERING'],
    },
    {
      id: 'planning',
      order: 40,
      dependencies: ['discovery'],
      implemented: true,
      role: 'worker',
      summary:
        'Derive Planning artifacts + WorkOrders from Discovery artifacts only (no AI / no builders)',
      terminalStatuses: ['PLANNING'],
    },
    {
      id: 'production',
      order: 50,
      dependencies: ['planning'],
      implemented: true,
      role: 'worker',
      summary:
        'ProductionController — dispatch Builder Registry (WebsiteBuilder first); emit deliverables + review gates',
      terminalStatuses: ['BUILDING'],
    },
  ],
};

export function listManifestCapabilityIds(manifest = CAPABILITY_MANIFEST) {
  return [...manifest.capabilities]
    .sort((a, b) => a.order - b.order)
    .map((item) => item.id);
}

export function getManifestEntry(id, manifest = CAPABILITY_MANIFEST) {
  return manifest.capabilities.find((item) => item.id === id) || null;
}

export function validateManifest(manifest = CAPABILITY_MANIFEST) {
  const ids = new Set();
  const errors = [];

  for (const entry of manifest.capabilities || []) {
    if (!entry.id) {
      errors.push('manifest entry missing id');
      continue;
    }
    if (ids.has(entry.id)) {
      errors.push(`duplicate capability id: ${entry.id}`);
    }
    ids.add(entry.id);
    for (const dep of entry.dependencies || []) {
      if (!ids.has(dep) && !(manifest.capabilities || []).some((c) => c.id === dep)) {
        // dep may appear later in list — check full list
      }
    }
  }

  for (const entry of manifest.capabilities || []) {
    for (const dep of entry.dependencies || []) {
      if (!ids.has(dep)) {
        errors.push(`capability ${entry.id} depends on unknown ${dep}`);
      }
      if (dep === entry.id) {
        errors.push(`capability ${entry.id} cannot depend on itself`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
