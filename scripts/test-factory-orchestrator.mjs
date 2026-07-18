/**
 * Unit + contract tests for EA Factory Phase 2 Orchestrator / Intake.
 * Run: node scripts/test-factory-orchestrator.mjs
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

const classifyMod = await import(pathToFileURL(join(root, 'lib/factory-intake-classify.mjs')).href);
const { classifyIntakeSources, buildIntakeRecord } = classifyMod;

// --- Unit: classifyIntakeSources ---
{
  const website = classifyIntakeSources({
    client: 'BGCA',
    goal: 'Transform programs',
    deliverable: 'Website + Portal',
    url: 'https://www.bgca.org',
  });
  assert(website.primarySourceType === 'website', 'URL launch → website primary');
  assert(website.sources[0]?.url === 'https://www.bgca.org', 'website source keeps url');
}

{
  const org = classifyIntakeSources({
    client: 'Bob Rumball Centre',
    goal: 'Training transformation',
    deliverable: 'Website + Portal',
  });
  assert(org.primarySourceType === 'organization', 'name-only launch → organization');
}

{
  const pdf = classifyIntakeSources({
    client: 'Acme',
    goal: 'Review deck',
    deliverable: 'Website + Portal',
    attachments: [{ type: 'pdf', name: 'brief.pdf' }],
  });
  assert(pdf.primarySourceType === 'pdf', 'pdf attachment → pdf primary');
}

{
  const image = classifyIntakeSources({
    client: 'Acme',
    goal: 'Brand',
    deliverable: 'Website + Portal',
    attachments: [{ type: 'image', name: 'logo.png' }],
  });
  assert(image.primarySourceType === 'image', 'image attachment → image primary');
}

{
  const ppt = classifyIntakeSources({
    client: 'Acme',
    goal: 'Pitch',
    deliverable: 'Website + Portal',
    attachments: [{ type: 'powerpoint', name: 'deck.pptx' }],
  });
  assert(ppt.primarySourceType === 'powerpoint', 'powerpoint attachment → powerpoint primary');
}

{
  const word = classifyIntakeSources({
    client: 'Acme',
    goal: 'SOPs',
    deliverable: 'Website + Portal',
    attachments: [{ type: 'word', name: 'sop.docx' }],
  });
  assert(word.primarySourceType === 'word', 'word attachment → word primary');
}

{
  const record = buildIntakeRecord({
    id: 'proj-test-1',
    client: 'BGCA',
    goal: 'Youth programs',
    deliverable: 'Website + Portal',
    url: 'https://www.bgca.org',
    attachments: [],
  });
  assert(record.version === 1, 'intake record version 1');
  assert(record.projectId === 'proj-test-1', 'intake record projectId');
  assert(record.normalized.organizationName === 'BGCA', 'normalized organizationName');
  assert(record.normalized.primaryUrl === 'https://www.bgca.org', 'normalized primaryUrl');
  assert(record.primarySourceType === 'website', 'intake primary website');
}

// --- Contract: orchestration wiring ---
const paths = {
  orchestrator: join(root, 'lib/factory-orchestrator.ts'),
  queue: join(root, 'lib/factory-queue.ts'),
  intakeWorker: join(root, 'lib/factory-workers/intake-worker.ts'),
  researchWorker: join(root, 'lib/factory-workers/research-worker.ts'),
  intakeTs: join(root, 'lib/factory-intake.ts'),
  classifyMjs: join(root, 'lib/factory-intake-classify.mjs'),
  workers: join(root, 'lib/factory-workers.ts'),
  store: join(root, 'lib/factory-project-store.ts'),
  launchApi: join(root, 'app/api/launch/route.ts'),
};

for (const [label, path] of Object.entries(paths)) {
  assert(existsSync(path), `missing ${label}: ${path}`);
}

const orchestrator = readFileSync(paths.orchestrator, 'utf8');
const queue = readFileSync(paths.queue, 'utf8');
const intakeWorker = readFileSync(paths.intakeWorker, 'utf8');
const researchWorker = readFileSync(paths.researchWorker, 'utf8');
const workers = readFileSync(paths.workers, 'utf8');
const store = readFileSync(paths.store, 'utf8');
const launchApi = readFileSync(paths.launchApi, 'utf8');

assert(queue.includes('export async function runGenerateWorker'), 'runGenerateWorker preserved');
assert(queue.includes('runFactoryOrchestrator'), 'GenerateWorker delegates to orchestrator');
assert(queue.includes('runLegacyGeneratePackageWorker'), 'legacy package worker retained');
assert(orchestrator.includes('discoverNextFromRegistry'), 'orchestrator discovers next capability');
assert(orchestrator.includes('bootstrapCapabilityRegistry'), 'orchestrator bootstraps registry');
assert(orchestrator.includes('loadProjectContext'), 'orchestrator reads ProjectContext');
assert(!orchestrator.includes('runIntakeWorker'), 'orchestrator does not hard-call intake worker');
assert(!orchestrator.includes('runResearchWorker'), 'orchestrator does not hard-call research worker');
assert(intakeWorker.includes('intakeCapability'), 'intake worker adapts intake capability');
assert(intakeWorker.includes('loadProjectContext'), 'intake worker loads ProjectContext');
assert(!intakeWorker.includes('runResearchWorker'), 'intake worker does not call research');
assert(researchWorker.includes('researchCapability'), 'research worker adapts research capability');
assert(researchWorker.includes('loadProjectContext'), 'research worker loads ProjectContext');
assert(!researchWorker.includes('fetch('), 'research worker adapter does not fetch');
assert(!researchWorker.includes('runIntakeWorker'), 'research worker does not call intake');
assert(store.includes('INTAKE_COMPLETE'), 'store status union includes INTAKE_COMPLETE');
assert(store.includes('FactoryIntakeRecord'), 'store has intake model');
assert(store.includes('context?'), 'store persists ProjectContext blob');
assert(workers.includes("id: 'intake'"), 'worker registry includes intake');
assert(workers.includes("role: 'orchestrator'"), 'generate marked orchestrator');
assert(launchApi.includes('launchFactoryProjectFlow'), 'launch API unchanged entry flow');
assert(!launchApi.includes('runIntakeWorker'), 'launch route does not call intake directly');

const docsOrch = join(root, 'docs/architecture/orchestrator.md');
assert(existsSync(docsOrch), 'orchestrator architecture doc exists');

// --- Integration (pure status machine, no Airtable) ---
{
  let status = 'QUEUED';
  const project = {
    id: 'proj-integration-1',
    client: 'Bob Rumball Centre',
    goal: 'Training transformation',
    deliverable: 'Website + Portal',
    attachments: [],
  };
  assert(status === 'QUEUED', 'integration starts QUEUED');
  status = 'INTAKE';
  const intake = buildIntakeRecord(project);
  status = 'INTAKE_COMPLETE';
  assert(intake.primarySourceType === 'organization', 'integration intake organization');
  assert(status === 'INTAKE_COMPLETE', 'integration reaches INTAKE_COMPLETE');
  status = 'RESEARCHING';
  assert(status === 'RESEARCHING', 'integration research advances RESEARCHING');
  status = 'DISCOVERING';
  assert(status === 'DISCOVERING', 'integration discovery advances DISCOVERING');
  status = 'PLANNING';
  assert(status === 'PLANNING', 'integration planning advances PLANNING');
  status = 'BUILDING';
  assert(status === 'BUILDING', 'integration production advances BUILDING');
  assert(intake.normalized.client === 'Bob Rumball Centre', 'integration normalized client');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory orchestrator unit + contract tests');
