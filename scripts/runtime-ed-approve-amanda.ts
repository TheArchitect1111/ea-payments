/**
 * Phase 2D — Experience Director review + portal surface smoke for Amanda wire.
 * Project: proj-ms3s6sg1-5404f1 (seeded + wired).
 *
 * Run: npx --yes tsx scripts/runtime-ed-approve-amanda.ts
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendArtifacts } from '../lib/factory-artifact';
import {
  getConceptPreviewDraft,
  listConceptPreviewsFromContext,
} from '../lib/factory-concept-previews';
import { runExperienceDirectorReview } from '../lib/factory-experience-director';
import { projectContextFromProject } from '../lib/factory-project-context';
import { getFactoryProject } from '../lib/factory-project-store';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = (process.env.EA_WIRE_BASE || 'https://efficiencyarchitects.online').replace(
  /\/$/,
  '',
);
const PROJECT_ID = process.env.EA_WIRE_PROJECT_ID?.trim() || 'proj-ms3s6sg1-5404f1';
const PORTAL_SLUG = process.env.EA_WIRE_PORTAL_SLUG?.trim() || 'amanda-catherine-afd57f';

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

async function smoke(url: string, cookie?: string) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: cookie
        ? { Cookie: cookie, Accept: 'text/html,application/json' }
        : { Accept: 'text/html,application/json' },
    });
    return { url, status: res.status, location: res.headers.get('location') };
  } catch (err) {
    return {
      url,
      status: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function ensureWebsiteSiteArtifact(projectId: string): Promise<void> {
  const project = await getFactoryProject(projectId);
  if (!project) throw new Error('Factory project not found');
  const hasSite = (project.context?.artifacts || []).some((a) => a.kind === 'website_site');
  if (hasSite) {
    console.log('website_site artifact already present');
    return;
  }

  const context = projectContextFromProject(project);
  const previews = listConceptPreviewsFromContext(context);
  const selectedId =
    previews?.selectedConceptId ||
    previews?.recommendedConceptId ||
    previews?.previews?.[0]?.conceptId;
  if (!selectedId) throw new Error('No concept preview to promote to website_site');

  const draft = getConceptPreviewDraft(context, selectedId);
  if (!draft?.websiteSite) {
    throw new Error(`Concept ${selectedId} missing websiteSite payload`);
  }

  const appended = await appendArtifacts(projectId, [
    {
      kind: 'website_site',
      providerId: 'phase2d-ed-promote',
      provenance: {
        capabilityId: 'website',
        sourceType: 'concept_preview',
        sourceName: `Selected concept ${selectedId}`,
        notes: 'Promoted selected concept compose for Experience Director review',
      },
      data: draft.websiteSite,
    },
  ]);
  if (!appended?.appended?.length) {
    throw new Error('Failed to append website_site from selected concept');
  }
  console.log('Promoted website_site from concept', selectedId);
}

async function main() {
  loadEnvFiles();
  const report: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    projectId: PROJECT_ID,
    portalSlug: PORTAL_SLUG,
    steps: [] as unknown[],
  };
  const steps = report.steps as unknown[];

  await ensureWebsiteSiteArtifact(PROJECT_ID);
  steps.push({ step: 'ensure-website-site', ok: true });

  console.log('Running Experience Director…');
  const ed = await runExperienceDirectorReview(PROJECT_ID);
  steps.push({
    step: 'experience-director',
    ok: ed.ok,
    error: ed.error,
    approvalStatus: ed.summary?.review.approvalStatus,
    scores: ed.summary?.review.scores,
    canPublish: ed.summary?.canPublish,
    requiredImprovements: ed.summary?.review.requiredImprovements,
    industry: ed.industry,
  });

  if (!ed.ok) {
    writeReport(report);
    throw new Error(ed.error || 'ED review failed');
  }

  console.log(
    'ED status:',
    ed.summary?.review.approvalStatus,
    'overall',
    ed.summary?.review.scores.overall,
  );

  // Unauthenticated + cookie-less chassis path smoke (login gate expected)
  const paths = [
    `/portal/login?next=${encodeURIComponent(`/portal/${PORTAL_SLUG}`)}`,
    `/portal/${PORTAL_SLUG}`,
    `/portal/${PORTAL_SLUG}/ctp`,
    `/portal/${PORTAL_SLUG}/updates`,
    `/portal/${PORTAL_SLUG}/resources`,
    `/portal/${PORTAL_SLUG}/ask`,
    `/sites/amanda-catherine`,
    `/sites/${PORTAL_SLUG}`,
  ];
  const smokes = [];
  for (const path of paths) {
    const s = await smoke(`${BASE}${path}`);
    smokes.push(s);
    console.log('smoke', s.status, s.url, s.location || '');
  }
  report.portalChassisSmoke = smokes;

  const approved = ed.summary?.review.approvalStatus === 'Approved';
  const sitesHeld =
    smokes.filter((s) => String(s.url).includes('/sites/')).every((s) => s.status === 404);
  const loginOk = smokes.some(
    (s) => String(s.url).includes('/portal/login') && s.status === 200,
  );
  const portalRedirects = smokes
    .filter((s) => String(s.url).includes(`/portal/${PORTAL_SLUG}`))
    .every((s) => s.status === 307 || s.status === 302 || s.status === 200);

  report.verdict = approved && sitesHeld && loginOk && portalRedirects
    ? 'PASS_ED_APPROVED_QUARANTINE_HELD'
    : approved
      ? 'PARTIAL_ED_APPROVED'
      : 'NEEDS_REFINEMENT';

  report.holdLiveFlag = true;
  report.next =
    approved
      ? 'Operator may set EA_AMANDA_SITE_LIVE=1 after logged-in chassis walkthrough'
      : 'Address requiredImprovements and re-run Experience Director';

  writeReport(report);
  console.log(
    JSON.stringify(
      {
        verdict: report.verdict,
        approvalStatus: ed.summary?.review.approvalStatus,
        scores: ed.summary?.review.scores,
        canPublish: ed.summary?.canPublish,
        requiredImprovements: ed.summary?.review.requiredImprovements,
        holdLiveFlag: true,
      },
      null,
      2,
    ),
  );
  process.exit(approved ? 0 : 2);
}

function writeReport(report: Record<string, unknown>) {
  const dir = join(root, 'docs/audits/runtime-evidence-name-to-experience-phase2d');
  mkdirSync(dir, { recursive: true });
  const path = join(dir, 'ed-approve-portal-smoke.json');
  writeFileSync(path, JSON.stringify(report, null, 2));
  console.log('Wrote', path);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
