/**
 * ResearchWorker — thin adapter over research Capability (stub).
 * Prefer CapabilityRegistry dispatch via Orchestrator.
 */
import { researchCapability } from '@/lib/factory-capabilities/research-capability';
import { loadProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';

export async function runResearchWorker(projectId: string): Promise<FactoryProject | null> {
  const context = await loadProjectContext(projectId);
  if (!context) {
    console.error('[factory-research] context not found', projectId);
    return null;
  }
  const result = await researchCapability.execute(context);
  return result.project;
}
