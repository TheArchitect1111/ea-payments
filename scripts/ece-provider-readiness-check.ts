/**
 * Print SET/MISSING for required ECE env vars without printing values.
 * Run: npx --yes tsx scripts/ece-provider-readiness-check.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { resolveVisionCriticProvider } from '../lib/experience-creation/vision-critic-provider';
import { assessExperienceProviderReadiness } from '../lib/experience-creation/provider-readiness';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env) || !process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(process.cwd(), '.env.local'));
loadEnvFile(path.join(process.cwd(), '.env'));

const keys = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'CLAUDE_API_KEY',
  'AI_MODEL_DEFAULT',
  'AI_MODEL_RESEARCH',
  'AI_MODEL_VISION',
  'FACTORY_RESEARCH_MODEL',
  'ECE_FACE_FOCAL_ENABLED',
  'FIRECRAWL_API_KEY',
  'AIRTABLE_API_KEY',
  'SESSION_SECRET',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
];

for (const key of keys) {
  console.log(`${key}: ${process.env[key]?.trim() ? 'SET' : 'MISSING'}`);
}

const vision = resolveVisionCriticProvider();
const readiness = assessExperienceProviderReadiness();
console.log(
  JSON.stringify(
    {
      visionProvider: { id: vision.id, ready: vision.ready, model: vision.model, missing: vision.missing },
      readiness: {
        status: readiness.status,
        canGeneratePacks: readiness.canGeneratePacks,
        canCertify: readiness.canCertify,
        research: readiness.research,
        creative: readiness.creative,
        visionCritic: readiness.visionCritic,
        openverse: readiness.openverse,
        faceFocal: readiness.faceFocal,
        reasons: readiness.reasons,
        configurationHints: readiness.configurationHints,
      },
    },
    null,
    2,
  ),
);
