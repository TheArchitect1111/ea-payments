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

function buildExperienceConcepts({ creative, organizationName, workOrderId }) {
  const direction = creative?.data || {};
  const story = direction.story || {};
  const shared = {
    organizationName,
    story,
    sourceCreativeDirectionId: creative?.id || null,
    publishingSafety: direction.publishingSafety || null,
  };
  const concepts = [
    {
      id: `${workOrderId}-concept-a`,
      name: 'Cinematic Documentary',
      rationale: 'Leads with the human story and makes proof feel lived rather than advertised.',
      website: {
        composition: 'full-bleed threshold hero → intimate story fragments → proof sequence → quiet invitation',
        imageBehavior: 'large documentary photography with selective crops and natural negative space',
        typeBehavior: 'high-contrast editorial headlines with restrained supporting copy',
        motion: 'slow scene reveals and image-led transitions',
      },
      portal: {
        composition: 'single next-best-action hero with a calm narrative progress rail',
        tone: 'concierge workspace; minimal controls; story continuity from the public experience',
      },
      ...shared,
    },
    {
      id: `${workOrderId}-concept-b`,
      name: 'Editorial Journal',
      rationale: 'Turns the client’s expertise, voice, and evidence into a distinctive publication-like experience.',
      website: {
        composition: 'asymmetric editorial lead → annotated evidence → vertical story chapters → signature close',
        imageBehavior: 'mixed portrait, detail, and archival crops with caption-style evidence',
        typeBehavior: 'magazine scale changes, pull quotes, narrow readable text columns',
        motion: 'measured page turns, line reveals, and anchored editorial transitions',
      },
      portal: {
        composition: 'personal briefing cover followed by guided chapters and documents',
        tone: 'private journal and executive briefing, never an administrative dashboard',
      },
      ...shared,
    },
    {
      id: `${workOrderId}-concept-c`,
      name: 'Intimate Studio',
      rationale: 'Creates a warm, premium relationship-first experience suited to personal influence and trust.',
      website: {
        composition: 'portrait-led introduction → tactile studio moments → guided pathways → personal invitation',
        imageBehavior: 'warm environmental portraits, hands-at-work details, material texture',
        typeBehavior: 'elegant display typography with handwritten or signature accents used sparingly',
        motion: 'soft depth, deliberate parallax, and quiet pathway transitions',
      },
      portal: {
        composition: 'personal welcome, one next step, recent progress, and direct relationship touchpoints',
        tone: 'private studio and trusted companion rather than software',
      },
      ...shared,
    },
  ];

  return {
    conceptSetVersion: 1,
    workOrderId,
    organizationName,
    recommendedConceptId: concepts[0].id,
    recommendationReason:
      'Cinematic Documentary best satisfies the story-first and human-evidence requirements by default.',
    selectedConceptId: null,
    selectionStatus: 'awaiting_review',
    sharedRequirements: {
      experiencePrinciples: direction.experiencePrinciples || [],
      homepageStoryBeats: direction.homepageStoryBeats || [],
      antiPatterns: direction.antiPatterns || [],
      portalContinuity: direction.portalContinuity || null,
      sourceAssetInventory: direction.sourceAssetInventory || [],
    },
    concepts,
  };
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
  const creative = planningArtifact(artifacts, 'creative_direction');

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
    creative?.id,
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
  const conceptsArtifactId = `artifact-production-experience_concepts-${workOrder.id}`;
  const conceptSet = buildExperienceConcepts({
    creative,
    organizationName: exec?.data?.organizationName || seedClient || null,
    workOrderId: workOrder.id,
  });
  const conceptsArtifact = {
    id: conceptsArtifactId,
    kind: 'experience_concepts',
    providerId: 'website-builder',
    provenance: {
      capabilityId: 'production',
      sourceType: 'creative_direction',
      sourceArtifactIds,
      seedClient,
      collectedAt: at,
      notes: `Three preview-ready experience concepts for ${workOrder.id}`,
    },
    data: conceptSet,
  };
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
      creativeDirection: creative?.data || null,
      experienceConceptsArtifactId: conceptsArtifactId,
      recommendedConceptId: conceptSet.recommendedConceptId,
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
      artifactIds: [websiteArtifactId, conceptsArtifactId],
      provenance: {
        capabilityId: 'production',
        sourceType: 'work_order',
        sourceArtifactIds,
        seedClient,
        collectedAt: at,
        notes: 'Website deliverable from WebsiteBuilder',
      },
      payload: {
        pageCount: pages.length,
        builderId: 'website',
        experienceConceptsArtifactId: conceptsArtifactId,
        conceptCount: conceptSet.concepts.length,
      },
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
    createReviewGate(
      {
        id: createReviewGateId('experience-concept', workOrder.id.slice(-6)),
        projectId,
        gateId: 'experience-concept',
        title: 'Experience concept review',
        description: 'Review three distinct website-and-portal directions and confirm the recommended concept',
        status: 'pending',
        required: true,
        deliverableId: deliverable.id,
        workOrderIds: [workOrder.id],
        provenance: {
          sourceType: 'experience_concepts',
          sourceArtifactIds: [conceptsArtifactId, creative?.id, ...sourceArtifactIds].filter(Boolean),
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
    conceptsArtifact,
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
