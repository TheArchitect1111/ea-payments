/**
 * Pure Planning derivation — Discovery artifacts → Planning artifacts + WorkOrders.
 * No external requests. No AI generation.
 */

import { listDiscoveryArtifacts, PLANNING_DOCUMENT_KINDS } from '../factory-artifact.mjs';
import {
  createWorkOrder,
  createWorkOrderId,
  validateWorkOrderLineage,
  workOrderToArtifactDraft,
} from '../factory-work-order.mjs';

export { PLANNING_DOCUMENT_KINDS };

function byKind(artifacts, kind) {
  return artifacts.filter((item) => item.kind === kind);
}

function first(artifacts, kind) {
  return byKind(artifacts, kind)[0] || null;
}

function idsOf(artifacts) {
  return artifacts.map((item) => item.id).filter(Boolean);
}

function baseProvenance(sourceArtifactIds, seedClient, intakeOutputId, notes) {
  return {
    capabilityId: 'planning',
    sourceType: 'discovery_artifacts',
    sourceArtifactIds: [...sourceArtifactIds],
    seedClient,
    intakeOutputId,
    notes,
  };
}

/**
 * Derive planning artifact drafts + work orders from discovery artifacts only.
 * @returns {{ drafts: object[], workOrders: object[] }}
 */
export function derivePlanningBundle(discoveryArtifacts, options = {}) {
  const discovery = listDiscoveryArtifacts(discoveryArtifacts || []);
  if (discovery.length === 0) {
    return { drafts: [], workOrders: [] };
  }

  const projectId = options.projectId || discovery[0].projectId;
  const seedClient =
    options.seedClient ||
    first(discovery, 'organization_profile')?.data?.name ||
    null;
  const intakeOutputId = options.intakeOutputId;
  const deliverable = options.deliverable || 'Website + Portal';

  const profile = first(discovery, 'organization_profile');
  const programs = first(discovery, 'programs');
  const services = first(discovery, 'services');
  const audiences = first(discovery, 'audience_segments');
  const content = first(discovery, 'content_inventory');
  const tech = first(discovery, 'technology_stack');
  const learning = first(discovery, 'learning_opportunities');
  const accessibility = first(discovery, 'accessibility_findings');
  const automation = first(discovery, 'automation_opportunities');
  const recommendations = first(discovery, 'recommendations');

  const allIds = idsOf(discovery);
  const profileIds = idsOf([profile, programs, services].filter(Boolean));
  const contentIds = idsOf([content, profile, audiences].filter(Boolean));
  const portalIds = idsOf([profile, services, learning, audiences].filter(Boolean));
  const learningIds = idsOf([learning, programs, audiences].filter(Boolean));

  const orgName = profile?.data?.name || seedClient || 'Organization';
  const goal = profile?.data?.goal || 'Deliver digital experience';
  const primaryUrl = profile?.data?.primaryUrl || null;

  const drafts = [];

  // 1. Executive Summary
  drafts.push({
    kind: 'executive_summary',
    providerId: 'planning',
    provenance: baseProvenance(profileIds.length ? profileIds : allIds, seedClient, intakeOutputId),
    data: {
      organizationName: orgName,
      goal,
      deliverable,
      primaryUrl,
      highlights: [
        `${orgName} — ${goal}`,
        `Deliverable focus: ${deliverable}`,
        `Discovery artifacts consumed: ${discovery.length}`,
        recommendations?.data?.count
          ? `Discovery recommendations available: ${recommendations.data.count}`
          : 'No discovery recommendations artifact',
      ],
      audienceCount: audiences?.data?.count ?? 0,
      contentEntryCount: content?.data?.count ?? 0,
    },
  });

  // 2. Information Architecture
  const iaSections = [
    { id: 'home', label: 'Home', intent: 'Brand + primary CTA' },
    { id: 'about', label: 'About', intent: 'Organization profile' },
    { id: 'programs', label: 'Programs', intent: 'Program discovery' },
    { id: 'services', label: 'Services', intent: 'Service overview' },
    { id: 'learn', label: 'Learn', intent: 'Learning pathways' },
    { id: 'portal', label: 'Portal', intent: 'Authenticated workspace entry' },
    { id: 'contact', label: 'Contact', intent: 'Intake / contact' },
  ];
  drafts.push({
    kind: 'information_architecture',
    providerId: 'planning',
    provenance: baseProvenance(contentIds.length ? contentIds : allIds, seedClient, intakeOutputId),
    data: {
      sections: iaSections,
      principles: [
        'Public site explains; portal executes',
        'Programs and services map from discovery signals',
        'Learning content surfaces from learning_opportunities',
      ],
    },
  });

  // 3. Website Sitemap
  const sitemap = iaSections.map((section, index) => ({
    path: section.id === 'home' ? '/' : `/${section.id}`,
    title: section.label,
    order: index + 1,
    sourceSignals: section.id,
  }));
  drafts.push({
    kind: 'website_sitemap',
    providerId: 'planning',
    provenance: baseProvenance(contentIds.length ? contentIds : allIds, seedClient, intakeOutputId),
    data: { nodes: sitemap, count: sitemap.length, primaryUrl },
  });

  // 4. Navigation Tree
  drafts.push({
    kind: 'navigation_tree',
    providerId: 'planning',
    provenance: baseProvenance(contentIds.length ? contentIds : allIds, seedClient, intakeOutputId),
    data: {
      primary: sitemap.filter((n) => !['/portal'].includes(n.path)).map((n) => ({
        label: n.title,
        href: n.path,
      })),
      utility: [{ label: 'Portal Login', href: '/portal' }],
      footer: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
  });

  // 5. Portal Blueprint
  const portalModules = [
    { id: 'dashboard', label: 'Dashboard', role: 'all' },
    { id: 'programs', label: 'Programs workspace', role: 'member' },
    { id: 'learning', label: 'Learning hub', role: 'member' },
    { id: 'resources', label: 'Resources', role: 'member' },
    { id: 'admin', label: 'Admin', role: 'admin' },
  ];
  drafts.push({
    kind: 'portal_blueprint',
    providerId: 'planning',
    provenance: baseProvenance(portalIds.length ? portalIds : allIds, seedClient, intakeOutputId),
    data: {
      modules: portalModules,
      auth: { mode: 'portal-session', note: 'Use existing EA portal session patterns' },
      organizationName: orgName,
    },
  });

  // 6. Learning Architecture
  const learningOpps = learning?.data?.opportunities || [];
  drafts.push({
    kind: 'learning_architecture',
    providerId: 'planning',
    provenance: baseProvenance(learningIds.length ? learningIds : allIds, seedClient, intakeOutputId),
    data: {
      tracks: learningOpps.slice(0, 6).map((opp, index) => ({
        id: `track-${index + 1}`,
        title: opp.label || `Track ${index + 1}`,
        confidence: opp.confidence ?? 0.4,
      })),
      delivery: ['portal-learning-hub', 'short-modules', 'resource-library'],
      empty: learningOpps.length === 0,
    },
  });

  // 7. Content Strategy
  const contentEntries = content?.data?.entries || [];
  drafts.push({
    kind: 'content_strategy',
    providerId: 'planning',
    provenance: baseProvenance(contentIds.length ? contentIds : allIds, seedClient, intakeOutputId),
    data: {
      pillars: [
        { id: 'brand', label: 'Brand & story', sources: ['organization_profile', 'branding'] },
        { id: 'offer', label: 'Programs & services', sources: ['programs', 'services'] },
        { id: 'learn', label: 'Learning content', sources: ['learning_opportunities'] },
        { id: 'proof', label: 'Proof & resources', sources: ['content_inventory'] },
      ],
      inventorySeedCount: contentEntries.length,
      reuse: contentEntries.slice(0, 8).map((entry) => ({
        title: entry.title,
        type: entry.type,
        sourceArtifactId: entry.sourceArtifactId,
      })),
    },
  });

  // 8. Deliverables Matrix
  const matrix = [
    { deliverable: 'Marketing website', owner: 'website', discoveryInputs: ['organization_profile', 'content_inventory', 'recommendations'] },
    { deliverable: 'Client portal', owner: 'portal', discoveryInputs: ['services', 'audience_segments', 'learning_opportunities'] },
    { deliverable: 'Learning modules', owner: 'learning', discoveryInputs: ['learning_opportunities', 'programs'] },
    { deliverable: 'Content pack', owner: 'content', discoveryInputs: ['content_inventory', 'content_strategy'] },
    { deliverable: 'Accessibility pass', owner: 'accessibility', discoveryInputs: ['accessibility_findings'] },
  ];
  drafts.push({
    kind: 'deliverables_matrix',
    providerId: 'planning',
    provenance: baseProvenance(allIds, seedClient, intakeOutputId),
    data: { rows: matrix, count: matrix.length, primaryDeliverable: deliverable },
  });

  // 9. Production Plan
  const phases = [
    { id: 'p1', name: 'Foundation', work: ['brand tokens', 'IA lock', 'sitemap'] },
    { id: 'p2', name: 'Website build', work: ['templates', 'core pages', 'nav'] },
    { id: 'p3', name: 'Portal build', work: ['modules', 'auth shell', 'dashboards'] },
    { id: 'p4', name: 'Learning + content', work: ['tracks', 'resources', 'CMS seed'] },
    { id: 'p5', name: 'QA + review', work: ['checklist', 'accessibility', 'stakeholder review'] },
  ];
  drafts.push({
    kind: 'production_plan',
    providerId: 'planning',
    provenance: baseProvenance(allIds, seedClient, intakeOutputId),
    data: {
      phases,
      constraints: [
        'No production builders in Planning phase',
        'WorkOrders define downstream production scope',
        tech?.data?.limited
          ? 'Technology stack evidence is limited — validate during production'
          : 'Use discovery technology_stack as advisory input',
      ],
    },
  });

  // 10. Milestone Plan
  const milestones = phases.map((phase, index) => ({
    id: `m${index + 1}`,
    title: phase.name,
    sequence: index + 1,
    dependsOn: index === 0 ? [] : [`m${index}`],
    exitCriteria: phase.work,
  }));
  drafts.push({
    kind: 'milestone_plan',
    providerId: 'planning',
    provenance: baseProvenance(allIds, seedClient, intakeOutputId),
    data: { milestones, count: milestones.length },
  });

  // 11. Review Checklist
  const checklist = [
    { id: 'ia-approved', label: 'Information architecture approved', required: true },
    { id: 'sitemap-approved', label: 'Website sitemap approved', required: true },
    { id: 'portal-modules', label: 'Portal blueprint modules confirmed', required: true },
    { id: 'learning-tracks', label: 'Learning tracks prioritized', required: false },
    { id: 'a11y-followup', label: 'Accessibility follow-up scheduled', required: true },
    { id: 'workorders-ready', label: 'WorkOrders accepted for production', required: true },
  ];
  if (accessibility?.data?.findings?.length) {
    checklist.push({
      id: 'a11y-findings-reviewed',
      label: 'Discovery accessibility findings reviewed',
      required: true,
    });
  }
  drafts.push({
    kind: 'review_checklist',
    providerId: 'planning',
    provenance: baseProvenance(
      idsOf([accessibility, recommendations, profile].filter(Boolean)).length
        ? idsOf([accessibility, recommendations, profile].filter(Boolean))
        : allIds,
      seedClient,
      intakeOutputId,
    ),
    data: { items: checklist, count: checklist.length },
  });

  // WorkOrders for downstream production (not builders in this phase)
  const at = options.at || new Date().toISOString();
  const workOrderSpecs = [
    {
      type: 'website',
      title: `${orgName} marketing website`,
      summary: 'Build public website from sitemap, IA, and content strategy.',
      priority: 'high',
      deliverable: 'Website',
      acceptanceCriteria: [
        'All sitemap nodes implemented or explicitly deferred',
        'Primary navigation matches navigation_tree',
        'Organization profile facts reflected on About',
      ],
      sourceArtifactIds: contentIds.length ? contentIds : allIds,
      payload: { sitemapNodeCount: sitemap.length },
    },
    {
      type: 'portal',
      title: `${orgName} client portal`,
      summary: 'Implement portal modules from portal_blueprint.',
      priority: 'high',
      deliverable: 'Portal',
      acceptanceCriteria: [
        'Dashboard and core modules present',
        'Auth uses platform portal session patterns',
      ],
      sourceArtifactIds: portalIds.length ? portalIds : allIds,
      payload: { modules: portalModules.map((m) => m.id) },
    },
    {
      type: 'learning',
      title: `${orgName} learning architecture build`,
      summary: 'Produce learning hub tracks from learning_architecture.',
      priority: learningOpps.length ? 'medium' : 'low',
      deliverable: 'Learning',
      acceptanceCriteria: ['Learning hub route exists', 'At least one track scaffolded'],
      sourceArtifactIds: learningIds.length ? learningIds : allIds,
      payload: { trackCount: learningOpps.length },
    },
    {
      type: 'content',
      title: `${orgName} content pack`,
      summary: 'Assemble reusable content from content_strategy / inventory.',
      priority: 'medium',
      deliverable: 'Content',
      acceptanceCriteria: ['Content pillars documented', 'Inventory reuse list applied'],
      sourceArtifactIds: contentIds.length ? contentIds : allIds,
      payload: { reuseCount: contentEntries.length },
    },
    {
      type: 'accessibility',
      title: `${orgName} accessibility follow-up`,
      summary: 'Address discovery accessibility findings during QA.',
      priority: 'medium',
      deliverable: 'Accessibility',
      acceptanceCriteria: ['Checklist a11y items completed', 'Known findings triaged'],
      sourceArtifactIds: idsOf([accessibility].filter(Boolean)).length
        ? idsOf([accessibility].filter(Boolean))
        : allIds,
      payload: { findingCount: accessibility?.data?.count ?? 0 },
    },
    {
      type: 'qa',
      title: `${orgName} review checklist execution`,
      summary: 'Execute planning review_checklist before publish.',
      priority: 'high',
      deliverable: 'QA',
      acceptanceCriteria: ['All required checklist items signed off'],
      sourceArtifactIds: allIds,
      payload: { checklistCount: checklist.length },
    },
  ];

  if ((automation?.data?.opportunities || []).length > 0) {
    workOrderSpecs.push({
      type: 'automation',
      title: `${orgName} automation opportunities`,
      summary: 'Queue automation opportunities identified in discovery.',
      priority: 'low',
      deliverable: 'Automation',
      acceptanceCriteria: ['Automation candidates documented for later phase'],
      sourceArtifactIds: idsOf([automation].filter(Boolean)),
      payload: { opportunityCount: automation.data.count },
    });
  }

  const workOrders = workOrderSpecs.map((spec, index) =>
    createWorkOrder(
      {
        id: createWorkOrderId(spec.type, `p${index + 1}`),
        projectId,
        type: spec.type,
        title: spec.title,
        summary: spec.summary,
        priority: spec.priority,
        status: 'ready',
        deliverable: spec.deliverable,
        acceptanceCriteria: spec.acceptanceCriteria,
        dependencies: [],
        provenance: {
          capabilityId: 'planning',
          sourceArtifactIds: spec.sourceArtifactIds,
          seedClient,
          intakeOutputId,
          collectedAt: at,
          notes: 'Emitted by Planning Capability for downstream production',
        },
        payload: spec.payload,
      },
      at,
    ),
  );

  return { drafts, workOrders };
}

export function validatePlanningDraftLineage(drafts) {
  const errors = [];
  for (const draft of drafts || []) {
    const ids = draft.provenance?.sourceArtifactIds;
    if (!Array.isArray(ids) || ids.length === 0) {
      errors.push(`${draft.kind} missing sourceArtifactIds`);
    }
    if (draft.provenance?.capabilityId !== 'planning') {
      errors.push(`${draft.kind} capabilityId must be planning`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Build artifact drafts for planning docs + work orders (append-only). */
export function planningBundleToArtifactDrafts(bundle) {
  const docDrafts = (bundle.drafts || []).map((draft) => ({ ...draft }));
  const workOrderDrafts = (bundle.workOrders || []).map((wo) => workOrderToArtifactDraft(wo));
  return { docDrafts, workOrderDrafts, allDrafts: [...docDrafts, ...workOrderDrafts] };
}

export function validatePlanningBundle(bundle) {
  const draftLineage = validatePlanningDraftLineage(bundle.drafts);
  const workOrderLineage = validateWorkOrderLineage(bundle.workOrders);
  const kinds = (bundle.drafts || []).map((d) => d.kind).sort();
  const expected = [...PLANNING_DOCUMENT_KINDS].sort();
  const kindsOk = kinds.join(',') === expected.join(',');
  const errors = [
    ...draftLineage.errors,
    ...workOrderLineage.errors,
    ...(kindsOk ? [] : [`expected planning kinds ${expected.join(',')}, got ${kinds.join(',')}`]),
    ...((bundle.workOrders || []).length === 0 ? ['workOrders must not be empty'] : []),
  ];
  return { ok: errors.length === 0, errors };
}
