/**
 * Bootstrap Builder Registry (production builders only).
 * Separate from Capability Registry — ProductionController dispatches here.
 */
import {
  createBuilderRegistry,
  defaultBuilderRegistry,
} from '@/lib/factory-builder-registry.mjs';
import { websiteBuilder } from '@/lib/factory-builders/website-builder.mjs';

export { createBuilderRegistry, defaultBuilderRegistry, websiteBuilder };

let bootstrapped = false;

export function bootstrapBuilderRegistry(registry = defaultBuilderRegistry) {
  if (registry === defaultBuilderRegistry && bootstrapped && registry.size() > 0) {
    return registry;
  }
  if (!registry.get('website')) {
    registry.register(websiteBuilder);
  }
  if (registry === defaultBuilderRegistry) {
    bootstrapped = true;
  }
  return registry;
}
