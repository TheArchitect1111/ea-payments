import { createHash } from 'node:crypto';
import { z } from 'zod';

const identifier = z.string().regex(/^[a-z][a-z0-9-]{0,63}$/);
const destination = z.object({ pageId: identifier.optional(), moduleId: identifier.optional(), login: z.literal(true).optional() }).strict()
  .refine(value => Object.values(value).filter(Boolean).length === 1, 'Choose exactly one destination');
export const ScreenshotPageInput = z.object({
  id: identifier, attachmentIndex: z.number().int().min(0).max(1023),
  order: z.number().int().min(0).max(23), surface: z.enum(['website', 'portal']),
  title: z.string().trim().min(1).max(160),
}).strict();
export const ScreenshotBuildInput = z.object({
  version: z.literal(1), pages: z.array(ScreenshotPageInput).min(1).max(24),
  portalSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80).optional(),
  assembly: z.object({ manifest: z.enum(['ayf', 'starter']),
    requestedModuleIds: z.array(identifier).max(30).default([]),
    moduleConfigs: z.record(z.unknown()).optional(),
  }).strict().optional(),
  // Backend meaning is supplied explicitly, never inferred from image pixels.
  formBindings: z.array(z.object({ pageId: identifier, componentId: identifier,
    kind: z.enum(['intake', 'applications']), }).strict()).max(100).default([]),
  imageBindings: z.array(z.object({ pageId: identifier, componentId: identifier,
    attachmentIndex: z.number().int().min(0).max(1023) }).strict()).max(100).default([]),
  linkBindings: z.array(z.object({ pageId: identifier, componentId: identifier, destination }).strict()).max(160).default([]),
  clarifications: z.array(z.object({ pageId: identifier, ambiguity: z.string().min(1).max(1000),
    resolution: z.string().trim().min(1).max(2000) }).strict()).max(100).default([]),
}).strict().superRefine((input, ctx) => {
  for (const key of ['id', 'order', 'attachmentIndex'] as const) {
    if (new Set(input.pages.map(page => page[key])).size !== input.pages.length)
      ctx.addIssue({ code: 'custom', message: `Duplicate screenshot page ${key}` });
  }
  const keys = input.formBindings.map(x => `${x.pageId}/${x.componentId}`);
  if (new Set(keys).size !== keys.length || input.formBindings.some(x => !input.pages.some(p => p.id === x.pageId)))
    ctx.addIssue({ code: 'custom', message: 'Invalid or duplicate form binding' });
  const images = input.imageBindings.map(x => `${x.pageId}/${x.componentId}`);
  if (new Set(images).size !== images.length || input.imageBindings.some(x => !input.pages.some(p => p.id === x.pageId)))
    ctx.addIssue({ code: 'custom', message: 'Invalid or duplicate image binding' });
  const links = input.linkBindings.map(x => `${x.pageId}/${x.componentId}`);
  if (new Set(links).size !== links.length || input.linkBindings.some(x => !input.pages.some(p => p.id === x.pageId)))
    ctx.addIssue({ code: 'custom', message: 'Invalid or duplicate link binding' });
});
export type ScreenshotBuildRequest = z.infer<typeof ScreenshotBuildInput>;

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const field = z.object({ name: identifier, label: z.string().min(1).max(160),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'number']), required: z.boolean() }).strict();
export const ScreenshotSpecification = z.object({
  width: z.number().int().min(200).max(10000), height: z.number().int().min(200).max(30000),
  background: color, foreground: color,
  layout: z.enum(['stack', 'sidebar', 'columns']),
  components: z.array(z.object({
    id: identifier, type: z.enum(['heading', 'text', 'image', 'navigation', 'cta', 'form', 'portal-section']),
    text: z.string().max(6000),
    box: z.object({ x: z.number().min(0), y: z.number().min(0), width: z.number().positive(), height: z.number().positive() }).strict(),
    background: color.optional(), color: color.optional(),
    // Image asset IDs must be separately supplied/approved; screenshot crops are not invented assets.
    assetId: identifier.optional(),
    destination: destination.optional(),
    fields: z.array(field).max(40).optional(),
  }).strict()).min(1).max(160),
  brickRequirements: z.array(z.object({ moduleId: identifier, visibleReason: z.string().min(1).max(500) }).strict()).max(30),
  ambiguities: z.array(z.string().min(1).max(1000)).max(50),
}).strict().superRefine((spec, ctx) => {
  if (new Set(spec.components.map(x => x.id)).size !== spec.components.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate component ID' });
  for (const c of spec.components) {
    if (c.box.x + c.box.width > spec.width + 1 || c.box.y + c.box.height > spec.height + 1)
      ctx.addIssue({ code: 'custom', message: `Component outside image: ${c.id}` });
    if (c.destination && Object.values(c.destination).filter(Boolean).length !== 1)
      ctx.addIssue({ code: 'custom', message: `Ambiguous destination: ${c.id}` });
  }
});
export type ScreenshotSpec = z.infer<typeof ScreenshotSpecification>;
export type ScreenshotTenant = { organizationId: string; portalSlug: string };
export type ScreenshotDraftPage = z.infer<typeof ScreenshotPageInput> & {
  spec: ScreenshotSpec; imageHash: string; previewPath: string; sourceImagePath: string;
  links: Record<string, string>; forms: Record<string, 'intake' | 'applications'>;
  images: Record<string, number>;
};
export const ACCEPTANCE_CHECKS = ['rendering', 'links', 'login', 'form-persistence', 'authorization', 'tenant-isolation', 'visual-desktop', 'visual-mobile'] as const;
export type ScreenshotCheck = typeof ACCEPTANCE_CHECKS[number];
export type ScreenshotEvidence = { check: ScreenshotCheck; passed: boolean; detail: string;
  method: 'browser' | 'http' | 'visual-comparison';
  artifact: string; runId: string; revision: string; checkedAt: string };
export const ScreenshotEvidenceSchema = z.object({
  check: z.enum(ACCEPTANCE_CHECKS), passed: z.boolean(), detail: z.string().trim().min(1).max(6000),
  method: z.enum(['browser', 'http', 'visual-comparison']), artifact: z.string().trim().min(1).max(2000),
  runId: z.string().trim().min(1).max(200), revision: z.string().regex(/^[a-f0-9]{64}$/), checkedAt: z.string().datetime(),
}).strict();
export type ScreenshotBuildResult = {
  version: 1; projectId: string; requestHash: string; revision: string; status: 'blocked' | 'draft_ready' | 'accepted';
  tenant?: ScreenshotTenant; pages: ScreenshotDraftPage[]; blockers: string[];
  evidence: ScreenshotEvidence[]; attempts: number; updatedAt: string;
};
export const screenshotHash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const screenshotPreviewPath = (projectId: string, pageId: string) =>
  `/api/projects/${encodeURIComponent(projectId)}/screenshot-build/preview/${encodeURIComponent(pageId)}`;

export class RecoverableScreenshotError extends Error {}
export async function screenshotRetry<T>(action: () => Promise<T>, attempts = 3): Promise<T> {
  for (let n = 1; ; n++) {
    try { return await action(); }
    catch (error) { if (!(error instanceof RecoverableScreenshotError) || n >= attempts) throw error; }
  }
}

export type ScreenshotBuildPorts = {
  loadImage(index: number): Promise<{ bytes: Buffer; mimeType: string }>;
  interpret(image: { bytes: Buffer; mimeType: string }, page: z.infer<typeof ScreenshotPageInput>): Promise<unknown>;
  resolveTenant(slug?: string): Promise<ScreenshotTenant | null>;
  // Must consult certification AND the persisted tenant install, without granting new entitlements.
  admittedModules(tenant: ScreenshotTenant, requested: string[]): Promise<string[]>;
  moduleHref(tenant: ScreenshotTenant, id: string): string | null;
  validateImageAsset?(attachmentIndex: number): Promise<boolean>;
  saveDraft(result: ScreenshotBuildResult): Promise<void>;
  verify?(result: ScreenshotBuildResult): Promise<ScreenshotEvidence[]>;
};

export async function assembleScreenshotBuild(projectId: string, raw: unknown, ports: ScreenshotBuildPorts): Promise<ScreenshotBuildResult> {
  const input = ScreenshotBuildInput.parse(raw);
  const result: ScreenshotBuildResult = { version: 1, projectId, requestHash: screenshotHash(input), revision: '', status: 'blocked',
    pages: [], blockers: [], evidence: [], attempts: 0, updatedAt: new Date().toISOString() };
  try {
    for (const page of [...input.pages].sort((a, b) => a.order - b.order)) {
      const image = await ports.loadImage(page.attachmentIndex);
      if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(image.mimeType) || !image.bytes.length)
        throw new Error(`Supported image bytes required: ${page.id}`);
      const spec = ScreenshotSpecification.parse(await screenshotRetry(async () => {
        result.attempts++;
        return ports.interpret(image, page);
      }));
      result.pages.push({ ...page, spec, imageHash: createHash('sha256').update(image.bytes).digest('hex'),
        previewPath: screenshotPreviewPath(projectId, page.id),
        sourceImagePath: `/api/projects/${encodeURIComponent(projectId)}/screenshot-build/source/${encodeURIComponent(page.id)}`,
        links: {}, forms: {}, images: {} });
      result.blockers.push(...spec.ambiguities.filter(ambiguity => !input.clarifications.some(note => note.pageId === page.id && note.ambiguity === ambiguity))
        .map(x => `${page.id}: ${x}`));
    }
    const tenant = await ports.resolveTenant(input.portalSlug);
    if (tenant && (!/^rec[a-zA-Z0-9]+$/.test(tenant.organizationId) || !/^[a-z0-9-]+$/.test(tenant.portalSlug)))
      throw new Error('Persisted tenant identity required');
    if (tenant) result.tenant = tenant;
    else result.blockers.push('Existing persisted tenant and installed chassis required before functional wiring.');
    const requested = [...new Set(result.pages.flatMap(p => p.spec.brickRequirements.map(b => b.moduleId))
      .concat(input.formBindings.map(x => x.kind))
      .concat(input.linkBindings.flatMap(b => b.destination.moduleId ? [b.destination.moduleId] : []))
      .concat(result.pages.flatMap(p => p.spec.components.flatMap(c => c.destination?.moduleId ? [c.destination.moduleId] : []))))];
    const admitted = tenant ? await ports.admittedModules(tenant, requested) : [];
    for (const id of requested) if (!admitted.includes(id)) result.blockers.push(`Module not certified and installed: ${id}`);
    for (const page of result.pages) {
      for (const c of page.spec.components) {
        if (c.type === 'image') {
          const binding = input.imageBindings.find(b => b.pageId === page.id && b.componentId === c.id);
          if (binding && ports.validateImageAsset && await ports.validateImageAsset(binding.attachmentIndex)) page.images[c.id] = binding.attachmentIndex;
          else result.blockers.push(`${page.id}/${c.id}: Approved image asset binding required.`);
        }
        if (c.type === 'navigation' || c.type === 'cta' || c.type === 'portal-section') {
          const dest = input.linkBindings.find(b => b.pageId === page.id && b.componentId === c.id)?.destination || c.destination;
          const target = dest?.pageId ? result.pages.find(p => p.id === dest.pageId)?.previewPath
            : dest?.login && tenant ? `/portal/${tenant.portalSlug}/login`
            : dest?.moduleId && tenant && admitted.includes(dest.moduleId) ? ports.moduleHref(tenant, dest.moduleId) : null;
          if (target) page.links[c.id] = target;
          else result.blockers.push(`${page.id}/${c.id}: Destination requires confirmation.`);
        }
        if (c.type === 'form') {
          const binding = input.formBindings.find(b => b.pageId === page.id && b.componentId === c.id);
          const names = c.fields?.map(f => f.name) || [];
          if (binding && tenant && admitted.includes(binding.kind) && names.includes('email') && names.includes('name')) page.forms[c.id] = binding.kind;
          else result.blockers.push(`${page.id}/${c.id}: Confirm capture binding and name/email fields before submission.`);
        }
      }
    }
    for (const b of input.formBindings) if (!result.pages.find(p => p.id === b.pageId)?.spec.components.some(c => c.id === b.componentId && c.type === 'form'))
      result.blockers.push(`Binding has no matching visible form: ${b.pageId}/${b.componentId}`);
    for (const b of input.imageBindings) if (!result.pages.find(p => p.id === b.pageId)?.spec.components.some(c => c.id === b.componentId && c.type === 'image'))
      result.blockers.push(`Binding has no matching visible image: ${b.pageId}/${b.componentId}`);
    for (const b of input.linkBindings) if (!result.pages.find(p => p.id === b.pageId)?.spec.components.some(c => c.id === b.componentId && ['navigation', 'cta', 'portal-section'].includes(c.type)))
      result.blockers.push(`Binding has no matching visible link: ${b.pageId}/${b.componentId}`);
  } catch (error) {
    result.blockers.push(error instanceof Error ? error.message : 'Screenshot assembly failed');
  }
  result.revision = screenshotHash({ input, tenant: result.tenant, pages: result.pages });
  result.status = result.blockers.length ? 'blocked' : 'draft_ready';
  // Verification needs a persisted, routable draft. Never count source inspection as behavioral evidence.
  await screenshotRetry(() => ports.saveDraft(result));
  if (ports.verify && !result.blockers.length) {
    try { result.evidence = z.array(ScreenshotEvidenceSchema).max(100).parse(await ports.verify(result)); }
    catch (error) { result.blockers.push(`Behavioral verification failed: ${error instanceof Error ? error.message : String(error)}`); }
  }
  result.blockers.push(...result.evidence.filter(e => e.revision === result.revision && !e.passed).map(e => `Acceptance failed: ${e.check}: ${e.detail}`));
  if (result.blockers.length) result.status = 'blocked';
  if (!result.blockers.length && ACCEPTANCE_CHECKS.every(check => result.evidence.some(e =>
    e.check === check && e.passed && e.revision === result.revision && e.runId.trim() && e.artifact.trim() && e.detail.trim() &&
    (check.startsWith('visual-') ? e.method === 'visual-comparison' : check === 'rendering' ? e.method === 'browser' : ['browser', 'http'].includes(e.method)) &&
    Number.isFinite(Date.parse(e.checkedAt)) && Date.parse(e.checkedAt) >= Date.parse(result.updatedAt) && Date.parse(e.checkedAt) <= Date.now() + 5000))) result.status = 'accepted';
  result.updatedAt = new Date().toISOString();
  await screenshotRetry(() => ports.saveDraft(result));
  return result;
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
export function renderScreenshotPage(result: ScreenshotBuildResult, pageId: string, requestId: string): string {
  const page = result.pages.find(p => p.id === pageId);
  if (!page) throw new Error('Screenshot page not found');
  const e = escapeHtml;
  const components = page.spec.components.map(c => {
    let body = `<p>${e(c.text)}</p>`;
    if (c.type === 'heading') body = `<h1>${e(c.text)}</h1>`;
    if (c.type === 'navigation' || c.type === 'cta') body = page.links[c.id]
      ? `<a href="${e(page.links[c.id])}">${e(c.text)}</a>` : `<span aria-disabled="true">${e(c.text)} (destination unresolved)</span>`;
    if (c.type === 'portal-section') body = `<h2>${e(c.text)}</h2>${page.links[c.id] ? `<a href="${e(page.links[c.id])}">Open ${e(c.text)}</a>` : '<p>Portal section awaits confirmed wiring.</p>'}`;
    if (c.type === 'form') {
      const enabled = Boolean(page.forms[c.id]);
      body = `<form method="post" action="/api/projects/${e(encodeURIComponent(result.projectId))}/screenshot-build/submit"><h2>${e(c.text)}</h2>
        <input type="hidden" name="pageId" value="${e(page.id)}"><input type="hidden" name="componentId" value="${e(c.id)}">
        <input type="hidden" name="revision" value="${e(result.revision)}"><input type="hidden" name="requestId" value="${e(requestId)}">
        ${(c.fields || []).map(f => `<label>${e(f.label)}${f.type === 'textarea' ? `<textarea name="${e(f.name)}"` : `<input type="${f.type}" name="${e(f.name)}"`} ${f.required ? 'required' : ''} ${enabled ? '' : 'disabled'}>${f.type === 'textarea' ? '</textarea>' : ''}</label>`).join('')}
        <button ${enabled ? '' : 'disabled'}>Submit</button>${enabled ? '' : '<p>Form awaits confirmed wiring.</p>'}</form>`;
    }
    if (c.type === 'image') body = page.images[c.id] !== undefined
      ? `<img src="/api/projects/${e(encodeURIComponent(result.projectId))}/screenshot-build/assets/${page.images[c.id]}" alt="${e(c.text)}" style="width:100%;height:100%;object-fit:contain">`
      : `<div role="img" aria-label="${e(c.text)}">Image asset awaiting approval: ${e(c.text)}</div>`;
    return `<section data-component="${e(c.id)}" data-type="${c.type}" style="left:${100 * c.box.x / page.spec.width}%;top:${c.box.y}px;width:${100 * c.box.width / page.spec.width}%;min-height:${c.box.height}px;${c.background ? `background:${c.background};` : ''}${c.color ? `color:${c.color};` : ''}">${body}</section>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${e(page.title)} — private draft</title><style>
    *{box-sizing:border-box}body{margin:0;font-family:system-ui;background:${page.spec.background};color:${page.spec.foreground}}aside{padding:12px;background:#fff4cc;color:#302500}main{position:relative;max-width:${page.spec.width}px;min-height:${page.spec.height}px;margin:auto}section{position:absolute;padding:12px;overflow-wrap:anywhere}h1{font-size:clamp(24px,3vw,48px)}a{color:inherit}label{display:block;margin:8px 0}input,textarea,button{font:inherit;padding:8px;max-width:100%}label input,label textarea{display:block;width:100%}@media(max-width:640px){main{min-height:0}section{position:relative!important;left:auto!important;top:auto!important;width:100%!important;min-height:0!important;padding:18px}}
    </style></head><body><aside>Private draft · ${e(result.status)} · ${result.blockers.length} unresolved items. Submissions persist to the selected tenant; no emails or payments are sent.</aside><main data-layout="${page.spec.layout}">${components}</main></body></html>`;
}
