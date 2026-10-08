import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'amanda-public.spec.ts',
  timeout: 45_000,
  expect: { timeout: 12_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-amanda-report', open: 'never' }]],
  use: { ...devices['Desktop Chrome'], headless: true, screenshot: 'only-on-failure',
    trace: 'retain-on-failure', video: 'retain-on-failure' },
});
