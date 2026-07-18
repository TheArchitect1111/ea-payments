/**
 * Pure tests for deeper Concept Pack entity audit signals.
 * Run: node scripts/test-factory-entity-audit.mjs
 */
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

const visionMod = await import(pathToFileURL(join(root, 'lib/factory-research/vision-parse.mjs')).href);
const profileMod = await import(pathToFileURL(join(root, 'lib/factory-entity-profile-parse.mjs')).href);
const extractMod = await import(pathToFileURL(join(root, 'lib/factory-research/website-extract.mjs')).href);

const { parseFactoryVisionText } = visionMod;
const { buildEntityProfileFallback, parseEntityProfileLabeledText, parseEntityType } = profileMod;
const { selectCrawlCandidateUrls, buildWebsiteArtifactData } = extractMod;

// --- Vision labels ---
{
  const parsed = parseFactoryVisionText(
    `BUSINESS_NAME: River City Coalition
ENTITY_TYPE: organization
WHO_THEY_ARE: A local coalition helping families navigate housing and work supports.
WHAT_THEY_DO: Coordinates partner services for working families
WHO_THEY_SERVE: Working parents and caregivers
OFFER: Navigation, workshops, and partner referrals
VOICE: Warm, practical, community-first
PROOF: Partner logos | Family stories
FRICTION: Unclear next step | No member home
OPS_CLUE: Intake via email and spreadsheets
CTA: Get connected
URL: https://example.org/river
OPPORTUNITIES: Clarify the front door | Centralize follow-up | Show proof near the ask
SUMMARY: Strong mission, weak digital journey.`,
    'Photo Project',
  );
  assert(parsed.suggestedClientName === 'River City Coalition', 'vision name');
  assert(parsed.entityType === 'organization', 'vision entity type');
  assert(/coalition/i.test(parsed.whoTheyAre), 'vision whoTheyAre');
  assert(parsed.audience === 'Working parents and caregivers', 'vision audience');
  assert(parsed.offer?.includes('Navigation'), 'vision offer');
  assert(parsed.opsClue?.includes('spreadsheets'), 'vision ops');
  assert(parsed.opportunities.length >= 2, 'vision opportunities');
}

// --- Entity profile fallback + labeled parse ---
{
  const bundle = {
    name: 'River City Coalition',
    sourceNote: 'We started from launch photo + https://example.org/river.',
    hasPhoto: true,
    hasWebsite: true,
    hasNotes: false,
    visionSummary: 'Strong mission, weak digital journey.',
    whoTheyAreHint: 'A local coalition helping families navigate housing and work supports.',
    whatTheyDo: 'Coordinates partner services',
    audience: 'Working parents',
    offerHint: 'Navigation and workshops',
    entityTypeHint: 'organization',
    cta: 'Get connected',
    proofHints: ['Partner logos'],
    frictionHints: ['Unclear next step'],
    opportunities: ['Clarify the front door'],
    h1: ['Help for working families'],
    navLabels: ['About', 'Programs'],
    ctas: ['Get connected'],
    websiteDescription: 'Coalition support for families',
    websiteTextPreview: 'We help families find housing and work supports through partners.',
  };
  const fallback = buildEntityProfileFallback(bundle);
  assert(fallback.entityType === 'organization', 'fallback entity type');
  assert(/coalition|families|River City/i.test(fallback.whoTheyAre), 'fallback whoTheyAre mentions mission');
  assert(fallback.confidence === 'high' || fallback.confidence === 'medium', 'fallback confidence not thin');
  assert(fallback.evidence.some((e) => /photo|H1|description/i.test(e)), 'fallback has evidence');

  const parsed = parseEntityProfileLabeledText(
    `ENTITY_TYPE: organization
NAME: River City Coalition
TAGLINE: Help for working families
WHO_THEY_ARE: River City Coalition is a local network that helps working parents find housing and job supports without getting lost in paperwork.
WHO_THEY_SERVE: Working parents and caregivers
WHAT_THEY_OFFER: Navigation, workshops, partner referrals
HOW_THEY_SOUND: Warm and practical
PROOF: Partner logos | Family stories
FRICTION: Unclear next step | Manual follow-up
OPS_REALITY: Intake still lives in email and spreadsheets.
PRIMARY_ASK: Get connected
EVIDENCE: From photo: mission poster | From homepage H1: Help for working families
CONFIDENCE: high`,
    fallback,
  );
  assert(parsed.name === 'River City Coalition', 'labeled name');
  assert(/paperwork/i.test(parsed.whoTheyAre), 'labeled whoTheyAre');
  assert(parsed.primaryAsk === 'Get connected', 'labeled ask');
  assert(parsed.confidence === 'high', 'labeled confidence');
  assert(parsed.frictionSignals.length >= 1, 'labeled friction');
}

assert(parseEntityType('nonprofit club') === 'organization', 'parseEntityType org');
assert(parseEntityType('solo coach') === 'person', 'parseEntityType person');
assert(parseEntityType('local studio brand') === 'business', 'parseEntityType business');

// --- Crawl candidates ignore off-origin ---
{
  const html = `<nav>
    <a href="/about-us">About</a>
    <a href="https://other.example/contact">Contact</a>
    <a href="/services">Services</a>
  </nav>`;
  const urls = selectCrawlCandidateUrls(html, 'https://www.bgca.org/', 3);
  assert(urls.every((u) => u.startsWith('https://www.bgca.org')), 'crawl same-origin only');
  assert(urls.length >= 2, 'crawl finds about + services');
  const data = buildWebsiteArtifactData({
    url: 'https://www.bgca.org/',
    status: 200,
    contentType: 'text/html',
    html: `<html><head><title>BGCA</title></head><body>${html}<h1>Clubs</h1><a href="/join">Sign up</a></body></html>`,
  });
  assert(data.extracted.ctas.some((c) => /sign up/i.test(c)), 'home CTA extracted');
}

if (failures.length) {
  console.error('FAIL');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}
console.log('OK factory entity audit tests passed');
