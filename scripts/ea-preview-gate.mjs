import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';

const previewUrl = process.env.EA_PREVIEW_URL;
const routePath = process.env.EA_GATE_PATH || '/';
const sourceCommit = process.env.EA_SOURCE_COMMIT || '';
const minVisuals = Number(process.env.EA_MIN_VISUALS || 1);
const outDir = path.resolve(process.env.EA_GATE_OUTPUT || 'artifacts/ea-gate');

if (!previewUrl) throw new Error('EA_PREVIEW_URL is required');
if (!sourceCommit) throw new Error('EA_SOURCE_COMMIT is required');
mkdirSync(outDir, { recursive: true });

const target = new URL(routePath, previewUrl).toString();
const results = {
  sourceCommit,
  previewUrl,
  target,
  completedAt: new Date().toISOString(),
  status: 'FAIL',
  gates: {
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

async function inspectViewport(browser, name, viewport, isMobile = false) {
  const context = await browser.newContext({ viewport, isMobile, deviceScaleFactor: 1 });
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

  const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);

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
    name,
    httpStatus: status,
    screenshot,
    screenshotSha256: sha256(screenshot),
    consoleErrors,
    pageErrors,
    failedRequests,
    badImageResponses,
    brokenImgs,
    brokenBackgrounds,
    renderedVisuals,
    overflow,
    bodyTextLength: dom.bodyTextLength,
    scrollHeight: dom.scrollHeight,
    viewport,
  };
}

const browser = await chromium.launch({ headless: true });
let desktop, mobile;
try {
  desktop = await inspectViewport(browser, 'desktop', { width: 1440, height: 1100 });
  mobile = await inspectViewport(browser, 'mobile', { width: 390, height: 844 }, true);
} finally {
  await browser.close();
}

results.details.desktop = desktop;
results.details.mobile = mobile;

const all = [desktop, mobile];
const functionalPass = all.every((r) => r.httpStatus >= 200 && r.httpStatus < 400 && r.pageErrors.length === 0 && r.bodyTextLength > 40);
const assetsPass = all.every((r) => r.brokenImgs.length === 0 && r.brokenBackgrounds.length === 0 && r.badImageResponses.length === 0 && r.renderedVisuals >= minVisuals);
const desktopPass = desktop.overflow <= 2 && desktop.consoleErrors.length === 0 && desktop.failedRequests.length === 0 && desktop.scrollHeight > desktop.viewport.height;
const mobilePass = mobile.overflow <= 2 && mobile.consoleErrors.length === 0 && mobile.failedRequests.length === 0 && mobile.scrollHeight > mobile.viewport.height;

// Creative Critic is deliberately independent from the builder. This deterministic critic
// refuses obviously incomplete visual experiences. A future AI critic can add stricter scoring
// without weakening these hard rules.
const criticReasons = [];
if (!assetsPass) criticReasons.push('visual assets failed');
if (!desktopPass) criticReasons.push('desktop visual gate failed');
if (!mobilePass) criticReasons.push('mobile visual gate failed');
if (Math.min(desktop.renderedVisuals, mobile.renderedVisuals) < minVisuals) criticReasons.push(`fewer than ${minVisuals} rendered visuals`);
if (desktop.bodyTextLength < 150 || mobile.bodyTextLength < 150) criticReasons.push('page appears visually/content incomplete');
const criticPass = criticReasons.length === 0;

results.gates.assets = { status: assetsPass ? 'PASS' : 'FAIL', proof: `desktop:${desktop.renderedVisuals}-visuals mobile:${mobile.renderedVisuals}-visuals` };
results.gates.functional = { status: functionalPass ? 'PASS' : 'FAIL', proof: `desktop:${desktop.httpStatus} mobile:${mobile.httpStatus}` };
results.gates.desktopVisual = { status: desktopPass ? 'PASS' : 'FAIL', proof: `sha256:${desktop.screenshotSha256}` };
results.gates.mobileVisual = { status: mobilePass ? 'PASS' : 'FAIL', proof: `sha256:${mobile.screenshotSha256}` };
results.gates.creativeCritic = { status: criticPass ? 'PASS' : 'FAIL', proof: criticPass ? 'objective-visual-critic:v1' : criticReasons.join('; ') };

results.status = Object.values(results.gates).every((g) => g.status === 'PASS') ? 'PASS' : 'FAIL';
writeFileSync(path.join(outDir, 'gate-result.json'), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.status !== 'PASS') process.exit(1);
