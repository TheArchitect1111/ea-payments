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
import { notificationCapability } from '@/lib/factory-capabilities/notification-capability';
import { planningCapability } from '@/lib/factory-capabilities/planning-capability';
import { productionCapability } from '@/lib/factory-capabilities/production-capability';
import { publishingCapability } from '@/lib/factory-capabilities/publishing-capability';
import { qaCapability } from '@/lib/factory-capabilities/qa-capability';
import { researchCapability } from '@/lib/factory-capabilities/research-capability';
import { bootstrapBuilderRegistry } from '@/lib/factory-builders';

export const IMPLEMENTED_CAPABILITIES: Capability[] = [
  intakeCapability,
  researchCapability,
  discoveryCapability,
  planningCapability,
  productionCapability,
  qaCapability,
  publishingCapability,
  notificationCapability,
];

/** Register the frozen Factory conveyor (idempotent overwrite by id). */
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
  notificationCapability,
  planningCapability,
  productionCapability,
  publishingCapability,
  qaCapability,
  researchCapability,
};
