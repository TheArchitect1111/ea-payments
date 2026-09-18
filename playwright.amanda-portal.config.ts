import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/amanda-recovery',
  timeout: 60000,
  retries: 1,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'retain-on-failure' },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Pixel 7', use: { ...devices['Pixel 7'] } },
  ],
  outputDir: 'test-results/amanda-recovery',
});