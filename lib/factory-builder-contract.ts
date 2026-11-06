import type { ArtifactDraft } from './factory-artifact';
import type { WorkOrder } from './factory-work-order';

/** Metadata and synchronous output consumed by ProductionController. */
export type FactoryBuilder = {
  id: string;
  workOrderType: string;
  canBuild(workOrder: WorkOrder, context?: object): boolean;
  build(workOrder: WorkOrder, context?: object, at?: string): {
    ok: boolean;
    detail?: string;
    drafts?: Array<Omit<ArtifactDraft, 'kind'> & { kind: string }>;
    metrics?: { websiteArtifactsCreated?: number; deliverablesCreated?: number; reviewGatesCreated?: number };
    reviewGates?: object[];
    deliverable?: { id: string };
    websiteArtifact?: { id: string };
  };
};
