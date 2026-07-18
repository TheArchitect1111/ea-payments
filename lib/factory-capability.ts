/**
 * Capability — standard interface for Factory execution units.
 * Orchestrator discovers via CapabilityRegistry; capabilities never call each other.
 */
import type { ProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';
import {
  createCapabilityRegistry,
  defaultCapabilityRegistry,
  dependenciesSatisfied,
  discoverNextCapability,
} from '@/lib/factory-capability-registry.mjs';
import {
  CAPABILITY_MANIFEST,
  CAPABILITY_MANIFEST_SCHEMA_VERSION,
  getManifestEntry,
  listManifestCapabilityIds,
  validateManifest,
} from '@/lib/factory-capability-manifest.mjs';

export {
  CAPABILITY_MANIFEST,
  CAPABILITY_MANIFEST_SCHEMA_VERSION,
  createCapabilityRegistry,
  defaultCapabilityRegistry,
  dependenciesSatisfied,
  discoverNextCapability,
  getManifestEntry,
  listManifestCapabilityIds,
  validateManifest,
};

export type CapabilityId = string;

export type CapabilityExecutionResult = {
  /** True when the capability performed work (status/output change). */
  ran: boolean;
  project: FactoryProject | null;
  context: ProjectContext | null;
  detail?: string;
};

/**
 * Standard Capability interface.
 * - id: stable capability identity (matches output kind / manifest id)
 * - dependencies: capability ids that must have appended outputs before this can run
 * - canRun: capability-specific readiness against ProjectContext
 * - execute: perform work by reading/appending ProjectContext only
 */
export type Capability = {
  id: CapabilityId;
  dependencies: CapabilityId[];
  canRun(context: ProjectContext): boolean;
  execute(context: ProjectContext): Promise<CapabilityExecutionResult>;
};

export type CapabilityRegistry = ReturnType<typeof createCapabilityRegistry>;

/** Discover next capability using registry + manifest order. */
export function discoverNextFromRegistry(
  context: ProjectContext,
  registry: CapabilityRegistry = defaultCapabilityRegistry,
): Capability | null {
  const orderIds = listManifestCapabilityIds(CAPABILITY_MANIFEST);
  return registry.discoverNext(context, { orderIds }) as Capability | null;
}

/** Ensure a capability's declared dependencies match the manifest (dev/test aid). */
export function assertCapabilityMatchesManifest(capability: Capability): void {
  const entry = getManifestEntry(capability.id, CAPABILITY_MANIFEST);
  if (!entry) {
    throw new Error(`Capability ${capability.id} is not listed in CAPABILITY_MANIFEST`);
  }
  const declared = [...capability.dependencies].sort().join(',');
  const expected = [...(entry.dependencies || [])].sort().join(',');
  if (declared !== expected) {
    throw new Error(
      `Capability ${capability.id} dependencies [${declared}] != manifest [${expected}]`,
    );
  }
}
