import {defineConfig, devices} from '@playwright/test';
const port=3118;
export default defineConfig({
  testDir:'./tests/tb3-browser',
  timeout:45000,
  retries:1,
  reporter:'list',
  use:{baseURL:'http://127.0.0.1:'+port,trace:'retain-on-failure'},
  webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port '+port,
    url:'http://127.0.0.1:'+port+'/tarris',
    reuseExistingServer:!process.env.CI,timeout:180000},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],
});
