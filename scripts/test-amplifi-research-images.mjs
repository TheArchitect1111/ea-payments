import assert from 'node:assert/strict';
import fs from 'node:fs';

const store = fs.readFileSync('lib/creative-studio/campaign-store.ts', 'utf8');
const research = fs.readFileSync('lib/creative-studio/research-engine.ts', 'utf8');
const images = fs.readFileSync('lib/creative-studio/image-engine.ts', 'utf8');
const generator = fs.readFileSync('lib/creative-studio/generate-assets.ts', 'utf8');
const dashboard = fs.readFileSync('app/admin/creative-studio/campaigns/[id]/CampaignDashboardClient.tsx', 'utf8');

assert.ok(store.includes('researchCampaign('), 'Campaign build does not run research.');
assert.ok(store.includes('createCampaignImages('), 'Campaign build does not run image selection.');
assert.ok(store.includes('applySuggestedImages'), 'Images are not assigned to generated posts.');
assert.ok(research.includes('SEARXNG_URL'), 'Open-source search provider is not supported.');
assert.ok(research.includes("tools: [{ type: 'web_search' }]"), 'Web-search fallback is not configured.');
assert.ok(research.includes('supportedFacts'), 'Research does not preserve supported facts.');
assert.ok(images.includes('api.openverse.org/v1/images'), 'Openverse image discovery is missing.');
assert.ok(images.includes("'cc0,pdm'"), 'Image search is not restricted to public-domain candidates.');
assert.ok(images.includes("gpt-image-1"), 'Generated-image fallback is missing.');
assert.ok(images.includes("BLOB_READ_WRITE_TOKEN"), 'Generated images are not persisted.');
assert.ok(generator.includes('research?.sources.length'), 'Post generation is not grounded in research.');
assert.ok(generator.includes('Use only supported facts.'), 'Unsupported-fact guardrail is missing.');
assert.ok(dashboard.includes('What informed this campaign'), 'Research provenance is not visible.');
assert.ok(dashboard.includes('Verify image source'), 'Image rights verification is not visible.');

console.log('Amplifi research and image pipeline contract passed.');
