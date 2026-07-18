import type { FactoryPipelineStatus } from '@/lib/factory-project-store';

/** Human-facing stages for phone / email (not raw pipeline codes). */
export type FactoryFriendlyStage =
  | 'received'
  | 'intake'
  | 'studying'
  | 'discovering'
  | 'planning'
  | 'building'
  | 'ready'
  | 'failed'
  | 'cancelled'
  | 'working';

const STAGE_LABEL: Record<FactoryFriendlyStage, string> = {
  received: 'Received',
  intake: 'Taking in your request',
  studying: 'Studying the site',
  discovering: 'Finding opportunities',
  planning: 'Planning the build',
  building: 'Building',
  ready: 'Ready for you',
  failed: 'Needs attention',
  cancelled: 'Cancelled',
  working: 'Working…',
};

export function factoryFriendlyStage(
  status: FactoryPipelineStatus | string,
): FactoryFriendlyStage {
  switch (status) {
    case 'CREATED':
    case 'QUEUED':
      return 'received';
    case 'INTAKE':
    case 'INTAKE_COMPLETE':
      return 'intake';
    case 'RESEARCHING':
      return 'studying';
    case 'DISCOVERING':
      return 'discovering';
    case 'PLANNING':
      return 'planning';
    case 'BUILDING':
    case 'GENERATING':
    case 'QA':
    case 'PUBLISHING':
      return 'building';
    case 'UNDER_REVIEW':
    case 'COMPLETE':
    case 'PUBLISHED':
      return 'ready';
    case 'FAILED':
      return 'failed';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'working';
  }
}

export function factoryFriendlyLabel(status: FactoryPipelineStatus | string): string {
  return STAGE_LABEL[factoryFriendlyStage(status)];
}

export function factoryIsInProgress(status: FactoryPipelineStatus | string): boolean {
  const stage = factoryFriendlyStage(status);
  return (
    stage === 'received' ||
    stage === 'intake' ||
    stage === 'studying' ||
    stage === 'discovering' ||
    stage === 'planning' ||
    stage === 'building' ||
    stage === 'working'
  );
}

export function factoryIsTerminalSuccess(status: FactoryPipelineStatus | string): boolean {
  return factoryFriendlyStage(status) === 'ready' || status === 'BUILDING';
}

export function factoryIsTerminalFailure(status: FactoryPipelineStatus | string): boolean {
  return status === 'FAILED' || status === 'CANCELLED';
}
