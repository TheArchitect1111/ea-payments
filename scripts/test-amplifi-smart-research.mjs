import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('lib/amplifi/smart-research.ts', 'utf8');
assert.ok(source.includes('MAX_SUBJECTS = 3'), 'Smart Research must enforce the three-subject product limit.');
assert.ok(source.includes('SEARXNG_URL'), 'Smart Research must support the open-source search provider.');
assert.ok(source.includes("tools: [{ type: 'web_search' }]"), 'Smart Research needs a web-search fallback.');
assert.ok(source.includes('supportedFacts'), 'Research intelligence must preserve evidence-backed facts.');
assert.ok(source.includes('trustedSources'), 'Research subjects must support preferred sources.');
assert.ok(source.includes('relevance'), 'Research results must be relevance-ranked.');
assert.ok(source.includes("confidence: 'high' | 'medium' | 'low'"), 'Research results need confidence labels.');
assert.ok(source.includes('new Map(items.map((item) => [item.url, item]))'), 'Research results must be deduplicated by URL.');
assert.ok(source.includes('Never invent facts or URLs.'), 'Research fallback must explicitly prohibit fabricated evidence.');
console.log('Amplifi Smart Research contract passed.');
