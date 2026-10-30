#!/usr/bin/env node
import { appendFileSync } from 'node:fs';
import { resolveGithubPreview } from '../lib/launch-certification/github-preview-check.mjs';

const result = await resolveGithubPreview({
  sourceCommit: process.env.EA_SOURCE_COMMIT || process.env.GITHUB_SHA || '',
  repository: process.env.GITHUB_REPOSITORY || '',
  token: process.env.GITHUB_TOKEN || '',
});

if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `EA_CERTIFICATION_BASE_URL=${result.url}\n`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `url=${result.url}\n`);
console.log(`Resolved commit-bound Vercel preview for ${result.sourceCommit}: ${result.url}`);
