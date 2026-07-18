/**
 * PlanningWorker — thin adapter over planning Capability.
 */
import { planningCapability } from '@/lib/factory-capabilities/planning-capability';
import { loadProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';

export async function runPlanningWorker(projectId: string): Promise<FactoryProject | null> {
  const context = await loadProjectContext(projectId);
  if (!context) {
    console.error('[factory-planning] context not found', projectId);
    return null;
  }
  const result = await planningCapability.execute(context);
  return result.project;
}
