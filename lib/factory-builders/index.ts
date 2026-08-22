/**
 * Bootstrap Builder Registry (production builders only).
 * Separate from Capability Registry — ProductionController dispatches here.
 * Every builder is wrapped with the mandatory Execution Contract gate.
 */
import {
  createBuilderRegistry,
  defaultBuilderRegistry,
} from '@/lib/factory-builder-registry.mjs';
import { websiteBuilder } from '@/lib/factory-builders/website-builder.mjs';
import { wrapBuilderWithExecutionContract } from '@/lib/factory-execution-contract.mjs';

export { createBuilderRegistry, defaultBuilderRegistry, websiteBuilder };

let bootstrapped = false;

export function registerProductionBuilder(registry, builder) {
  const wrapped = wrapBuilderWithExecutionContract(builder);
  registry.register(wrapped);
  return wrapped;
}

export function bootstrapBuilderRegistry(registry = defaultBuilderRegistry) {
  if (registry === defaultBuilderRegistry && bootstrapped && registry.size() > 0) {
    return registry;
  }
  if (!registry.get('website')) {
    registerProductionBuilder(registry, websiteBuilder);
  }
  if (registry === defaultBuilderRegistry) {
    bootstrapped = true;
  }
  return registry;
}
