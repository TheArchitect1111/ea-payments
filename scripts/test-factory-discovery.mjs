/**
 * Unit + integration tests for Phase 5 Discovery Capability.
 * Run: node scripts/test-factory-discovery.mjs
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
const contextMod = await import(pathToFileURL(join(root, 'lib/factory-project-context.mjs')).href);
const deriveMod = await import(pathToFileURL(join(root, 'lib/factory-discovery/derive.mjs')).href);
const gatesMod = await import(pathToFileURL(join(root, 'lib/factory-capability-gates.mjs')).href);

const {
  createArtifact,
  appendArtifacts,
  listResearchArtifacts,
  listArtifactsByCapability,
  DISCOVERY_ARTIFACT_KINDS,
  RESEARCH_ARTIFACT_KINDS,
} = artifactMod;
const { createProjectContext, appendProjectContextOutput, appendProjectContextArtifacts, withProjectContextStatus } =
  contextMod;
const {
  deriveDiscoveryDrafts,
  validateDiscoveryDraftLineage,
  createRecommendation,
  DISCOVERY_ARTIFACT_KINDS: DERIVE_KINDS,
} = deriveMod;
const { discoveryCanRun, researchCanRun } = gatesMod;

function researchFixture(projectId = 'proj-disc-1') {
  const at = '2026-07-18T18:00:00.000Z';
  return [
    createArtifact({
      id: 'artifact-metadata-metadata-1',
      projectId,
      kind: 'metadata',
      providerId: 'metadata',
      provenance: { capabilityId: 'research', sourceType: 'launch', collectedAt: at, seedClient: 'BGCA' },
      data: { client: 'BGCA', primarySourceType: 'website', hasUrl: true, source: 'api' },
    }),
    createArtifact({
      id: 'artifact-organization-organization-1',
      projectId,
      kind: 'organization',
      providerId: 'organization',
      provenance: { capabilityId: 'research', sourceType: 'organization', collectedAt: at, seedClient: 'BGCA' },
      data: {
        organizationName: 'BGCA',
        client: 'BGCA',
        goal: 'Youth programs and training',
        deliverable: 'Website + Portal',
        industry: 'nonprofit',
        primaryUrl: 'https://www.bgca.org',
      },
    }),
    createArtifact({
      id: 'artifact-website-website-1',
      projectId,
      kind: 'website',
      providerId: 'website',
      provenance: {
        capabilityId: 'research',
        sourceType: 'website',
        sourceUrl: 'https://www.bgca.org',
        collectedAt: at,
        seedClient: 'BGCA',
      },
      data: {
        url: 'https://www.bgca.org',
        ok: true,
        contentType: 'text/html',
        extracted: {
          title: 'Boys & Girls Clubs of America',
          description: 'Youth development programs and community services',
          ogImage: 'https://cdn.example/og.png',
          textPreview: 'Great futures start here. Programs for youth and families.',
          h1: ['Great Futures Start Here'],
          navLabels: ['About', 'Programs', 'Contact'],
          ctas: ['Join today'],
        },
      },
    }),
    createArtifact({
      id: 'artifact-document-document-1',
      projectId,
      kind: 'document',
      providerId: 'document',
      provenance: { capabilityId: 'research', sourceType: 'pdf', collectedAt: at, seedClient: 'BGCA' },
      data: { name: 'brief.pdf', type: 'pdf', textPreview: 'Training curriculum for staff onboarding' },
    }),
    createArtifact({
      id: 'artifact-branding-branding-1',
      projectId,
      kind: 'branding',
      providerId: 'branding',
      provenance: { capabilityId: 'research', sourceType: 'image', collectedAt: at, seedClient: 'BGCA' },
      data: {
        brandName: 'BGCA',
        suggestedClientName: 'Boys & Girls Clubs',
        assetType: 'image',
        name: 'logo.png',
        hasVision: true,
        entityType: 'organization',
        whoTheyAre: 'A youth development nonprofit building great futures.',
        whatTheyDo: 'After-school programs and mentoring',
        audience: 'Youth and families',
        offer: 'Clubs, programs, and mentoring',
        cta: 'Join today',
        visionSummary: 'Youth programs with a clear membership ask.',
      },
    }),
  ];
}

// --- Unit: kinds + recommendation shape ---
{
  assert(DISCOVERY_ARTIFACT_KINDS.length === 10, '10 discovery artifact kinds');
  assert(DERIVE_KINDS.length === 10, 'derive exports 10 kinds');
  assert(RESEARCH_ARTIFACT_KINDS.length === 5, '5 research kinds preserved');

  const rec = createRecommendation({
    id: 'rec-1',
    title: 'Test',
    category: 'organization',
    summary: 'Summary',
    evidence: [{ artifactId: 'a1', kind: 'organization', field: 'name', excerpt: 'BGCA' }],
    confidence: 1.5,
    priority: 'high',
  });
  assert(rec.confidence === 1, 'confidence confidence clamped to 1');
  assert(rec.evidence[0].artifactId === 'a1', 'recommendation evidence artifactId');
}

// --- Unit: derive all kinds + lineage ---
{
  const research = researchFixture();
  const drafts = deriveDiscoveryDrafts(research, { seedClient: 'BGCA', intakeOutputId: 'intake-1' });
  const kinds = drafts.map((d) => d.kind).sort();
  const expected = [...DISCOVERY_ARTIFACT_KINDS].sort();
  assert(kinds.join(',') === expected.join(','), `derive emits all kinds (got ${kinds.join(',')})`);

  const lineage = validateDiscoveryDraftLineage(drafts);
  assert(lineage.ok, `lineage ok: ${lineage.errors.join('; ')}`);

  for (const draft of drafts) {
    assert(draft.provenance.capabilityId === 'discovery', `${draft.kind} capabilityId discovery`);
    assert(
      Array.isArray(draft.provenance.sourceArtifactIds) && draft.provenance.sourceArtifactIds.length > 0,
      `${draft.kind} has sourceArtifactIds`,
    );
    for (const id of draft.provenance.sourceArtifactIds) {
      assert(
        research.some((r) => r.id === id),
        `${draft.kind} sourceArtifactId ${id} is a research artifact`,
      );
    }
  }

  const recommendations = drafts.find((d) => d.kind === 'recommendations');
  const recs = recommendations?.data?.recommendations || [];
  assert(recs.length >= 2, 'recommendations has multiple items');
  assert(
    recs.every((r) => typeof r.confidence === 'number' && Array.isArray(r.evidence) && r.evidence.length > 0),
    'each recommendation has confidence + evidence',
  );

  const orgProfile = drafts.find((d) => d.kind === 'organization_profile');
  assert(orgProfile?.data?.whatTheyDo === 'After-school programs and mentoring', 'org profile whatTheyDo from branding');
  assert(orgProfile?.data?.audience === 'Youth and families', 'org profile audience from branding');
  assert(orgProfile?.data?.entityType === 'organization', 'org profile entityType');
  assert(orgProfile?.data?.websiteTextPreview?.includes('Great futures'), 'org profile websiteTextPreview');
}

// --- Unit: discoveryCanRun gate ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-gate',
      client: 'BGCA',
      goal: 'Youth',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'RESEARCHING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'research-1',
    kind: 'research',
    worker: 'research',
    payload: { stub: false },
  });
  const research = researchFixture(ctx.projectId);
  ctx = appendProjectContextArtifacts(ctx, research);

  assert(researchCanRun(ctx) === false, 'research cannot re-run at RESEARCHING');
  assert(discoveryCanRun(ctx) === true, 'discovery canRun at RESEARCHING with research artifacts');

  ctx = withProjectContextStatus(ctx, 'DISCOVERING');
  ctx = appendProjectContextOutput(ctx, {
    id: 'discovery-1',
    kind: 'discovery',
    worker: 'discovery',
    payload: { phase: 5 },
  });
  assert(discoveryCanRun(ctx) === false, 'discovery idle after discovery output');
}

// --- Integration: research artifacts → discovery artifacts on context (no network) ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-int-disc',
      client: 'BGCA',
      goal: 'Youth programs',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'RESEARCHING',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-1',
    kind: 'intake',
    worker: 'intake',
    payload: { intake: { primarySourceType: 'website' } },
  });
  ctx = appendProjectContextOutput(ctx, {
    id: 'research-1',
    kind: 'research',
    worker: 'research',
    payload: { stub: false, phase: 4 },
  });

  const research = researchFixture(ctx.projectId);
  ctx = appendProjectContextArtifacts(ctx, research);
  assert(listResearchArtifacts(ctx.artifacts).length === 5, 'integration has 5 research artifacts');

  const drafts = deriveDiscoveryDrafts(listResearchArtifacts(ctx.artifacts), {
    seedClient: 'BGCA',
    intakeOutputId: 'intake-1',
  });
  const at = '2026-07-18T19:00:00.000Z';
  const created = drafts.map((draft, index) =>
    createArtifact({
      id: `artifact-discovery-${draft.kind}-${index}`,
      projectId: ctx.projectId,
      kind: draft.kind,
      providerId: 'discovery',
      provenance: { ...draft.provenance, collectedAt: at },
      data: draft.data,
    }),
  );

  const merged = appendArtifacts(ctx.artifacts, created);
  ctx = appendProjectContextArtifacts(ctx, merged.artifacts, at);
  ctx = withProjectContextStatus(ctx, 'DISCOVERING', at);
  ctx = appendProjectContextOutput(
    ctx,
    {
      id: 'discovery-out-1',
      kind: 'discovery',
      worker: 'discovery',
      payload: {
        phase: 5,
        discoveryArtifactIds: created.map((a) => a.id),
        researchArtifactIds: research.map((a) => a.id),
      },
    },
    at,
  );

  const discoveryArts = listArtifactsByCapability(ctx.artifacts, 'discovery');
  assert(discoveryArts.length === 10, `integration discovery artifacts 10 (got ${discoveryArts.length})`);
  assert(ctx.pipelineStatus === 'DISCOVERING', 'integration status DISCOVERING');
  assert(
    discoveryArts.every((a) => a.provenance.sourceArtifactIds?.length > 0),
    'all discovery artifacts have lineage',
  );
  assert(
    listResearchArtifacts(ctx.artifacts).length === 5,
    'research artifacts preserved append-only',
  );
}

// --- Integration: document-only research (no website) ---
{
  const at = '2026-07-18T20:00:00.000Z';
  const research = [
    createArtifact({
      id: 'artifact-organization-organization-doc',
      projectId: 'proj-doc',
      kind: 'organization',
      providerId: 'organization',
      provenance: { capabilityId: 'research', sourceType: 'organization', collectedAt: at, seedClient: 'Acme' },
      data: {
        organizationName: 'Acme',
        goal: 'Training transformation',
        deliverable: 'Website + Portal',
      },
    }),
    createArtifact({
      id: 'artifact-document-document-doc',
      projectId: 'proj-doc',
      kind: 'document',
      providerId: 'document',
      provenance: { capabilityId: 'research', sourceType: 'pdf', collectedAt: at, seedClient: 'Acme' },
      data: { name: 'brief.pdf', type: 'pdf', textPreview: 'Learning workshop for members' },
    }),
    createArtifact({
      id: 'artifact-metadata-metadata-doc',
      projectId: 'proj-doc',
      kind: 'metadata',
      providerId: 'metadata',
      provenance: { capabilityId: 'research', sourceType: 'launch', collectedAt: at, seedClient: 'Acme' },
      data: { primarySourceType: 'pdf', hasUrl: false },
    }),
  ];

  const drafts = deriveDiscoveryDrafts(research, { seedClient: 'Acme' });
  assert(drafts.length === 10, 'document path still emits 10 discovery kinds');
  const recs = drafts.find((d) => d.kind === 'recommendations')?.data?.recommendations || [];
  assert(
    recs.some((r) => r.id === 'rec-document-first' || r.title.toLowerCase().includes('document')),
    'document-first recommendation when no website',
  );
  assert(validateDiscoveryDraftLineage(drafts).ok, 'document path lineage ok');
}

// --- Contract: no network in discovery; wiring ---
{
  const paths = {
    derive: join(root, 'lib/factory-discovery/derive.mjs'),
    capability: join(root, 'lib/factory-capabilities/discovery-capability.ts'),
    docs: join(root, 'docs/architecture/discovery-capability.md'),
    gates: join(root, 'lib/factory-capability-gates.mjs'),
    bootstrap: join(root, 'lib/factory-capabilities/index.ts'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}`);
  }

  const capability = readFileSync(paths.capability, 'utf8');
  const derive = readFileSync(paths.derive, 'utf8');
  const docs = readFileSync(paths.docs, 'utf8');
  const bootstrap = readFileSync(paths.bootstrap, 'utf8');

  assert(capability.includes('listResearchArtifacts'), 'discovery reads research artifacts only');
  assert(capability.includes('deriveDiscoveryDrafts'), 'discovery uses derive engine');
  assert(capability.includes('appendArtifacts'), 'discovery appends via ArtifactService');
  assert(!capability.includes('fetch('), 'discovery capability has no fetch');
  assert(!derive.includes('fetch('), 'derive engine has no fetch');
  assert(bootstrap.includes('discoveryCapability'), 'bootstrap registers discovery');
  assert(docs.includes('sourceArtifactIds'), 'docs cover lineage');
  assert(docs.includes('artifact lineage') || docs.includes('Artifact lineage'), 'docs have lineage section');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory discovery unit + integration tests');
