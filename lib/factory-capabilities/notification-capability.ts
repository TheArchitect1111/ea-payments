import { notificationCanRun as notificationCanRunPure } from '@/lib/factory-capability-gates.mjs';
import type { Capability, CapabilityExecutionResult } from '@/lib/factory-capability';
import {
  appendProjectContextOutput,
  getLatestProjectContextOutput,
  loadProjectContext,
  type ProjectContext,
} from '@/lib/factory-project-context';
import { notifyFactoryDone } from '@/lib/factory-notify';
import { getProject } from '@/lib/factory-project';

export function notificationCanRun(context: ProjectContext): boolean {
  return notificationCanRunPure(context);
}

export async function executeNotification(context: ProjectContext): Promise<CapabilityExecutionResult> {
  const projectId = context.projectId;
  if (!notificationCanRun(context)) {
    return { ran: false, project: await getProject(projectId), context: await loadProjectContext(projectId), detail: 'skip' };
  }

  const publishing = getLatestProjectContextOutput(context, 'publishing');
  const reviewUrl = String(publishing?.payload?.reviewUrl || '');
  const notified = await notifyFactoryDone(projectId);
  const deduped = !notified.ok && /already sent/i.test(notified.error || '');
  const emailSent = notified.ok || deduped;

  const result = await appendProjectContextOutput(projectId, {
    kind: 'notification',
    worker: 'notification',
    payload: {
      notified: true,
      emailSent,
      deduped,
      reviewReady: true,
      reviewUrl,
      deliveryError: emailSent ? null : notified.error || 'Notification email failed',
      note: emailSent
        ? 'Founder notification completed.'
        : 'Review-ready deliverable remains available in Factory even though email delivery failed.',
    },
    pipelineStatus: 'UNDER_REVIEW',
    detail: emailSent ? 'Founder notified · review-ready' : 'Review-ready · notification email degraded',
  });

  return {
    ran: true,
    project: result?.project ?? await getProject(projectId),
    context: result?.context ?? await loadProjectContext(projectId),
    detail: emailSent ? 'notified' : 'review-ready; email degraded',
  };
}

export const notificationCapability: Capability = {
  id: 'notification',
  dependencies: ['publishing'],
  canRun: notificationCanRun,
  execute: executeNotification,
};
