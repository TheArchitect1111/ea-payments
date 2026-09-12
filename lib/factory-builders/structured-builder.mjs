/** Shared deterministic builder kernel for Portal, Learning, Knowledge and Report builders. */
import { createDeliverable, createDeliverableId, deliverableToArtifactDraft } from '../factory-deliverable.mjs';
import { createReviewGate, createReviewGateId, reviewGateToArtifactDraft } from '../factory-review-gate.mjs';
import { createWorkOrder, workOrderToArtifactDraft } from '../factory-work-order.mjs';

function latestPlanning(artifacts, kind) {
  return [...(artifacts || [])].reverse().find((item) => item.kind === kind && item.provenance?.capabilityId === 'planning') || null;
}
function workOrderArtifactId(artifacts, id) {
  return [...(artifacts || [])].reverse().find((item) => item.kind === 'work_order' && item.data?.workOrder?.id === id)?.id || null;
}

export function createStructuredBuilder(spec) {
  const { id, workOrderType, artifactKind, deliverableType, planningKinds, gateId, title } = spec;
  return {
    id,
    workOrderType,
    canBuild(workOrder) {
      return Boolean(workOrder && workOrder.type === workOrderType && workOrder.status !== 'complete' && workOrder.status !== 'cancelled');
    },
    build(workOrder, context = {}, at = new Date().toISOString()) {
      if (!this.canBuild(workOrder)) return { ok: false, drafts: [], detail: 'cannot build' };
      const artifacts = context.artifacts || [];
      const projectId = context.projectId || workOrder.projectId;
      const seedClient = context.seedClient || workOrder.provenance?.seedClient;
      const planning = planningKinds.map((kind) => latestPlanning(artifacts, kind)).filter(Boolean);
      const sourceArtifactIds = [workOrderArtifactId(artifacts, workOrder.id), ...planning.map((item) => item.id), ...(workOrder.provenance?.sourceArtifactIds || [])].filter(Boolean);
      const artifactId = `artifact-production-${artifactKind}-${workOrder.id}`;
      const productionArtifact = {
        id: artifactId,
        kind: artifactKind,
        providerId: `${id}-builder`,
        provenance: { capabilityId: 'production', sourceType: 'work_order', sourceArtifactIds, seedClient, collectedAt: at, notes: `${title} output for ${workOrder.id}` },
        data: {
          workOrderId: workOrder.id,
          organizationName: seedClient || null,
          builderId: id,
          planning: Object.fromEntries(planning.map((item) => [item.kind, item.data])),
          acceptanceCriteria: workOrder.acceptanceCriteria || [],
          payload: workOrder.payload || {},
          stub: false,
          generatedAt: at,
        },
      };
      const deliverable = createDeliverable({
        id: createDeliverableId(deliverableType, workOrder.id.replace(/[^a-z0-9]+/gi, '').slice(-8) || id),
        projectId, type: deliverableType, title: workOrder.title || title,
        summary: workOrder.summary || `${title} produced from approved WorkOrder`,
        status: 'ready_for_review', workOrderIds: [workOrder.id], artifactIds: [artifactId],
        provenance: { capabilityId: 'production', sourceType: 'work_order', sourceArtifactIds, seedClient, collectedAt: at, notes: `${title} deliverable` },
        payload: { builderId: id, artifactKind },
      }, at);
      const gate = createReviewGate({
        id: createReviewGateId(gateId, workOrder.id.slice(-8)), projectId, gateId,
        title: `${title} structural review`, description: `Verify ${title} structure against approved planning evidence`,
        status: 'pending', required: true, deliverableId: deliverable.id, workOrderIds: [workOrder.id],
        provenance: { capabilityId: 'production', sourceType: artifactKind, sourceArtifactIds: [artifactId, ...sourceArtifactIds], seedClient, collectedAt: at, notes: `${title} structural verification` },
      }, at);
      const completedWorkOrder = createWorkOrder({
        ...workOrder, status: 'complete', createdAt: at,
        payload: { ...(workOrder.payload || {}), completedAt: at, completedByBuilder: id, productionArtifactId: artifactId, deliverableId: deliverable.id, priorStatus: workOrder.status || 'ready' },
        provenance: { ...workOrder.provenance, capabilityId: 'planning', sourceArtifactIds: workOrder.provenance?.sourceArtifactIds || sourceArtifactIds, collectedAt: workOrder.provenance?.collectedAt || at, notes: `Completed by ${title} at ${at}` },
      }, at);
      return {
        ok: true,
        drafts: [productionArtifact, deliverableToArtifactDraft(deliverable), reviewGateToArtifactDraft(gate), workOrderToArtifactDraft(completedWorkOrder, { providerId: `${id}-builder` })],
        completedWorkOrder, deliverable, reviewGates: [gate], productionArtifact,
        metrics: { websiteArtifactsCreated: 0, deliverablesCreated: 1, reviewGatesCreated: 1 },
        detail: `${id}=ready_for_review`,
      };
    },
  };
}
