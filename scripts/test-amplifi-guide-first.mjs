import assert from 'node:assert/strict';
import fs from 'node:fs';

const packs = fs.readFileSync('lib/creative-studio/strategy-packs.ts', 'utf8');
const generator = fs.readFileSync('lib/creative-studio/generate-assets.ts', 'utf8');

const requiredGuideLanguage = [
  "posture: 'A warm, experienced guide",
  "'Reflect what life or work may feel like now without judging the reader'",
  "'Help the reader imagine what could become easier, clearer, or more possible'",
  "'Invite the reader to explore Consider the Possibilities™ without pressure'",
  "'Does this unmistakably sound like a guide rather than a consultant?'",
  "conversionUrl: 'https://cc.efficiencyarchitects.online/ctp'",
];

for (const phrase of requiredGuideLanguage) {
  assert.ok(packs.includes(phrase), `Missing EA guide contract: ${phrase}`);
}

const prohibited = [
  'operational gaps',
  'qualified leads',
  'diagnose',
  'consultation',
  'business-growth systems',
  'improve your operations',
  'digital transformation',
  'pain points',
  'sales funnel',
];

for (const phrase of prohibited) {
  assert.ok(packs.includes(`'${phrase}'`), `Missing prohibited EA phrase: ${phrase}`);
}

assert.ok(generator.includes('function eaGuideCopy'), 'EA guide fallback copy is missing.');
assert.ok(generator.includes('pack.prohibitedLanguage.filter'), 'Prohibited-language critic is missing.');
assert.ok(generator.includes("EA copy sounds like a consultant or agency instead of a guide."), 'EA posture critic is missing.');
assert.ok(generator.includes('silently apply every critic question'), 'AI brand-critic instruction is missing.');
assert.equal(/qualified business leads/i.test(generator.match(/function eaGuideCopy[\s\S]*?function fallbackCopy/)?.[0] || ''), false, 'EA fallback contains lead-generation language.');
assert.equal(/operational gaps/i.test(generator.match(/function eaGuideCopy[\s\S]*?function fallbackCopy/)?.[0] || ''), false, 'EA fallback contains consultant language.');

console.log('Amplifi EA guide-first campaign contract passed.');
