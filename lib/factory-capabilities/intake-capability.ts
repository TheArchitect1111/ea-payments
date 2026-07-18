/**
 * Intake capability — classify seed, append intake output to ProjectContext.
 */
import { intakeCanRun as intakeCanRunPure } from '@/lib/factory-capability-gates.mjs';
import { buildIntakeRecord } from '@/lib/factory-intake';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import {
  appendProjectContextOutput,
  loadProjectContext,
  setProjectContextStatus,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { getProject } from '@/lib/factory-project';

export function intakeCanRun(context: ProjectContext): boolean {
  return intakeCanRunPure(context);
}

export async function executeIntake(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;

  if (!intakeCanRun(context)) {
    console.info('[factory-intake] skip — canRun false', {
      projectId,
      status: context.pipelineStatus,
    });
    const project = await getProject(projectId);
    return {
      ran: false,
      project,
      context: await loadProjectContext(projectId),
      detail: 'skip',
    };
  }

  console.info('[factory-intake] start', {
    projectId,
    client: context.seed.client,
    hasUrl: Boolean(context.seed.url),
    attachmentCount: context.seed.attachments?.length ?? 0,
    schemaVersion: context.schemaVersion,
  });

  await setProjectContextStatus(projectId, 'INTAKE', 'intake', 'Intake capability inspecting ProjectContext seed');

  try {
    const latest = await loadProjectContext(projectId);
    if (!latest) {
      return { ran: false, project: null, context: null, detail: 'context missing' };
    }

    const intake = buildIntakeRecord({
      id: latest.projectId,
      client: latest.seed.client,
      goal: latest.seed.goal,
      deliverable: latest.seed.deliverable,
      industry: latest.seed.industry,
      notes: latest.seed.notes,
      url: latest.seed.url,
      attachments: latest.seed.attachments,
    });

    console.info('[factory-intake] classified', {
      projectId,
      primarySourceType: intake.primarySourceType,
      sourceCount: intake.sources.length,
    });

    const result = await appendProjectContextOutput(projectId, {
      kind: 'intake',
      worker: 'intake',
      payload: { intake },
      pipelineStatus: 'INTAKE_COMPLETE',
      detail: `Intake complete · primary=${intake.primarySourceType}`,
      mirrorIntake: intake,
    });

    console.info('[factory-intake] complete', {
      projectId,
      status: result?.project.pipelineStatus,
      outputs: result?.context.outputs.length,
      primarySourceType: intake.primarySourceType,
    });

    return {
      ran: true,
      project: result?.project ?? null,
      context: result?.context ?? null,
      detail: `primary=${intake.primarySourceType}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Intake capability failed';
    console.error('[factory-intake] failed', projectId, err);
    await setProjectContextStatus(projectId, 'FAILED', 'intake', message);
    return {
      ran: true,
      project: await getProject(projectId),
      context: await loadProjectContext(projectId),
      detail: message,
    };
  }
}

export const intakeCapability: Capability = {
  id: 'intake',
  dependencies: [],
  canRun: intakeCanRun,
  execute: executeIntake,
};
