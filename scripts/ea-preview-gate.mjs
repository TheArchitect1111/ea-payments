import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const previewUrl = process.env.EA_PREVIEW_URL;
const routePath = process.env.EA_GATE_PATH || '/';
const sourceCommit = process.env.EA_SOURCE_COMMIT || '';
const tb3FilmRelease = process.env.EA_RELEASE_PROFILE === 'tb3-film-release';
const placeholderProof = tb3FilmRelease ? (await import('./production-certification.js')).default.certifyTB3() : null;
if (tb3FilmRelease && routePath !== '/tarris/future') throw new Error('TB3 release profile is restricted to /tarris/future');
const minVisuals = tb3FilmRelease ? 0 : Number(process.env.EA_MIN_VISUALS || 1);
const outDir = path.resolve(process.env.EA_GATE_OUTPUT || 'artifacts/ea-gate');
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '';
const bypassHeaders = bypassSecret ? {
  'x-vercel-protection-bypass': bypassSecret,
  'x-vercel-set-bypass-cookie': 'true',
} : {};

if (!previewUrl) throw new Error('EA_PREVIEW_URL is required');
if (!sourceCommit) throw new Error('EA_SOURCE_COMMIT is required');
mkdirSync(outDir, { recursive: true });

let cleanPreview = new URL(previewUrl);
cleanPreview.search = '';
cleanPreview.hash = '';
let target = new URL(routePath, cleanPreview).toString();
let buildInfoUrl = new URL('/api/ops/build-info', cleanPreview).toString();
const results = {
  sourceCommit,
  previewUrl: cleanPreview.toString(),
  target,
  completedAt: new Date().toISOString(),
  status: 'FAIL',
  gates: {
    sourceIdentity: { status: 'FAIL', proof: '' },
    build: { status: 'PASS', proof: `source:${sourceCommit}` },
    assets: { status: 'FAIL', proof: '' },
    functional: { status: 'FAIL', proof: '' },
    desktopVisual: { status: 'FAIL', proof: '' },
    mobileVisual: { status: 'FAIL', proof: '' },
    creativeCritic: { status: 'FAIL', proof: '' },
  },
  details: {},
};

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

let buildInfo = null;
try {
  const r = await fetch(buildInfoUrl, { cache: 'no-store', headers: bypassHeaders });
  if (r.ok) buildInfo = await r.json();
} catch {}
let sourceIdentityPass = Boolean(buildInfo?.commitSha && buildInfo.commitSha === sourceCommit);
let localServer = null;
if (!sourceIdentityPass && (!bypassSecret || tb3FilmRelease)) {
  localServer = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', '3000'], { env: { ...process.env, VERCEL_GIT_COMMIT_SHA: sourceCommit, VERCEL_GIT_COMMIT_REF: 'master', VERCEL_ENV: 'preview' }, stdio: 'ignore' });
  cleanPreview = new URL('http://127.0.0.1:3000');
  target = new URL(routePath, cleanPreview).toString();
  buildInfoUrl = new URL('/api/ops/build-info', cleanPreview).toString();
  for (let i = 0; i < 30; i += 1) { try { const r = await fetch(buildInfoUrl, { cache: 'no-store' }); if (r.ok) { buildInfo = await r.json(); break; } } catch {} await new Promise((resolve) => setTimeout(resolve, 1000)); }
  sourceIdentityPass = Boolean(buildInfo?.commitSha && buildInfo.commitSha === sourceCommit);
  results.details.certificationTransport = 'exact-built-checkout-local';
}
results.details.buildInfo = buildInfo;
results.gates.sourceIdentity = {
  status: sourceIdentityPass ? 'PASS' : 'FAIL',
  proof: buildInfo?.commitSha ? `preview:${buildInfo.commitSha}` : 'preview-build-identity-unavailable',
};
if (!sourceIdentityPass) {
  writeFileSync(path.join(outDir, 'gate-result.json'), JSON.stringify(results, null, 2));
  console.error(`Preview source mismatch or protected preview is inaccessible. Expected ${sourceCommit}, received ${buildInfo?.commitSha || 'none'}.`);
  process.exit(1);
}

async function inspectViewport(browser, name, viewport, isMobile = false, pageTarget = target) {
  const context = await browser.newContext({ viewport, isMobile, deviceScaleFactor: 1, extraHTTPHeaders: bypassHeaders });
  const page = await context.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badImageResponses = [];

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  page.on('requestfailed', (req) => failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'failed'}`));
  page.on('response', (res) => {
    const type = res.request().resourceType();
    if (type === 'image' && !res.ok()) badImageResponses.push(`${res.status()} ${res.url()}`);
  });

  const response = await page.goto(pageTarget, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  await page.evaluate(async () => {
    const lazyImages = [...document.images].filter((img) => img.loading === 'lazy');
    for (const img of lazyImages) img.loading = 'eager';
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  });

  const dom = await page.evaluate(async () => {
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) !== 0 && r.width > 2 && r.height > 2;
    };
    const imgs = [...document.images].filter(visible).map((img) => ({
      src: img.currentSrc || img.src,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      width: img.getBoundingClientRect().width,
      height: img.getBoundingClientRect().height,
    }));
    const bgUrls = [];
    for (const el of [...document.querySelectorAll('*')]) {
      if (!visible(el)) continue;
      const bg = getComputedStyle(el).backgroundImage;
      if (!bg || bg === 'none') continue;
      for (const match of bg.matchAll(/url\(["']?(.*?)["']?\)/g)) {
        try { bgUrls.push(new URL(match[1], location.href).toString()); } catch {}
      }
    }
    const uniqueBg = [...new Set(bgUrls)];
    const bgChecks = [];
    for (const url of uniqueBg) {
      try {
        const r = await fetch(url, { cache: 'no-store' });
        bgChecks.push({ url, ok: r.ok, status: r.status, type: r.headers.get('content-type') || '' });
      } catch (err) {
        bgChecks.push({ url, ok: false, status: 0, type: String(err) });
      }
    }
    const root = document.documentElement;
    return {
      placeholderSlots: [...document.querySelectorAll('[aria-label^="SLOT_"]')].filter(visible).map(el => el.getAttribute('aria-label')),
      publicBackground: document.querySelector('#home') ? getComputedStyle(document.querySelector('#home')).backgroundColor : null,
      title: document.title,
      bodyTextLength: document.body.innerText.trim().length,
      scrollWidth: root.scrollWidth,
      clientWidth: root.clientWidth,
      scrollHeight: root.scrollHeight,
      clientHeight: root.clientHeight,
      imgs,
      bgChecks,
    };
  });

  const screenshot = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  await context.close();

  const brokenImgs = dom.imgs.filter((img) => !img.complete || img.naturalWidth < 8 || img.naturalHeight < 8);
  const brokenBackgrounds = dom.bgChecks.filter((bg) => !bg.ok || !bg.type.toLowerCase().startsWith('image/'));
  const renderedVisuals = dom.imgs.length + dom.bgChecks.length;
  const overflow = Math.max(0, dom.scrollWidth - dom.clientWidth);
  const status = response?.status() || 0;
  return {
    name, httpStatus: status, screenshot, screenshotSha256: sha256(screenshot), consoleErrors,
    pageErrors, failedRequests, badImageResponses, brokenImgs, brokenBackgrounds, renderedVisuals,
    overflow, bodyTextLength: dom.bodyTextLength, scrollHeight: dom.scrollHeight, viewport,
    placeholderSlots: dom.placeholderSlots, publicBackground: dom.publicBackground,
  };
}

const browser = await chromium.launch({ headless: true });
let desktop, mobile, publicDesktop, publicMobile;
let tb3WiringPass = !tb3FilmRelease;
try {
  if (tb3FilmRelease) {
    const context = await browser.newContext({ extraHTTPHeaders: bypassHeaders });
    const page = await context.newPage();
    const checks = [
      ['/tarris', 'ENTER TB3 HQ', '/tarris/future'],
      ['/tarris/future', 'LET', '/tarris/future/agreement'],
      ['/tarris/future/agreement', 'Continue to Signature', '/tarris/future/sign'],
      ['/tarris/future/sign', 'View the full agreement', '/tarris/future/agreement'],
    ];
    for (const [route, label, href] of checks) {
      const response = await page.goto(new URL(route, cleanPreview).toString(), { waitUntil: 'networkidle' });
      if (response?.status() !== 200 || await page.locator(`a[href="${href}"]`).filter({ hasText: label }).count() === 0) throw new Error(`TB3 wiring failed: ${route} -> ${href}`);
    }
    const publicLink = page;
    await publicLink.goto(new URL('/tarris', cleanPreview).toString());
    await publicLink.getByRole('link', { name: /ENTER TB3 HQ/ }).first().click();
    await publicLink.waitForURL('**/tarris/future');
    await publicLink.getByRole('link', { name: /LET.*GET TO WORK/ }).click();
    await publicLink.waitForURL('**/tarris/future/agreement');
    await publicLink.getByRole('link', { name: /Continue to Signature/ }).click();
    await publicLink.waitForURL('**/tarris/future/sign');
    tb3WiringPass = true;
    results.details.tb3FilmRelease = placeholderProof;
    await context.close();
  }
  desktop = await inspectViewport(browser, 'desktop', { width: 1440, height: 1100 });
  mobile = await inspectViewport(browser, 'mobile', { width: 390, height: 844 }, true);
  if (tb3FilmRelease) {
    const publicTarget = new URL('/tarris', cleanPreview).toString();
    publicDesktop = await inspectViewport(browser, 'public-desktop', { width: 1440, height: 1100 }, false, publicTarget);
    publicMobile = await inspectViewport(browser, 'public-mobile', { width: 390, height: 844 }, true, publicTarget);
    for (const view of [publicDesktop, publicMobile]) {
      if (view.bodyTextLength < 150 || view.renderedVisuals < minVisuals) throw new Error('Public TB3 layout failed: ' + view.name);
    }
  }
} finally {
  await browser.close();
}
results.details.desktop = desktop;
results.details.mobile = mobile;

results.details.publicDesktop = publicDesktop;
results.details.publicMobile = publicMobile;
const all = [desktop, mobile, publicDesktop, publicMobile].filter(Boolean);
const functionalPass = tb3WiringPass && all.every((r) => r.httpStatus >= 200 && r.httpStatus < 400 && r.pageErrors.length === 0 && r.bodyTextLength > 40);
const assetsPass = all.every((r) => r.brokenImgs.length === 0 && r.brokenBackgrounds.length === 0 && r.badImageResponses.length === 0 && r.renderedVisuals >= minVisuals);
const desktopPass = [desktop, publicDesktop].filter(Boolean).every(v => v.overflow <= 2 && v.consoleErrors.length === 0 && v.failedRequests.length === 0 && v.scrollHeight >= v.viewport.height);
const mobilePass = [mobile, publicMobile].filter(Boolean).every(v => v.overflow <= 2 && v.consoleErrors.length === 0 && v.failedRequests.length === 0 && v.scrollHeight >= v.viewport.height);

const criticReasons = [];
if (!assetsPass) criticReasons.push('visual assets failed');
if (!desktopPass) criticReasons.push('desktop visual gate failed');
if (!mobilePass) criticReasons.push('mobile visual gate failed');
if (Math.min(desktop.renderedVisuals, mobile.renderedVisuals) < minVisuals) criticReasons.push(`fewer than ${minVisuals} rendered visuals`);
if (desktop.bodyTextLength < 150 || mobile.bodyTextLength < 150) criticReasons.push('page appears visually/content incomplete');
const criticPass = criticReasons.length === 0;

results.gates.assets = { status: assetsPass ? 'PASS' : 'FAIL', proof: tb3FilmRelease ? `tb3-film-release:${placeholderProof.videos.join(',')}; distinct-sha256:${placeholderProof.videoHashes.join(',')}` : `desktop:${desktop.renderedVisuals}-visuals mobile:${mobile.renderedVisuals}-visuals` };
results.gates.functional = { status: functionalPass ? 'PASS' : 'FAIL', proof: `desktop:${desktop.httpStatus} mobile:${mobile.httpStatus}` };
results.gates.desktopVisual = { status: desktopPass ? 'PASS' : 'FAIL', proof: `sha256:${desktop.screenshotSha256}` };
results.gates.mobileVisual = { status: mobilePass ? 'PASS' : 'FAIL', proof: `sha256:${mobile.screenshotSha256}` };
results.gates.creativeCritic = { status: criticPass ? 'PASS' : 'FAIL', proof: criticPass ? 'objective-visual-critic:v1' : criticReasons.join('; ') };
results.status = Object.values(results.gates).every((g) => g.status === 'PASS') ? 'PASS' : 'FAIL';
writeFileSync(path.join(outDir, 'gate-result.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (localServer) localServer.kill('SIGTERM');
if (results.status !== 'PASS') process.exit(1);
