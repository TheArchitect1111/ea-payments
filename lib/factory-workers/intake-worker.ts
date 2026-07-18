/**
 * IntakeWorker — thin adapter over intake Capability.
 * Prefer CapabilityRegistry dispatch via Orchestrator.
 */
import { intakeCapability } from '@/lib/factory-capabilities/intake-capability';
import { loadProjectContext } from '@/lib/factory-project-context';
import type { FactoryProject } from '@/lib/factory-project-store';

export async function runIntakeWorker(projectId: string): Promise<FactoryProject | null> {
  const context = await loadProjectContext(projectId);
  if (!context) {
    console.error('[factory-intake] context not found', projectId);
    return null;
  }
  const result = await intakeCapability.execute(context);
  return result.project;
}
