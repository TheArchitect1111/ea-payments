import { chromium } from '@playwright/test';

const journeys = [
  { name: 'EA home', url: 'https://efficiencyarchitects.online/', marker: null },
  { name: 'Amplifi public', url: 'https://efficiencyarchitects.online/amplifi', marker: 'Focus on your craft' },
  { name: 'Amanda public', url: 'https://amandacatherine.ca/', marker: null },
  { name: 'Amanda portal entry', url: 'https://efficiencyarchitects.online/portal/amanda-catherine', marker: null },
  { name: 'CPR public', url: 'https://canadianprospectrecruitment.vercel.app/', marker: null },
];

async function settleImages(page) {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const step = Math.max(Math.floor(window.innerHeight * 0.8), 500);
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    for (let y = 0; y < height; y += step) {
      window.scrollTo(0, y);
      await delay(90);
    }
    window.scrollTo(0, 0);
    const images = Array.from(document.images);
    await Promise.all(images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, 5_000);
      });
    }));
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];

for (const journey of journeys) {
  try {
    const imageHttpFailures = [];
    const onResponse = (response) => {
      const request = response.request();
      if (request.resourceType() === 'image' && response.status() >= 400) {
        imageHttpFailures.push(`${response.status()} ${response.url()}`);
      }
    };
    page.on('response', onResponse);

    const response = await page.goto(journey.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const status = response?.status() ?? 0;
    if (status >= 400 || status === 0) throw new Error(`HTTP ${status}`);
    const body = await page.locator('body').innerText();
    if (body.trim().length < 40) throw new Error('page body is unexpectedly empty');
    if (/application error|internal server error|unable to load agreement/i.test(body)) throw new Error('known failure text detected');
    if (journey.marker && !body.includes(journey.marker)) throw new Error(`approved marker missing: ${journey.marker}`);

    await settleImages(page);
    const brokenImages = await page.locator('img').evaluateAll((images) => images
      .filter((img) => {
        const src = img.currentSrc || img.getAttribute('src') || '';
        if (!src || src.startsWith('data:') || src.startsWith('blob:')) return false;
        return img.complete && img.naturalWidth === 0;
      })
      .map((img) => img.currentSrc || img.getAttribute('src')));

    page.off('response', onResponse);
    if (imageHttpFailures.length) throw new Error(`image HTTP failures: ${imageHttpFailures.slice(0, 5).join(', ')}`);
    if (brokenImages.length) throw new Error(`broken images after load settlement: ${brokenImages.slice(0, 5).join(', ')}`);
    console.log(`[recovery-journey] PASS ${journey.name} ${status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${journey.name}: ${message}`);
    console.error(`[recovery-journey] FAIL ${journey.name}: ${message}`);
    page.removeAllListeners('response');
  }
}

await browser.close();
if (failures.length) {
  console.error(`Recovery journey monitor failed (${failures.length}/${journeys.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Recovery journey monitor passed (${journeys.length}/${journeys.length}).`);
