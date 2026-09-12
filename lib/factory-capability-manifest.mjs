/**
 * Capability Manifest — declarative execution order and dependencies.
 * Machine-readable companion to docs/architecture/capability-manifest.md
 */
export const CAPABILITY_MANIFEST_SCHEMA_VERSION = 1;

export const CAPABILITY_MANIFEST = {
  schemaVersion: CAPABILITY_MANIFEST_SCHEMA_VERSION,
  capabilities: [
    { id: 'intake', order: 10, dependencies: [], implemented: true, role: 'worker', summary: 'Classify launch seed and append intake output', terminalStatuses: ['INTAKE_COMPLETE'] },
    { id: 'research', order: 20, dependencies: ['intake'], implemented: true, role: 'worker', summary: 'Provider-based research → artifacts', terminalStatuses: ['RESEARCHING'] },
    { id: 'discovery', order: 30, dependencies: ['research'], implemented: true, role: 'worker', summary: 'Derive Discovery artifacts from Research artifacts', terminalStatuses: ['DISCOVERING'] },
    { id: 'planning', order: 40, dependencies: ['discovery'], implemented: true, role: 'worker', summary: 'Derive Planning artifacts + WorkOrders', terminalStatuses: ['PLANNING'] },
    { id: 'production', order: 50, dependencies: ['planning'], implemented: true, role: 'worker', summary: 'ProductionController dispatches Builder Registry', terminalStatuses: ['BUILDING'] },
    { id: 'qa', order: 60, dependencies: ['production'], implemented: true, role: 'worker', summary: 'Verify production artifacts and auto-remediate system-verifiable review gates', terminalStatuses: ['QA'] },
    { id: 'publishing', order: 70, dependencies: ['qa'], implemented: true, role: 'worker', summary: 'Publish and verify a canonical review-ready Factory preview', terminalStatuses: ['PUBLISHING', 'UNDER_REVIEW'] },
    { id: 'notification', order: 80, dependencies: ['publishing'], implemented: true, role: 'worker', summary: 'Notify founder that the verified review-ready deliverable is available', terminalStatuses: ['UNDER_REVIEW'] },
  ],
};

export function listManifestCapabilityIds(manifest = CAPABILITY_MANIFEST) {
  return [...manifest.capabilities].sort((a, b) => a.order - b.order).map((item) => item.id);
}

export function getManifestEntry(id, manifest = CAPABILITY_MANIFEST) {
  return manifest.capabilities.find((item) => item.id === id) || null;
}

export function validateManifest(manifest = CAPABILITY_MANIFEST) {
  const ids = new Set();
  const errors = [];
  for (const entry of manifest.capabilities || []) {
    if (!entry.id) { errors.push('manifest entry missing id'); continue; }
    if (ids.has(entry.id)) errors.push(`duplicate capability id: ${entry.id}`);
    ids.add(entry.id);
  }
  for (const entry of manifest.capabilities || []) {
    for (const dep of entry.dependencies || []) {
      if (!ids.has(dep)) errors.push(`capability ${entry.id} depends on unknown ${dep}`);
      if (dep === entry.id) errors.push(`capability ${entry.id} cannot depend on itself`);
    }
  }
  return { ok: errors.length === 0, errors };
}
