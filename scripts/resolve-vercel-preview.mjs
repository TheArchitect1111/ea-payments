#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { resolveVercelPreview } from '../lib/launch-certification/vercel-preview.mjs';

const result = await resolveVercelPreview({
  sourceCommit: process.env.EA_SOURCE_COMMIT || process.env.GITHUB_SHA || '',
  token: process.env.VERCEL_TOKEN || '',
  projectId: process.env.EA_VERCEL_PROJECT_ID || '',
  teamId: process.env.EA_VERCEL_TEAM_ID || '',
});

if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `EA_CERTIFICATION_BASE_URL=${result.url}\n`);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `url=${result.url}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `deployment_id=${result.deploymentId || ''}\n`);
}
console.log(`Resolved exact READY Vercel preview ${result.deploymentId} for ${result.sourceCommit}: ${result.url}`);
