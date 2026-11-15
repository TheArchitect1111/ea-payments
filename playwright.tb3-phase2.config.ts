import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./tests',testMatch:'tb3-phase2.spec.ts',workers:1,fullyParallel:false,retries:0,
  timeout:75000,expect:{timeout:20000},
  reporter:[['list'],['html',{open:'never',outputFolder:'playwright-tb3-phase2-report'}]],
  use:{baseURL:'http://127.0.0.1:3219',screenshot:'only-on-failure',trace:'retain-on-failure'},
  // The isolated certification worktree shares dependencies through a junction.
  // Use Next's supported webpack dev server so Playwright does not require
  // Turbopack to resolve node_modules outside the worktree root.
  webServer:{command:'node ./node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3219',url:'http://127.0.0.1:3219/tarris',reuseExistingServer:false,timeout:240000,env:{
    VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/tb3-hq-remake-20261005',TB3_MERCH_CHECKOUT_ENABLED:'false',NEXT_TELEMETRY_DISABLED:'1'
  }},
  projects:[
    {name:'Desktop Chrome',use:{...devices['Desktop Chrome']}},
    {name:'Mobile Chrome 390',use:{...devices['Desktop Chrome'],viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  ],
});
