/**
 * Phase 2D — seed Amanda Factory project (if needed), generate previews,
 * select concept, wire selected experience, smoke surfaces against production.
 *
 * Uses local env (../ea-payments/.env.local) against the shared Airtable SoR.
 * Run: npx --yes tsx scripts/runtime-wire-amanda-local.ts
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendArtifacts } from '../lib/factory-artifact';
import {
  generateAndPersistConceptPreviews,
  persistConceptSelection,
} from '../lib/factory-concept-previews';
import { createFactoryProject } from '../lib/factory-project';
import { listFactoryProjects, getFactoryProject } from '../lib/factory-project-store';
import { publishSelectedFactoryConcept } from '../lib/factory-publish-selected-concept';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.EA_WIRE_BASE || 'https://efficiencyarchitects.online').replace(
  /\/$/,
  '',
);

function loadEnvFiles() {
  for (const path of [
    join(root, '.env.local'),
    join(root, '..', 'ea-payments', '.env.local'),
  ]) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#') || !line.includes('=')) continue;
      const i = line.indexOf('=');
      const key = line.slice(0, i).trim();
      let value = line.slice(i + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function smoke(url: string | undefined | null) {
  if (!url) return { url: null, status: null, skip: true };
  const absolute = url.startsWith('http') ? url : `${BASE}${url}`;
  try {
    const res = await fetch(absolute, { method: 'GET', redirect: 'manual' });
    return {
      url: absolute,
      status: res.status,
      ok: res.status >= 200 && res.status < 400,
    };
  } catch (err) {
    return {
      url: absolute,
      status: null,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function ensureAmandaProject(): Promise<string> {
  const existing = await listFactoryProjects();
  const amanda = existing.find(
    (p) =>
      p.client.toLowerCase().includes('amanda') &&
      (p.context?.artifacts || []).some((a) => a.kind === 'experience_concepts'),
  );
  if (amanda) {
    console.log('Reusing Amanda project', amanda.id);
    return amanda.id;
  }

  const created = await createFactoryProject({
    client: 'Amanda Catherine',
    goal: 'Name-to-experience Phase 2D wire cert',
    deliverable: 'Website + Portal',
    industry: 'Personal Brand, Education, Wellness, and Speaking',
    notes: 'Phase 2D seeded project for selected-concept wire + surfaces smoke',
    source: 'api',
  });
  if (!created.ok) {
    throw new Error(`createFactoryProject failed: ${created.missing?.join(',')}`);
  }
  const projectId = created.project.id;

  const creative = {
    organizationName: 'Amanda Catherine',
    story: {
      sentence: 'Turn your gifts into purpose, impact, and sustainable opportunity.',
      audience: 'Purpose-led creators and wellness seekers',
      transformation: 'From unused gifts to a clear next path.',
      proofSignals: ['Lived mentoring', 'Creative + wellness paths'],
    },
    visualDirection: {
      style: 'editorial, cinematic, human, calm, premium',
      photography: 'documentary realism',
      typography: 'expressive editorial display',
      composition: 'image-led chapters',
      motion: 'slow purposeful reveals',
    },
    homepageStoryBeats: [
      'Who they are',
      'Why they exist',
      'Who they help',
      'Why that matters',
      'What changes',
    ],
    portalContinuity: {
      purpose: 'Continue the public story inside a calm executive workspace',
      firstView: ['where I am', 'what happened', 'what happens next'],
    },
  };

  const concepts = {
    recommendedConceptId: 'wo-amanda-concept-b',
    selectedConceptId: null,
    selectionStatus: 'awaiting_review',
    concepts: [
      {
        id: 'wo-amanda-concept-a',
        name: 'Cinematic Documentary',
        rationale: 'Leads with the human story.',
        organizationName: 'Amanda Catherine',
        story: creative.story,
        website: {
          composition: 'full-bleed threshold hero',
          imageBehavior: 'documentary photography',
          typeBehavior: 'high-contrast editorial headlines',
          motion: 'slow scene reveals',
        },
        portal: { composition: 'single next-best-action hero', tone: 'concierge workspace' },
      },
      {
        id: 'wo-amanda-concept-b',
        name: 'Editorial Journal',
        rationale: 'Publication-like experience.',
        organizationName: 'Amanda Catherine',
        story: creative.story,
        website: {
          composition: 'asymmetric editorial lead',
          imageBehavior: 'mixed portrait crops',
          typeBehavior: 'magazine scale changes',
          motion: 'measured page turns',
        },
        portal: { composition: 'personal briefing cover', tone: 'private journal' },
      },
      {
        id: 'wo-amanda-concept-c',
        name: 'Intimate Studio',
        rationale: 'Relationship-first trust.',
        organizationName: 'Amanda Catherine',
        story: creative.story,
        website: {
          composition: 'portrait-led introduction',
          imageBehavior: 'warm environmental portraits',
          typeBehavior: 'elegant display typography',
          motion: 'soft depth',
        },
        portal: { composition: 'personal welcome', tone: 'private studio' },
      },
    ],
  };

  const art = await appendArtifacts(projectId, [
    {
      kind: 'creative_direction',
      providerId: 'phase2d-wire-seed',
      data: creative,
      provenance: { source: 'phase2d-wire-seed' },
    },
    {
      kind: 'experience_concepts',
      providerId: 'phase2d-wire-seed',
      data: concepts,
      provenance: { source: 'phase2d-wire-seed' },
    },
  ]);
  if (!art || !art.appended?.length) {
    throw new Error('appendArtifacts failed or appended nothing');
  }

  console.log('Seeded Amanda project', projectId);
  return projectId;
}

async function main() {
  loadEnvFiles();
  if (!process.env.AIRTABLE_API_KEY && !process.env.AIRTABLE_PAT) {
    throw new Error('AIRTABLE_API_KEY required');
  }

  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    steps: [] as unknown[],
  };
  const steps = report.steps as unknown[];

  const projectId = process.env.EA_WIRE_PROJECT_ID?.trim() || (await ensureAmandaProject());
  report.projectId = projectId;

  const gen = await generateAndPersistConceptPreviews(projectId, {
    portalSlug: 'amanda-catherine',
  });
  steps.push({
    step: 'generate-previews',
    ok: gen.ok,
    error: !gen.ok ? gen.error : undefined,
    previewCount: gen.ok ? gen.payload.previews.length : 0,
  });
  if (!gen.ok) {
    writeReport(report);
    throw new Error(gen.error);
  }

  const recommended =
    gen.payload.recommendedConceptId ||
    gen.payload.previews.find((p) => p.recommended)?.conceptId ||
    gen.payload.previews[0]?.conceptId;
  if (!recommended) throw new Error('No concept to select');

  const sel = await persistConceptSelection({
    projectId,
    selectedConceptId: recommended,
    selectionStatus: 'awaiting_certify',
  });
  steps.push({
    step: 'select-concept',
    ok: sel.ok,
    selectedConceptId: sel.ok ? sel.selectedConceptId : undefined,
    selectionStatus: sel.ok ? sel.selectionStatus : undefined,
    error: !sel.ok ? sel.error : undefined,
  });
  if (!sel.ok) {
    writeReport(report);
    throw new Error(sel.error);
  }

  console.log('Wiring selected experience…');
  const wire = await publishSelectedFactoryConcept({
    projectId,
    portalSlug: 'amanda-catherine',
    activatePortal: true,
    saveDraft: true,
  });
  steps.push({
    step: 'wire-selected',
    ok: wire.ok,
    websiteStatus: wire.websiteStatus,
    portalSlug: wire.portalSlug,
    organizationId: wire.organizationId,
    error: wire.error,
    surfaces: wire.surfaces || null,
    portal: wire.portal
      ? { ok: wire.portal.ok, portalSlug: wire.portal.portalSlug, error: wire.portal.error }
      : null,
  });
  if (!wire.ok) {
    writeReport(report);
    throw new Error(wire.error || 'wire failed');
  }

  const surfaces = wire.surfaces || {};
  const smokes = [];
  for (const url of [
    surfaces.portalLoginUrl,
    surfaces.portalCtpUrl,
    surfaces.portalHomeUrl,
    surfaces.draftPreviewPath,
    surfaces.websitePreviewPath,
    `${BASE}/sites/amanda-catherine`,
  ]) {
    const s = await smoke(url);
    smokes.push(s);
    console.log('smoke', s.status, s.url);
  }

  report.surfaceSmoke = smokes;
  report.chassisModules = surfaces.chassisModules;
  report.memberHomeSaved = surfaces.memberHomeSaved;
  report.publicSiteQuarantined = surfaces.publicSiteQuarantined;
  report.loginCtaPresent = surfaces.loginCtaPresent;
  report.websiteStatus = wire.websiteStatus;

  const loginOk = smokes.find((s) => s.url === surfaces.portalLoginUrl)?.ok === true;
  const quarantineHeld =
    smokes.find((s) => String(s.url || '').includes('/sites/amanda-catherine'))?.status === 404;

  report.verdict =
    wire.ok &&
    wire.websiteStatus === 'draft_only' &&
    loginOk &&
    surfaces.publicSiteQuarantined === true &&
    quarantineHeld
      ? 'PASS_WIRE_DRAFT_ONLY'
      : 'PARTIAL';

  // Confirm project persisted
  const reloaded = await getFactoryProject(projectId);
  report.persisted = Boolean(reloaded);

  writeReport(report);
  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        projectId,
        selectedConceptId: sel.selectedConceptId,
        websiteStatus: wire.websiteStatus,
        surfaces: {
          portalLoginUrl: surfaces.portalLoginUrl,
          portalCtpUrl: surfaces.portalCtpUrl,
          draftPreviewPath: surfaces.draftPreviewPath,
          chassisModules: surfaces.chassisModules,
          publicSiteQuarantined: surfaces.publicSiteQuarantined,
          memberHomeSaved: surfaces.memberHomeSaved,
        },
      },
      null,
      2,
    ),
  );
  process.exit(String(report.verdict).startsWith('PASS') ? 0 : 2);
}

function writeReport(report: Record<string, unknown>) {
  const dir = join(root, 'docs/audits/runtime-evidence-name-to-experience-phase2d');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'wire-surfaces-smoke.json');
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log('Wrote', path);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
