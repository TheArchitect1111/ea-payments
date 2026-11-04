import { readCtpAssetBytes } from '@/lib/ctp-asset-store';
import { describeScreenshotBase64 } from '@/lib/screenshot-vision';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { createAssemblyPlan } from '@/lib/modules/assembly';
import { loadTenantInstall } from '@/lib/modules/tenant-install';
import { getModuleDefinition, moduleHref, type ModuleId } from '@/lib/modules/registry';
import { getFactoryProject, saveFactoryProject, type FactoryProject } from '@/lib/factory-project-store';
import { saveStudioRecord, loadStudioRecordFromAirtable } from '@/lib/creative-studio/persistence';
import { airtableConfigured } from '@/lib/data/airtable-client';
import ayf from '@/config/chassis-manifests/ayf.json';
import { verifyPrivateScreenshotDraft } from './factory-screenshot-verifier';
import { assembleScreenshotBuild, screenshotHash, ScreenshotBuildInput, ScreenshotSpecification,
  type ScreenshotSpec, type ScreenshotBuildResult } from './factory-screenshot-build';

const PROMPT = `Interpret this image as a layout specification, not branding inspiration. Return ONLY a JSON object matching this contract:
{"width":1200,"height":900,"background":"#ffffff","foreground":"#111111","layout":"stack","components":[{"id":"title","type":"heading","text":"Visible heading","box":{"x":20,"y":20,"width":900,"height":100}}],"brickRequirements":[],"ambiguities":[]}
layout: stack|sidebar|columns. Components in reading order: heading|text|image|navigation|cta|form|portal-section.
Every component requires unique lowercase hyphenated id, visible text, pixel box x/y/width/height within image bounds. Optional background/color are six-digit hex. Describe visible images as image components; do not fabricate asset IDs or URLs.
For a visible form include fields [{name:"email",label:"Email",type:"email",required:true}]; field types text|email|tel|textarea|number. Preserve visible labels and names; mark uncertainty in ambiguities. A visible name field may use name:"name".
Navigation/CTA may include destination:{pageId:"known-page-id"} OR {moduleId:"known-module-id"} OR {login:true} only if unambiguous from supplied context. Missing destinations remain unresolved. Separate each link into its own component.
brickRequirements entries {moduleId:"intake",visibleReason:"Visible intake form"} are candidate requirements only. Never invent database fields, business rules, pricing, authorization, payment activation, hidden pages, backend behavior or successful submissions. Report ambiguities for anything that needs confirmation. No markdown fences, prose, or extra keys.`;

export const screenshotDraftRecordId = (projectId: string) => `factory-screenshot-${screenshotHash(projectId).slice(0, 40)}`;

export async function loadScreenshotDraft(projectId: string): Promise<ScreenshotBuildResult | null> {
  // A memory-only success is never a private delivery record.
  const draft = await loadStudioRecordFromAirtable<ScreenshotBuildResult>('experience', screenshotDraftRecordId(projectId));
  const project = await getFactoryProject(projectId);
  const config = ScreenshotBuildInput.safeParse(project?.screenshotBuild);
  return project?.buildMode === 'screenshot' && project.pipelineStatus !== 'CANCELLED' && config.success &&
    draft?.projectId === projectId && draft.requestHash === screenshotHash(config.data) ? draft : null;
}

const runs = new Map<string, Promise<FactoryProject | null>>();
export function runFactoryScreenshotBuild(projectId: string): Promise<FactoryProject | null> {
  const prior = runs.get(projectId);
  if (prior) return prior;
  const run = execute(projectId).finally(() => runs.delete(projectId));
  runs.set(projectId, run);
  return run;
}

async function execute(projectId: string): Promise<FactoryProject | null> {
  const project = await getFactoryProject(projectId);
  if (!project || project.buildMode !== 'screenshot' || project.pipelineStatus === 'CANCELLED') return project;
  if (project.screenshotResult) return project;
  let result: ScreenshotBuildResult;
  try {
    const config = ScreenshotBuildInput.parse(project.screenshotBuild);
    const interpreted = new Map<number, { bytes: Buffer; mimeType: string; spec: ScreenshotSpec }>();
    // One uncached vision operation per orchestration tick keeps multi-image runs within request budgets.
    // Durable, content-addressed interpretation records let a retry resume without reinterpreting completed pages.
    for (const page of [...config.pages].sort((a, b) => a.order - b.order)) {
      const assetId = /\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)$/.exec(project.attachments[page.attachmentIndex]?.url || '')?.[1];
      const asset = assetId ? await readCtpAssetBytes(assetId) : null;
      if (!asset || !['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.meta.mimeType)) throw new Error(`Supported screenshot bytes unavailable: ${page.id}`);
      const key = `screenshot-interpretation-${screenshotHash([1, projectId, config.pages, asset.bytes.toString('base64'), page]).slice(0, 40)}`;
      const cached = await loadStudioRecordFromAirtable<{ projectId: string; spec: unknown }>('media', key);
      if (cached) {
        if (cached.projectId !== projectId) throw new Error('Interpretation project mismatch');
        interpreted.set(page.attachmentIndex, { bytes: asset.bytes, mimeType: asset.meta.mimeType,
          spec: ScreenshotSpecification.parse(cached.spec) });
        continue;
      }
      const text = await describeScreenshotBase64(asset.bytes.toString('base64'), asset.meta.mimeType, {
        prompt: `${PROMPT}\nPage: ${JSON.stringify(page)}\nKnown page IDs: ${config.pages.map(x => x.id).join(', ')}\nKnown module IDs: dashboard,intake,applications,documents,reports,messaging,training,people,resources,settings`,
        maxTokens: 8000, throwOnFailure: true,
      });
      if (!text) throw new Error('Image interpretation unavailable. Configure the existing vision provider; no generic layout was substituted.');
      const payload = { projectId, spec: ScreenshotSpecification.parse(JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''))) };
      const saved = await saveStudioRecord({ recordType: 'media', id: key, organizationId: 'ea-factory', title: `Screenshot layout: ${page.title}`, payload });
      if (!saved.ok || !saved.persistedToAirtable) throw new Error('Screenshot interpretation durable storage unavailable.');
      const actual = await loadStudioRecordFromAirtable('media', key);
      if (screenshotHash(actual) !== screenshotHash(payload)) throw new Error('Screenshot interpretation read-back failed.');
      const latest = await getFactoryProject(projectId);
      if (!latest || latest.pipelineStatus === 'CANCELLED' || screenshotHash(latest.screenshotBuild) !== screenshotHash(config)) return latest;
      const progress: FactoryProject = { ...latest, pipelineStatus: 'BUILDING', updatedAt: new Date().toISOString() };
      const progressSaved = await saveFactoryProject(progress);
      if (!progressSaved.ok || !progressSaved.persistedToAirtable) throw new Error('Screenshot progress persistence failed');
      const { scheduleFactoryGenerateJob } = await import('@/lib/factory-queue');
      scheduleFactoryGenerateJob(projectId);
      return progress;
    }
    result = await assembleScreenshotBuild(projectId, project.screenshotBuild, {
      async loadImage(index) {
        const image = interpreted.get(index);
        if (!image) throw new Error('Durable interpreted screenshot missing');
        return image;
      },
      async interpret(_image, page) {
        return interpreted.get(page.attachmentIndex)?.spec;
      },
      async resolveTenant(slug) {
        const isAyf = /^(are you fundable|ayf)$/i.test(project.client.trim());
        if (config.assembly?.manifest === 'ayf' && (!isAyf || slug && slug !== ayf.portalSlug || config.assembly.requestedModuleIds.length))
          throw new Error('AYF assembly must use the canonical AYF project and unchanged approved manifest.');
        const selected = slug || (isAyf ? ayf.portalSlug : undefined);
        if (!selected) return null;
        let org = await findOrganizationByPortalSlug(selected);
        if (config.assembly) {
          const existingInstall = org ? await loadTenantInstall(org.id) : null;
          if (!existingInstall) {
            const { ensureTenantFoundation } = await import('@/lib/tenant-foundation');
            const { ModuleConfigsSchema } = await import('@/lib/bricks/module-install');
            const moduleConfigs = ModuleConfigsSchema.parse(config.assembly.moduleConfigs || {});
            const foundation = await ensureTenantFoundation(config.assembly.manifest === 'ayf'
              ? { ...ayf, assemblyMode: 'certified', moduleConfigs }
              : { portalSlug: selected, clientName: project.client, packagePurchased: 'Website + Portal Starter',
                assemblyMode: 'certified', requestedModuleIds: config.assembly.requestedModuleIds,
                moduleConfigs });
            org = await findOrganizationByPortalSlug(selected);
            if (!org || org.id !== foundation.orgId) throw new Error('Private chassis tenant read-back failed');
          }
        }
        return org ? { organizationId: org.id, portalSlug: selected } : null;
      },
      async admittedModules(tenant, requested) {
        const plan = createAssemblyPlan(requested);
        if (plan.blocked) throw new Error(`Certification gate blocked: ${plan.rejected.map(x => `${x.id}:${x.reason}`).join(', ')}`);
        const installed = await loadTenantInstall(tenant.organizationId);
        if (!installed || installed.state !== 'installed' || installed.portalSlug !== tenant.portalSlug)
          throw new Error('Matching durable tenant installation required. No duplicate tenant was provisioned.');
        return plan.admitted.filter(id => installed.admitted.includes(id));
      },
      moduleHref(tenant, id) {
        const definition = getModuleDefinition(id as ModuleId);
        return definition ? moduleHref(tenant.portalSlug, definition) : null;
      },
      async validateImageAsset(index) {
        const id = /\/api\/ctp\/assets\/([a-zA-Z0-9_-]+)$/.exec(project.attachments[index]?.url || '')?.[1];
        const asset = id ? await readCtpAssetBytes(id) : null;
        return Boolean(asset && ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(asset.meta.mimeType));
      },
      async saveDraft(draft) {
        if (!airtableConfigured()) throw new Error('Durable private draft storage unavailable.');
        const saved = await saveStudioRecord({ recordType: 'experience', id: screenshotDraftRecordId(projectId),
          organizationId: draft.tenant?.organizationId || 'ea-factory', title: `${project.client}: private screenshot draft`, payload: draft });
        if (!saved.ok || !saved.persistedToAirtable) throw new Error('Private draft durable write failed.');
        const readBack = await loadScreenshotDraft(projectId);
        if (screenshotHash(readBack) !== screenshotHash(draft)) throw new Error('Private draft durable read-back failed.');
      },
      verify: verifyPrivateScreenshotDraft,
    });
  } catch (error) {
    const recoverable = error instanceof Error && ((error as Error & { retryable?: boolean }).retryable === true ||
      ['TimeoutError', 'AbortError'].includes(error.name) || error instanceof TypeError && /fetch failed/i.test(error.message));
    if (recoverable && (project.screenshotRetryAttempts || 0) < 2) {
      const latest = await getFactoryProject(projectId);
      if (!latest || latest.pipelineStatus === 'CANCELLED' || screenshotHash(latest.screenshotBuild) !== screenshotHash(project.screenshotBuild)) return latest;
      const retry: FactoryProject = { ...latest, pipelineStatus: 'BUILDING',
        screenshotRetryAttempts: (latest.screenshotRetryAttempts || 0) + 1, updatedAt: new Date().toISOString() };
      const saved = await saveFactoryProject(retry);
      if (!saved.ok || !saved.persistedToAirtable) throw new Error('Screenshot retry state persistence failed');
      const { scheduleFactoryGenerateJob } = await import('@/lib/factory-queue');
      scheduleFactoryGenerateJob(projectId);
      return retry;
    }
    result = { version: 1, projectId, requestHash: screenshotHash(project.screenshotBuild), revision: '', status: 'blocked', pages: [], evidence: [], attempts: 0,
      blockers: [error instanceof Error ? error.message : 'Private build failed'], updatedAt: new Date().toISOString() };
  }
  const latest = await getFactoryProject(projectId);
  if (!latest || latest.pipelineStatus === 'CANCELLED' || screenshotHash(latest.screenshotBuild) !== screenshotHash(project.screenshotBuild)) return latest;
  const status = result.status === 'accepted' ? 'COMPLETE' : 'UNDER_REVIEW';
  const updated: FactoryProject = { ...latest, screenshotResult: result, pipelineStatus: status,
    updatedAt: result.updatedAt, error: result.blockers.length ? result.blockers.join('\n') : undefined,
    context: latest.context ? { ...latest.context, pipelineStatus: status, updatedAt: result.updatedAt,
      outputs: [...latest.context.outputs, { id: `screenshot-output-${screenshotHash([projectId, result.revision, result.updatedAt]).slice(0, 40)}`, kind: 'screenshot_build',
        worker: 'screenshot-build', createdAt: result.updatedAt, payload: { revision: result.revision, status: result.status, blockers: result.blockers, evidence: result.evidence } }] } : undefined,
    activity: [...latest.activity, { at: result.updatedAt, from: latest.pipelineStatus, to: status,
      worker: 'screenshot-build', detail: `${result.pages.length} private pages; ${result.blockers.length} blockers; ${result.evidence.length} acceptance receipts` }] };
  const saved = await saveFactoryProject(updated);
  if (!saved.ok || result.status === 'accepted' && !saved.persistedToAirtable) throw new Error(saved.error || 'Screenshot readiness record failed');
  return updated;
}
