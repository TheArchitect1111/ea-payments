/**
 * WorkOrder model — TypeScript surface over pure factory-work-order.mjs
 */
import {
  artifactToWorkOrder as artifactToWorkOrderPure,
  createWorkOrder as createWorkOrderPure,
  createWorkOrderId,
  listPendingWorkOrders as listPendingPure,
  listWorkOrdersFromArtifacts as listWorkOrdersPure,
  validateWorkOrderLineage,
  WORK_ORDER_SCHEMA_VERSION,
  WORK_ORDER_TYPES,
  workOrderToArtifactDraft as workOrderToDraftPure,
} from '@/lib/factory-work-order.mjs';

export {
  createWorkOrderId,
  validateWorkOrderLineage,
  WORK_ORDER_SCHEMA_VERSION,
  WORK_ORDER_TYPES,
};

export type WorkOrderType =
  | 'website'
  | 'portal'
  | 'learning'
  | 'content'
  | 'branding'
  | 'accessibility'
  | 'automation'
  | 'qa'
  | 'integration';

export type WorkOrder = {
  schemaVersion: number;
  id: string;
  projectId: string;
  type: WorkOrderType;
  title: string;
  summary: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
  deliverable: string;
  acceptanceCriteria: string[];
  dependencies: string[];
  createdAt: string;
  provenance: {
    capabilityId: string;
    sourceType: string;
    sourceArtifactIds: string[];
    seedClient?: string;
    intakeOutputId?: string;
    collectedAt: string;
    notes?: string;
  };
  payload: Record<string, unknown>;
};

export type WorkOrderArtifactDraft = {
  id?: string;
  kind: 'work_order';
  providerId: string;
  provenance: {
    capabilityId: string;
    sourceType: string;
    sourceArtifactIds: string[];
    seedClient?: string;
    intakeOutputId?: string;
    collectedAt?: string;
    notes?: string;
  };
  data: Record<string, unknown>;
};

export function createWorkOrder(
  input: Parameters<typeof createWorkOrderPure>[0],
  at?: string,
): WorkOrder {
  return createWorkOrderPure(input, at) as WorkOrder;
}

export function workOrderToArtifactDraft(
  workOrder: WorkOrder,
  options?: { artifactId?: string; providerId?: string },
): WorkOrderArtifactDraft {
  return workOrderToDraftPure(workOrder, options) as WorkOrderArtifactDraft;
}

export function artifactToWorkOrder(artifact: {
  kind?: string;
  data?: Record<string, unknown>;
  createdAt?: string;
}): WorkOrder | null {
  return artifactToWorkOrderPure(artifact) as WorkOrder | null;
}

export function listWorkOrdersFromArtifacts(artifacts: unknown[]): WorkOrder[] {
  return listWorkOrdersPure(artifacts) as WorkOrder[];
}

export function listPendingWorkOrders(artifacts: unknown[], type?: string): WorkOrder[] {
  return listPendingPure(artifacts, type) as WorkOrder[];
}
