/**
 * Unit + integration tests for Phase 7 Production Framework / WebsiteBuilder.
 * Run: node scripts/test-factory-production.mjs
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const workOrderMod = await import(pathToFileURL(join(root, 'lib/factory-work-order.mjs')).href);
const deliverableMod = await import(pathToFileURL(join(root, 'lib/factory-deliverable.mjs')).href);
const reviewMod = await import(pathToFileURL(join(root, 'lib/factory-review-gate.mjs')).href);
const progressMod = await import(pathToFileURL(join(root, 'lib/factory-production-progress.mjs')).href);
const builderRegMod = await import(pathToFileURL(join(root, 'lib/factory-builder-registry.mjs')).href);
const websiteMod = await import(pathToFileURL(join(root, 'lib/factory-builders/website-builder.mjs')).href);
const gatesMod = await import(pathToFileURL(join(root, 'lib/factory-capability-gates.mjs')).href);
const contextMod = await import(pathToFileURL(join(root, 'lib/factory-project-context.mjs')).href);
const artifactMod = await import(pathToFileURL(join(root, 'lib/factory-artifact.mjs')).href);
const planningMod = await import(pathToFileURL(join(root, 'lib/factory-planning/derive.mjs')).href);

const {
  createWorkOrder,
  createWorkOrderId,
  workOrderToArtifactDraft,
  listWorkOrdersFromArtifacts,
  listPendingWorkOrders,
} = workOrderMod;
const { createDeliverable, createDeliverableId, listDeliverablesFromArtifacts } = deliverableMod;
const { createReviewGate, createReviewGateId, listReviewGatesFromArtifacts, summarizeReviewGates } =
  reviewMod;
const { createProductionProgress, computeWorkOrderMetrics } = progressMod;
const { createBuilderRegistry } = builderRegMod;
const { websiteBuilder, buildWebsiteDeliverable } = websiteMod;
const { productionCanRun, planningCanRun } = gatesMod;
const {
  createProjectContext,
  appendProjectContextOutput,
  appendProjectContextArtifacts,
  withProjectContextStatus,
} = contextMod;
const { createArtifact, appendArtifacts, PRODUCTION_ARTIFACT_KINDS } = artifactMod;

function baseWorkOrder(projectId = 'proj-prod-1') {
  return createWorkOrder({
    id: createWorkOrderId('website', 't1'),
    projectId,
    type: 'website',
    title: 'BGCA marketing website',
    summary: 'Build site',
    priority: 'high',
    status: 'ready',
    acceptanceCriteria: ['Sitemap implemented'],
    provenance: {
      capabilityId: 'planning',
      sourceArtifactIds: ['artifact-discovery-organization_profile-0'],
      seedClient: 'BGCA',
      collectedAt: '2026-07-18T22:00:00.000Z',
    },
  });
}

function planningArtifacts(projectId) {
  const at = '2026-07-18T22:00:00.000Z';
  const mk = (kind, data) =>
    createArtifact({
      id: `artifact-planning-${kind}-1`,
      projectId,
      kind,
      providerId: 'planning',
      provenance: {
        capabilityId: 'planning',
        sourceType: 'discovery_artifacts',
        sourceArtifactIds: ['artifact-discovery-organization_profile-0'],
        collectedAt: at,
        seedClient: 'BGCA',
      },
      data,
    });
  return [
    mk('executive_summary', { organizationName: 'BGCA', primaryUrl: 'https://www.bgca.org' }),
    mk('website_sitemap', {
      nodes: [
        { path: '/', title: 'Home', order: 1 },
        { path: '/about', title: 'About', order: 2 },
        { path: '/programs', title: 'Programs', order: 3 },
      ],
      primaryUrl: 'https://www.bgca.org',
    }),
    mk('navigation_tree', { primary: [{ label: 'Home', href: '/' }] }),
    mk('information_architecture', { sections: [{ id: 'home', label: 'Home' }] }),
  ];
}

// --- Unit: models ---
{
  assert(PRODUCTION_ARTIFACT_KINDS.includes('website_site'), 'production kinds include website_site');
  const d = createDeliverable({
    id: createDeliverableId('website', 'x'),
    projectId: 'p1',
    type: 'website',
    title: 'Site',
    workOrderIds: ['wo-1'],
    provenance: { sourceArtifactIds: ['a1'] },
  });
  assert(d.status === 'ready_for_review', 'deliverable default status');

  const gate = createReviewGate({
    id: createReviewGateId('website-content', 'x'),
    projectId: 'p1',
    gateId: 'website-content',
    title: 'Content review',
    provenance: { sourceArtifactIds: ['a1'] },
  });
  assert(gate.status === 'pending', 'review gate pending');
  assert(summarizeReviewGates([gate]).pending === 1, 'gate summary');

  const progress = createProductionProgress({
    projectId: 'p1',
    metrics: { workOrdersInScope: 2, workOrdersComplete: 1, workOrdersPending: 1 },
  });
  assert(progress.percentComplete === 50, 'progress percent');
}

// --- Unit: WorkOrder latest + pending ---
{
  const wo = baseWorkOrder();
  const readyDraft = workOrderToArtifactDraft(wo);
  const complete = createWorkOrder({
    ...wo,
    status: 'complete',
    createdAt: '2026-07-18T23:00:00.000Z',
    payload: { completedByBuilder: 'website' },
  });
  const completeDraft = workOrderToArtifactDraft(complete);
  assert(readyDraft.id !== completeDraft.id, 'complete snapshot uses distinct artifact id');
  const arts = [
    createArtifact({ ...readyDraft, projectId: wo.projectId, provenance: { ...readyDraft.provenance, collectedAt: readyDraft.provenance.collectedAt }, data: readyDraft.data }),
    createArtifact({
      ...completeDraft,
      projectId: wo.projectId,
      provenance: { ...completeDraft.provenance, collectedAt: complete.createdAt },
      data: completeDraft.data,
    }),
  ];
  const latest = listWorkOrdersFromArtifacts(arts);
  assert(latest.length === 1, 'latest collapses by work order id');
  assert(latest[0].status === 'complete', 'latest status is complete');
  assert(listPendingWorkOrders(arts).length === 0, 'no pending after complete');
}

// --- Unit: Builder Registry + WebsiteBuilder ---
{
  const registry = createBuilderRegistry();
  registry.register(websiteBuilder);
  assert(registry.getByWorkOrderType('website')?.id === 'website', 'registry resolves website builder');
  assert(registry.getByWorkOrderType('portal') === null, 'no portal builder');

  const projectId = 'proj-prod-wb';
  const wo = baseWorkOrder(projectId);
  const woArt = createArtifact({
    ...workOrderToArtifactDraft(wo),
    projectId,
    provenance: {
      ...workOrderToArtifactDraft(wo).provenance,
      collectedAt: '2026-07-18T22:00:00.000Z',
    },
  });
  const contextArts = [...planningArtifacts(projectId), woArt];
  const result = buildWebsiteDeliverable(wo, {
    artifacts: contextArts,
    projectId,
    seedClient: 'BGCA',
  });
  assert(result.ok === true, 'website builder ok');
  assert(result.websiteArtifact?.kind === 'website_site', 'produces website_site');
  assert(result.websiteArtifact?.data?.pageCount === 3, 'pages from sitemap');
  assert(result.deliverable?.type === 'website', 'deliverable website');
  assert(result.reviewGates?.length === 2, 'two review gates');
  assert(result.completedWorkOrder?.status === 'complete', 'marks work order complete');
  assert(result.completedWorkOrder?.provenance?.capabilityId === 'planning', 'WO contract capabilityId preserved');
  assert(result.drafts.some((d) => d.kind === 'work_order'), 'completion draft included');
}

// --- Unit: productionCanRun ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-prod-gate',
      client: 'BGCA',
      goal: 'Youth',
      deliverable: 'Website + Portal',
      source: 'api',
    },
    'PLANNING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'planning-1',
    kind: 'planning',
    worker: 'planning',
    payload: { phase: 6 },
  });
  const wo = baseWorkOrder(ctx.projectId);
  ctx = appendProjectContextArtifacts(ctx, [
    createArtifact({
      ...workOrderToArtifactDraft(wo),
      projectId: ctx.projectId,
      provenance: {
        ...workOrderToArtifactDraft(wo).provenance,
        collectedAt: '2026-07-18T22:00:00.000Z',
      },
    }),
  ]);
  assert(planningCanRun(ctx) === false, 'planning idle after planning output');
  assert(productionCanRun(ctx) === true, 'production canRun with pending website WO');

  const done = createWorkOrder({
    ...wo,
    status: 'complete',
    createdAt: '2026-07-18T23:30:00.000Z',
  });
  ctx = appendProjectContextArtifacts(ctx, [
    createArtifact({
      ...workOrderToArtifactDraft(done),
      projectId: ctx.projectId,
      provenance: {
        ...workOrderToArtifactDraft(done).provenance,
        collectedAt: done.createdAt,
      },
    }),
  ]);
  assert(productionCanRun(ctx) === false, 'production idle when website WO complete');
}

// --- Integration: planning WOs → WebsiteBuilder → artifacts/progress ---
{
  const projectId = 'proj-prod-int';
  let ctx = createProjectContext(
    {
      projectId,
      client: 'BGCA',
      goal: 'Youth programs',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'PLANNING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'planning-out',
    kind: 'planning',
    worker: 'planning',
    payload: { phase: 6 },
  });

  // Minimal discovery ids for planning bundle lineage
  const discoveryStub = createArtifact({
    id: 'artifact-discovery-organization_profile-0',
    projectId,
    kind: 'organization_profile',
    providerId: 'discovery',
    provenance: {
      capabilityId: 'discovery',
      sourceType: 'research_artifacts',
      sourceArtifactIds: ['artifact-organization-organization-1'],
      collectedAt: '2026-07-18T20:00:00.000Z',
      seedClient: 'BGCA',
    },
    data: { name: 'BGCA', goal: 'Youth programs', deliverable: 'Website + Portal' },
  });

  const bundle = planningMod.derivePlanningBundle(
    [
      discoveryStub,
      ...[
        'programs',
        'services',
        'audience_segments',
        'content_inventory',
        'technology_stack',
        'learning_opportunities',
        'accessibility_findings',
        'automation_opportunities',
        'recommendations',
      ].map((kind, index) =>
        createArtifact({
          id: `artifact-discovery-${kind}-${index}`,
          projectId,
          kind,
          providerId: 'discovery',
          provenance: {
            capabilityId: 'discovery',
            sourceType: 'research_artifacts',
            sourceArtifactIds: ['artifact-organization-organization-1'],
            collectedAt: '2026-07-18T20:00:00.000Z',
            seedClient: 'BGCA',
          },
          data: { count: 0, items: [], segments: [], entries: [], opportunities: [], findings: [], recommendations: [] },
        }),
      ),
    ],
    { projectId, seedClient: 'BGCA', deliverable: 'Website + Portal' },
  );

  const { allDrafts } = planningMod.planningBundleToArtifactDrafts(bundle);
  const planningArts = allDrafts.map((draft) =>
    createArtifact({
      id: draft.id || `artifact-planning-${draft.kind}-x`,
      projectId,
      kind: draft.kind,
      providerId: 'planning',
      provenance: {
        ...draft.provenance,
        collectedAt: '2026-07-18T22:00:00.000Z',
      },
      data: draft.data,
    }),
  );

  ctx = appendProjectContextArtifacts(ctx, [discoveryStub, ...planningArts]);
  assert(listPendingWorkOrders(ctx.artifacts, 'website').length === 1, 'pending website WO');

  const websiteWo = listPendingWorkOrders(ctx.artifacts, 'website')[0];
  const built = buildWebsiteDeliverable(websiteWo, {
    artifacts: ctx.artifacts,
    projectId,
    seedClient: 'BGCA',
  });
  assert(built.ok, 'integration builder ok');

  const merged = appendArtifacts(
    ctx.artifacts,
    built.drafts.map((d) => ({
      ...d,
      projectId,
      provenance: { ...d.provenance, collectedAt: d.provenance.collectedAt || '2026-07-18T23:00:00.000Z' },
    })),
  );

  const progress = createProductionProgress({
    projectId,
    metrics: {
      ...computeWorkOrderMetrics(listWorkOrdersFromArtifacts(merged.artifacts), ['website']),
      buildersRun: 1,
      websiteArtifactsCreated: 1,
      deliverablesCreated: 1,
      reviewGatesCreated: 2,
    },
    builderRuns: [{ builderId: 'website', ok: true }],
  });

  ctx = appendProjectContextArtifacts(ctx, merged.artifacts);
  ctx = withProjectContextStatus(ctx, 'BUILDING');
  ctx = appendProjectContextOutput(ctx, {
    id: 'production-out',
    kind: 'production',
    worker: 'production',
    payload: { phase: 7, metrics: progress.metrics, percentComplete: progress.percentComplete },
  });

  assert(ctx.pipelineStatus === 'BUILDING', 'status BUILDING');
  assert(ctx.artifacts.some((a) => a.kind === 'website_site'), 'has website_site');
  assert(listDeliverablesFromArtifacts(ctx.artifacts).length === 1, 'has deliverable');
  assert(listReviewGatesFromArtifacts(ctx.artifacts).length === 2, 'has review gates');
  assert(listPendingWorkOrders(ctx.artifacts, 'website').length === 0, 'website WO complete');
  assert(listWorkOrdersFromArtifacts(ctx.artifacts).find((w) => w.type === 'website')?.status === 'complete', 'website complete');
  assert(progress.percentComplete === 100, 'website in-scope 100%');
  assert(productionCanRun(ctx) === false, 'production idle after website complete');
}

// --- Contract: preserved surfaces + no other builders ---
{
  const paths = {
    production: join(root, 'lib/factory-capabilities/production-capability.ts'),
    websiteBuilder: join(root, 'lib/factory-builders/website-builder.mjs'),
    builderRegistry: join(root, 'lib/factory-builder-registry.mjs'),
    docs: join(root, 'docs/architecture/production-framework.md'),
    orchestrator: join(root, 'lib/factory-orchestrator.ts'),
    capabilityRegistry: join(root, 'lib/factory-capability-registry.mjs'),
    projectContext: join(root, 'lib/factory-project-context.mjs'),
    launchApi: join(root, 'app/api/launch/route.ts'),
    bootstrap: join(root, 'lib/factory-capabilities/index.ts'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}`);
  }

  const production = readFileSync(paths.production, 'utf8');
  const websiteBuilderSrc = readFileSync(paths.websiteBuilder, 'utf8');
  const docs = readFileSync(paths.docs, 'utf8');
  const bootstrap = readFileSync(paths.bootstrap, 'utf8');
  const buildersIndex = readFileSync(join(root, 'lib/factory-builders/index.ts'), 'utf8');

  assert(production.includes('listPendingWorkOrders'), 'controller reads pending WorkOrders');
  assert(production.includes('getByWorkOrderType') || production.includes('Builder'), 'dispatches builders');
  assert(production.includes('[factory-production] metrics'), 'logs metrics');
  assert(websiteBuilderSrc.includes("workOrderType: 'website'") || websiteBuilderSrc.includes("type !== 'website'"), 'website-only builder');
  assert(!buildersIndex.includes('portalBuilder'), 'no portal builder registered');
  assert(!buildersIndex.includes('learningBuilder'), 'no learning builder registered');
  assert(!buildersIndex.includes('reportBuilder'), 'no report builder registered');
  assert(bootstrap.includes('productionCapability'), 'bootstrap registers production');
  assert(bootstrap.includes('bootstrapBuilderRegistry'), 'bootstrap builders with capabilities');
  assert(docs.includes('Builder Registry'), 'docs cover builder registry');
  assert(docs.includes('Review Gates') || docs.includes('review_gate'), 'docs cover review gates');
  assert(docs.includes('Deliverable'), 'docs cover deliverable');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory production / WebsiteBuilder unit + integration tests');
