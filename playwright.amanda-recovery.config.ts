import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/amanda-recovery',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: 1,
  reporter: [['html', { outputFolder: 'playwright-report/amanda-recovery', open: 'never' }], ['list']],
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
  ],
  outputDir: 'test-results/amanda-recovery',
});
