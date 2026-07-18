/**
 * WebsiteBuilder — consumes website WorkOrders only; produces website artifacts.
 * No portal/learning/report builders. No external requests / AI.
 */

import { createDeliverable, createDeliverableId, deliverableToArtifactDraft } from '../factory-deliverable.mjs';
import {
  createReviewGate,
  createReviewGateId,
  reviewGateToArtifactDraft,
} from '../factory-review-gate.mjs';
import { createWorkOrder, workOrderToArtifactDraft } from '../factory-work-order.mjs';

function planningArtifact(artifacts, kind) {
  return (artifacts || []).find(
    (item) => item.kind === kind && item.provenance?.capabilityId === 'planning',
  );
}

function workOrderArtifactId(artifacts, workOrderId) {
  const matches = (artifacts || []).filter(
    (item) => item.kind === 'work_order' && item.data?.workOrder?.id === workOrderId,
  );
  return matches.length ? matches[matches.length - 1].id : null;
}

/**
 * @param {object} workOrder
 * @param {{ artifacts?: object[], seedClient?: string, projectId?: string }} context
 */
export function websiteBuilderCanBuild(workOrder, context = {}) {
  if (!workOrder || workOrder.type !== 'website') return false;
  if (workOrder.status === 'complete') return false;
  return true;
}

/**
 * Build website production artifacts from a website WorkOrder + planning artifacts.
 */
export function buildWebsiteDeliverable(workOrder, context = {}, at = new Date().toISOString()) {
  if (!websiteBuilderCanBuild(workOrder, context)) {
    return {
      ok: false,
      drafts: [],
      completedWorkOrder: null,
      metrics: { websiteArtifactsCreated: 0, deliverablesCreated: 0, reviewGatesCreated: 0 },
      detail: 'cannot build',
    };
  }

  const artifacts = context.artifacts || [];
  const projectId = context.projectId || workOrder.projectId;
  const seedClient = context.seedClient || workOrder.provenance?.seedClient;
  const sitemap = planningArtifact(artifacts, 'website_sitemap');
  const nav = planningArtifact(artifacts, 'navigation_tree');
  const ia = planningArtifact(artifacts, 'information_architecture');
  const exec = planningArtifact(artifacts, 'executive_summary');

  const nodes = sitemap?.data?.nodes || [
    { path: '/', title: 'Home', order: 1 },
    { path: '/about', title: 'About', order: 2 },
  ];

  const sourceArtifactIds = [
    workOrderArtifactId(artifacts, workOrder.id),
    sitemap?.id,
    nav?.id,
    ia?.id,
    exec?.id,
    ...(workOrder.provenance?.sourceArtifactIds || []),
  ].filter(Boolean);

  const pages = nodes.map((node, index) => ({
    path: node.path || `/${index}`,
    title: node.title || `Page ${index + 1}`,
    order: node.order ?? index + 1,
    sections: [
      { id: 'hero', label: `${node.title || 'Page'} hero` },
      { id: 'body', label: 'Primary content' },
    ],
  }));

  const websiteArtifactId = `artifact-production-website_site-${workOrder.id}`;
  const websiteArtifact = {
    id: websiteArtifactId,
    kind: 'website_site',
    providerId: 'website-builder',
    provenance: {
      capabilityId: 'production',
      sourceType: 'work_order',
      sourceArtifactIds,
      seedClient,
      collectedAt: at,
      notes: `WebsiteBuilder output for ${workOrder.id}`,
    },
    data: {
      workOrderId: workOrder.id,
      organizationName: exec?.data?.organizationName || seedClient || null,
      primaryUrl: sitemap?.data?.primaryUrl || exec?.data?.primaryUrl || null,
      pages,
      pageCount: pages.length,
      navigation: nav?.data || null,
      informationArchitecture: ia?.data?.sections || null,
      builderId: 'website',
      stub: false,
      note: 'Structured website production artifact — no deploy in Phase 7',
    },
  };

  const deliverable = createDeliverable(
    {
      id: createDeliverableId('website', workOrder.id.replace(/[^a-z0-9]+/gi, '').slice(-8) || '1'),
      projectId,
      type: 'website',
      title: workOrder.title || 'Website deliverable',
      summary: workOrder.summary || 'Website produced from website WorkOrder',
      status: 'ready_for_review',
      workOrderIds: [workOrder.id],
      artifactIds: [websiteArtifactId],
      provenance: {
        capabilityId: 'production',
        sourceType: 'work_order',
        sourceArtifactIds,
        seedClient,
        collectedAt: at,
        notes: 'Website deliverable from WebsiteBuilder',
      },
      payload: { pageCount: pages.length, builderId: 'website' },
    },
    at,
  );

  const gates = [
    createReviewGate(
      {
        id: createReviewGateId('website-content', workOrder.id.slice(-6)),
        projectId,
        gateId: 'website-content',
        title: 'Website content review',
        description: 'Review page titles/sections against planning sitemap',
        status: 'pending',
        required: true,
        deliverableId: deliverable.id,
        workOrderIds: [workOrder.id],
        provenance: {
          sourceType: 'website_artifacts',
          sourceArtifactIds: [websiteArtifactId, ...sourceArtifactIds],
          seedClient,
          collectedAt: at,
        },
      },
      at,
    ),
    createReviewGate(
      {
        id: createReviewGateId('website-navigation', workOrder.id.slice(-6)),
        projectId,
        gateId: 'website-navigation',
        title: 'Website navigation review',
        description: 'Confirm primary navigation matches planning navigation_tree',
        status: 'pending',
        required: true,
        deliverableId: deliverable.id,
        workOrderIds: [workOrder.id],
        provenance: {
          sourceType: 'website_artifacts',
          sourceArtifactIds: [websiteArtifactId, nav?.id, ...sourceArtifactIds].filter(Boolean),
          seedClient,
          collectedAt: at,
        },
      },
      at,
    ),
  ];

  const completedWorkOrder = createWorkOrder(
    {
      ...workOrder,
      status: 'complete',
      createdAt: at,
      payload: {
        ...(workOrder.payload || {}),
        completedAt: at,
        completedByBuilder: 'website',
        websiteArtifactId,
        deliverableId: deliverable.id,
        priorStatus: workOrder.status || 'ready',
      },
      provenance: {
        ...workOrder.provenance,
        capabilityId: 'planning',
        sourceArtifactIds: workOrder.provenance?.sourceArtifactIds || sourceArtifactIds,
        collectedAt: workOrder.provenance?.collectedAt || at,
        notes: `Completed by WebsiteBuilder at ${at}`,
      },
    },
    at,
  );

  const drafts = [
    websiteArtifact,
    deliverableToArtifactDraft(deliverable),
    ...gates.map((gate) => reviewGateToArtifactDraft(gate)),
    workOrderToArtifactDraft(completedWorkOrder, { providerId: 'website-builder' }),
  ];

  return {
    ok: true,
    drafts,
    completedWorkOrder,
    deliverable,
    reviewGates: gates,
    websiteArtifact,
    metrics: {
      websiteArtifactsCreated: 1,
      deliverablesCreated: 1,
      reviewGatesCreated: gates.length,
    },
    detail: `pages=${pages.length}`,
  };
}

export const websiteBuilder = {
  id: 'website',
  workOrderType: 'website',
  canBuild: websiteBuilderCanBuild,
  build: buildWebsiteDeliverable,
};
