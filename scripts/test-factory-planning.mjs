/**
 * Unit + integration tests for Phase 6 Planning / WorkOrders.
 * Run: node scripts/test-factory-planning.mjs
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

const artifactMod = await import(pathToFileURL(join(root, 'lib/factory-artifact.mjs')).href);
const workOrderMod = await import(pathToFileURL(join(root, 'lib/factory-work-order.mjs')).href);
const deriveMod = await import(pathToFileURL(join(root, 'lib/factory-planning/derive.mjs')).href);
const gatesMod = await import(pathToFileURL(join(root, 'lib/factory-capability-gates.mjs')).href);
const contextMod = await import(pathToFileURL(join(root, 'lib/factory-project-context.mjs')).href);

const {
  createArtifact,
  appendArtifacts,
  listDiscoveryArtifacts,
  listPlanningArtifacts,
  listWorkOrderArtifacts,
  PLANNING_DOCUMENT_KINDS,
} = artifactMod;
const {
  createWorkOrder,
  createWorkOrderId,
  workOrderToArtifactDraft,
  listWorkOrdersFromArtifacts,
  validateWorkOrderLineage,
} = workOrderMod;
const {
  derivePlanningBundle,
  validatePlanningBundle,
  planningBundleToArtifactDrafts,
} = deriveMod;
const { planningCanRun, discoveryCanRun } = gatesMod;
const {
  createProjectContext,
  appendProjectContextOutput,
  appendProjectContextArtifacts,
  withProjectContextStatus,
} = contextMod;

function discoveryFixture(projectId = 'proj-plan-1') {
  const at = '2026-07-18T21:00:00.000Z';
  const kinds = [
    ['organization_profile', { name: 'BGCA', goal: 'Youth programs', deliverable: 'Website + Portal', primaryUrl: 'https://www.bgca.org' }],
    ['programs', { items: [{ label: 'program', signal: 'keyword' }], count: 1 }],
    ['services', { items: [{ label: 'portal', signal: 'keyword' }], count: 1 }],
    ['audience_segments', { segments: [{ segment: 'youth', confidence: 0.6 }], count: 1 }],
    ['content_inventory', { entries: [{ type: 'website_page', title: 'Home', sourceArtifactId: 'r1' }], count: 1 }],
    ['technology_stack', { items: [{ name: 'Public website', category: 'web' }], count: 1, limited: true }],
    ['learning_opportunities', { opportunities: [{ label: 'training', confidence: 0.5 }], count: 1 }],
    ['accessibility_findings', { findings: [{ code: 'full_audit_not_performed', severity: 'info' }], count: 1 }],
    ['automation_opportunities', { opportunities: [{ label: 'Automate intake', confidence: 0.5 }], count: 1 }],
    ['recommendations', { recommendations: [{ id: 'rec-1', confidence: 0.7, evidence: [{ artifactId: 'x' }] }], count: 1 }],
  ];
  return kinds.map(([kind, data], index) =>
    createArtifact({
      id: `artifact-discovery-${kind}-${index}`,
      projectId,
      kind,
      providerId: 'discovery',
      provenance: {
        capabilityId: 'discovery',
        sourceType: 'research_artifacts',
        sourceArtifactIds: ['artifact-organization-organization-1'],
        collectedAt: at,
        seedClient: 'BGCA',
      },
      data,
    }),
  );
}

// --- Unit: WorkOrder model ---
{
  let threw = false;
  try {
    createWorkOrder({
      id: 'wo-bad',
      projectId: 'p1',
      type: 'website',
      title: 'Site',
      provenance: { capabilityId: 'planning', sourceArtifactIds: [] },
    });
  } catch {
    threw = true;
  }
  assert(threw, 'WorkOrder requires sourceArtifactIds');

  const wo = createWorkOrder({
    id: createWorkOrderId('website', 't1'),
    projectId: 'p1',
    type: 'website',
    title: 'Build site',
    summary: 'From planning',
    priority: 'high',
    acceptanceCriteria: ['Sitemap complete'],
    provenance: {
      capabilityId: 'planning',
      sourceArtifactIds: ['artifact-discovery-organization_profile-0'],
      seedClient: 'BGCA',
      collectedAt: '2026-07-18T21:00:00.000Z',
    },
  });
  assert(wo.provenance.sourceArtifactIds.length === 1, 'work order lineage present');
  const draft = workOrderToArtifactDraft(wo);
  assert(draft.kind === 'work_order', 'work order serializes to work_order artifact');
  assert(draft.provenance.sourceArtifactIds[0] === 'artifact-discovery-organization_profile-0', 'draft keeps lineage');
}

// --- Unit: derive planning bundle ---
{
  const discovery = discoveryFixture();
  const bundle = derivePlanningBundle(discovery, {
    projectId: 'proj-plan-1',
    seedClient: 'BGCA',
    deliverable: 'Website + Portal',
    intakeOutputId: 'intake-1',
  });
  const validated = validatePlanningBundle(bundle);
  assert(validated.ok, `bundle valid: ${validated.errors.join('; ')}`);
  assert(bundle.drafts.length === PLANNING_DOCUMENT_KINDS.length, '11 planning document kinds');
  assert(bundle.workOrders.length >= 6, 'emits multiple WorkOrders');
  assert(validateWorkOrderLineage(bundle.workOrders).ok, 'work order lineage ok');

  for (const draft of bundle.drafts) {
    assert(draft.provenance.capabilityId === 'planning', `${draft.kind} capability planning`);
    assert(draft.provenance.sourceArtifactIds.length > 0, `${draft.kind} has discovery lineage`);
    for (const id of draft.provenance.sourceArtifactIds) {
      assert(
        discovery.some((d) => d.id === id),
        `${draft.kind} source ${id} is discovery artifact`,
      );
    }
  }

  for (const wo of bundle.workOrders) {
    assert(wo.provenance.capabilityId === 'planning', `${wo.id} capability planning`);
    assert(wo.acceptanceCriteria.length > 0, `${wo.id} has acceptance criteria`);
  }

  const { allDrafts } = planningBundleToArtifactDrafts(bundle);
  assert(
    allDrafts.filter((d) => d.kind === 'work_order').length === bundle.workOrders.length,
    'all work orders become artifact drafts',
  );
}

// --- Unit: planningCanRun gate ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-plan-gate',
      client: 'BGCA',
      goal: 'Youth',
      deliverable: 'Website + Portal',
      source: 'api',
    },
    'DISCOVERING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'discovery-1',
    kind: 'discovery',
    worker: 'discovery',
    payload: { phase: 5 },
  });
  ctx = appendProjectContextArtifacts(ctx, discoveryFixture(ctx.projectId));
  assert(discoveryCanRun(ctx) === false, 'discovery idle after discovery output');
  assert(planningCanRun(ctx) === true, 'planning canRun at DISCOVERING with discovery artifacts');

  ctx = appendProjectContextOutput(ctx, {
    id: 'planning-1',
    kind: 'planning',
    worker: 'planning',
    payload: { phase: 6 },
  });
  assert(planningCanRun(ctx) === false, 'planning idle after planning output');
}

// --- Integration: discovery → planning artifacts + work orders (no network) ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-plan-int',
      client: 'BGCA',
      goal: 'Youth programs',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'DISCOVERING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'discovery-out',
    kind: 'discovery',
    worker: 'discovery',
    payload: { phase: 5 },
  });
  const discovery = discoveryFixture(ctx.projectId);
  ctx = appendProjectContextArtifacts(ctx, discovery);
  assert(listDiscoveryArtifacts(ctx.artifacts).length === 10, 'integration has 10 discovery artifacts');

  const bundle = derivePlanningBundle(listDiscoveryArtifacts(ctx.artifacts), {
    projectId: ctx.projectId,
    seedClient: 'BGCA',
    deliverable: ctx.seed.deliverable,
  });
  const at = '2026-07-18T22:00:00.000Z';
  const { allDrafts } = planningBundleToArtifactDrafts(bundle);
  const created = allDrafts.map((draft) =>
    createArtifact({
      id: draft.id || `artifact-planning-${draft.kind}-x`,
      projectId: ctx.projectId,
      kind: draft.kind,
      providerId: 'planning',
      provenance: { ...draft.provenance, collectedAt: at },
      data: draft.data,
    }),
  );
  const merged = appendArtifacts(ctx.artifacts, created);
  ctx = appendProjectContextArtifacts(ctx, merged.artifacts, at);
  ctx = withProjectContextStatus(ctx, 'PLANNING', at);
  ctx = appendProjectContextOutput(
    ctx,
    {
      id: 'planning-out',
      kind: 'planning',
      worker: 'planning',
      payload: {
        phase: 6,
        planningArtifactCount: listPlanningArtifacts(merged.artifacts).length,
        workOrderCount: bundle.workOrders.length,
        workOrderIds: bundle.workOrders.map((w) => w.id),
      },
    },
    at,
  );

  assert(listPlanningArtifacts(ctx.artifacts).length === 11, '11 planning document artifacts');
  assert(listWorkOrderArtifacts(ctx.artifacts).length === bundle.workOrders.length, 'work_order artifacts present');
  assert(listWorkOrdersFromArtifacts(ctx.artifacts).length === bundle.workOrders.length, 'WorkOrders recoverable');
  assert(ctx.pipelineStatus === 'PLANNING', 'status PLANNING');
  assert(listDiscoveryArtifacts(ctx.artifacts).length === 10, 'discovery artifacts preserved append-only');
  assert(
    listWorkOrdersFromArtifacts(ctx.artifacts).every((w) => w.provenance.sourceArtifactIds.length > 0),
    'all WorkOrders have discovery lineage',
  );
}

// --- Contract: unchanged surfaces + no network/AI ---
{
  const paths = {
    derive: join(root, 'lib/factory-planning/derive.mjs'),
    workOrder: join(root, 'lib/factory-work-order.mjs'),
    capability: join(root, 'lib/factory-capabilities/planning-capability.ts'),
    artifactTs: join(root, 'lib/factory-artifact.ts'),
    docs: join(root, 'docs/architecture/planning-capability.md'),
    orchestrator: join(root, 'lib/factory-orchestrator.ts'),
    registry: join(root, 'lib/factory-capability-registry.mjs'),
    projectContext: join(root, 'lib/factory-project-context.mjs'),
    launchApi: join(root, 'app/api/launch/route.ts'),
    bootstrap: join(root, 'lib/factory-capabilities/index.ts'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}`);
  }

  const capability = readFileSync(paths.capability, 'utf8');
  const derive = readFileSync(paths.derive, 'utf8');
  const artifactTs = readFileSync(paths.artifactTs, 'utf8');
  const docs = readFileSync(paths.docs, 'utf8');
  const bootstrap = readFileSync(paths.bootstrap, 'utf8');

  assert(capability.includes('listDiscoveryArtifacts'), 'planning consumes discovery artifacts');
  assert(capability.includes('derivePlanningBundle'), 'planning uses derive bundle');
  assert(!capability.includes('fetch('), 'planning capability has no fetch');
  assert(!derive.includes('fetch('), 'derive has no fetch');
  assert(artifactTs.includes('listPlanningArtifacts'), 'ArtifactService planning helper');
  assert(artifactTs.includes('appendWorkOrders'), 'ArtifactService appendWorkOrders helper');
  assert(artifactTs.includes('provenanceFromDiscoveryArtifacts'), 'planning provenance helper');
  assert(bootstrap.includes('planningCapability'), 'bootstrap registers planning');
  assert(docs.includes('WorkOrder'), 'docs cover WorkOrders');
  assert(docs.includes('Launcher, Orchestrator, Capability Registry mechanics, ProjectContext schema'), 'docs note unchanged surfaces');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory planning / WorkOrder unit + integration tests');
