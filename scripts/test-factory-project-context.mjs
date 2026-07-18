/**
 * Unit tests for ProjectContext lifecycle (append-only, versioned).
 * Run: node scripts/test-factory-project-context.mjs
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const ctxMod = await import(pathToFileURL(join(root, 'lib/factory-project-context.mjs')).href);
const {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  createProjectContext,
  migrateProjectContext,
  appendProjectContextOutput,
  withProjectContextStatus,
  listProjectContextOutputs,
  getLatestProjectContextOutput,
  createContextOutputId,
} = ctxMod;

const seed = {
  projectId: 'proj-ctx-1',
  client: 'BGCA',
  goal: 'Youth programs',
  deliverable: 'Website + Portal',
  url: 'https://www.bgca.org',
  attachments: [],
  source: 'api',
};

// --- create ---
{
  const ctx = createProjectContext(seed, 'CREATED', '2026-07-18T12:00:00.000Z');
  assert(ctx.schemaVersion === PROJECT_CONTEXT_SCHEMA_VERSION, 'create sets schemaVersion');
  assert(ctx.projectId === 'proj-ctx-1', 'create sets projectId');
  assert(ctx.seed.client === 'BGCA', 'create sets seed.client');
  assert(ctx.pipelineStatus === 'CREATED', 'create sets pipelineStatus');
  assert(Array.isArray(ctx.outputs) && ctx.outputs.length === 0, 'create starts with empty outputs');
  assert(Array.isArray(ctx.artifacts) && ctx.artifacts.length === 0, 'create starts with empty artifacts');
  assert(ctx.createdAt === '2026-07-18T12:00:00.000Z', 'create sets createdAt');
}

// --- migrate v0 / missing version ---
{
  const migrated = migrateProjectContext({
    projectId: 'proj-old',
    seed: { client: 'Legacy', goal: 'Grow', deliverable: 'Site' },
    pipelineStatus: 'QUEUED',
    outputs: [],
  });
  assert(migrated.schemaVersion === PROJECT_CONTEXT_SCHEMA_VERSION, 'migrate bumps to current schemaVersion');
  assert(Array.isArray(migrated.artifacts), 'migrate ensures artifacts array');
  assert(migrated.seed.client === 'Legacy', 'migrate preserves seed');
  assert(migrated.pipelineStatus === 'QUEUED', 'migrate preserves status');
}

{
  let threw = false;
  try {
    migrateProjectContext({ schemaVersion: 999, projectId: 'x', seed: {}, outputs: [] });
  } catch {
    threw = true;
  }
  assert(threw, 'migrate rejects future schemaVersion');
}

// --- append-only ---
{
  let ctx = createProjectContext(seed, 'QUEUED', '2026-07-18T12:00:00.000Z');
  const intakeId = createContextOutputId('intake', 'intake', 'a1');
  ctx = appendProjectContextOutput(
    ctx,
    {
      id: intakeId,
      kind: 'intake',
      worker: 'intake',
      payload: { intake: { primarySourceType: 'website' } },
    },
    '2026-07-18T12:01:00.000Z',
  );
  assert(ctx.outputs.length === 1, 'append adds one output');
  assert(ctx.outputs[0].id === intakeId, 'append keeps output id');
  assert(ctx.updatedAt === '2026-07-18T12:01:00.000Z', 'append updates updatedAt');

  const before = ctx.outputs[0];
  ctx = appendProjectContextOutput(
    ctx,
    {
      id: createContextOutputId('research', 'research', 'b2'),
      kind: 'research',
      worker: 'research',
      payload: { stub: true },
    },
    '2026-07-18T12:02:00.000Z',
  );
  assert(ctx.outputs.length === 2, 'second append grows history');
  assert(ctx.outputs[0].id === before.id, 'prior output id unchanged');
  assert(
    JSON.stringify(ctx.outputs[0].payload) === JSON.stringify(before.payload),
    'prior output payload not overwritten',
  );
}

// --- idempotent append by id ---
{
  let ctx = createProjectContext(seed, 'INTAKE');
  const id = 'intake-intake-same';
  ctx = appendProjectContextOutput(ctx, {
    id,
    kind: 'intake',
    worker: 'intake',
    payload: { n: 1 },
  });
  ctx = appendProjectContextOutput(ctx, {
    id,
    kind: 'intake',
    worker: 'intake',
    payload: { n: 2 },
  });
  assert(ctx.outputs.length === 1, 'duplicate id does not append again');
  assert(ctx.outputs[0].payload.n === 1, 'duplicate id keeps original payload');
}

// --- status helper ---
{
  let ctx = createProjectContext(seed, 'QUEUED');
  ctx = withProjectContextStatus(ctx, 'INTAKE', '2026-07-18T13:00:00.000Z');
  assert(ctx.pipelineStatus === 'INTAKE', 'withStatus updates pipelineStatus');
  assert(ctx.updatedAt === '2026-07-18T13:00:00.000Z', 'withStatus updates updatedAt');
}

// --- list / latest ---
{
  let ctx = createProjectContext(seed, 'INTAKE_COMPLETE');
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-1',
    kind: 'intake',
    worker: 'intake',
    payload: { v: 1 },
  });
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-2',
    kind: 'intake',
    worker: 'intake',
    payload: { v: 2 },
  });
  ctx = appendProjectContextOutput(ctx, {
    id: 'research-1',
    kind: 'research',
    worker: 'research',
    payload: { stub: true },
  });

  const intakes = listProjectContextOutputs(ctx, 'intake');
  assert(intakes.length === 2, 'list filters by kind');
  const latestIntake = getLatestProjectContextOutput(ctx, 'intake');
  assert(latestIntake?.payload?.v === 2, 'latest intake is most recent');
  const latestResearch = getLatestProjectContextOutput(ctx, 'research');
  assert(latestResearch?.payload?.stub === true, 'latest research present');
  assert(getLatestProjectContextOutput(ctx, 'qa') === null, 'missing kind returns null');
}

// --- seed immutability across append ---
{
  let ctx = createProjectContext(seed, 'QUEUED');
  const client = ctx.seed.client;
  ctx = appendProjectContextOutput(ctx, {
    id: 'sys-1',
    kind: 'system',
    worker: 'system',
    payload: {},
  });
  assert(ctx.seed.client === client, 'append does not mutate seed.client');
}

// --- Contract: workers / orchestrator use ProjectContext ---
{
  const paths = {
    contextMjs: join(root, 'lib/factory-project-context.mjs'),
    contextTs: join(root, 'lib/factory-project-context.ts'),
    orchestrator: join(root, 'lib/factory-orchestrator.ts'),
    intakeWorker: join(root, 'lib/factory-workers/intake-worker.ts'),
    researchWorker: join(root, 'lib/factory-workers/research-worker.ts'),
    docs: join(root, 'docs/architecture/orchestrator.md'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}: ${path}`);
  }

  const orchestrator = readFileSync(paths.orchestrator, 'utf8');
  const intakeWorker = readFileSync(paths.intakeWorker, 'utf8');
  const researchWorker = readFileSync(paths.researchWorker, 'utf8');
  const docs = readFileSync(paths.docs, 'utf8');

  assert(orchestrator.includes('loadProjectContext'), 'orchestrator reads ProjectContext');
  assert(orchestrator.includes('ensureProjectContext'), 'orchestrator ensures ProjectContext');
  assert(orchestrator.includes('discoverNextFromRegistry'), 'orchestrator discovers capabilities');
  assert(orchestrator.includes('bootstrapCapabilityRegistry'), 'orchestrator bootstraps registry');

  assert(intakeWorker.includes('loadProjectContext'), 'intake reads ProjectContext');
  assert(intakeWorker.includes('intakeCapability'), 'intake adapts capability');
  assert(!intakeWorker.includes('runResearchWorker'), 'intake does not call research');
  assert(!intakeWorker.includes('runFactoryOrchestrator'), 'intake does not call orchestrator');

  assert(researchWorker.includes('loadProjectContext'), 'research reads ProjectContext');
  assert(researchWorker.includes('researchCapability'), 'research adapts capability');
  assert(!researchWorker.includes('runIntakeWorker'), 'research does not call intake');
  assert(!researchWorker.includes('fetch('), 'research worker adapter does not fetch');

  assert(docs.includes('ProjectContext'), 'architecture doc covers ProjectContext');
  assert(docs.includes('append-only') || docs.includes('append only') || docs.includes('Append-only'), 'docs mention append-only');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory ProjectContext lifecycle tests');
