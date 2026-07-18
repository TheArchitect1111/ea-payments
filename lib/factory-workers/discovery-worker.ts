/**
 * DiscoveryWorker — thin adapter over discovery Capability.
 */
import { discoveryCapability } from '@/lib/factory-capabilities/discovery-capability';
import { loadProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';

export async function runDiscoveryWorker(projectId: string): Promise<FactoryProject | null> {
  const context = await loadProjectContext(projectId);
  if (!context) {
    console.error('[factory-discovery] context not found', projectId);
    return null;
  }
  const result = await discoveryCapability.execute(context);
  return result.project;
}
