import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.SMOKE_PORT || 3102);
const baseURL = process.env.SMOKE_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/smoke',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 45_000,
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: process.env.SMOKE_BASE_URL
    ? undefined
    : {
        command: `node scripts/start-production.mjs --hostname 127.0.0.1 --port ${port}`,
        port,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
