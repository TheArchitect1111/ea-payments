import { defineConfig, devices } from '@playwright/test';

/**
 * ECE visual verification viewports — expand existing Playwright; do not add a second platform.
 * Capture screenshots for multimodal critic; pixel compare alone is insufficient for premium quality.
 */
const port = Number(process.env.SMOKE_PORT || 3102);
const baseURL = process.env.SMOKE_BASE_URL || process.env.ECE_BASE_URL || `http://127.0.0.1:${port}`;
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const protectedPreview = /^https:\/\/.*\.vercel\.app/i.test(baseURL);

if (protectedPreview && !bypass) {
  throw new Error('VERCEL_AUTOMATION_BYPASS_SECRET is required for ECE QA against protected Vercel previews');
}

export default defineConfig({
  testDir: './tests/ece-visual',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 90_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    ...(bypass ? {
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': bypass,
        'x-vercel-set-bypass-cookie': 'true',
      },
    } : {}),
  },
  projects: [
    { name: 'ece-mobile-390', use: { viewport: { width: 390, height: 844 }, ...devices['Desktop Chrome'] } },
    { name: 'ece-tablet-768', use: { viewport: { width: 768, height: 1024 }, ...devices['Desktop Chrome'] } },
    { name: 'ece-laptop-1440', use: { viewport: { width: 1440, height: 900 }, ...devices['Desktop Chrome'] } },
    { name: 'ece-desktop-1920', use: { viewport: { width: 1920, height: 1080 }, ...devices['Desktop Chrome'] } },
  ],
});
