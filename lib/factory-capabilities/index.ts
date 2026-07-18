/**
 * Bootstrap default CapabilityRegistry with implemented capabilities.
 * Registry mechanics unchanged — registration list only.
 */
import {
  assertCapabilityMatchesManifest,
  defaultCapabilityRegistry,
  discoverNextFromRegistry,
  type Capability,
} from '@/lib/factory-capability';
import { discoveryCapability } from '@/lib/factory-capabilities/discovery-capability';
import { intakeCapability } from '@/lib/factory-capabilities/intake-capability';
import { planningCapability } from '@/lib/factory-capabilities/planning-capability';
import { productionCapability } from '@/lib/factory-capabilities/production-capability';
import { researchCapability } from '@/lib/factory-capabilities/research-capability';
import { bootstrapBuilderRegistry } from '@/lib/factory-builders';

export const IMPLEMENTED_CAPABILITIES: Capability[] = [
  intakeCapability,
  researchCapability,
  discoveryCapability,
  planningCapability,
  productionCapability,
];

/** Register Intake → … → Production (idempotent overwrite by id). */
export function bootstrapCapabilityRegistry(
  registry = defaultCapabilityRegistry,
): typeof defaultCapabilityRegistry {
  bootstrapBuilderRegistry();
  for (const capability of IMPLEMENTED_CAPABILITIES) {
    assertCapabilityMatchesManifest(capability);
    registry.register(capability);
  }
  return registry;
}

export {
  discoverNextFromRegistry,
  discoveryCapability,
  intakeCapability,
  planningCapability,
  productionCapability,
  researchCapability,
};
