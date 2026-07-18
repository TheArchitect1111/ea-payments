/**
 * Unit + integration tests for Phase 4 Research / Artifacts.
 * Run: node scripts/test-factory-research.mjs
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
const extractMod = await import(pathToFileURL(join(root, 'lib/factory-research/website-extract.mjs')).href);
const providersMod = await import(pathToFileURL(join(root, 'lib/factory-research/providers.mjs')).href);

const {
  ARTIFACT_SCHEMA_VERSION,
  createArtifact,
  createArtifactId,
  appendArtifacts,
  listArtifacts,
  getArtifactById,
} = artifactMod;
const {
  PROJECT_CONTEXT_SCHEMA_VERSION,
  createProjectContext,
  migrateProjectContext,
  appendProjectContextOutput,
  appendProjectContextArtifacts,
} = contextMod;
const {
  extractTitle,
  extractMetaContent,
  buildWebsiteArtifactData,
  extractHeadings,
  extractNavLabels,
  extractCtaLabels,
  selectCrawlCandidateUrls,
} = extractMod;
const {
  planMetadataArtifact,
  planOrganizationArtifact,
  planDocumentArtifacts,
  planBrandingArtifacts,
  providerCanCollect,
  resolveResearchUrl,
} = providersMod;

// --- Unit: ProjectContext v2 artifacts ---
{
  assert(PROJECT_CONTEXT_SCHEMA_VERSION === 2, 'ProjectContext schemaVersion is 2');
  const ctx = createProjectContext(
    {
      projectId: 'proj-r1',
      client: 'BGCA',
      goal: 'Programs',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'INTAKE_COMPLETE',
  );
  assert(Array.isArray(ctx.artifacts) && ctx.artifacts.length === 0, 'new context has empty artifacts');

  const migrated = migrateProjectContext({
    schemaVersion: 1,
    projectId: 'proj-old',
    seed: { client: 'X', goal: 'Y', deliverable: 'Z' },
    pipelineStatus: 'QUEUED',
    outputs: [],
  });
  assert(migrated.schemaVersion === 2, 'migrate v1 → v2');
  assert(Array.isArray(migrated.artifacts), 'migrate adds artifacts array');
}

// --- Unit: Artifact append-only + provenance ---
{
  const art = createArtifact({
    id: createArtifactId('metadata', 'metadata', 't1'),
    projectId: 'proj-r1',
    kind: 'metadata',
    providerId: 'metadata',
    provenance: {
      capabilityId: 'research',
      sourceType: 'launch',
      seedClient: 'BGCA',
      collectedAt: '2026-07-18T12:00:00.000Z',
    },
    data: { client: 'BGCA' },
  });
  assert(art.schemaVersion === ARTIFACT_SCHEMA_VERSION, 'artifact schemaVersion');
  assert(art.provenance.capabilityId === 'research', 'provenance capabilityId');

  const first = appendArtifacts([], [art]);
  assert(first.appended.length === 1, 'append adds artifact');
  const second = appendArtifacts(first.artifacts, [art]);
  assert(second.appended.length === 0, 'duplicate id skipped');
  assert(second.artifacts.length === 1, 'history not overwritten');
  assert(getArtifactById(first.artifacts, art.id)?.data.client === 'BGCA', 'get by id');
}

// --- Unit: HTML extract ---
{
  const html = `<!doctype html><html><head>
    <title>Boys &amp; Girls Clubs</title>
    <meta name="description" content="Youth programs">
    <meta property="og:image" content="https://cdn.example/og.png">
    <link rel="canonical" href="https://www.bgca.org/">
  </head><body>
    <nav><a href="/about">About</a><a href="/programs">Programs</a><a href="/contact">Contact</a></nav>
    <h1>Great Futures Start Here</h1>
    <h2>Youth development</h2>
    <a href="/join">Join today</a>
    <p>Email us at hello@bgca.org or call 555-123-4567 for membership.</p>
  </body></html>`;
  assert(extractTitle(html) === 'Boys & Girls Clubs', 'extract title entities');
  assert(extractMetaContent(html, 'description') === 'Youth programs', 'extract description');
  assert(extractHeadings(html, 'h1')[0] === 'Great Futures Start Here', 'extract h1');
  assert(extractNavLabels(html).includes('About'), 'extract nav About');
  assert(extractCtaLabels(html).some((c) => /join/i.test(c)), 'extract join CTA');
  const crawl = selectCrawlCandidateUrls(html, 'https://www.bgca.org', 3);
  assert(crawl.some((u) => /about/i.test(u)), 'crawl candidate about');
  assert(crawl.length <= 3, 'crawl candidates capped at 3');
  const data = buildWebsiteArtifactData({
    url: 'https://www.bgca.org',
    status: 200,
    contentType: 'text/html',
    html,
    extraPages: [
      {
        url: 'https://www.bgca.org/about',
        html: '<html><body><h1>Our Mission</h1><p>We enable youth to reach great futures.</p></body></html>',
      },
    ],
  });
  assert(data.ok === true, 'website data ok');
  assert(data.extracted.title === 'Boys & Girls Clubs', 'website extracted title');
  assert(data.extracted.ogImage === 'https://cdn.example/og.png', 'website og:image');
  assert(Array.isArray(data.extracted.h1) && data.extracted.h1.length > 0, 'website h1 list');
  assert(typeof data.extracted.textPreview === 'string' && data.extracted.textPreview.length > 20, 'website textPreview');
  assert(data.extracted.email === 'hello@bgca.org', 'website contact email');
  assert(data.extracted.pages?.length === 2, 'website pages include crawl');
}

// --- Unit: provider plans ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-url',
      client: 'BGCA',
      goal: 'Youth',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      attachments: [{ type: 'pdf', name: 'brief.pdf' }, { type: 'image', name: 'logo.png' }],
      source: 'api',
    },
    'INTAKE_COMPLETE',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-1',
    kind: 'intake',
    worker: 'intake',
    payload: {
      intake: {
        primarySourceType: 'website',
        normalized: { organizationName: 'BGCA', primaryUrl: 'https://www.bgca.org' },
        sources: [{ type: 'website', url: 'https://www.bgca.org' }],
      },
    },
  });

  assert(resolveResearchUrl(ctx) === 'https://www.bgca.org', 'resolve url from seed');
  assert(providerCanCollect('website', ctx), 'website canCollect with url');
  assert(providerCanCollect('document', ctx), 'document canCollect with pdf');
  assert(planMetadataArtifact(ctx).data.hasUrl === true, 'metadata hasUrl');
  assert(planOrganizationArtifact(ctx).data.organizationName === 'BGCA', 'org name');
  assert(planDocumentArtifacts(ctx).some((d) => d.data.type === 'pdf'), 'document plans pdf');
  assert(planBrandingArtifacts(ctx).some((d) => d.data.assetType === 'image'), 'branding plans image');
  assert(planBrandingArtifacts(ctx).some((d) => d.data.faviconGuess), 'branding plans favicon guess');
}

// --- Integration: URL launch → artifact collection on context ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-int-url',
      client: 'BGCA',
      goal: 'Programs',
      deliverable: 'Website + Portal',
      url: 'https://www.bgca.org',
      source: 'api',
    },
    'INTAKE_COMPLETE',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-url',
    kind: 'intake',
    worker: 'intake',
    payload: { intake: { primarySourceType: 'website', normalized: { primaryUrl: 'https://www.bgca.org' } } },
  });

  const drafts = [];
  const meta = planMetadataArtifact(ctx);
  const org = planOrganizationArtifact(ctx);
  const websiteData = buildWebsiteArtifactData({
    url: 'https://www.bgca.org',
    status: 200,
    contentType: 'text/html',
    html: '<title>BGCA</title><meta name="description" content="Clubs">',
  });
  const branding = planBrandingArtifacts(ctx);

  const at = '2026-07-18T15:00:00.000Z';
  const toCreate = [
    createArtifact({
      id: 'artifact-metadata-metadata-1',
      projectId: ctx.projectId,
      kind: 'metadata',
      providerId: 'metadata',
      provenance: { capabilityId: 'research', sourceType: 'launch', collectedAt: at, seedClient: 'BGCA' },
      data: meta.data,
    }),
    createArtifact({
      id: 'artifact-organization-organization-1',
      projectId: ctx.projectId,
      kind: 'organization',
      providerId: 'organization',
      provenance: { capabilityId: 'research', sourceType: 'organization', collectedAt: at, seedClient: 'BGCA' },
      data: org.data,
    }),
    createArtifact({
      id: 'artifact-website-website-1',
      projectId: ctx.projectId,
      kind: 'website',
      providerId: 'website',
      provenance: {
        capabilityId: 'research',
        sourceType: 'website',
        sourceUrl: 'https://www.bgca.org',
        collectedAt: at,
        seedClient: 'BGCA',
      },
      data: websiteData,
    }),
    ...branding.map((plan, index) =>
      createArtifact({
        id: `artifact-branding-branding-${index}`,
        projectId: ctx.projectId,
        kind: 'branding',
        providerId: 'branding',
        provenance: {
          capabilityId: 'research',
          sourceType: plan.sourceType,
          sourceUrl: plan.sourceUrl,
          collectedAt: at,
          seedClient: 'BGCA',
        },
        data: plan.data,
      }),
    ),
  ];

  const merged = appendArtifacts([], toCreate);
  ctx = appendProjectContextArtifacts(ctx, merged.artifacts, at);
  ctx = appendProjectContextOutput(
    ctx,
    {
      id: 'research-1',
      kind: 'research',
      worker: 'research',
      payload: {
        stub: false,
        phase: 4,
        artifactIds: merged.artifacts.map((a) => a.id),
        artifactCount: merged.artifacts.length,
      },
    },
    at,
  );

  assert(ctx.artifacts.length >= 4, `url launch artifacts >= 4 (got ${ctx.artifacts.length})`);
  assert(listArtifacts(ctx.artifacts, 'website').length === 1, 'has website artifact');
  assert(listArtifacts(ctx.artifacts, 'organization').length === 1, 'has organization artifact');
  assert(listArtifacts(ctx.artifacts, 'metadata').length === 1, 'has metadata artifact');
  assert(ctx.outputs.some((o) => o.kind === 'research' && o.payload.stub === false), 'research output not stub');
  assert(ctx.artifacts.every((a) => a.provenance.capabilityId === 'research'), 'all provenance research');
}

// --- Integration: document launch → document + metadata artifacts ---
{
  let ctx = createProjectContext(
    {
      projectId: 'proj-int-doc',
      client: 'Acme',
      goal: 'Review brief',
      deliverable: 'Website + Portal',
      attachments: [{ type: 'pdf', name: 'brief.pdf', textPreview: 'Acme transformation brief' }],
      source: 'api',
    },
    'INTAKE_COMPLETE',
  );
  ctx = appendProjectContextOutput(ctx, {
    id: 'intake-doc',
    kind: 'intake',
    worker: 'intake',
    payload: { intake: { primarySourceType: 'pdf', sources: [{ type: 'pdf', name: 'brief.pdf' }] } },
  });

  assert(providerCanCollect('website', ctx) === false, 'doc launch website canCollect false');
  const docs = planDocumentArtifacts(ctx);
  assert(docs.length >= 1, 'document plans at least one');
  const created = docs.map((plan, index) =>
    createArtifact({
      id: `artifact-document-document-${index}`,
      projectId: ctx.projectId,
      kind: 'document',
      providerId: 'document',
      provenance: {
        capabilityId: 'research',
        sourceType: plan.sourceType,
        sourceName: plan.sourceName,
        collectedAt: '2026-07-18T16:00:00.000Z',
        seedClient: 'Acme',
      },
      data: plan.data,
    }),
  );
  const meta = createArtifact({
    id: 'artifact-metadata-metadata-doc',
    projectId: ctx.projectId,
    kind: 'metadata',
    providerId: 'metadata',
    provenance: {
      capabilityId: 'research',
      sourceType: 'launch',
      collectedAt: '2026-07-18T16:00:00.000Z',
      seedClient: 'Acme',
    },
    data: planMetadataArtifact(ctx).data,
  });
  const merged = appendArtifacts([], [...created, meta]);
  ctx = appendProjectContextArtifacts(ctx, merged.artifacts);
  assert(listArtifacts(ctx.artifacts, 'document').length >= 1, 'doc launch has document artifact');
  assert(listArtifacts(ctx.artifacts, 'metadata').length === 1, 'doc launch has metadata');
  assert(
    listArtifacts(ctx.artifacts, 'document')[0].data.textPreview === 'Acme transformation brief',
    'document preserves textPreview',
  );
}

// --- Contract: wiring (orchestrator/registry untouched; research uses providers) ---
{
  const paths = {
    artifactMjs: join(root, 'lib/factory-artifact.mjs'),
    artifactTs: join(root, 'lib/factory-artifact.ts'),
    researchCap: join(root, 'lib/factory-capabilities/research-capability.ts'),
    runProviders: join(root, 'lib/factory-research/run-providers.ts'),
    websiteProvider: join(root, 'lib/factory-research/website-provider.ts'),
    docs: join(root, 'docs/architecture/research-capability.md'),
    orchestrator: join(root, 'lib/factory-orchestrator.ts'),
    registry: join(root, 'lib/factory-capability-registry.mjs'),
  };
  for (const [label, path] of Object.entries(paths)) {
    assert(existsSync(path), `missing ${label}`);
  }

  const researchCap = readFileSync(paths.researchCap, 'utf8');
  const runProviders = readFileSync(paths.runProviders, 'utf8');
  const docs = readFileSync(paths.docs, 'utf8');

  assert(researchCap.includes('collectResearchArtifacts'), 'research uses provider runner');
  assert(researchCap.includes('appendArtifacts'), 'research uses ArtifactService');
  assert(!researchCap.includes('stub: true'), 'research no longer stub:true');
  assert(runProviders.includes('metadataProvider'), 'runner includes metadata');
  assert(runProviders.includes('organizationProvider'), 'runner includes organization');
  assert(runProviders.includes('websiteProvider'), 'runner includes website');
  assert(runProviders.includes('documentProvider'), 'runner includes document');
  assert(runProviders.includes('brandingProvider'), 'runner includes branding');
  assert(docs.includes('ArtifactService'), 'docs cover ArtifactService');
  assert(docs.includes('Orchestrator + Capability Registry dispatch mechanics unchanged'), 'docs note unchanged dispatch');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('PASS factory research / artifact unit + integration tests');
