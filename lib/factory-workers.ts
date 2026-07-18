/**
 * Worker registry — Phase 1 ships GenerateWorker only.
 * Other workers are typed placeholders for later phases (no fake implementations).
 */
import type { FactoryPipelineStatus } from '@/lib/factory-project-store';

export type FactoryWorkerId =
  | 'generate'
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
};

export const FACTORY_WORKERS: FactoryWorkerDescriptor[] = [
  {
    id: 'generate',
    label: 'Generate Worker',
    phase: 1,
    advancesTo: ['GENERATING', 'UNDER_REVIEW', 'FAILED'],
    implemented: true,
  },
  {
    id: 'research',
    label: 'Research Worker',
    phase: 2,
    advancesTo: ['RESEARCHING'],
    implemented: false,
  },
  {
    id: 'discovery',
    label: 'Discovery Worker',
    phase: 2,
    advancesTo: ['DISCOVERING'],
    implemented: false,
  },
  {
    id: 'planning',
    label: 'Planning Worker',
    phase: 2,
    advancesTo: ['PLANNING'],
    implemented: false,
  },
  {
    id: 'website',
    label: 'Website Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
  },
  {
    id: 'portal',
    label: 'Portal Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
  },
  {
    id: 'learning',
    label: 'Learning Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
  },
  {
    id: 'knowledge',
    label: 'Knowledge Base Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
  },
  {
    id: 'report',
    label: 'Report Builder',
    phase: 3,
    advancesTo: ['BUILDING'],
    implemented: false,
  },
  {
    id: 'qa',
    label: 'QA Worker',
    phase: 3,
    advancesTo: ['QA'],
    implemented: false,
  },
  {
    id: 'notification',
    label: 'Notification Worker',
    phase: 1,
    advancesTo: ['UNDER_REVIEW', 'COMPLETE'],
    implemented: false,
  },
];
