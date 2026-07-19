/**
 * Contract test for Opportunity Intelligence Brief™ (Launch Protocol v3).
 * Run: node scripts/test-factory-launch-email.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const packSrc = readFileSync(join(root, 'lib/factory-concept-pack.ts'), 'utf8');
const notifySrc = readFileSync(join(root, 'lib/factory-notify.ts'), 'utf8');
const emailSrc = readFileSync(join(root, 'lib/email.ts'), 'utf8');
const gateSrc = readFileSync(join(root, 'lib/factory-concept-quality-gate.ts'), 'utf8');
const rendersSrc = readFileSync(join(root, 'lib/factory-concept-renders.tsx'), 'utf8');
const researchSrc = readFileSync(join(root, 'lib/factory-org-research.ts'), 'utf8');
const briefParse = await import(
  pathToFileURL(join(root, 'lib/factory-opportunity-brief-parse.mjs')).href
);

assert(packSrc.includes('Opportunity Intelligence Brief™'), 'email is OIB™');
assert(packSrc.includes('Executive Intelligence'), 'has Executive Intelligence');
assert(packSrc.includes('Opportunity Scorecard'), 'has Opportunity Scorecard');
assert(packSrc.includes('Hidden opportunities'), 'has Hidden opportunities');
assert(packSrc.includes('Executive Conversation Guide'), 'has Conversation Guide');
assert(packSrc.includes('Discovery Questions'), 'has Discovery Questions');
assert(packSrc.includes('Likely Objections'), 'has Likely Objections');
assert(packSrc.includes('Meeting Strategy'), 'has Meeting Strategy');
assert(packSrc.includes('Consultant Coaching'), 'has Consultant Coaching');
assert(packSrc.includes('Future Website'), 'has Future Website');
assert(packSrc.includes('Executive Ops Portal'), 'has Ops Portal');
assert(packSrc.includes('opportunityBrief'), 'pack includes opportunityBrief');
assert(packSrc.includes('version: 3'), 'pack version 3');
assert(!packSrc.includes('Executive Meeting Brief'), 'no Executive Meeting Brief naming');

assert(notifySrc.includes('Opportunity Intelligence Brief™ |'), 'notify subject OIB™');
assert(notifySrc.includes('primaryColor'), 'notify passes brand colors to renders');
assert(notifySrc.includes('portalModules'), 'notify passes portal modules');
assert(notifySrc.includes('thinConfidenceNote') || notifySrc.includes('visualConfidenceNote'), 'notify wires quality note');

assert(emailSrc.includes("title: 'Opportunity Intelligence Brief™'"), 'ready email shell title');
assert(emailSrc.includes('premium: true'), 'premium email shell');

assert(gateSrc.includes('evaluateConceptRenderInputs'), 'quality gate exists');
assert(gateSrc.includes('tightenConceptRenderBrand'), 'regenerate tighten exists');
assert(rendersSrc.includes('BrowserChrome') || rendersSrc.includes('Discover'), 'story website render');
assert(rendersSrc.includes('LaptopChrome') || rendersSrc.includes('Leadership workspace'), 'portal laptop frame');
assert(rendersSrc.includes('PhoneChrome') || rendersSrc.includes('Welcome back'), 'member phone frame');
assert(researchSrc.includes('detectPublicSocialUrl'), 'org research social detect');
assert(researchSrc.includes('buildFactoryOrgResearch'), 'org research async');

const fallback = briefParse.buildOpportunityBriefFallback({
  profile: {
    name: 'River City Coalition',
    whoTheyAre: 'A local coalition helping working families.',
    whoTheyServe: 'Working parents',
    whatTheyOffer: 'Navigation and workshops',
    frictionSignals: ['Unclear next step', 'Manual follow-up'],
    confidence: 'medium',
  },
  research: {
    name: 'River City Coalition',
    story: 'We help working parents.',
    industryFamily: 'nonprofit',
    primaryAudience: 'Working parents',
    offer: 'Navigation and workshops',
    confidence: 'medium',
    hasPhoto: true,
    evidence: [{ label: 'Launch photo', detail: 'Storefront capture' }],
    brand: { primary: '#0f2c4c', accent: '#c4a35a' },
  },
  scorecard: { overallScore: 42 },
  opportunityLabel: '$6,980 – $27,920',
  generationTime: '2 minutes 14 seconds',
  industryHint: 'nonprofit',
});

assert(fallback.productName === 'Opportunity Intelligence Brief™', 'product name');
assert(fallback.industryFamily === 'nonprofit', 'nonprofit family');
assert(fallback.portal.modules.includes('Donors'), 'nonprofit portal modules');
assert(fallback.member.persona === 'Volunteer', 'nonprofit persona');
assert(fallback.conversationStarters.some((s) => s.includes('River City')), 'starters personalized');
assert(fallback.objections.length === 3, 'three objections');
assert(fallback.scorecard.length >= 10, 'scorecard rows');
assert(fallback.hiddenOpportunities.length >= 1, 'hidden opportunities');
assert(/^#/.test(fallback.brand.primary), 'brand primary hex');
assert(!/your organization/i.test(JSON.stringify(fallback)), 'no Your Organization in fallback');

const labeled = briefParse.parseOpportunityBriefLabeledText(
  `INDUSTRY: Community nonprofit
PRIMARY_AUDIENCE: Working parents
STORY: We help working parents find support.
WHO_THEY_ARE: River City Coalition helps families find housing and work supports.
WHAT_WE_LEARNED: Mission buried | Registration fragmented | No member home
HIDDEN_OPPORTUNITIES: Unclear next step / Lost interest / Guided journey | Manual follow-up / Staff hours / Ops home
CONVERSATION_STARTERS: I noticed River City Coalition | Where does interest stall?
DISCOVERY_QUESTIONS: How do people find you? | How do they register? | What takes staff time?
OBJECTIONS: We already have a website. → This is about a better experience. | No budget. → Start with the Opportunity Intelligence Brief™. | Team is busy. → Fewer tools.
SHOW_FIRST: Future Website
FLOW_20: Open website | Share observation | Show member | Ask priority
FLOW_45: Reflect mission | Show website | Walk opportunities | Show portal | Discovery | Next steps
NEXT_IMMEDIATE: Send thank-you with concept images
CONSULTANT_COACHING: Lead with empathy | Mirror impact | Stay on outcomes
PRIMARY_COLOR: #0f2c4c
ACCENT_COLOR: #c4a35a
HEADLINE: Help for working families
CTA: Get connected
CONFIDENCE: high`,
  fallback,
);

assert(labeled.overallConfidence === 'high', 'labeled confidence');
assert(labeled.brand.headline === 'Help for working families', 'labeled headline');
assert(labeled.whatWeLearned.length >= 3, 'labeled learned');
assert(labeled.objections[0].objection.toLowerCase().includes('website'), 'objection parse');
assert(labeled.conversationStarters.length >= 2, 'labeled starters');

const badBrandBlob = JSON.stringify({
  clientName: 'Your Organization',
  tagline: 'lorem ipsum',
  cta: 'placeholder',
  portalModules: ['Dashboard'],
  memberTiles: ['Card 1'],
});
assert(
  /your organization|lorem|placeholder|card\s*1|dashboard/i.test(badBrandBlob),
  'forbidden patterns detectable',
);
assert(gateSrc.includes('your organization'), 'gate forbids Your Organization');

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('OK factory Opportunity Intelligence Brief™ v3 contract passed');
