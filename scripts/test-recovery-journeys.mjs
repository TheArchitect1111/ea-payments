import { chromium } from '@playwright/test';

const journeys = [
  { name: 'EA home', url: 'https://efficiencyarchitects.online/', marker: null },
  { name: 'Amplifi public', url: 'https://efficiencyarchitects.online/amplifi', marker: 'Focus on your craft' },
  { name: 'Amanda public', url: 'https://amandacatherine.ca/', marker: null },
  { name: 'Amanda portal entry', url: 'https://efficiencyarchitects.online/portal/amanda-catherine', marker: null },
  { name: 'CPR public', url: 'https://canadianprospectrecruitment.vercel.app/', marker: null },
];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];

for (const journey of journeys) {
  try {
    const response = await page.goto(journey.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const status = response?.status() ?? 0;
    if (status >= 400 || status === 0) throw new Error(`HTTP ${status}`);
    const body = await page.locator('body').innerText();
    if (body.trim().length < 40) throw new Error('page body is unexpectedly empty');
    if (/application error|internal server error|unable to load agreement/i.test(body)) throw new Error('known failure text detected');
    if (journey.marker && !body.includes(journey.marker)) throw new Error(`approved marker missing: ${journey.marker}`);
    const brokenImages = await page.locator('img').evaluateAll((images) => images.filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.getAttribute('src')));
    if (brokenImages.length) throw new Error(`broken images: ${brokenImages.slice(0, 5).join(', ')}`);
    console.log(`[recovery-journey] PASS ${journey.name} ${status}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${journey.name}: ${message}`);
    console.error(`[recovery-journey] FAIL ${journey.name}: ${message}`);
  }
}

await browser.close();
if (failures.length) {
  console.error(`Recovery journey monitor failed (${failures.length}/${journeys.length}):\n${failures.join('\n')}`);
  process.exit(1);
}
console.log(`Recovery journey monitor passed (${journeys.length}/${journeys.length}).`);
