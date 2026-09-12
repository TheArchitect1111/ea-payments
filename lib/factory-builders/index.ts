/**
 * Bootstrap Builder Registry (production builders only).
 * ProductionController is the sole dispatcher. Every builder is execution-contract wrapped.
 */
import { createBuilderRegistry, defaultBuilderRegistry } from '@/lib/factory-builder-registry.mjs';
import { websiteBuilder } from '@/lib/factory-builders/website-builder.mjs';
import { portalBuilder } from '@/lib/factory-builders/portal-builder.mjs';
import { learningBuilder } from '@/lib/factory-builders/learning-builder.mjs';
import { knowledgeBuilder } from '@/lib/factory-builders/knowledge-builder.mjs';
import { reportBuilder } from '@/lib/factory-builders/report-builder.mjs';
import { wrapBuilderWithExecutionContract } from '@/lib/factory-execution-contract.mjs';

export { createBuilderRegistry, defaultBuilderRegistry, websiteBuilder, portalBuilder, learningBuilder, knowledgeBuilder, reportBuilder };

const PRODUCTION_BUILDERS = [websiteBuilder, portalBuilder, learningBuilder, knowledgeBuilder, reportBuilder];
let bootstrapped = false;

export function registerProductionBuilder(registry, builder) {
  const wrapped = wrapBuilderWithExecutionContract(builder);
  registry.register(wrapped);
  return wrapped;
}

export function bootstrapBuilderRegistry(registry = defaultBuilderRegistry) {
  if (registry === defaultBuilderRegistry && bootstrapped && registry.size() >= PRODUCTION_BUILDERS.length) return registry;
  for (const builder of PRODUCTION_BUILDERS) {
    if (!registry.get(builder.id)) registerProductionBuilder(registry, builder);
  }
  if (registry === defaultBuilderRegistry) bootstrapped = true;
  return registry;
}
