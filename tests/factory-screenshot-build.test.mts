import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { build } from 'esbuild';
import sharp from 'sharp';
import { chromium } from '@playwright/test';
import { NextRequest } from 'next/server';
import { renderToStaticMarkup } from 'react-dom/server';
import { screenshotLedgerTransport } from './fixtures/screenshot-ledger';
import { createScreenshotVerifierHandler, rasterDifference, runScreenshotBrowserChecks } from '../lib/factory-screenshot-browser-worker';
import { createHmac } from 'node:crypto';
import { verifyPrivateScreenshotDraft } from '../lib/factory-screenshot-verifier';
import {
  assembleScreenshotBuild, ScreenshotBuildInput, ScreenshotSpecification, renderScreenshotPage,
  RecoverableScreenshotError, screenshotHash, ACCEPTANCE_CHECKS,
  type ScreenshotBuildPorts, type ScreenshotBuildRequest, type ScreenshotBuildResult, type ScreenshotSpec,
} from '../lib/factory-screenshot-build';

const tenant = { organizationId: 'recSYNTHETIC', portalSlug: 'synthetic' };
const input = { version: 1, portalSlug: 'synthetic', pages: [
  { id: 'home', attachmentIndex: 0, order: 0, surface: 'website', title: 'Synthetic home' },
  { id: 'portal', attachmentIndex: 1, order: 1, surface: 'portal', title: 'Synthetic portal' },
], formBindings: [{ pageId: 'home', componentId: 'apply', kind: 'intake' }],
imageBindings: [{ pageId: 'home', componentId: 'logo', attachmentIndex: 2 }] };
const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });
const home: ScreenshotSpec = { width: 1000, height: 900, background: '#ffffff', foreground: '#142536', layout: 'stack',
  components: [
    { id: 'heading', type: 'heading', text: 'Build a brighter future', box: box(30, 10, 840, 110) },
    { id: 'logo', type: 'image', text: 'Approved synthetic logo', box: box(900, 20, 60, 60) },
    { id: 'next', type: 'navigation', text: 'Your portal preview', destination: { pageId: 'portal' }, box: box(30, 140, 420, 60) },
    { id: 'login', type: 'cta', text: 'Member login', destination: { login: true }, box: box(500, 140, 420, 60) },
    { id: 'apply', type: 'form', text: 'Request a review', box: box(30, 240, 940, 620), fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'message', label: 'Your request', type: 'textarea', required: true },
    ] },
  ], brickRequirements: [{ moduleId: 'intake', visibleReason: 'Visible review request' }], ambiguities: [] };
const portal: ScreenshotSpec = { ...home, layout: 'sidebar', components: [
  { id: 'dashboard', type: 'heading', text: 'Your private workspace', box: box(20, 10, 950, 100) },
  { id: 'section', type: 'portal-section', text: 'Your intake requests', destination: { moduleId: 'intake' }, box: box(20, 140, 950, 150) },
  { id: 'back', type: 'navigation', text: 'Back to home', destination: { pageId: 'home' }, box: box(20, 320, 950, 60) },
], brickRequirements: [], ambiguities: [] };

async function bundleFixture(source: string, mocks: Record<string, string>, dir: string) {
  const root = process.cwd();
  const compiled = await build({ stdin: { contents: source, resolveDir: root }, bundle: true, write: false,
    platform: 'node', format: 'cjs', packages: 'external', plugins: [{ name: 'controlled-services', setup(b) {
      b.onResolve({ filter: /.*/ }, args => {
        const key = Object.keys(mocks).find(key => args.path === `@/lib/${key}` || args.path.endsWith(`/${key}`));
        return key ? { path: key, namespace: 'fixture' } : undefined;
      });
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents: mocks[args.path]!, loader: 'ts', resolveDir: root }));
    } }] });
  const { createRequire } = await import('node:module');
  const require = createRequire(join(root, 'package.json'));
  const Module = require('node:module');
  const modulePath = join(dir, 'fixture.cjs');
  const loaded = new Module(modulePath); loaded.filename = modulePath; loaded.paths = Module._nodeModulePaths(root);
  loaded._compile(compiled.outputFiles[0]!.text, modulePath);
  return loaded.exports;
}

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'ea-screenshot-'));
  // Actual generated PNG pixels, not filenames masquerading as screenshot interpretation.
  const images = await Promise.all([home, portal].map(async (spec, index) => {
    const svg = `<svg width="1000" height="900"><rect width="1000" height="900" fill="white"/>${spec.components.map(c => `<rect x="${c.box.x}" y="${c.box.y}" width="${c.box.width}" height="${c.box.height}" fill="${index ? '#eeeeee' : '#dddddd'}"/><text x="${c.box.x + 16}" y="${c.box.y + 32}" fill="#142536" font-size="24">${c.text}</text>`).join('')}</svg>`;
    const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
    await writeFile(join(dir, `${index}.png`), bytes);
    return bytes;
  }));
  images.push(await sharp({create:{width:32,height:32,channels:3,background:'#142536'}}).png().toBuffer());
  await writeFile(join(dir,'logo.png'),images[2]!);
  const interpretations: string[] = [];
  let saved: ScreenshotBuildResult | undefined;
  const ports: ScreenshotBuildPorts = {
    async loadImage(index) { return { bytes: images[index]!, mimeType: 'image/png' }; },
    async interpret(image) {
      const metadata = await sharp(image.bytes).metadata();
      assert.equal(metadata.width, 1000); assert.equal(metadata.height, 900);
      const index = images.findIndex(bytes => bytes.equals(image.bytes));
      assert.notEqual(index, -1); interpretations.push(screenshotHash(image.bytes));
      return structuredClone(index === 0 ? home : portal); // controlled vision provider fixture
    },
    async resolveTenant() { return tenant; },
    async admittedModules(_tenant, requested) { return requested; },
    moduleHref(t, id) { return `/portal/${t.portalSlug}/${id}`; },
    async validateImageAsset(index) { return index === 2; },
    async saveDraft(result) { saved = structuredClone(result); await writeFile(join(dir, 'draft.json'), JSON.stringify(result)); },
  };
  return { dir, images, ports, interpretations, saved: () => saved };
}

test('ordered image interpretation reconstructs pages, exposes ambiguity and fails closed without evidence', async () => {
  const f = await fixture();
  const result = await assembleScreenshotBuild('synthetic-project', input, f.ports);
  assert.equal(result.status, 'draft_ready'); assert.equal(result.evidence.length, 0);
  assert.equal(f.interpretations.length, 2); assert.deepEqual(result.pages.map(p => p.id), ['home', 'portal']);
  assert.equal(result.pages[0]!.forms.apply, 'intake');
  assert.equal(result.pages[0]!.links.next, result.pages[1]!.previewPath);
  assert.equal(result.pages[0]!.links.login, '/portal/synthetic/login');
  assert.equal((await assembleScreenshotBuild('synthetic-project', input, f.ports)).revision, result.revision);
  const ambiguous = await assembleScreenshotBuild('ambiguous', { ...input, formBindings: [] }, f.ports);
  assert.equal(ambiguous.status, 'blocked'); assert.match(ambiguous.blockers.join(), /Confirm capture binding/);
  assert.match(renderScreenshotPage(ambiguous, 'home', 'request-123'), /button disabled/);
  const denied = await assembleScreenshotBuild('denied', input, { ...f.ports, admittedModules: async () => [] });
  assert.equal(denied.status, 'blocked'); assert.equal(denied.pages[0]!.forms.apply, undefined);
  const absent = await assembleScreenshotBuild('absent', input, { ...f.ports, resolveTenant: async () => null });
  assert.equal(absent.status, 'blocked');
  const offline = await assembleScreenshotBuild('offline', input, { ...f.ports, interpret: async () => { throw Error('No vision credentials'); } });
  assert.equal(offline.status, 'blocked'); assert.equal(offline.pages.length, 0);
  assert.throws(() => ScreenshotBuildInput.parse({ ...input, pages: [input.pages[0], input.pages[0]] }), /Duplicate/);
  assert.throws(() => ScreenshotSpecification.parse({ ...home, components: [{ ...home.components[0], box: box(999, 0, 20, 20) }] }), /outside/);
  const malicious = structuredClone(result); malicious.pages[0]!.spec.components[0]!.text = '<script>alert(1)</script>';
  assert.ok(!renderScreenshotPage(malicious, 'home', 'request-123').includes('<script>'));
  const imageSpec = { ...home, components: [...home.components, { id: 'brand', type: 'image' as const,
    text: 'Approved logo', box: box(850, 20, 100, 80) }] };
  const withImage = await assembleScreenshotBuild('image-assets', { ...input,
    imageBindings: [...input.imageBindings, { pageId: 'home', componentId: 'brand', attachmentIndex: 2 }] }, { ...f.ports,
    interpret: async (image, page) => page.id === 'home' ? imageSpec : f.ports.interpret(image, page), validateImageAsset: async index => index === 2,
  });
  assert.equal(withImage.status, 'draft_ready');
  assert.match(renderScreenshotPage(withImage, 'home', 'request-123'), /screenshot-build\/assets\/2/);
  assert.match(withImage.pages[0]!.sourceImagePath, /screenshot-build\/source\/home$/);
});

test('50 concurrent synthetic assemblies preserve tenant identity, evidence state and distinct private links', async () => {
  const f = await fixture();
  const results = await Promise.all(Array.from({ length: 50 }, (_, i) => assembleScreenshotBuild(`tenant-project-${i}`, { ...input, portalSlug: `synthetic-${i}` }, {
    ...f.ports, resolveTenant: async () => ({ organizationId: `recSYNTHETIC${i}`, portalSlug: `synthetic-${i}` }),
    saveDraft: async draft => { await writeFile(join(f.dir, `${draft.projectId}.json`), JSON.stringify(draft)); },
  })));
  assert.equal(new Set(results.map(r => r.revision)).size, 50);
  assert.equal(new Set(results.flatMap(r => r.pages.map(p => p.previewPath))).size, 100);
  for (let i = 0; i < results.length; i++) {
    const result = results[i]!;
    assert.equal(result.status, 'draft_ready'); assert.equal(result.evidence.length, 0);
    assert.equal(result.tenant!.organizationId, `recSYNTHETIC${i}`);
    assert.equal(result.pages[0]!.links.login, `/portal/synthetic-${i}/login`);
    assert.deepEqual(JSON.parse(await readFile(join(f.dir, `${result.projectId}.json`), 'utf8')), result);
  }
});

test('bounded recoverable retries preserve identity; persistence and stale receipts cannot imply acceptance', async () => {
  const f = await fixture(); let attempts = 0;
  const result = await assembleScreenshotBuild('retry', input, { ...f.ports, interpret: async (...args) => {
    if (++attempts <= 2) throw new RecoverableScreenshotError('temporary timeout'); return f.ports.interpret(...args);
  } });
  assert.equal(attempts, 4); assert.equal(result.pages.length, 2);
  const stale = await assembleScreenshotBuild('stale', input, { ...f.ports, verify: async draft => ACCEPTANCE_CHECKS.map(check => ({
    check, passed: true, method: 'browser', detail: 'old run', artifact: 'artifact', runId: 'old', revision: draft.revision, checkedAt: '2020-01-01T00:00:00.000Z',
  })) });
  assert.equal(stale.status, 'draft_ready');
  await assert.rejects(assembleScreenshotBuild('storage', input, { ...f.ports, saveDraft: async () => { throw Error('Durable storage failed'); } }), /storage failed/);
  const forged = await assembleScreenshotBuild('source-only', input, { ...f.ports, verify: async draft => ACCEPTANCE_CHECKS.map(check => ({
    check, passed: true, method: 'source-string' as never, detail: 'HTML contains strings', artifact: 'grep.log',
    runId: 'grep', revision: draft.revision, checkedAt: new Date().toISOString(),
  })) });
  assert.notEqual(forged.status, 'accepted');
  const accepted = await assembleScreenshotBuild('controlled-evidence-contract', input, { ...f.ports,
    verify: async draft => ACCEPTANCE_CHECKS.map(check => ({ check, passed: true,
      method: check.startsWith('visual-') ? 'visual-comparison' as const : 'browser' as const,
      detail: 'Controlled receipt contract test; not a real provider acceptance claim', artifact: 'controlled-fixture.json',
      runId: 'contract-fixture', revision: draft.revision, checkedAt: new Date().toISOString(),
    })),
  });
  assert.equal(accepted.status, 'accepted');
});

test('production runtime resumes durable per-image work, retries transient vision, and retains private readiness without notifications', async () => {
  const f = await fixture();
  const state = { project: { version: 1, id: 'runtime-project', client: 'Synthetic', buildMode: 'screenshot',
    screenshotBuild: ScreenshotBuildInput.parse(input), pipelineStatus: 'QUEUED', attachments: f.images.map((_,i) => ({ type: 'image', url: `/api/ctp/assets/image-${i}` })),
    activity: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Record<string, unknown>,
    records: new Map(), images: f.images, calls: 0, queued: 0, retry: true, specs: [home, portal],
    orgMissing: false, installed: true, foundations: [] as Array<Record<string, unknown>> };
  (globalThis as Record<string, unknown>).__screenshotRuntime = state;
  const mocks = {
    'factory-project-store': `export async function getFactoryProject(){return structuredClone(globalThis.__screenshotRuntime.project)};export async function saveFactoryProject(project){globalThis.__screenshotRuntime.project=structuredClone(project);return {ok:true,persistedToAirtable:true}}`,
    'creative-studio/persistence': `export async function loadStudioRecordFromAirtable(type,id){return structuredClone(globalThis.__screenshotRuntime.records.get(type+':'+id)||null)};export async function saveStudioRecord(row){globalThis.__screenshotRuntime.records.set(row.recordType+':'+row.id,structuredClone(row.payload));return {ok:true,persistedToAirtable:true}}`,
    'ctp-asset-store': `export async function readCtpAssetBytes(id){return {bytes:globalThis.__screenshotRuntime.images[Number(id.split('-')[1])],meta:{mimeType:'image/png'}}}`,
    'screenshot-vision': `export async function describeScreenshotBase64(base64,mime,options){const s=globalThis.__screenshotRuntime;s.calls++;if(s.retry){s.retry=false;throw Object.assign(new Error('429'),{retryable:true})}if(options.maxTokens!==8000||!options.throwOnFailure)throw Error('Structured interpretation options missing');const i=s.images.findIndex(bytes=>bytes.toString('base64')===base64);if(i<0)throw Error('Real image bytes required');return JSON.stringify(s.specs[i])}`,
    'organizations': `export async function findOrganizationByPortalSlug(slug){return slug==='synthetic'&&!globalThis.__screenshotRuntime.orgMissing?{id:'recSYNTHETIC'}:null}`,
    'tenant-install': `export async function loadTenantInstall(){return globalThis.__screenshotRuntime.installed?{portalSlug:'synthetic',state:'installed',admitted:['intake','dashboard','amplifi','update-hub']}:null}`,
    'data/airtable-client': `export function airtableConfigured(){return true}`,
    'factory-queue': `export function scheduleFactoryGenerateJob(){globalThis.__screenshotRuntime.queued++}`,
    'factory-screenshot-verifier': `export async function verifyPrivateScreenshotDraft(){return []}`,
    'tenant-foundation': `export async function ensureTenantFoundation(input){const s=globalThis.__screenshotRuntime;s.foundations.push(input);s.installed=true;s.orgMissing=false;return {orgId:'recSYNTHETIC'}}`,
    'bricks/module-install': `export const ModuleConfigsSchema={parse:x=>x}`,
  };
  const runtime = await bundleFixture(`export * from './lib/factory-screenshot-runtime';`, mocks, f.dir);
  try {
    await runtime.runFactoryScreenshotBuild('runtime-project'); // transient attempt persisted, no blocked completion
    assert.equal(state.project.screenshotRetryAttempts, 1); assert.equal(state.project.screenshotResult, undefined);
    await runtime.runFactoryScreenshotBuild('runtime-project'); // first image saved
    await runtime.runFactoryScreenshotBuild('runtime-project'); // second image saved; first is cached
    await runtime.runFactoryScreenshotBuild('runtime-project'); // cached assembly
    const result = state.project.screenshotResult as unknown as ScreenshotBuildResult;
    assert.equal(result.status, 'draft_ready'); assert.equal(result.pages.length, 2);
    assert.equal(state.project.pipelineStatus, 'UNDER_REVIEW'); assert.equal(state.calls, 3); assert.equal(state.queued, 3);
    assert.equal((await runtime.loadScreenshotDraft('runtime-project')).revision, result.revision);
    await runtime.runFactoryScreenshotBuild('runtime-project'); assert.equal(state.calls, 3);
    assert.equal(state.foundations.length, 0, 'Existing installed tenant must not be reprovisioned');
    state.project.screenshotResult = undefined;
    state.project.screenshotBuild = ScreenshotBuildInput.parse({ ...input, assembly: { manifest: 'starter', requestedModuleIds: ['intake'] } });
    state.orgMissing = true; state.installed = false;
    await runtime.runFactoryScreenshotBuild('runtime-project');
    assert.equal(state.calls, 3, 'Backend binding changes must reuse image interpretation');
    assert.equal(state.foundations.length, 1);
    assert.equal(state.foundations[0]!.assemblyMode, 'certified');
    assert.deepEqual(state.foundations[0]!.requestedModuleIds, ['intake']);
    assert.equal(state.foundations[0]!.packagePurchased, 'Website + Portal Starter');
    state.project.screenshotBuild = { ...ScreenshotBuildInput.parse(input), formBindings: [] };
    assert.equal(await runtime.loadScreenshotDraft('runtime-project'), null, 'Stale draft must not serve after configuration changes');
  } finally { delete (globalThis as Record<string, unknown>).__screenshotRuntime; }
});

test('private verifier boundary signs scoped runs, retries recoverable responses and rejects source-string receipts', async () => {
  const f = await fixture(); const draft = await assembleScreenshotBuild('verifier', input, f.ports);
  const beforeUrl = process.env.EA_SCREENSHOT_VERIFIER_URL;
  const beforeSecret = process.env.EA_SCREENSHOT_VERIFIER_SECRET;
  const beforeLocal = process.env.EA_SCREENSHOT_ALLOW_LOCAL_VERIFIER;
  const beforeNode = process.env.NODE_ENV;
  const beforeVercel = process.env.VERCEL_ENV;
  const originalFetch = globalThis.fetch;
  try {
    delete process.env.EA_SCREENSHOT_VERIFIER_URL; delete process.env.EA_SCREENSHOT_VERIFIER_SECRET;
    assert.deepEqual(await verifyPrivateScreenshotDraft(draft), []);
    process.env.EA_SCREENSHOT_VERIFIER_URL = 'https://controlled-verifier.invalid/run';
    process.env.EA_SCREENSHOT_VERIFIER_SECRET = 'synthetic-secret';
    let calls = 0;
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://controlled-verifier.invalid/run'); calls++;
      const payload = String(options?.body);
      assert.equal(new Headers(options?.headers).get('x-ea-signature'), createHmac('sha256', 'synthetic-secret').update(payload).digest('hex'));
      assert.equal(JSON.parse(payload).revision, draft.revision);
      assert.equal(JSON.parse(payload).constraints.noEmails, true);
      if (calls === 1) return Response.json({}, { status: 503 });
      return Response.json({ evidence: [{ check: 'rendering', passed: true, method: 'browser',
        detail: 'Controlled browser fixture', artifact: 'test-run.json', runId: 'runner-1', revision: draft.revision, checkedAt: new Date().toISOString() }] });
    };
    assert.equal((await verifyPrivateScreenshotDraft(draft)).length, 1); assert.equal(calls, 2);
    globalThis.fetch = async () => Response.json({ evidence: [{ check: 'rendering', passed: true, method: 'source-string' }] });
    await assert.rejects(verifyPrivateScreenshotDraft(draft));
    process.env.EA_SCREENSHOT_VERIFIER_URL = 'http://unapproved.invalid';
    await assert.rejects(verifyPrivateScreenshotDraft(draft), /HTTPS/);
    process.env.EA_SCREENSHOT_ALLOW_LOCAL_VERIFIER='1';Object.assign(process.env,{NODE_ENV:'test'});delete process.env.VERCEL_ENV;
    process.env.EA_SCREENSHOT_VERIFIER_URL='http://127.0.0.1:4141/verify';
    globalThis.fetch=async url=>{assert.equal(String(url),'http://127.0.0.1:4141/verify');return Response.json({evidence:[]});};
    assert.deepEqual(await verifyPrivateScreenshotDraft(draft),[]);
    Object.assign(process.env,{NODE_ENV:'production'});await assert.rejects(verifyPrivateScreenshotDraft(draft),/HTTPS/);
    Object.assign(process.env,{NODE_ENV:'test',VERCEL_ENV:'preview'});await assert.rejects(verifyPrivateScreenshotDraft(draft),/HTTPS/);
  } finally {
    globalThis.fetch = originalFetch;
    if (beforeUrl === undefined) delete process.env.EA_SCREENSHOT_VERIFIER_URL; else process.env.EA_SCREENSHOT_VERIFIER_URL = beforeUrl;
    if (beforeSecret === undefined) delete process.env.EA_SCREENSHOT_VERIFIER_SECRET; else process.env.EA_SCREENSHOT_VERIFIER_SECRET = beforeSecret;
    for(const [key,value] of [['EA_SCREENSHOT_ALLOW_LOCAL_VERIFIER',beforeLocal],['NODE_ENV',beforeNode],['VERCEL_ENV',beforeVercel]] as const){if(value===undefined)Reflect.deleteProperty(process.env,key);else Object.assign(process.env,{[key]:value});}
  }
});

test('worker validates signed jobs, rejects stale/unsigned requests, deduplicates retry and detects raster drift',async()=>{
  const f=await fixture();const draft=await assembleScreenshotBuild('signed-worker',input,f.ports);
  const secret='synthetic-worker-secret-at-least-24-characters';let calls=0;
  const handler=createScreenshotVerifierHandler(secret,async()=>{calls++;return {evidence:[]};});
  const job={version:1,projectId:draft.projectId,revision:draft.revision,timestamp:new Date().toISOString(),tenant:draft.tenant,pages:draft.pages,requiredChecks:ACCEPTANCE_CHECKS,
    constraints:{privateOnly:true,testIdentitiesOnly:true,noEmails:true,noPayments:true,noPublicPublish:true}};
  const request=(payload:unknown,signed=true)=>{const body=JSON.stringify(payload);return new Request('http://localhost/verify',{method:'POST',headers:signed?{'x-ea-signature':createHmac('sha256',secret).update(body).digest('hex')}:{},body});};
  assert.equal((await handler(request(job,false))).status,401);
  assert.equal((await handler(request({...job,timestamp:'2020-01-01T00:00:00.000Z'}))).status,401);
  assert.equal((await handler(request(job))).status,200);assert.equal((await handler(request(job))).status,200);assert.equal(calls,1);
  let retries=0;const retryHandler=createScreenshotVerifierHandler(secret,async()=>{if(++retries===1)throw Error('Recoverable worker failure');return {evidence:[]};});
  assert.equal((await retryHandler(request(job))).status,503);assert.equal((await retryHandler(request(job))).status,200);
  assert.equal(await rasterDifference(f.images[0]!,f.images[0]!),0);
  assert.ok(await rasterDifference(f.images[0]!,f.images[1]!)>0);
});

test('multipart intake preserves ordered website/portal metadata, approved assets and normal name/URL launch', async () => {
  const f = await fixture();
  const parser = await bundleFixture(`export * from './lib/factory-launch-request';`, {
    'ctp-asset-store': `let next=0;export const CTP_ASSET_MAX_BYTES=2097152;export function isAllowedCtpAssetMime(mime){return mime==='image/png'};export async function storeCtpAsset(input){return {id:'asset-'+(++next),fileName:input.fileName,url:'/api/ctp/assets/asset-'+next}};export async function persistCtpAssetToStudio(){return true}`,
    'factory-project': `export function factoryOrganizationId(){return 'ea-factory'}`,
  }, f.dir);
  const form = new FormData();
  form.set('client', 'Synthetic'); form.set('buildMode', 'screenshot'); form.set('screenshotBuild', JSON.stringify(input));
  for (let index = 0; index < f.images.length; index++) form.append(`file${index}`, new Blob([new Uint8Array(f.images[index]!)], { type: 'image/png' }), `synthetic-${index}.png`);
  const parsed = await parser.parseFactoryLaunchBody(new NextRequest('https://factory.invalid/api/launch', { method: 'POST', body: form }));
  assert.equal(parsed.ok, true); assert.equal(parsed.body.buildMode, 'screenshot');
  assert.deepEqual(parsed.body.screenshotBuild.pages, input.pages); assert.equal(parsed.body.attachments.length, 3);
  assert.equal(parsed.body.attachments[0].name, 'synthetic-0.png');
  const normal = await parser.parseFactoryLaunchBody(new NextRequest('https://factory.invalid/api/launch', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client: 'Normal', url: 'https://normal.invalid' }) }));
  assert.equal(normal.ok, true); assert.equal(normal.body.screenshotBuild, undefined);
  const invalid = await parser.parseFactoryLaunchBody(new NextRequest('https://factory.invalid/api/launch', { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ client: 'Invalid', buildMode: 'screenshot', screenshotBuild: input, attachments: [] }) }));
  assert.equal(invalid.ok, false);
  assert.throws(() => parser.validateScreenshotLaunch({ buildMode: 'exploratory', screenshotBuild: input }), /require Screenshot/);
});

test('AYF screenshot launch reuses the canonical existing project even with forceNew, without creating or publishing', async () => {
  const f = await fixture();
  const state = { project: { id: 'canonical-ayf', client: 'Are You Fundable', createdAt: '2020-01-01', pipelineStatus: 'UNDER_REVIEW',
    attachments: [{ type: 'image', name: 'Approved AYF logo', url: '/api/ctp/assets/approved-ayf-logo' }] }, queued: 0 };
  (globalThis as Record<string, unknown>).__screenshotLaunch = state;
  const api = await bundleFixture(`export {POST} from './app/api/launch/route';`, {
    'factory-api-auth': `export async function requireFactoryApiAccess(){return {ok:true,via:'admin'}}`,
    'factory-project': `export function factoryOrganizationId(){return 'ea-factory'};export function resolveLaunchProjectInput(body){return {input:{client:body.client}}};export async function createFactoryProject(){throw Error('Duplicate project creation forbidden')}`,
    'factory-project-store': `export async function listFactoryProjects(){return [globalThis.__screenshotLaunch.project]};export async function saveFactoryProject(p){globalThis.__screenshotLaunch.project=p;return {ok:true}}`,
    'factory-queue': `export async function launchFactoryProjectFlow(id){if(id!=='canonical-ayf')throw Error('Wrong canonical project');globalThis.__screenshotLaunch.queued++;return globalThis.__screenshotLaunch.project}`,
    'control-plane-bridge': `export async function registerFactoryProjectControlPlane(){return {ok:true}}`,
    'ctp-asset-store': `export const CTP_ASSET_MAX_BYTES=2097152;export function isAllowedCtpAssetMime(){return true};export async function storeCtpAsset(){throw Error('Unexpected upload')};export async function persistCtpAssetToStudio(){throw Error('Unexpected upload')}`,
  }, f.dir);
  try {
    const response = await api.POST(new NextRequest('https://factory.invalid/api/launch', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client: 'AYF', buildMode: 'screenshot', forceNew: true, screenshotBuild: input,
        attachments: [0, 1, 2].map(i => ({ type: 'image', url: `/api/ctp/assets/synthetic-${i}` })) }) }));
    assert.equal(response.status, 200); const body = await response.json();
    assert.equal(body.reused, true); assert.equal(body.projectId, 'canonical-ayf'); assert.equal(state.queued, 1);
    assert.equal((state.project as Record<string, unknown>).buildMode, 'screenshot');
    assert.equal(state.project.attachments[0]!.url, '/api/ctp/assets/approved-ayf-logo');
    assert.equal(((state.project as Record<string, unknown>).screenshotBuild as ScreenshotBuildRequest).pages[0]!.attachmentIndex, 1);
  } finally { delete (globalThis as Record<string, unknown>).__screenshotLaunch; }
});

test('synthetic PNG → private website → signed login → actual intake portal, durable persistence and permissions', async t => {
  const f = await fixture();
  const storage = join(f.dir, 'records'); await mkdir(storage);
  const beforeEnv = new Map(['ADMIN_SESSION_SECRET','NODE_ENV','VERCEL_ENV'].map(key=>[key,process.env[key]]));
  Object.assign(process.env,{ADMIN_SESSION_SECRET:'synthetic-signing-secret-only-for-local-fixtures',NODE_ENV:'test',VERCEL_ENV:'preview'});
  t.after(()=>{for(const [key,value] of beforeEnv){if(value===undefined)delete process.env[key];else process.env[key]=value;}});
  const state = { draft: null as ScreenshotBuildResult | null, storage, failWrites: false,
    ledgerOffline: false, failLedgerWrites: false, dropLedgerWrites: false, memberActive: true, moduleEnabled: true,
    renderSession: null as unknown, images: f.images };
  (globalThis as Record<string, unknown>).__screenshotTest = state;
  const mocks: Record<string, string> = {
    'factory-api-auth': `export async function requireFactoryApiAccess(req){return req.cookies.get('factory')?.value==='fixture' ? {ok:true,via:'admin'} : {ok:false,response:Response.json({error:'Login required'},{status:401})}}`,
    'factory-screenshot-runtime': `export async function loadScreenshotDraft(id){const d=globalThis.__screenshotTest.draft;return d?.projectId===id?d:null}`,
    'organizations': `export async function findOrganizationByPortalSlug(slug){return {id:slug==='other'?'recOTHER':'recSYNTHETIC'}}`,
    'memberships': `export async function findMembership(email,org){return email==='member@example.test'?{status:globalThis.__screenshotTest.memberActive?'active':'inactive',role:'guest'}:null}`,
    'portal-modules': `export async function isModuleEnabled(){return globalThis.__screenshotTest.moduleEnabled};export async function requirePortalModule(slug,id){const session=globalThis.__screenshotTest.renderSession;if(!session||session.slug!==slug)throw Error('Portal was not authorized');return {session,client:{clientName:'Synthetic'}}}`,
    'auth/resolve-portal-session': `import {verifySession,EA_PORTAL_COOKIE} from '@/lib/ea-portal-auth';export async function requirePortalSessionFromRequest(req){const token=req.cookies.get(EA_PORTAL_COOKIE)?.value;return token?verifySession(token):null};export async function requirePortalSession(){throw Error('Use authenticated request context')}`,
    'platform-store': screenshotLedgerTransport,
    'PortalSubpage': `import {createElement} from 'react';export function PortalSubpage({title,children}){return createElement('main',null,createElement('h1',null,title),children)}`,
    'factory-project-store': `export async function getFactoryProject(){return {attachments:globalThis.__screenshotTest.images.map((_,i)=>({url:'/api/ctp/assets/image-'+i}))}}`,
    'ctp-asset-store': `export async function readCtpAssetBytes(id){const bytes=globalThis.__screenshotTest.images[Number(id.split('-')[1])];return bytes?{bytes,meta:{mimeType:'image/png'}}:null}`,
    'airtable': `export async function validatePortalLogin(email,password){return email==='member@example.test'&&password==='synthetic-fixture-password'?{ok:true,slug:'synthetic'}:{ok:false}};export async function getClientByPortalSlug(){return null};export async function updateClientEngagementScore(){throw Error('Unexpected engagement write')}`,
    'connect-provision': `export async function ensureDemoConnectTenant(){throw Error('No demo provisioning')}`,
    'demo-client': `export function isDemoCredentialAttempt(){return false};export async function ensureDemoClient(){throw Error('No demo provisioning')}`,
    'demo-website-portal': `export function getDemoWebsitePortalCredentials(){return {email:'unused@example.test',password:'unused'}};export async function ensureDemoWebsitePortal(){throw Error('No demo provisioning')}`,
    'ea-auth-2fa': `export function is2FAEnabled(){return false};export async function begin2FA(){throw Error('No email allowed in synthetic run')}`,
    'client-success': `export async function getClientSuccessProfile(){throw Error('No engagement lookup')}`,
    'portal-notify': `export async function notifyPortal(){throw Error('No notifications allowed in synthetic run')}`,
    'org-provision': `export async function resolvePortalIdentity({email,slug}){return {email,orgId:'recSYNTHETIC',role:'guest'}}`,
    'portal-post-login': `export async function resolvePortalPostLoginPath(){return '/portal/synthetic/intake'}`,
    'amanda-catherine/client-access': `export async function getAmandaAssignedAudience(){return null}`,
    'tenant-install': `export async function loadTenantInstall(org){return {organizationId:org,portalSlug:org==='recOTHER'?'other':'synthetic',state:'installed',admitted:['intake','applications']}}`,
    'creative-studio/persistence': `import {readFile,writeFile} from 'node:fs/promises';import {join} from 'node:path';export async function loadStudioRecordFromAirtable(type,id){try{return JSON.parse(await readFile(join(globalThis.__screenshotTest.storage,encodeURIComponent(id)+'.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}};export async function saveStudioRecord(row){if(globalThis.__screenshotTest.failWrites)return {ok:false,persistedToAirtable:false};await writeFile(join(globalThis.__screenshotTest.storage,encodeURIComponent(row.id)+'.json'),JSON.stringify(row.payload));return {ok:true,persistedToAirtable:true}}`,
  };
  // Keep canonical guardBrick, role checks, submitCapture/readCapture and durable read-back real.
  const handlers = await bundleFixture(`
    export {GET as preview} from './app/api/projects/[id]/screenshot-build/preview/[pageId]/route';
    export {GET as source} from './app/api/projects/[id]/screenshot-build/source/[pageId]/route';
    export {GET as asset} from './app/api/projects/[id]/screenshot-build/assets/[index]/route';
    export {POST as submit} from './app/api/projects/[id]/screenshot-build/submit/route';
    export {POST as login} from './app/api/portal/login/route';
    export {default as IntakePage} from './app/portal/[slug]/intake/page';
    export {default as ApplicationsPage} from './app/portal/[slug]/applications/page';
    export {guardBrick} from './lib/bricks/access';
    export {signSession,verifySession,EA_PORTAL_COOKIE} from './lib/ea-portal-auth';
    export {listPortalFormSubmissions,createPortalFormSubmission,updatePortalFormSubmissionStatus} from './lib/portal-forms/store';
    export {submitScreenshotForm} from './lib/factory-screenshot-submit';`, mocks, f.dir);
  let base = '';
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, base);
      const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks);
      const send = async (response: Response) => {
        res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
      };
      if (url.pathname === '/portal/synthetic/login') {
        if (req.method === 'POST') {
          const response=await handlers.login(new NextRequest(base+'/api/portal/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(Object.fromEntries(new URLSearchParams(body.toString())))}));
          if(!response.ok){await send(response);return;}
          const data=await response.json();res.writeHead(303,{'set-cookie':response.headers.get('set-cookie')!,location:data.next});res.end();return;
        }
        res.setHeader('content-type', 'text/html'); res.end(`<form method="post"><label>Email<input name="email" type="email"></label><label>Password<input name="password" type="password"></label><input type="hidden" name="next" value="${state.draft!.pages[0]!.previewPath}"><button>Sign in test member</button></form>`); return;
      }
      if (url.pathname === '/api/portal/login') {
        await send(await handlers.login(new NextRequest(url,{method:'POST',headers:{'content-type':'application/json'},body:body.toString()})));return;
      }
      const request = new NextRequest(url, { method: req.method, headers: req.headers as Record<string, string>,
        ...(req.method === 'POST' ? { body:body.toString(), duplex: 'half' } : {}) });
      if(['/portal/synthetic/intake','/portal/synthetic/applications'].includes(url.pathname)){
        const moduleId=url.pathname.endsWith('applications')?'applications':'intake';
        const access=await handlers.guardBrick(request,'synthetic',moduleId);if(!access.ok){await send(access.response);return;}
        state.renderSession=access.session;
        const html=renderToStaticMarkup(await (moduleId==='applications'?handlers.ApplicationsPage:handlers.IntakePage)({params:Promise.resolve({slug:'synthetic'})}));
        res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'private, no-store'});res.end(html);return;
      }
      const match = /^\/api\/projects\/([^/]+)\/screenshot-build\/(preview\/([^/]+)|source\/([^/]+)|assets\/(\d+)|submit)$/.exec(url.pathname);
      if (!match) { res.writeHead(404); res.end(); return; }
      const response = await (match[3] ? handlers.preview(request, { params: Promise.resolve({ id: match[1], pageId: match[3] }) }) :
        match[4]?handlers.source(request,{params:Promise.resolve({id:match[1],pageId:match[4]})}):
        match[5]?handlers.asset(request,{params:Promise.resolve({id:match[1],index:match[5]})}):handlers.submit(request, { params: Promise.resolve({ id: match[1] }) }));
      await send(response);
    } catch (error) { res.writeHead(500); res.end(String(error)); }
  });
  await new Promise<void>(resolve => server.listen(0, resolve));
  base = `http://localhost:${(server.address() as { port: number }).port}`;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1100, height: 1000 } });
  const page = await context.newPage();
  const evidence: string[] = [];
  try {
    const result = await assembleScreenshotBuild('synthetic-project', input, { ...f.ports,
      async saveDraft(draft) { state.draft = structuredClone(draft); await f.ports.saveDraft(draft); },
      async verify(draft) {
        assert.equal((await fetch(base + draft.pages[0]!.previewPath)).status, 401); evidence.push('private preview anonymous denial');
        assert.equal((await fetch(base+draft.pages[0]!.sourceImagePath)).status,401);
        assert.equal((await fetch(base+'/api/projects/synthetic-project/screenshot-build/assets/2')).status,401);
        await context.addCookies([{ name: 'factory', value: 'fixture', url: base }]);
        await page.goto(base + draft.pages[0]!.previewPath);
        assert.equal(await page.locator('h1').textContent(), home.components[0]!.text);
        assert.equal(await page.locator('form').count(), 1); evidence.push('desktop rendering');
        assert.equal(await page.getByRole('img',{name:'Approved synthetic logo'}).evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth===32),true);
        const factoryCookie={cookie:'factory=fixture'};
        const source=await fetch(base+draft.pages[0]!.sourceImagePath,{headers:factoryCookie});
        assert.equal(source.status,200);assert.ok(Buffer.from(await source.arrayBuffer()).equals(f.images[0]!));
        assert.equal((await fetch(base+'/api/projects/synthetic-project/screenshot-build/assets/99',{headers:factoryCookie})).status,404);
        const originalImage=f.images[0]!;state.images[0]=Buffer.from('changed');
        assert.equal((await fetch(base+draft.pages[0]!.sourceImagePath,{headers:factoryCookie})).status,404);state.images[0]=originalImage;
        await page.screenshot({ path: join(f.dir, 'desktop.png'), fullPage: true });
        await page.getByRole('link', { name: 'Your portal preview' }).click();
        assert.equal(await page.locator('h1').textContent(), 'Your private workspace');
        await page.getByRole('link',{name:'Back to home'}).click();
        await page.getByRole('link',{name:'Your portal preview'}).click();
        await page.getByRole('link', { name: 'Open Your intake requests' }).click();
        assert.match(await page.locator('body').innerText(),/log in again/i);
        await page.goto(base+draft.pages[0]!.previewPath);
        evidence.push('cross-page links');
        const submit = async (cookie: string, data: Record<string, string> = {}, origin = base) => fetch(`${base}/api/projects/synthetic-project/screenshot-build/submit`, {
          method: 'POST', headers: { origin, cookie, 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ pageId: 'home', componentId: 'apply', revision: draft.revision, requestId: 'request-123', name: 'Synthetic member', email: 'member@example.test', message: 'Synthetic review', ...data }),
        });
        const memberToken=await handlers.signSession({slug:'synthetic',orgId:'recSYNTHETIC',email:'member@example.test',role:'guest'});
        const memberCookie=`${handlers.EA_PORTAL_COOKIE}=${memberToken}`;
        const otherToken=await handlers.signSession({slug:'other',orgId:'recOTHER',email:'member@example.test',role:'guest'});
        assert.equal((await submit('')).status, 401);
        assert.equal((await submit(`${handlers.EA_PORTAL_COOKIE}=${otherToken}`)).status, 403); evidence.push('anonymous and cross-tenant form denial');
        assert.equal((await submit(`${handlers.EA_PORTAL_COOKIE}=${memberToken}tampered`)).status,401);
        const expired=await handlers.signSession({slug:'synthetic',orgId:'recSYNTHETIC',email:'member@example.test',role:'guest',exp:Date.now()-60000});
        assert.equal((await submit(`${handlers.EA_PORTAL_COOKIE}=${expired}`)).status,401);
        assert.equal((await submit(memberCookie, {}, 'https://cross-origin.invalid')).status, 400);
        state.memberActive=false;assert.equal((await submit(memberCookie)).status,403);state.memberActive=true;
        state.moduleEnabled=false;assert.equal((await submit(memberCookie)).status,403);state.moduleEnabled=true;
        const invalidLogin=await fetch(base+'/api/portal/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'member@example.test',password:'wrong'})});
        assert.equal(invalidLogin.status,401);assert.equal(invalidLogin.headers.get('set-cookie'),null);
        await page.getByRole('link', { name: 'Member login' }).click();
        await page.getByLabel('Email',{exact:true}).fill('member@example.test');await page.getByLabel('Password').fill('synthetic-fixture-password');
        await page.getByRole('button', { name: 'Sign in test member' }).click(); evidence.push('controlled login redirect');
        const portalCookie=(await context.cookies()).find(c=>c.name===handlers.EA_PORTAL_COOKIE)!;
        assert.equal((await handlers.verifySession(portalCookie.value)).orgId,'recSYNTHETIC');
        await page.getByLabel('Name', { exact: true }).fill('Synthetic member');
        await page.getByLabel('Email', { exact: true }).fill('member@example.test');
        await page.getByLabel('Your request').fill('Synthetic review');
        const savedResponse = page.waitForResponse(r => r.url().endsWith('/submit'));
        await page.getByRole('button', { name: 'Submit', exact: true }).click();
        assert.equal((await savedResponse).status(),303);
        await page.waitForURL(base+'/portal/synthetic/intake');
        assert.equal(await page.getByRole('heading',{name:'Client intake'}).count(),1);
        assert.match(await page.locator('body').innerText(),/Synthetic member/);
        const ledgerRows=await handlers.listPortalFormSubmissions('synthetic',{kind:'intake',email:'member@example.test'});
        assert.equal(ledgerRows.length,1);
        const saved={id:ledgerRows[0].payload.canonicalCaptureId};
        const persisted = JSON.parse(await readFile(join(storage, encodeURIComponent(saved.id) + '.json'), 'utf8'));
        assert.equal(persisted.organizationId, tenant.organizationId); assert.equal(persisted.payload.message, 'Synthetic review');
        assert.equal(persisted.confirmationSent, false); evidence.push('canonical capture durable disk read-back');
        await handlers.updatePortalFormSubmissionStatus({portalSlug:'synthetic',submissionId:ledgerRows[0].id,status:'reviewed'});
        const repeat = await submit(memberCookie, { requestId: persisted.requestId });
        assert.equal((await repeat.json()).id, saved.id);
        const reviewed=await handlers.listPortalFormSubmissions('synthetic',{kind:'intake',email:'member@example.test'});
        assert.equal(reviewed.length,1);assert.equal(reviewed[0].status,'reviewed');
        await handlers.createPortalFormSubmission({portalSlug:'synthetic',kind:'intake',name:'Other member secret',email:'another@example.test',requireDurable:true});
        await handlers.createPortalFormSubmission({portalSlug:'other',kind:'intake',name:'Other tenant secret',email:'member@example.test',requireDurable:true});
        await page.reload();const portalText=await page.locator('body').innerText();
        assert.match(portalText,/reviewed/);assert.doesNotMatch(portalText,/Other member secret|Other tenant secret/);
        assert.equal((await submit(memberCookie, { requestId: persisted.requestId, message: 'conflicting replay' })).status, 400);
        assert.equal((await submit(memberCookie, { email: 'someoneelse@example.test' })).status, 400);
        assert.equal((await submit(memberCookie, { revision: 'stale' })).status, 400);
        state.failWrites = true;
        assert.equal((await submit(memberCookie, { requestId: 'failure-456' })).status, 400);
        state.failWrites = false; evidence.push('failed writes, stale drafts and conflicting replays rejected');
        state.failLedgerWrites=true;
        assert.equal((await submit(memberCookie,{requestId:'ledger-failure-1'})).status,400);
        state.failLedgerWrites=false;
        assert.equal((await submit(memberCookie,{requestId:'ledger-failure-1'})).status,200);
        state.ledgerOffline=true;assert.equal((await submit(memberCookie,{requestId:'ledger-offline-1'})).status,400);state.ledgerOffline=false;
        state.dropLedgerWrites=true;assert.equal((await submit(memberCookie,{requestId:'ledger-drop-1'})).status,400);state.dropLedgerWrites=false;
        assert.equal((await submit(memberCookie,{requestId:'ledger-drop-1'})).status,200);
        const applicationDraft=await assembleScreenshotBuild('synthetic-project',{...input,formBindings:[{pageId:'home',componentId:'apply',kind:'applications'}]},
          {...f.ports,saveDraft:async next=>{state.draft=structuredClone(next);await f.ports.saveDraft(next);}});
        assert.equal(applicationDraft.status,'draft_ready');
        const application=await submit(memberCookie,{revision:applicationDraft.revision,requestId:'application-123',name:'Synthetic application'});
        assert.equal(application.status,200);const applicationResult=await application.json();
        assert.equal(applicationResult.portalPath,'/portal/synthetic/applications');
        await page.goto(base+applicationResult.portalPath);
        assert.equal(await page.getByRole('heading',{name:'My applications'}).count(),1);
        assert.match(await page.locator('body').innerText(),/Synthetic application/);
        assert.equal(JSON.parse(await readFile(join(storage,encodeURIComponent(applicationResult.id)+'.json'),'utf8')).confirmationSent,false);
        state.draft=structuredClone(draft);
        await assert.rejects(handlers.submitScreenshotForm(draft, { organizationId: 'recOTHER', portalSlug: 'other' }, {}, { email: 'member@example.test' }), /tenant mismatch/);
        await page.goto(base + draft.pages[0]!.previewPath);
        await page.setViewportSize({ width: 390, height: 844 });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        await page.screenshot({ path: join(f.dir, 'mobile.png'), fullPage: true }); evidence.push('mobile no horizontal overflow');
        const anonymous=await browser.newContext();const other=await browser.newContext();
        await other.addCookies([{name:handlers.EA_PORTAL_COOKIE,value:otherToken,url:base}]);
        try{
          const worker=await runScreenshotBrowserChecks(draft,{baseUrl:base,context,anonymous,otherTenant:other,outputDir:join(f.dir,'worker'),
            fixtures:[{pageId:'home',componentId:'apply',fields:{name:'Worker test member',email:'member@example.test',message:'Worker persistence check'}}]});
          assert.equal(worker.outcomes.filter(outcome=>outcome.status==='PASS').length,6,JSON.stringify(worker.outcomes));
          assert.equal(worker.outcomes.find(outcome=>outcome.check==='visual-mobile')!.status,'BLOCKED');
          assert.equal(worker.outcomes.find(outcome=>outcome.check==='visual-desktop')!.status,'FAIL','Synthetic interpretation intentionally lacks reference backgrounds; mismatch must not certify');
        }finally{await anonymous.close();await other.close();}
        evidence.push('actual intake and applications portals render persisted own records; signed sessions, durable ledger replay/drop failures and approved asset/source routes verified');
        // Reference-image fidelity still requires the real reference and interpretation provider.
        return ACCEPTANCE_CHECKS.filter(check => !check.startsWith('visual-')).map(check => ({ check, passed: true, method: 'browser' as const,
          detail: `Synthetic HTTP/browser acceptance: ${check}; controlled auth/vision/storage services`,
          artifact: join(f.dir, 'evidence.json'), runId: 'synthetic-http', revision: draft.revision, checkedAt: new Date().toISOString() }));
      },
    });
    assert.equal(result.status, 'draft_ready', result.blockers.join('\n')); // visual fidelity deliberately not fabricated
    assert.equal(result.evidence.length, 6, result.blockers.join('\n'));
    await writeFile(join(f.dir, 'evidence.json'), JSON.stringify({ result, assertions: evidence,
          limitations: ['Vision and identity/storage provider transports are controlled fixtures; login handler, HMAC sessions, capture and portal ledger/page are actual code.', 'Real provider availability and screenshot-reference fidelity are not certified.'] }, null, 2));
    console.log(`Synthetic image-to-private-preview evidence: ${join(f.dir, 'evidence.json')}`);
  } finally {
    await context.close(); await browser.close(); await new Promise<void>(resolve => server.close(() => resolve()));
    delete (globalThis as Record<string, unknown>).__screenshotTest;
  }
});
