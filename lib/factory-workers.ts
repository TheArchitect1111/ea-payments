/**
 * Worker / capability catalog (UI + ops).
 * Runtime dispatch uses CapabilityRegistry — see lib/factory-capability*.
 */
import type { FactoryPipelineStatus } from '@/lib/factory-project-store';

export type FactoryWorkerId =
  | 'generate'
  | 'intake'
  | 'research'
  | 'discovery'
  | 'planning'
  | 'website'
  | 'portal'
  | 'learning'
  | 'knowledge'
  | 'report'
  | 'qa'
  | 'notification';

export type FactoryWorkerDescriptor = {
  id: FactoryWorkerId;
  label: string;
  phase: 1 | 2 | 3;
  /** Pipeline statuses this worker may write when implemented. */
  advancesTo: FactoryPipelineStatus[];
  implemented: boolean;
  role: 'orchestrator' | 'worker' | 'stub';
  /** CapabilityRegistry id when applicable. */
  capabilityId?: string;
};

export const FACTORY_WORKERS: FactoryWorkerDescriptor[] = [
  {
    id: 'generate',
    label: 'Generate Worker (Orchestrator)',
    phase: 1,
    advancesTo: [],
    implemented: true,
    role: 'orchestrator',
  },
  {
    id: 'intake',
    label: 'Intake Capability',
    phase: 3,
    advancesTo: ['INTAKE', 'INTAKE_COMPLETE', 'FAILED'],
    implemented: true,
    role: 'worker',
    capabilityId: 'intake',
  },
  {
    id: 'research',
    label: 'Research Capability',
    phase: 4,
    advancesTo: ['RESEARCHING'],
    implemented: true,
    role: 'worker',
    capabilityId: 'research',
  },
  {
    id: 'discovery',
    label: 'Discovery Capability',
    phase: 5,
    advancesTo: ['DISCOVERING'],
    implemented: true,
    role: 'worker',
    capabilityId: 'discovery',
  },
  {
    id: 'planning',
    label: 'Planning Capability',
    phase: 6,
    advancesTo: ['PLANNING'],
    implemented: true,
    role: 'worker',
    capabilityId: 'planning',
  },
  {
    id: 'website',
    label: 'Website Builder',
    phase: 7,
    advancesTo: ['BUILDING'],
    implemented: true,
    role: 'worker',
    capabilityId: 'production',
  },
  {
    id: 'portal',
    label: 'Portal Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
    role: 'stub',
  },
  {
    id: 'learning',
    label: 'Learning Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
    role: 'stub',
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
    role: 'stub',
  },
  {
    id: 'report',
    label: 'Report Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
    role: 'stub',
  },
  {
    id: 'qa',
    label: 'QA Capability',
    phase: 3,
    advancesTo: ['QA'],
    implemented: false,
    role: 'stub',
  },
  {
    id: 'notification',
    label: 'Notification Capability',
    phase: 1,
    advancesTo: ['UNDER_REVIEW', 'COMPLETE'],
    implemented: false,
    role: 'stub',
  },
];
