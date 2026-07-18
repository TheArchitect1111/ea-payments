/**
 * Unit + integration tests for CapabilityRegistry / Manifest / discovery.
 * Run: node scripts/test-factory-capability-registry.mjs
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

const registryMod = await import(pathToFileURL(join(root, 'lib/factory-capability-registry.mjs')).href);
const manifestMod = await import(pathToFileURL(join(root, 'lib/factory-capability-manifest.mjs')).href);
const gatesMod = await import(pathToFileURL(join(root, 'lib/factory-capability-gates.mjs')).href);
const contextMod = await import(pathToFileURL(join(root, 'lib/factory-project-context.mjs')).href);

const {
  createCapabilityRegistry,
  dependenciesSatisfied,
  discoverNextCapability,
} = registryMod;
const {
  CAPABILITY_MANIFEST,
  listManifestCapabilityIds,
  validateManifest,
  getManifestEntry,
} = manifestMod;
const { intakeCanRun, researchCanRun, discoveryCanRun, planningCanRun, productionCanRun } = gatesMod;
const {
  createProjectContext,
  appendProjectContextOutput,
  withProjectContextStatus,
} = contextMod;

// --- Unit: manifest ---
{
  const validated = validateManifest(CAPABILITY_MANIFEST);
  assert(validated.ok, `manifest valid: ${validated.errors.join('; ')}`);
  const order = listManifestCapabilityIds();
  assert(order[0] === 'intake', 'manifest order starts with intake');
  assert(order[1] === 'research', 'manifest order research after intake');
  assert(order[2] === 'discovery', 'manifest order discovery after research');
  assert(order[3] === 'planning', 'manifest order planning after discovery');
  assert(getManifestEntry('research')?.dependencies.includes('intake'), 'research depends on intake');
  assert(getManifestEntry('discovery')?.implemented === true, 'discovery implemented in manifest');
  assert(getManifestEntry('discovery')?.dependencies.includes('research'), 'discovery depends on research');
  assert(getManifestEntry('planning')?.implemented === true, 'planning implemented in manifest');
  assert(getManifestEntry('planning')?.dependencies.includes('discovery'), 'planning depends on discovery');
  assert(order[4] === 'production', 'manifest order production after planning');
  assert(getManifestEntry('production')?.implemented === true, 'production implemented in manifest');
  assert(getManifestEntry('production')?.dependencies.includes('planning'), 'production depends on planning');
}

// --- Unit: registry register / get / list ---
{
  const registry = createCapabilityRegistry();
  let threw = false;
  try {
    registry.register({ id: 'bad' });
  } catch {
    threw = true;
  }
  assert(threw, 'register rejects incomplete capability');

  const cap = {
    id: 'intake',
    dependencies: [],
    canRun: () => true,
    execute: async () => ({ ran: true }),
  };
  registry.register(cap);
  assert(registry.get('intake') === cap, 'get returns registered capability');
  assert(registry.list().length === 1, 'list has one capability');
  assert(registry.size() === 1, 'size is 1');
}

// --- Unit: dependenciesSatisfied ---
{
  const research = { id: 'research', dependencies: ['intake'], canRun: () => true, execute: async () => ({}) };
  assert(!dependenciesSatisfied(research, { outputs: [] }), 'deps unsatisfied without intake output');
  assert(
    dependenciesSatisfied(research, { outputs: [{ kind: 'intake', id: '1' }] }),
    'deps satisfied with intake output',
  );
}

// --- Unit: discoverNext with mocks ---
{
  const caps = [
    {
      id: 'research',
      dependencies: ['intake'],
      canRun: (ctx) => ctx.pipelineStatus === 'INTAKE_COMPLETE',
      execute: async () => ({ ran: true }),
    },
    {
      id: 'intake',
      dependencies: [],
      canRun: (ctx) => ctx.pipelineStatus === 'QUEUED',
      execute: async () => ({ ran: true }),
    },
  ];
  const order = ['intake', 'research'];

  const queued = discoverNextCapability(caps, { pipelineStatus: 'QUEUED', outputs: [] }, order);
  assert(queued?.id === 'intake', 'QUEUED discovers intake');

  const blocked = discoverNextCapability(
    caps,
    { pipelineStatus: 'INTAKE_COMPLETE', outputs: [] },
    order,
  );
  assert(blocked === null, 'INTAKE_COMPLETE without intake output does not run research');

  const researchReady = discoverNextCapability(
    caps,
    { pipelineStatus: 'INTAKE_COMPLETE', outputs: [{ kind: 'intake', id: 'i1' }] },
    order,
  );
  assert(researchReady?.id === 'research', 'INTAKE_COMPLETE + intake output discovers research');

  const failed = discoverNextCapability(caps, { pipelineStatus: 'FAILED', outputs: [] }, order);
  assert(failed === null, 'FAILED discovers nothing');
}

// --- Unit: real gates ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-cap-1',
      client: 'BGCA',
      goal: 'Programs',
      deliverable: 'Website + Portal',
      source: 'api',
    },
    'QUEUED',
  );
  assert(intakeCanRun(ctx) === true, 'intake canRun on QUEUED');
  assert(researchCanRun(ctx) === false, 'research cannot run on QUEUED');

  ctx = withProjectContextStatus(ctx, 'INTAKE_COMPLETE');
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-1',
    kind: 'intake',
    worker: 'intake',
    payload: { intake: { primarySourceType: 'organization' } },
  });
  assert(intakeCanRun(ctx) === false, 'intake cannot re-run after complete');
  assert(researchCanRun(ctx) === true, 'research canRun after intake complete');
}

// --- Integration: registry discover loop (in-memory, no Airtable) ---
{
  const registry = createCapabilityRegistry();
  const orderIds = listManifestCapabilityIds();

  let ctx = createProjectContext(
    {
      projectId: 'proj-cap-int',
      client: 'Bob Rumball Centre',
      goal: 'Training',
      deliverable: 'Website + Portal',
      source: 'api',
    },
    'QUEUED',
  );

  registry.register({
    id: 'intake',
    dependencies: [],
    canRun: intakeCanRun,
    execute: async (context) => {
      let next = withProjectContextStatus(context, 'INTAKE');
      next = appendProjectContextOutput(next, {
        id: 'intake-int-1',
        kind: 'intake',
        worker: 'intake',
        payload: { intake: { primarySourceType: 'organization' } },
      });
      next = withProjectContextStatus(next, 'INTAKE_COMPLETE');
      return { ran: true, context: next };
    },
  });

  registry.register({
    id: 'research',
    dependencies: ['intake'],
    canRun: researchCanRun,
    execute: async (context) => {
      let next = appendProjectContextOutput(context, {
        id: 'research-int-1',
        kind: 'research',
        worker: 'research',
        payload: { stub: false },
      });
      // Minimal research artifact so discovery deps/gates can proceed in this pure test
      next = {
        ...next,
        artifacts: [
          ...(next.artifacts || []),
          {
            schemaVersion: 1,
            id: 'artifact-organization-organization-int',
            projectId: next.projectId,
            kind: 'organization',
            providerId: 'organization',
            createdAt: next.updatedAt,
            provenance: {
              capabilityId: 'research',
              sourceType: 'organization',
              collectedAt: next.updatedAt,
              seedClient: next.seed.client,
            },
            data: { organizationName: next.seed.client, goal: next.seed.goal },
          },
        ],
      };
      next = withProjectContextStatus(next, 'RESEARCHING');
      return { ran: true, context: next };
    },
  });

  const deriveMod = await import(pathToFileURL(join(root, 'lib/factory-discovery/derive.mjs')).href);

  registry.register({
    id: 'discovery',
    dependencies: ['research'],
    canRun: discoveryCanRun,
    execute: async (context) => {
      const drafts = deriveMod.deriveDiscoveryDrafts(context.artifacts || [], {
        seedClient: context.seed.client,
      });
      let next = {
        ...context,
        artifacts: [
          ...(context.artifacts || []),
          ...drafts.map((draft, index) => ({
            schemaVersion: 1,
            id: `artifact-discovery-${draft.kind}-${index}`,
            projectId: context.projectId,
            kind: draft.kind,
            providerId: 'discovery',
            createdAt: context.updatedAt,
            provenance: { ...draft.provenance, collectedAt: context.updatedAt },
            data: draft.data,
          })),
        ],
      };
      next = appendProjectContextOutput(next, {
        id: 'discovery-int-1',
        kind: 'discovery',
        worker: 'discovery',
        payload: { phase: 5 },
      });
      next = withProjectContextStatus(next, 'DISCOVERING');
      return { ran: true, context: next };
    },
  });

  const planningMod = await import(pathToFileURL(join(root, 'lib/factory-planning/derive.mjs')).href);
  registry.register({
    id: 'planning',
    dependencies: ['discovery'],
    canRun: planningCanRun,
    execute: async (context) => {
      const discoveryArts = (context.artifacts || []).filter(
        (a) => a.provenance?.capabilityId === 'discovery',
      );
      const bundle = planningMod.derivePlanningBundle(discoveryArts, {
        projectId: context.projectId,
        seedClient: context.seed.client,
        deliverable: context.seed.deliverable,
      });
      const { allDrafts } = planningMod.planningBundleToArtifactDrafts(bundle);
      let next = {
        ...context,
        artifacts: [
          ...(context.artifacts || []),
          ...allDrafts.map((draft, index) => ({
            schemaVersion: 1,
            id: draft.id || `artifact-planning-${draft.kind}-${index}`,
            projectId: context.projectId,
            kind: draft.kind,
            providerId: 'planning',
            createdAt: context.updatedAt,
            provenance: { ...draft.provenance, collectedAt: context.updatedAt },
            data: draft.data,
          })),
        ],
      };
      next = appendProjectContextOutput(next, {
        id: 'planning-int-1',
        kind: 'planning',
        worker: 'planning',
        payload: { phase: 6, workOrderCount: bundle.workOrders.length },
      });
      next = withProjectContextStatus(next, 'PLANNING');
      return { ran: true, context: next };
    },
  });

  const websiteMod = await import(pathToFileURL(join(root, 'lib/factory-builders/website-builder.mjs')).href);
  registry.register({
    id: 'production',
    dependencies: ['planning'],
    canRun: productionCanRun,
    execute: async (context) => {
      const byId = new Map();
      for (const item of context.artifacts || []) {
        if (item.kind !== 'work_order') continue;
        const wo = item.data?.workOrder;
        if (!wo?.id) continue;
        const prev = byId.get(wo.id);
        if (!prev || String(wo.createdAt || '') >= String(prev.createdAt || '')) byId.set(wo.id, wo);
      }
      const websitePending = [...byId.values()].filter(
        (wo) => wo.type === 'website' && wo.status !== 'complete',
      );
      let next = { ...context, artifacts: [...(context.artifacts || [])] };
      for (const wo of websitePending) {
        const built = websiteMod.buildWebsiteDeliverable(wo, {
          artifacts: next.artifacts,
          projectId: context.projectId,
          seedClient: context.seed.client,
        });
        if (!built.ok) continue;
        next.artifacts = [
          ...next.artifacts,
          ...built.drafts.map((draft) => ({
            schemaVersion: 1,
            id: draft.id,
            projectId: context.projectId,
            kind: draft.kind,
            providerId: draft.providerId,
            createdAt: context.updatedAt,
            provenance: { ...draft.provenance, collectedAt: context.updatedAt },
            data: draft.data,
          })),
        ];
      }
      next = appendProjectContextOutput(next, {
        id: 'production-int-1',
        kind: 'production',
        worker: 'production',
        payload: { phase: 7 },
      });
      next = withProjectContextStatus(next, 'BUILDING');
      return { ran: true, context: next };
    },
  });

  const dispatched = [];
  for (let step = 0; step < 12; step += 1) {
    const next = registry.discoverNext(ctx, { orderIds });
    if (!next) break;
    dispatched.push(next.id);
    const result = await next.execute(ctx);
    ctx = result.context;
  }

  assert(
    dispatched.join('>') === 'intake>research>discovery>planning>production',
    `integration dispatch order ${dispatched.join('>')}`,
  );
  assert(ctx.pipelineStatus === 'BUILDING', 'integration ends BUILDING');
  assert(ctx.outputs.some((o) => o.kind === 'intake'), 'integration has intake output');
  assert(ctx.outputs.some((o) => o.kind === 'research'), 'integration has research output');
  assert(ctx.outputs.some((o) => o.kind === 'discovery'), 'integration has discovery output');
  assert(ctx.outputs.some((o) => o.kind === 'planning'), 'integration has planning output');
  assert(ctx.outputs.some((o) => o.kind === 'production'), 'integration has production output');
  assert(registry.discoverNext(ctx, { orderIds }) === null, 'integration idle after production');
}

// --- Contract: wiring ---
{
  const paths = {
    registry: join(root, 'lib/factory-capability-registry.mjs'),
    manifest: join(root, 'lib/factory-capability-manifest.mjs'),
    gates: join(root, 'lib/factory-capability-gates.mjs'),
    capabilityTs: join(root, 'lib/factory-capability.ts'),
    intakeCap: join(root, 'lib/factory-capabilities/intake-capability.ts'),
    researchCap: join(root, 'lib/factory-capabilities/research-capability.ts'),
    bootstrap: join(root, 'lib/factory-capabilities/index.ts'),
    orchestrator: join(root, 'lib/factory-orchestrator.ts'),
    docsManifest: join(root, 'docs/architecture/capability-manifest.md'),
    docsOrch: join(root, 'docs/architecture/orchestrator.md'),
    launchApi: join(root, 'app/api/launch/route.ts'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}: ${path}`);
  }

  const orchestrator = readFileSync(paths.orchestrator, 'utf8');
  const intakeCap = readFileSync(paths.intakeCap, 'utf8');
  const researchCap = readFileSync(paths.researchCap, 'utf8');
  const bootstrap = readFileSync(paths.bootstrap, 'utf8');
  const docsOrch = readFileSync(paths.docsOrch, 'utf8');
  const launchApi = readFileSync(paths.launchApi, 'utf8');

  assert(orchestrator.includes('discoverNextFromRegistry'), 'orchestrator discovers from registry');
  assert(orchestrator.includes('bootstrapCapabilityRegistry'), 'orchestrator bootstraps registry');
  assert(orchestrator.includes("'RESEARCHING'"), 'orchestrator drain includes RESEARCHING for discovery');
  assert(!orchestrator.includes('runIntakeWorker'), 'orchestrator no longer hard-calls intake worker');
  assert(!orchestrator.includes('runResearchWorker'), 'orchestrator no longer hard-calls research worker');

  assert(intakeCap.includes('intakeCapability'), 'intake capability exported');
  assert(intakeCap.includes('dependencies: []'), 'intake has empty dependencies');
  assert(researchCap.includes("dependencies: ['intake']"), 'research depends on intake');
  assert(researchCap.includes('collectResearchArtifacts'), 'research runs providers');
  assert(researchCap.includes('appendArtifacts'), 'research appends artifacts');
  assert(bootstrap.includes('discoveryCapability'), 'bootstrap registers discovery');
  assert(bootstrap.includes('planningCapability'), 'bootstrap registers planning');
  assert(bootstrap.includes('productionCapability'), 'bootstrap registers production');

  assert(docsOrch.includes('CapabilityRegistry') || docsOrch.includes('Capability'), 'orchestrator doc mentions capabilities');
  assert(launchApi.includes('launchFactoryProjectFlow'), 'launch API entry preserved');
  assert(!launchApi.includes('discoverNextFromRegistry'), 'launch route does not dispatch capabilities');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory CapabilityRegistry unit + integration tests');
